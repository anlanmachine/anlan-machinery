const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { createCanvas } = require('@napi-rs/canvas');
const { extractMixerProducts } = require('./extract-mixer-pdf');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'products.json');
const CURRENT_UPLOADS = path.join(ROOT, 'public', 'uploads', 'xcmg');
const NEXT_UPLOADS = path.join(ROOT, 'public', 'uploads', 'xcmg-next');
const MIXER_UPLOADS = path.join(ROOT, 'public', 'uploads', 'self-loading-mixer');
const MIXER_PDF = path.resolve(ROOT, '..', '..', 'work', 'self-loading-mixer.pdf');
const PDF_SOURCE_DIR = path.resolve(ROOT, '..', '..', 'work', 'xcmg-sources');
const PDF_SOURCES = new Set(['XE500G','XC870K','XC958','ZL50GN','XS203J']);
const CHINA_EXACT_URLS = {
  'XE17U':'https://www.xcmg.com/product/pro-detail.jsp?id=120536',
  'XE35U':'https://www.xcmg.com/product/pro-detail.jsp?id=120539',
  'XC7-SR07B':'https://www.xcmg.com/product/pro-detail.jsp?id=115807'
};
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36';

const DEFINITIONS = [
  ['XE17U','excavator','mini-excavator'],['XE35U','excavator','mini-excavator'],['XE60GA PRO','excavator','crawler-excavator'],['XE75GA','excavator','crawler-excavator'],['XE105GA','excavator','crawler-excavator'],['XE135GA','excavator','crawler-excavator'],['XE155GA','excavator','crawler-excavator'],['XE200GA','excavator','crawler-excavator'],['XE205GA','excavator','crawler-excavator'],['XE215G','excavator','crawler-excavator'],['XE245G','excavator','crawler-excavator'],['XE335G','excavator','crawler-excavator'],['XE370G','excavator','crawler-excavator'],['XE380G','excavator','crawler-excavator'],['XE390G','excavator','crawler-excavator'],['XE500G','excavator','crawler-excavator'],['XE600GA PRO','excavator','crawler-excavator'],
  ['XE85GW','excavator','wheel-excavator'],['XE75W','excavator','wheel-excavator'],['XE155GW','excavator','wheel-excavator'],
  ['XC7-SR07B','loader','skid-steer-loader'],['XC870K','loader','backhoe-loader'],['XC938','loader','wheel-loader'],['XC958','loader','wheel-loader'],['ZL50GN','loader','wheel-loader'],['LW300KN','loader','wheel-loader'],
  ['XS103J','roller','single-drum-roller'],['XS163J','roller','single-drum-roller'],['XS203J','roller','single-drum-roller'],['XP163','roller','pneumatic-roller'],
  ['GR180','grader','motor-grader'],['GR215','grader','motor-grader'],['GR2405','grader','motor-grader']
].map(([model,category,subCategory]) => ({model,category,subCategory}));

const norm = value => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const safe = model => model.replace(/\s+/g, '-').replace(/[^A-Z0-9-]/gi, '').toUpperCase();
const absolute = (value, base) => { try { return new URL(value, base).href; } catch { return ''; } };

async function download(url, model, index) {
  const response = await axios.get(url, { responseType:'arraybuffer', timeout:45000, headers:{'User-Agent':USER_AGENT} });
  const type = String(response.headers['content-type'] || '');
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  const filename = `${safe(model)}-${index}.${ext}`;
  await fsp.writeFile(path.join(NEXT_UPLOADS, filename), Buffer.from(response.data));
  return `/uploads/xcmg/${filename}`;
}

