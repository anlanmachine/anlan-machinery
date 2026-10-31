import './load-local-env';
import {execFileSync,spawnSync} from 'child_process';
import {existsSync} from 'fs';
import {mkdir,readFile,writeFile} from 'fs/promises';
import path from 'path';
import {neon} from '@neondatabase/serverless';
import {canonicalModel,normalizeStatus,productIdentity} from '../lib/product-store';
import type {ProductRecord} from '../lib/product-types';

type Source='CURRENT_DATABASE'|'GITHUB_ONLY'|'HISTORICAL_ONLY';
type Candidate={source:Source;product:ProductRecord;identity:string;safe:boolean;needsReview:boolean;reasons:string[]};
type DatabaseState={available:boolean;error?:string;products:ProductRecord[];updatedAt?:string;mediaIds:Set<string>};
const root=process.cwd(),diagnostics=path.join(root,'diagnostics');
const knownCategories=new Set(['excavator','loader','backhoe-loader','roller','forklift','dump-truck','grader','motor-grader','crane','mixer','concrete-mixer']);

function asProduct(value:unknown):ProductRecord{
  const source=(value&&typeof value==='object'?value:{}) as Record<string,unknown>;
  const images=Array.isArray(source.images)?source.images.map(item=>String(item)).filter(Boolean):[];
  return {id:String(source.id||''),brand:String(source.brand||'XCMG'),model:String(source.model||''),name:String(source.name||''),slug:String(source.slug||''),category:String(source.category||''),subCategory:String(source.subCategory||''),source:String(source.source||''),image:String(source.image||images[0]||''),images,description:String(source.description||''),shortDescription:String(source.shortDescription||''),specifications:(source.specifications&&typeof source.specifications==='object'?source.specifications:{}) as Record<string,string>,status:String(source.status||'Published'),video:String(source.video||''),pdfBrochure:String(source.pdfBrochure||''),localOnly:true};
}
function identity(product:ProductRecord){return productIdentity(product)||`id:${String(product.id||'').toLowerCase()}`;}
function readJson(file:string):ProductRecord[]{try{return JSON.parse(execFileSync('git',['show',file],{cwd:root,encoding:'utf8'})) as ProductRecord[];}catch{return [];}}
async function readWorkingTree():Promise<ProductRecord[]>{try{return (JSON.parse(await readFile(path.join(root,'data','products.json'),'utf8')) as unknown[]).map(asProduct);}catch{return [];}}
function gitLines(args:string[]){try{return execFileSync('git',args,{cwd:root,encoding:'utf8'}).split(/\r?\n/).map(item=>item.trim()).filter(Boolean);}catch{return [];}}
function historicalRevisions(){
  const revisions=new Set<string>([...gitLines(['rev-list','--all']),...gitLines(['reflog','--all','--format=%H'])]);
  const fsck=spawnSync('git',['fsck','--no-reflogs','--unreachable'],{cwd:root,encoding:'utf8'}).stdout||'';
  for(const match of fsck.matchAll(/unreachable commit ([0-9a-f]{40})/g))revisions.add(match[1]);
  return [...revisions];
}
function fromRevision(revision:string){
  try{return JSON.parse(execFileSync('git',['show',`${revision}:data/products.json`],{cwd:root,encoding:'utf8'})) as unknown[];}catch{return [];}
}
function publicImageExists(url:string,mediaIds:Set<string>){
  if(!url)return false;
  if(url.startsWith('/uploads/'))return existsSync(path.join(root,'public',url));
  if(url.startsWith('/api/media/'))return mediaIds.has(url.split('/').pop()||'');
  return /^https?:\/\//.test(url);
}
function productExport(product:ProductRecord){
  return {id:product.id,brand:product.brand,model:product.model,name:product.name,slug:product.slug,category:product.category,subCategory:product.subCategory,status:normalizeStatus(product.status),image:product.image,images:product.images};
}
async function readDatabase():Promise<DatabaseState>{
  const url=process.env.DATABASE_URL;
  if(!url)return {available:false,error:'DATABASE_URL is not configured.',products:[],mediaIds:new Set()};
  try{
    const sql=neon(url);
    const rows=await sql`SELECT value,updated_at FROM cms_store WHERE key='products' LIMIT 1`;
    const values=Array.isArray(rows[0]?.value)?rows[0].value as unknown[]:[];
    let mediaIds=new Set<string>();
    const table=await sql`SELECT to_regclass('public.media_files') AS relation`;
    if(table[0]?.relation){const media=await sql`SELECT id FROM media_files`;mediaIds=new Set(media.map(row=>String(row.id)));}
    return {available:true,products:values.map(asProduct),updatedAt:rows[0]?.updated_at?String(rows[0].updated_at):undefined,mediaIds};
  }catch(error){return {available:false,error:error instanceof Error?error.message:String(error),products:[],mediaIds:new Set()};}
}
function groupedDuplicates(products:ProductRecord[]){
  const groups=new Map<string,ProductRecord[]>();
  for(const product of products){const key=identity(product);groups.set(key,[...(groups.get(key)||[]),product]);}
  return [...groups.entries()].filter(([,items])=>new Set(items.map(item=>item.id)).size>1).map(([key,items])=>({key,products:items.map(productExport)}));
}

