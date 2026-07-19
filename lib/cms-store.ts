import {readFile, rename, writeFile, mkdir} from 'fs/promises';
import path from 'path';
import {createClient} from '@supabase/supabase-js';
import {neon} from '@neondatabase/serverless';

export type CmsCollection='products'|'cases'|'factory'|'shipping'|'blog'|'media'|'inquiries';

const DATA_DIR=path.join(process.cwd(),'data');
const collectionFile=(collection:CmsCollection)=>path.join(DATA_DIR,collection==='media'?'admin-media.json':`${collection}.json`);
let schemaReady:Promise<void>|null=null;

function databaseConfigured(){
  return Boolean(process.env.DATABASE_URL);
}

function sql(){
  const url=process.env.DATABASE_URL;
  if(!url)throw new Error('DATABASE_URL is not configured.');
  return neon(url);
}

async function ensureSchema(){
  if(!databaseConfigured())return;
  if(!schemaReady)schemaReady=(async()=>{
    const db=sql();
    await db`CREATE TABLE IF NOT EXISTS cms_store (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    await db`CREATE TABLE IF NOT EXISTS media_files (
      id text PRIMARY KEY,
      filename text NOT NULL,
      mime text NOT NULL,
      bytes bytea NOT NULL,
      size integer NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;
  })();
  await schemaReady;
}

function supabaseConfigured(){
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function productionRuntime(){
  return process.env.VERCEL==='1'||process.env.NODE_ENV==='production';
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
  if(databaseConfigured()){
    try{
      await ensureSchema();
      const rows=await sql()`SELECT value FROM cms_store WHERE key=${collection} LIMIT 1`;
      if(rows[0]?.value)return rows[0].value as T;
      return fallback;
    }catch{
      return fallback;
    }
  }
  if(supabaseConfigured()){
    const {data,error}=await supabase().from('cms_store').select('value').eq('key',collection).maybeSingle();
    if(!error&&data?.value)return data.value as T;
  }
  return readLocal(collection,fallback);
}

export async function writeCollection<T>(collection:CmsCollection,data:T){
  if(databaseConfigured()){
    await ensureSchema();
    await sql()`INSERT INTO cms_store (key,value,updated_at) VALUES (${collection},${JSON.stringify(data)}::jsonb,now()) ON CONFLICT (key) DO UPDATE SET value=excluded.value,updated_at=now()`;
    return;
  }
  if(supabaseConfigured()){
    const {error}=await supabase().from('cms_store').upsert({key:collection,value:data,updated_at:new Date().toISOString()},{onConflict:'key'});
    if(error)throw new Error(error.message);
    return;
  }
  if(productionRuntime())throw new Error('Persistent storage is not configured. Set DATABASE_URL in Vercel before saving website content.');
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
  if(databaseConfigured()){
    await ensureSchema();
    const id=`media-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
    await sql()`INSERT INTO media_files (id,filename,mime,bytes,size) VALUES (${id},${filename},${file.type||'application/octet-stream'},${bytes},${file.size})`;
    return {url:`/api/media/${id}`,path:id,filename,size:file.size,type:file.type};
  }
  if(supabaseConfigured()&&process.env.SUPABASE_STORAGE_BUCKET){
    const bucket=process.env.SUPABASE_STORAGE_BUCKET;
    const client=supabase();
    const {error}=await client.storage.from(bucket).upload(key,bytes,{contentType:file.type||'application/octet-stream',upsert:false});
    if(error)throw new Error(error.message);
    const {data}=client.storage.from(bucket).getPublicUrl(key);
    return {url:data.publicUrl,path:key,filename,size:file.size,type:file.type};
  }
  if(productionRuntime())throw new Error('Persistent media storage is not configured. Set DATABASE_URL in Vercel before uploading files.');
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
