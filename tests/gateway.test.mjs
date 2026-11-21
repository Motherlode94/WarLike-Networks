import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync,readdirSync} from 'node:fs';import {onRequest} from '../functions/api/[[path]].js';
test('all migrations apply in order',()=>{const db=new DatabaseSync(':memory:');for(const f of readdirSync('migrations').sort().filter(x=>x.endsWith('.sql')))db.exec(readFileSync('migrations/'+f,'utf8'));assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE name='network_turn_limits'").get());assert.ok(db.prepare("PRAGMA table_info(network_calls)").all().some(x=>x.name==='offer'));db.close();});
const env={NETWORKS_DB:{},WARLIKE_SERVER:{fetch(){throw Error('unexpected upstream')}}};const req=(path,opts)=>new Request('https://warlike-networks.pages.dev/api/'+path,opts);
test('missing configuration fails closed',async()=>assert.equal((await onRequest({request:req('calls'),env:{}})).status,503));
test('anonymous calls denied',async()=>assert.equal((await onRequest({request:req('calls'),env})).status,401));
test('foreign origin denied',async()=>assert.equal((await onRequest({request:req('ice',{method:'POST',headers:{origin:'https://example.com'}}),env})).status,403));
test('anonymous TURN issuance denied',async()=>assert.equal((await onRequest({request:req('ice',{method:'POST',headers:{origin:'https://warlike-networks.pages.dev'},body:'{}'}),env})).status,401));
