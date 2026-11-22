import {deliverPush} from './web-push.js';
// Internal only. The caller supplies an authoritative live session revocation check.
export async function routePush(db,env,{userId,app,kind},isSessionActive,deliver=deliverPush){
 if(env.PUSH_DELIVERY_ENABLED!=='true'||typeof isSessionActive!=='function')return {accepted:0,expired:0,retry:0,rejected:0};
 if(typeof userId!=='string'||!['chat','telecom'].includes(app)||!['call','message'].includes(kind))throw Error('Invalid recipient');
 const counts={accepted:0,expired:0,retry:0,rejected:0};
 const rows=await db.prepare('SELECT * FROM network_push_subscriptions WHERE user_id=? AND app=? AND session_until>? AND (expires_at IS NULL OR expires_at>?) LIMIT 10').bind(userId,app,Date.now(),Date.now()).all();
 for(const row of rows.results){
  if(!row.session_hash||!(await isSessionActive(row.session_hash,userId)))continue;
  let status;try{status=await deliver(row,env,kind);}catch{status='retry';}
  if(status==='expired')await db.prepare('DELETE FROM network_push_subscriptions WHERE id=? AND user_id=? AND session_hash=? AND session_until=? AND p256dh=? AND auth=?').bind(row.id,userId,row.session_hash,row.session_until,row.p256dh,row.auth).run();
  if(Object.hasOwn(counts,status))counts[status]++;
 }
 return counts;
}