function parseProductPage(html, url) {
  const $ = cheerio.load(html);
  const description = clean($('meta[name="description"]').attr('content') || $('.result-describe,.product-intro,.intro').first().text());
  const specifications = {};
  $('table tr').each((_,row) => { const cells=$(row).find('th,td').map((__,cell)=>clean($(cell).text())).get().filter(Boolean); if(cells.length>=2) specifications[cells[0]]=cells.slice(1).join(' '); });
  const images=[];
  $('img').each((_,image)=>{const src=$(image).attr('data-src')||$(image).attr('src');const full=absolute(src,url);if(full&&/\/upload\/images\//.test(full)&&!images.includes(full))images.push(full);});
  return {description,specifications,images:images.slice(0,4)};
}

async function queryGlobal(model) {
  const body = new URLSearchParams({flag:'getdata',type:'product',keywords:norm(model),nowPage:'1',pageSize:'50'});
  try {
    const response = await axios.post('https://www.xcmgglobal.com/ext/ajax_search.jsp', body.toString(), {timeout:30000,headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':USER_AGENT}});
    const $=cheerio.load(response.data),target=norm(model),items=[];
    $('li').each((_,li)=>{const a=$(li).find('.con-tit a').first();const href=a.attr('href');if(href)items.push({text:clean(a.text()),href:absolute(href,'https://www.xcmgglobal.com'),image:absolute($(li).find('img').attr('src'),'https://www.xcmgglobal.com'),description:clean($(li).find('.result-describe').text())});});
    return items.find(item => norm(new URL(item.href).pathname.split('/').filter(Boolean).pop())===target || norm(item.text).endsWith(target)) || null;
  } catch { return null; }
}

async function queryChina(model) {
  try {
    if(CHINA_EXACT_URLS[model])return {text:model,href:CHINA_EXACT_URLS[model],image:''};
    const url=`https://www.xcmg.com/site/search.htm?keywords=${encodeURIComponent(model)}`;
    const response=await axios.get(url,{timeout:30000,headers:{'User-Agent':USER_AGENT}});const $=cheerio.load(response.data),target=norm(model),items=[];
    $('a[href*="pro-detail"]').each((_,a)=>{const text=clean($(a).text());const href=absolute($(a).attr('href'),url);if(href)items.push({text,href,image:absolute($(a).find('img').attr('src'),url)});});
    return items.find(item=>norm(item.text).endsWith(target))||null;
  } catch { return null; }
}

async function createPlaceholder(model, category) {
  const canvas=createCanvas(1400,900),ctx=canvas.getContext('2d');ctx.fillStyle='#eef1eb';ctx.fillRect(0,0,1400,900);ctx.fillStyle='#d8ff36';ctx.fillRect(0,0,1400,24);ctx.fillStyle='#111512';ctx.font='900 84px Arial';ctx.fillText(`XCMG ${model}`,90,400);ctx.fillStyle='#657069';ctx.font='32px Arial';ctx.fillText(`${category.toUpperCase()} · IMAGE VERIFICATION PENDING`,94,465);ctx.strokeStyle='#c8cec7';ctx.lineWidth=3;ctx.strokeRect(70,70,1260,760);const filename=`${safe(model)}-1.png`;await fsp.writeFile(path.join(NEXT_UPLOADS,filename),canvas.toBuffer('image/png'));return `/uploads/xcmg/${filename}`;
}

async function buildFromLocalPdf(definition) {
  if(!PDF_SOURCES.has(definition.model))return null;
  const pdfPath=path.join(PDF_SOURCE_DIR,`${definition.model}.pdf`);if(!fs.existsSync(pdfPath))return null;
  try{const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');const document=await pdfjs.getDocument({data:new Uint8Array(await fsp.readFile(pdfPath))}).promise;const page=await document.getPage(1);const viewport=page.getViewport({scale:0.45});const canvas=createCanvas(viewport.width,viewport.height);await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;const filename=`${safe(definition.model)}-1.png`;await fsp.writeFile(path.join(NEXT_UPLOADS,filename),canvas.toBuffer('image/png'));const textContent=await page.getTextContent();const text=clean(textContent.items.map(item=>item.str).join(' '));return {...definition,id:`xcmg-${safe(definition.model)}`,brand:'XCMG',name:`XCMG ${definition.model}`,source:'xcmg',image:`/uploads/xcmg/${filename}`,images:[`/uploads/xcmg/${filename}`],description:text.slice(0,700)||`XCMG ${definition.model} ${definition.subCategory.replaceAll('-',' ')}.`,specifications:{'Source':'Product brochure'},localOnly:true};}catch{return null;}
}

async function buildXcmgProduct(definition, previous) {
  const cached=previous.find(product=>norm(product.model)===norm(definition.model));
  if(cached && !cached.specifications?.['Verification Status'] && cached.images?.length) {
    const copied=[];for(const image of cached.images){const source=path.join(ROOT,'public',image);if(fs.existsSync(source)){const filename=path.basename(image).replace(safe(cached.model),safe(definition.model));await fsp.copyFile(source,path.join(NEXT_UPLOADS,filename));copied.push(`/uploads/xcmg/${filename}`);}}
    if(copied.length)return {...definition,id:`xcmg-${safe(definition.model)}`,brand:'XCMG',name:`XCMG ${definition.model}`,source:'xcmg',image:copied[0],images:copied,description:cached.description||`XCMG ${definition.model} ${definition.subCategory.replaceAll('-',' ')}.`,specifications:cached.specifications||{},localOnly:true};
  }
  const fromPdf=await buildFromLocalPdf(definition);if(fromPdf)return fromPdf;
  const match=await queryGlobal(definition.model)||await queryChina(definition.model);
  if(match){try{const page=await axios.get(match.href,{timeout:45000,headers:{'User-Agent':USER_AGENT}});const detail=parseProductPage(page.data,match.href),remote=[match.image,...detail.images].filter(Boolean),images=[];for(let i=0;i<Math.min(remote.length,4);i++){try{images.push(await download(remote[i],definition.model,i+1));}catch{}}if(images.length)return {...definition,id:`xcmg-${safe(definition.model)}`,brand:'XCMG',name:`XCMG ${definition.model}`,source:'xcmg',image:images[0],images,description:detail.description||match.description||`XCMG ${definition.model} ${definition.subCategory.replaceAll('-',' ')}.`,specifications:detail.specifications,localOnly:true};}catch{}}
  const image=await createPlaceholder(definition.model,definition.category);
  return {...definition,id:`xcmg-${safe(definition.model)}`,brand:'XCMG',name:`XCMG ${definition.model}`,source:'xcmg',image,images:[image],description:`XCMG ${definition.model} ${definition.subCategory.replaceAll('-',' ')}. Product image and detailed specifications are pending exact-model verification.`,specifications:{'Verification Status':'Exact-model data pending'},localOnly:true};
}

async function rebuild() {
  if(!fs.existsSync(MIXER_PDF))throw new Error(`Mixer PDF not found: ${MIXER_PDF}`);
  const previous=JSON.parse(await fsp.readFile(DATA_FILE,'utf8'));
  await fsp.rm(NEXT_UPLOADS,{recursive:true,force:true});await fsp.mkdir(NEXT_UPLOADS,{recursive:true});
  const xcmg=[];for(let i=0;i<DEFINITIONS.length;i++){const product=await buildXcmgProduct(DEFINITIONS[i],previous);xcmg.push(product);console.error(`[xcmg:${i+1}/${DEFINITIONS.length}] ${product.model} ${product.specifications['Verification Status']?'placeholder':'verified'}`);}
  const mixers=await extractMixerProducts({pdfPath:MIXER_PDF,outputDir:MIXER_UPLOADS});
  const products=[...xcmg,...mixers];
  await fsp.rm(CURRENT_UPLOADS,{recursive:true,force:true});await fsp.rename(NEXT_UPLOADS,CURRENT_UPLOADS);
  const temp=`${DATA_FILE}.tmp`;await fsp.writeFile(temp,JSON.stringify(products,null,2)+'\n','utf8');await fsp.rm(DATA_FILE,{force:true});await fsp.rename(temp,DATA_FILE);
  const result={success:true,xcmg:xcmg.length,mixers:mixers.length,total:products.length,placeholders:xcmg.filter(p=>p.specifications['Verification Status']).length};console.log(JSON.stringify(result));return result;
}

if(require.main===module)rebuild().catch(error=>{console.error(error.stack||error.message);process.exitCode=1});
module.exports={rebuild,DEFINITIONS};
