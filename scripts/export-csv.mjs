import fs from 'node:fs/promises';
const data=JSON.parse(await fs.readFile('data/prices.json','utf8'));
const keys=['checkedAt','city','product','provider','sku','price','currency','status','reason','url'];
const escape=v=>'"'+String(v??'').replaceAll('"','""')+'"';
const csv=[keys.join(','),...(data.records||[]).map(r=>keys.map(k=>escape(r[k])).join(','))].join('\n')+'\n';
await fs.writeFile('data/prices.csv',csv,'utf8');
console.log('CSV generado:',(data.records||[]).length,'registros');
