import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const cities=[['Temuco','La Araucanía'],['Villarrica','La Araucanía'],['Valdivia','Los Ríos'],['Osorno','Los Lagos'],['Puerto Montt','Los Lagos']];
const products=[['Cemento Melón 25 kg','cemento melon 25 kg','110324015','WA000153-CEM'],['Cemento Polpaico 25 kg','cemento polpaico 25 kg',null,null],['Malla ACMA C-92','malla acma c92','110327972','MC0092-UN']];
const providers=[['Sodimac','https://www.sodimac.cl/sodimac-cl'],['Prodalam','https://www.prodalam.cl/']];
const records=[],checkedAt=new Date().toISOString(),limit=Math.min(30,Math.max(1,Number(process.env.MAX_RECORDS)||30));
await fs.mkdir('data/evidence',{recursive:true});
const browser=await chromium.launch({headless:true});
const click=async l=>{try{await l.first().click({timeout:2500});return true}catch{return false}};
const choose=async(page,label,value)=>{const l=page.getByLabel(label,{exact:false});try{await l.first().selectOption({label:value},{timeout:2500});return true}catch{};return await click(l)&&await click(page.getByText(value,{exact:true}))};
async function location(page,provider,city,region){
 if(provider==='Sodimac'){
  await click(page.getByText(/entrega en/i));
  if(!await choose(page,'Región',region)||!await choose(page,'Comuna',city))return {ok:false,reason:'No se confirmó región y comuna'};
  if(!await click(page.getByRole('button',{name:/guardar/i})))return {ok:false,reason:'No se guardó comuna'};
  const header=(await page.locator('header').allInnerTexts().catch(()=>[])).join(' ');
  return {ok:header.toLowerCase().includes(city.toLowerCase()),reason:'Confirmación de comuna en cabecera'};
 }
 await click(page.getByText(/elige tu sucursal|selecciona.*sucursal/i));
 await click(page.getByText('Retiro',{exact:true}));
 if(!await choose(page,'Región',region))return {ok:false,reason:'No se seleccionó región'};
 if(!await click(page.getByText(city,{exact:true})))return {ok:false,reason:'No se seleccionó sucursal'};
 return {ok:await click(page.getByRole('button',{name:/guardar/i})),reason:'Selección de retiro intentada'};
}
try{
 outer:for(const [city,region] of cities)for(const [product,query,sodSku,proSku] of products)for(const [provider,base] of providers){
  if(records.length>=limit)break outer;
  const context=await browser.newContext({locale:'es-CL',timezoneId:'America/Santiago'});
  const page=await context.newPage();page.setDefaultTimeout(4000);
  const sku=provider==='Sodimac'?sodSku:proSku;
  let url=base,loc={ok:false,reason:'No se intentó'},reason='',diagnostic=null;
  const file='data/evidence/'+[city,provider,product].join('-').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]/gi,'-').toLowerCase()+'.png';
  try{
   const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
   if(!response||response.status()>=400)throw Error('HTTP '+(response?.status()??'sin respuesta'));
   loc=await location(page,provider,city,region);
   if(!loc.ok)reason=loc.reason;
   else{
    url=provider==='Sodimac'?'https://www.sodimac.cl/sodimac-cl/search?Ntt='+encodeURIComponent(sku||query):'https://www.prodalam.cl/catalogsearch/result/?q='+encodeURIComponent(sku||query);
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
    const body=await page.locator('body').innerText({timeout:10000});
    diagnostic={skuPresent:Boolean(sku&&body.includes(sku)),priceCandidates:[...body.matchAll(/\$\s*[\d.]{3,12}\b/g)].slice(0,12).map(x=>x[0]),excerpt:body.slice(0,1000)};
    reason='Precio sin verificar: requiere ficha exacta, IVA y ubicación persistente';
   }
  }catch(e){reason=String(e.message).slice(0,250)}
  try{await page.screenshot({path:file,timeout:10000})}catch{}
  records.push({city,region,product,provider,sku,price:null,currency:'CLP',includesVat:null,status:'unverified',reason,locationSelection:loc,diagnostic,url,checkedAt,screenshot:file});
  console.log(city,provider,product,loc.ok?'ubicación intentada':'sin ubicación');
  await context.close();
 }
}finally{await browser.close()}
const report={schemaVersion:3,checkedAt,records,verifiedCount:0,note:'No se publican precios no verificados'};
await fs.mkdir('data/history',{recursive:true});
await fs.writeFile('data/prices.json',JSON.stringify(report,null,2));
await fs.writeFile('data/history/'+checkedAt.replace(/[:.]/g,'-')+'.json',JSON.stringify(report,null,2));
console.log('Consultas:',records.length,'precios verificados: 0');
