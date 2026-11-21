import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync,readdirSync} from 'node:fs';import {onRequest} from '../functions/api/[[path]].js';
test('all migrations apply in order',()=>{const db=new DatabaseSync(':memory:');for(const f of readdirSync('migrations').sort().filter(x=>x.endsWith('.sql')))db.exec(readFileSync('migrations/'+f,'utf8'));assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE name='network_turn_limits'").get());assert.ok(db.prepare("PRAGMA table_info(network_calls)").all().some(x=>x.name==='offer'));db.close();});
const env={NETWORKS_DB:{},WARLIKE_SERVER:{fetch(){throw Error('unexpected upstream')}}};const req=(path,opts)=>new Request('https://warlike-networks.pages.dev/api/'+path,opts);
test('missing configuration fails closed',async()=>assert.equal((await onRequest({request:req('calls'),env:{}})).status,503));
test('anonymous calls denied',async()=>assert.equal((await onRequest({request:req('calls'),env})).status,401));
test('foreign origin denied',async()=>assert.equal((await onRequest({request:req('ice',{method:'POST',headers:{origin:'https://example.com'}}),env})).status,403));
test('anonymous TURN issuance denied',async()=>assert.equal((await onRequest({request:req('ice',{method:'POST',headers:{origin:'https://warlike-networks.pages.dev'},body:'{}'}),env})).status,401));

test('self provisioning is idempotent and never restores revoked lines',async()=>{const db=new DatabaseSync(':memory:');try{for(const f of readdirSync('migrations').sort().filter(x=>x.endsWith('.sql')))db.exec(readFileSync('migrations/'+f,'utf8'));const env={NETWORKS_DB:{prepare(sql){return {bind(...args){return {async run(){return {meta:{changes:Number(db.prepare(sql).run(...args).changes)}}},async first(){return db.prepare(sql).get(...args)}}}}}},WARLIKE_SERVER:{async fetch(){return Response.json({user:{id:'member-a',name:'A',role:'member'},mustChange:false})}}};const provision=()=>onRequest({request:req('provision-line',{method:'POST',headers:{origin:'https://warlike-networks.pages.dev',cookie:'__Host-warlike_networks='+'a'.repeat(43)},body:JSON.stringify({user_id:'other'})}),env});const first=await provision();assert.equal(first.status,200);const a=await first.json();const second=await provision();assert.equal(second.status,200);assert.deepEqual(await second.json(),a);assert.equal(a.line.user_id,'member-a');db.prepare('UPDATE network_lines SET revoked_at=1').run();assert.equal((await provision()).status,409);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM network_lines').get().n,1);}finally{db.close();}});

test('native login provisions once and preserves revoked lines',async()=>{
 const db=new DatabaseSync(':memory:');
 try{
  for(const f of readdirSync('migrations').sort().filter(x=>x.endsWith('.sql')))db.exec(readFileSync('migrations/'+f,'utf8'));
  const database={prepare(sql){return {bind(...args){return {async run(){return {meta:{changes:Number(db.prepare(sql).run(...args).changes)}};}};}};}};
  const server={async fetch(r){return new URL(r.url).pathname.endsWith('/login')?Response.json({mustChange:false},{headers:{'set-cookie':'__Host-warlike_session='+'a'.repeat(43)+'; Path=/'}}):Response.json({user:{id:'member-b',name:'B',role:'member'},mustChange:false});}};
  const login=()=>onRequest({request:req('login',{method:'POST',headers:{origin:'https://warlike-networks.pages.dev'},body:JSON.stringify({username:'b',password:'test'})}),env:{NETWORKS_DB:database,WARLIKE_SERVER:server}});
  assert.equal((await login()).status,200);assert.equal((await login()).status,200);
  assert.equal(db.prepare('SELECT user_id FROM network_lines').get().user_id,'member-b');
  db.exec('UPDATE network_lines SET revoked_at=1');assert.equal((await login()).status,200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM network_lines').get().n,1);
  assert.equal(db.prepare('SELECT revoked_at FROM network_lines').get().revoked_at,1);
 }finally{db.close();}
});

test('shared contacts persist across sessions and isolate account mutations',async()=>{
 const db=new DatabaseSync(':memory:');
 try{
  for(const f of readdirSync('migrations').sort().filter(x=>x.endsWith('.sql')))db.exec(readFileSync('migrations/'+f,'utf8'));
  const database={prepare(sql){return {bind(...args){return {async run(){return {meta:{changes:Number(db.prepare(sql).run(...args).changes)}};},async first(){return db.prepare(sql).get(...args);},async all(){return {results:db.prepare(sql).all(...args)};}};}};}};
  const call=(id,path,body)=>onRequest({request:req(path,{method:body===undefined?'GET':'POST',headers:{origin:'https://warlike-networks.pages.dev',cookie:'__Host-warlike_networks='+'a'.repeat(43)},...(body===undefined?{}:{body:JSON.stringify(body)})}),env:{NETWORKS_DB:database,WARLIKE_SERVER:{async fetch(){return Response.json({user:{id,name:id,role:'member'},mustChange:false});}}}});
  const a=await call('alpha','provision-line',{}),b=await call('beta','provision-line',{});assert.equal(a.status,200);assert.equal(b.status,200);const number=(await b.json()).line.number;
  assert.equal((await call('alpha','contact-save',{number,name:'Beta'})).status,200);
  assert.deepEqual((await (await call('alpha','contacts')).json()).contacts,[{number,name:'Beta'}]);
  assert.deepEqual((await (await call('beta','contacts')).json()).contacts,[]);
  assert.equal((await call('beta','contact-delete',{number})).status,200);
  assert.equal((await (await call('alpha','contacts')).json()).contacts.length,1);
  assert.equal((await call('alpha','contact-save',{number,name:'Renamed'})).status,200);
  assert.deepEqual((await (await call('alpha','contacts')).json()).contacts,[{number,name:'Renamed'}]);
  assert.equal((await call('alpha','contact-delete',{number})).status,200);
  assert.deepEqual((await (await call('alpha','contacts')).json()).contacts,[]);
 }finally{db.close();}
});
