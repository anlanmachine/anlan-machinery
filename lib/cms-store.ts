import {readFile, rename, writeFile, mkdir} from 'fs/promises';
import path from 'path';
import {createClient} from '@supabase/supabase-js';

export type CmsCollection='products'|'cases'|'factory'|'shipping'|'blog'|'media'|'inquiries';

const DATA_DIR=path.join(process.cwd(),'data');
const collectionFile=(collection:CmsCollection)=>path.join(DATA_DIR,collection==='media'?'admin-media.json':`${collection}.json`);

function supabaseConfigured(){
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function supabase(){
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
}

async function readLocal<T>(collection:CmsCollection,fallback:T):Promise<T>{
  try{return JSON.parse(await readFile(collectionFile(collection),'utf8')) as T;}catch{return fallback;}
}

async function writeLocal<T>(collection:CmsCollection,data:T){
  await mkdir(DATA_DIR,{recursive:true});
  const file=collectionFile(collection),temporary=`${file}.tmp`;
  await writeFile(temporary,JSON.stringify(data,null,2)+'\n','utf8');
  await rename(temporary,file);
}

export async function readCollection<T>(collection:CmsCollection,fallback:T):Promise<T>{
  if(supabaseConfigured()){
    const {data,error}=await supabase().from('cms_store').select('value').eq('key',collection).maybeSingle();
    if(!error&&data?.value)return data.value as T;
  }
  return readLocal(collection,fallback);
}

export async function writeCollection<T>(collection:CmsCollection,data:T){
  if(supabaseConfigured()){
    const {error}=await supabase().from('cms_store').upsert({key:collection,value:data,updated_at:new Date().toISOString()},{onConflict:'key'});
    if(error)throw new Error(error.message);
    return;
  }
  await writeLocal(collection,data);
}

export function slugify(value:string){
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

export function nowIso(){return new Date().toISOString();}

export async function saveUpload(file:File,folder='admin'){
  const bytes=Buffer.from(await file.arrayBuffer());
  const extension=path.extname(file.name).toLowerCase()||mimeExtension(file.type);
  const base=slugify(path.basename(file.name,path.extname(file.name)))||'media';
  const filename=`${base}-${Date.now()}${extension}`;
  const key=`uploads/${folder}/${filename}`;
  if(supabaseConfigured()&&process.env.SUPABASE_STORAGE_BUCKET){
    const bucket=process.env.SUPABASE_STORAGE_BUCKET;
    const client=supabase();
    const {error}=await client.storage.from(bucket).upload(key,bytes,{contentType:file.type||'application/octet-stream',upsert:false});
    if(error)throw new Error(error.message);
    const {data}=client.storage.from(bucket).getPublicUrl(key);
    return {url:data.publicUrl,path:key,filename,size:file.size,type:file.type};
  }
  const output=path.join(process.cwd(),'public','uploads',folder);
  await mkdir(output,{recursive:true});
  await writeFile(path.join(output,filename),bytes);
  return {url:`/uploads/${folder}/${filename}`,path:key,filename,size:file.size,type:file.type};
}

function mimeExtension(type:string){
  if(type==='image/jpeg')return '.jpg';
  if(type==='image/png')return '.png';
  if(type==='image/webp')return '.webp';
  if(type==='video/mp4')return '.mp4';
  if(type==='application/pdf')return '.pdf';
  return '';
}
