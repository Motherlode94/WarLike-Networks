import {WorkerEntrypoint} from 'cloudflare:workers';
import {routePush} from './push-router.js';
export class ChatPushDelivery extends WorkerEntrypoint {
 async notifyPrivateMessage(sender,recipient){
  const env=this.env,db=env.NETWORKS_DB;
  if(env.PUSH_DELIVERY_ENABLED!=='true'||!db||!env.PUSH_SESSION_VERIFIER||typeof sender!=='string'||typeof recipient!=='string'||!sender||!recipient||sender===recipient||sender.length>100||recipient.length>100)return false;
  try{
   const row=await db.prepare('SELECT EXISTS(SELECT 1 FROM network_contacts c JOIN network_lines l ON l.id=c.line_id WHERE c.blocked=1 AND ((c.user_id=? AND l.user_id=?) OR (c.user_id=? AND l.user_id=?))) AS blocked, EXISTS(SELECT 1 FROM network_permissions WHERE (user_id=? AND message_out=0) OR (user_id=? AND message_in=0)) AS restricted').bind(sender,recipient,recipient,sender,sender,recipient).first();
   if(!row||row.blocked||row.restricted)return false;
   await routePush(db,env,{userId:recipient,app:'chat',kind:'message'},async(hash,uid)=>{try{return await env.PUSH_SESSION_VERIFIER.isSessionActive(hash,uid)===true;}catch{return false;}});
   return true;
  }catch{return false;}
 }
}
