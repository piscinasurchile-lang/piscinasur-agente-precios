import fs from 'node:fs/promises';
const report=JSON.parse(await fs.readFile('data/prices.json','utf8'));
const rows=report.records||[];
const verified=rows.filter(r=>r.status==='verified'&&Number.isFinite(r.price)&&r.price>0);
const located=rows.filter(r=>r.locationSelection?.ok);
const markdown=[
'# PiscinaSur — Diagnóstico de consulta',
'',
'- Fecha: '+(report.checkedAt||'Sin ejecución'),
'- Consultas realizadas: '+rows.length,
'- Ubicaciones confirmadas por el colector: '+located.length,
'- Precios verificados: '+verified.length,
'',
'| Ciudad | Proveedor | Producto | Ubicación | Estado | Motivo |',
'|---|---|---|---|---|---|',
...rows.map(r=>'| '+[r.city,r.provider,r.product,r.locationSelection?.ok?'Sí':'No',r.status,(r.reason||'').replaceAll('|','/')].join(' | ')+' |'),
'',
'**Advertencia:** un precio detectado visualmente no se considera verificado sin validar producto, ciudad, IVA y ficha.',
''];
const out=markdown.join('\n');
await fs.mkdir('data',{recursive:true});
await fs.writeFile('data/diagnostico.md',out);
if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,out);
console.log('Diagnóstico generado: '+rows.length+' consultas');
