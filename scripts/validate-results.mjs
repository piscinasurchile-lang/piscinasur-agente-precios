import fs from 'node:fs/promises';
const report=JSON.parse(await fs.readFile('data/prices.json','utf8'));
const rows=report.records||[];
const errors=[];
for(const [i,r] of rows.entries()){
 if(!['Temuco','Villarrica','Valdivia','Osorno','Puerto Montt'].includes(r.city))errors.push(i+': ciudad inválida');
 if(!['Sodimac','Prodalam'].includes(r.provider))errors.push(i+': proveedor inválido');
 if(r.status==='verified'){
  if(!Number.isInteger(r.price)||r.price<=0)errors.push(i+': precio inválido');
  if(r.includesVat!==true)errors.push(i+': IVA no confirmado');
  if(r.locationSelection?.ok!==true)errors.push(i+': ubicación no confirmada');
  if(!r.sku)errors.push(i+': SKU no confirmado');
  if(!r.url?.startsWith('https://'))errors.push(i+': enlace no verificable');
  if(!r.screenshot)errors.push(i+': sin evidencia visual');
 }else if(r.price!==null)errors.push(i+': precio no verificado debe ser null');
}
if(report.verifiedCount!==rows.filter(r=>r.status==='verified').length)errors.push('verifiedCount inconsistente');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}
else console.log('Validación aprobada: '+rows.length+' registros, '+report.verifiedCount+' verificados');