async function main(){
  await mkdir(diagnostics,{recursive:true});
  const database=await readDatabase(),github=await readWorkingTree();
  const historical=new Map<string,ProductRecord>();
  const historyVersions:Array<{commit:string;count:number}>=[];
  for(const commit of historicalRevisions()){
    const products=fromRevision(commit).map(asProduct);
    if(!products.length)continue;
    historyVersions.push({commit,count:products.length});
    for(const product of products)if(!historical.has(identity(product)))historical.set(identity(product),product);
  }
  const dbByIdentity=new Map(database.products.map(product=>[identity(product),product]));
  const githubByIdentity=new Map(github.map(product=>[identity(product),product]));
  const candidates:Candidate[]=[];
  for(const product of database.products)candidates.push({source:'CURRENT_DATABASE',product,identity:identity(product),safe:true,needsReview:false,reasons:[]});
  for(const product of github){
    if(dbByIdentity.has(identity(product)))continue;
    const reasons:string[]=[];
    if(!database.available)reasons.push('database unavailable: absence cannot be confirmed');
    if(!product.model.trim())reasons.push('empty model');
    if(!product.image)reasons.push('missing cover image');
    else if(!publicImageExists(product.image,database.mediaIds))reasons.push('cover image cannot be verified locally');
    if(!knownCategories.has(product.category.trim().toLowerCase()))reasons.push('invalid category');
    candidates.push({source:'GITHUB_ONLY',product,identity:identity(product),safe:reasons.length===0,needsReview:reasons.length>0,reasons});
  }
  for(const [key,product] of historical){
    if(dbByIdentity.has(key)||githubByIdentity.has(key))continue;
    const reasons:string[]=[];
    if(!database.available)reasons.push('database unavailable: absence cannot be confirmed');
    if(!product.model.trim())reasons.push('empty model');
    if(!product.image||!publicImageExists(product.image,database.mediaIds))reasons.push('missing or unverifiable cover image');
    if(!knownCategories.has(product.category.trim().toLowerCase()))reasons.push('invalid category');
    candidates.push({source:'HISTORICAL_ONLY',product,identity:key,safe:reasons.length===0,needsReview:reasons.length>0,reasons});
  }
  const all=[...database.products,...github,...historical.values()];
  const missingImages=all.filter(product=>!product.image||!publicImageExists(product.image,database.mediaIds));
  const invalidCategory=all.filter(product=>!knownCategories.has(product.category.trim().toLowerCase()));
  const statuses=Object.groupBy(all,product=>normalizeStatus(product.status));
  const report={
    generatedAt:new Date().toISOString(),database:{available:database.available,error:database.error||null,updatedAt:database.updatedAt||null,productCount:database.products.length},
    summary:{currentDatabaseProducts:database.products.length,githubProducts:github.length,historicalUniqueProducts:historical.size,productsSafeToRecover:candidates.filter(item=>item.source!=='CURRENT_DATABASE'&&item.safe).length,potentialDuplicates:groupedDuplicates(all).length,needManualReview:candidates.filter(item=>item.needsReview).length},
    classifications:{CURRENT_DATABASE:candidates.filter(item=>item.source==='CURRENT_DATABASE'),GITHUB_ONLY:candidates.filter(item=>item.source==='GITHUB_ONLY'),DATABASE_ONLY:database.products.filter(product=>!githubByIdentity.has(identity(product))&&!historical.has(identity(product))).map(productExport),HISTORICAL_ONLY:candidates.filter(item=>item.source==='HISTORICAL_ONLY'),POSSIBLE_DUPLICATE:groupedDuplicates(all),MISSING_IMAGE:missingImages.map(productExport),INVALID_CATEGORY:invalidCategory.map(productExport),DRAFT:(statuses.Draft||[]).map(productExport),PUBLISHED:(statuses.Published||[]).map(productExport),ARCHIVED:(statuses.Archived||[]).map(productExport)},
    historyVersions:historyVersions.sort((a,b)=>b.count-a.count),recoveryCandidates:candidates.filter(item=>item.source!=='CURRENT_DATABASE')
  };
  await writeFile(path.join(diagnostics,'current-database-products.json'),JSON.stringify({available:database.available,error:database.error||null,updatedAt:database.updatedAt||null,products:database.products.map(productExport)},null,2)+'\n');
  await writeFile(path.join(diagnostics,'product-recovery-report.json'),JSON.stringify(report,null,2)+'\n');
  const summary=report.summary;
  const markdown=[
    '# Master Product Recovery Report','',
    `Generated: ${report.generatedAt}`,'',
    `Current DB products: ${database.available?summary.currentDatabaseProducts:'UNAVAILABLE'}`,
    `GitHub products: ${summary.githubProducts}`,
    `Historical unique products: ${summary.historicalUniqueProducts}`,
    `Products safe to recover: ${summary.productsSafeToRecover}`,
    `Potential duplicates: ${summary.potentialDuplicates}`,
    `Need manual review: ${summary.needManualReview}`,'',
    database.available?'Database read completed in read-only mode.':'Database read failed in read-only mode: '+(database.error||'Unknown error.'),'',
    '## Candidate groups','',
    `- CURRENT_DATABASE: ${report.classifications.CURRENT_DATABASE.length}`,
    `- GITHUB_ONLY: ${report.classifications.GITHUB_ONLY.length}`,
    `- DATABASE_ONLY: ${report.classifications.DATABASE_ONLY.length}`,
    `- HISTORICAL_ONLY: ${report.classifications.HISTORICAL_ONLY.length}`,
    `- MISSING_IMAGE: ${report.classifications.MISSING_IMAGE.length}`,
    `- INVALID_CATEGORY: ${report.classifications.INVALID_CATEGORY.length}`,'',
    'No database rows were written by this audit.'
  ].join('\n');
  await writeFile(path.join(diagnostics,'product-recovery-report.md'),markdown+'\n');
  console.log(markdown);
}

void main().catch(error=>{console.error(error instanceof Error?error.stack:error);process.exitCode=1;});
