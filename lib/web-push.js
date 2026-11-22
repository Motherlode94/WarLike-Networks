// RFC 8291 / 8188 / 8292. Internal module, not an HTTP route.
const enc=new TextEncoder();
const bytes=s=>enc.encode(s);
const concat=(...parts)=>{const result=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let offset=0;for(const p of parts){result.set(p,offset);offset+=p.length;}return result;};
const b64=a=>btoa(String.fromCharCode(...a)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const un64=s=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
async function hkdf(key,salt,info,length){const k=await crypto.subtle.importKey('raw',key,'HKDF',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info},k,length*8));}
export function pushEndpoint(value){const u=new URL(value);if(u.protocol!=='https:'||u.port||u.username||u.password||u.hash||!['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].includes(u.hostname))throw Error('Unsupported push endpoint');return u;}
export async function encryptPush(row,payload){
 const plain=bytes(JSON.stringify(payload));if(plain.length>1024)throw Error('Payload too large');
 const ua=un64(row.p256dh),auth=un64(row.auth);if(ua.length!==65||ua[0]!==4||auth.length!==16)throw Error('Invalid subscription keys');
 const pair=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveBits']);
 const peer=await crypto.subtle.importKey('raw',ua,{name:'ECDH',namedCurve:'P-256'},false,[]);
 const pub=new Uint8Array(await crypto.subtle.exportKey('raw',pair.publicKey));
 const shared=new Uint8Array(await crypto.subtle.deriveBits({name:'ECDH',public:peer},pair.privateKey,256));
 const ikm=await hkdf(shared,auth,concat(bytes('WebPush: info\0'),ua,pub),32);
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const cek=await hkdf(ikm,salt,bytes('Content-Encoding: aes128gcm\0'),16);
 const nonce=await hkdf(ikm,salt,bytes('Content-Encoding: nonce\0'),12);
 const key=await crypto.subtle.importKey('raw',cek,'AES-GCM',false,['encrypt']);
 const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},key,concat(plain,new Uint8Array([2]))));
 return concat(salt,new Uint8Array([0,0,16,0,65]),pub,cipher);
}
export async function vapidAuthorization(endpoint,env){
 const u=pushEndpoint(endpoint),pub=un64(env.VAPID_PUBLIC_KEY),d=un64(env.VAPID_PRIVATE_KEY);
 if(pub.length!==65||pub[0]!==4||d.length!==32||!/^mailto:[^\s@]+@[^\s@]+$/.test(env.VAPID_SUBJECT))throw Error('Invalid VAPID configuration');
 const key=await crypto.subtle.importKey('jwk',{kty:'EC',crv:'P-256',x:b64(pub.slice(1,33)),y:b64(pub.slice(33)),d:b64(d),ext:false},{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const token=b64(bytes(JSON.stringify({typ:'JWT',alg:'ES256'})))+'.'+b64(bytes(JSON.stringify({aud:u.origin,exp:Math.floor(Date.now()/1000)+3600,sub:env.VAPID_SUBJECT})));
 const sig=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,bytes(token));
 return 'vapid t='+token+'.'+b64(new Uint8Array(sig))+', k='+b64(pub);
}
export async function deliverPush(row,env,kind,send=fetch){
 if(env.PUSH_DELIVERY_ENABLED!=='true')return 'disabled';
 if(row.expires_at!=null&&row.expires_at<=Date.now())return 'expired';
 const endpoint=pushEndpoint(row.endpoint);
 if(!['call','message'].includes(kind))throw Error('Invalid notification kind');
 const body=await encryptPush(row,{kind});
 const authorization=await vapidAuthorization(endpoint.href,env);
 const res=await send(endpoint.href,{method:'POST',redirect:'error',headers:{Authorization:authorization,'Content-Encoding':'aes128gcm','Content-Type':'application/octet-stream',TTL:kind==='call'?'30':'300',Urgency:kind==='call'?'high':'normal'},body});
 if(res.status===404||res.status===410)return 'expired';
 if(res.ok)return 'accepted';
 if(res.status===429||res.status>=500)return 'retry';
 return 'rejected';
}
