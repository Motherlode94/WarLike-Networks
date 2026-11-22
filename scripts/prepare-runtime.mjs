import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
const migrations=readdirSync('migrations').filter(x=>/^\d{4}_.+\.sql$/.test(x)).sort();
const db=new DatabaseSync(':memory:');
for(const [i,file] of migrations.entries()){if(Number(file.slice(0,4))!==i+1)throw Error('Migration sequence gap: '+file);db.exec(readFileSync('migrations/'+file,'utf8'));}
const schema=db.prepare("SELECT type,name FROM sqlite_master WHERE name LIKE 'network_%' ORDER BY name").all();
const cols={};for(const x of schema.filter(x=>x.type==='table'))cols[x.name]=db.prepare('PRAGMA table_info('+x.name+')').all().map(c=>c.name);
const api=readFileSync('functions/api/[[path]].js','utf8');
const imp="import {numberFor,parseNumber} from '../../lib/numbers.js';";
if(!api.startsWith(imp))throw Error('Unexpected gateway import');
const worker=api.replace(imp,"import {numberFor,parseNumber} from './numbers.js';")+'\nexport default {fetch(request,env){return onRequest({request,env});}};\n';
mkdirSync('dist-runtime',{recursive:true});writeFileSync('dist-runtime/worker.mjs',worker);writeFileSync('dist-runtime/numbers.js',readFileSync('lib/numbers.js'));writeFileSync('dist-runtime/package.json','{"type":"module"}');writeFileSync('dist-runtime/schema.json',JSON.stringify({migrations,schema,columns:cols},null,2));
console.log('Validated '+migrations.length+' migrations; runtime bundle generated.');
