import {readFile} from 'fs/promises';
import path from 'path';
import {neon} from '@neondatabase/serverless';
import {normalizeProductCategory,normalizeSubCategory,PRODUCT_CATEGORY_OPTIONS,type CatalogCategory} from './catalog-config';
import {readCollection,slugify} from './cms-store';
import {PRODUCT_STATUSES,type ProductHealth,type ProductRecord,type ProductStatus} from './product-types';

type Row=Record<string,unknown>;
type Backup={id:string;collection:string;value:ProductRecord[];item_count:number;created_at:string;reason:string|null};
type Version={id:string;product_id:string;version:number;snapshot:ProductRecord;created_at:string;action:string|null};

const PLACEHOLDER='/uploads/placeholder-machine.svg';
const KNOWN_CATEGORIES=new Set<string>(PRODUCT_CATEGORY_OPTIONS.map(item=>item.value));

export class CatalogSafetyError extends Error{
  code='CATALOG_SAFETY_BLOCK';
  constructor(public readonly oldCount:number,public readonly newCount:number){
    super(`This operation would remove ${oldCount-newCount} products. Bulk catalog replacement has been blocked.`);
  }
}

function databaseUrl(){return process.env.DATABASE_URL;}
export function catalogDatabaseConfigured(){return Boolean(databaseUrl());}
function sql(){
  const url=databaseUrl();
  if(!url)throw new Error('DATABASE_URL is not configured.');
  return neon(url);
}

function cleanText(value:unknown){return String(value??'').trim();}
function normalizedIdentity(value:unknown){return cleanText(value).toLowerCase().replace(/[\s_-]+/g,'');}
export function canonicalModel(value:unknown){return cleanText(value).toUpperCase().replace(/[\s_-]+/g,'-');}
export function productIdentity(product:Pick<ProductRecord,'brand'|'model'>){return `${normalizedIdentity(product.brand)}:${normalizedIdentity(product.model)}`;}
export function normalizeStatus(value:unknown):ProductStatus{
  const normalized=cleanText(value).toLowerCase();
  if(normalized==='draft')return 'Draft';
  if(normalized==='archived'||normalized==='archive')return 'Archived';
  if(normalized==='deleted'||normalized==='trash')return 'Deleted';
  return 'Published';
}

function normalizeSpecs(value:unknown):Record<string,string>{
  if(typeof value==='string')return Object.fromEntries(value.split('\n').map(line=>{const index=line.indexOf(':');return index<0?['','']:[line.slice(0,index).trim(),line.slice(index+1).trim()]}).filter(([key,item])=>key&&item));
  if(!value||typeof value!=='object'||Array.isArray(value))return {};
  return Object.fromEntries(Object.entries(value as Record<string,unknown>).map(([key,item])=>[cleanText(key),cleanText(item)]).filter(([key,item])=>key&&item));
}

export function normalizeProduct(input:Partial<ProductRecord>):ProductRecord{
  const model=cleanText(input.model);
  const category=normalizeProductCategory(cleanText(input.category))||'uncategorized';
  const imageCandidates=[...(Array.isArray(input.images)?input.images:[]).map(cleanText),cleanText(input.image)].filter(Boolean);
  const images=[...new Set(imageCandidates)];
  const status=normalizeStatus(input.status);
  return {
    id:cleanText(input.id)||`product-${slugify(`${input.brand||'xcmg'}-${model}`)}-${Date.now()}`,
    brand:cleanText(input.brand)||'XCMG',
    name:cleanText(input.name)||`${cleanText(input.brand)||'XCMG'} ${model}`.trim(),
    model,
    category,
    subCategory:normalizeSubCategory(category,cleanText(input.subCategory)),
    source:cleanText(input.source)||'manual',
    image:cleanText(input.image)||images[0]||PLACEHOLDER,
    images:images.length?images:[cleanText(input.image)||PLACEHOLDER],
    description:cleanText(input.description),
    shortDescription:cleanText(input.shortDescription)||undefined,
    specifications:normalizeSpecs(input.specifications),
    engine:cleanText(input.engine)||undefined,
    operatingWeight:cleanText(input.operatingWeight)||undefined,
    bucketCapacity:cleanText(input.bucketCapacity)||undefined,
    ratedPower:cleanText(input.ratedPower)||undefined,
    dimension:cleanText(input.dimension)||undefined,
    fobPrice:cleanText(input.fobPrice)||undefined,
    moq:cleanText(input.moq)||undefined,
    deliveryTime:cleanText(input.deliveryTime)||undefined,
    seaFreight:cleanText(input.seaFreight)||undefined,
    destinationPort:cleanText(input.destinationPort)||undefined,
    cifPrice:cleanText(input.cifPrice)||undefined,
    deposit30:cleanText(input.deposit30)||undefined,
    balance70:cleanText(input.balance70)||undefined,
    validity:cleanText(input.validity)||undefined,
    video:cleanText(input.video)||undefined,
    pdfBrochure:cleanText(input.pdfBrochure)||undefined,
    seoTitle:cleanText(input.seoTitle)||undefined,
    seoDescription:cleanText(input.seoDescription)||undefined,
    slug:slugify(cleanText(input.slug)||`${input.brand||'XCMG'}-${model}`),
    status,
    localOnly:true,
    createdAt:cleanText(input.createdAt)||undefined,
    updatedAt:cleanText(input.updatedAt)||undefined,
    deletedAt:input.deletedAt?cleanText(input.deletedAt):status==='Deleted'?new Date().toISOString():null
  };
}

async function fileProducts():Promise<ProductRecord[]>{
  try{return JSON.parse(await readFile(path.join(process.cwd(),'data','products.json'),'utf8')).map((item:ProductRecord)=>normalizeProduct(item));}catch{return [];}
}

async function legacyDatabaseProducts():Promise<ProductRecord[]>{
  const rows=await sql()`SELECT value FROM cms_store WHERE key='products' LIMIT 1`;
  return Array.isArray(rows[0]?.value)?rows[0].value.map((item:ProductRecord)=>normalizeProduct(item)):[];
}

export async function getLegacyProducts():Promise<ProductRecord[]>{
  if(catalogDatabaseConfigured()){
    try{return await legacyDatabaseProducts();}catch{return fileProducts();}
  }
  return readCollection<ProductRecord[]>('products',await fileProducts()).then(items=>items.map(normalizeProduct));
}

export async function ensureProductSchema(){
  const db=sql();
  await db`CREATE TABLE IF NOT EXISTS cms_backups (
    id text PRIMARY KEY,
    collection text NOT NULL,
    value jsonb NOT NULL,
    item_count integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    reason text
  )`;
  await db`CREATE TABLE IF NOT EXISTS products (
    id text PRIMARY KEY,
    brand text NOT NULL,
    model text NOT NULL,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    category text NOT NULL,
    sub_category text,
    source text,
    description text,
    short_description text,
    image text,
    status text NOT NULL DEFAULT 'Published',
    specifications jsonb NOT NULL DEFAULT '{}'::jsonb,
    engine text,
    operating_weight text,
    bucket_capacity text,
    rated_power text,
    dimension text,
    fob_price text,
    moq text,
    delivery_time text,
    sea_freight text,
    destination_port text,
    cif_price text,
    deposit_30 text,
    balance_70 text,
    validity text,
    video text,
    pdf_brochure text,
    seo_title text,
    seo_description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
  )`;
  await db`CREATE UNIQUE INDEX IF NOT EXISTS products_brand_model_unique ON products(lower(brand),lower(model)) WHERE deleted_at IS NULL`;
  await db`CREATE TABLE IF NOT EXISTS product_images (
    id text PRIMARY KEY,
    product_id text NOT NULL REFERENCES products(id),
    url text NOT NULL,
    position integer NOT NULL DEFAULT 0,
    is_cover boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await db`CREATE INDEX IF NOT EXISTS product_images_product_id_index ON product_images(product_id,position)`;
  await db`CREATE TABLE IF NOT EXISTS product_versions (
    id text PRIMARY KEY,
    product_id text NOT NULL,
    version integer NOT NULL,
    snapshot jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    action text,
    UNIQUE(product_id,version)
  )`;
}

async function tableProductCount(includeDeleted=true){
  const db=sql();
  const table=await db`SELECT to_regclass('public.products') AS relation`;
  if(!table[0]?.relation)return null;
  const rows=includeDeleted?await db`SELECT count(*)::int AS count FROM products`:await db`SELECT count(*)::int AS count FROM products WHERE deleted_at IS NULL`;
  return Number(rows[0]?.count||0);
}

async function tableExists(table:string){
  const rows=await sql()`SELECT to_regclass(${`public.${table}`}) AS relation`;
  return Boolean(rows[0]?.relation);
}

function rowProduct(row:Row,imageRows:Row[]):ProductRecord{
  const images=imageRows.filter(item=>String(item.product_id)===String(row.id)).sort((a,b)=>Number(a.position)-Number(b.position)).map(item=>cleanText(item.url)).filter(Boolean);
  const cover=imageRows.find(item=>String(item.product_id)===String(row.id)&&Boolean(item.is_cover));
  return normalizeProduct({
    id:cleanText(row.id),brand:cleanText(row.brand),model:cleanText(row.model),name:cleanText(row.name),slug:cleanText(row.slug),category:cleanText(row.category),subCategory:cleanText(row.sub_category),source:cleanText(row.source),description:cleanText(row.description),shortDescription:cleanText(row.short_description),image:cleanText(row.image)||cleanText(cover?.url)||images[0],images,specifications:row.specifications as Record<string,string>,status:cleanText(row.status),engine:cleanText(row.engine),operatingWeight:cleanText(row.operating_weight),bucketCapacity:cleanText(row.bucket_capacity),ratedPower:cleanText(row.rated_power),dimension:cleanText(row.dimension),fobPrice:cleanText(row.fob_price),moq:cleanText(row.moq),deliveryTime:cleanText(row.delivery_time),seaFreight:cleanText(row.sea_freight),destinationPort:cleanText(row.destination_port),cifPrice:cleanText(row.cif_price),deposit30:cleanText(row.deposit_30),balance70:cleanText(row.balance_70),validity:cleanText(row.validity),video:cleanText(row.video),pdfBrochure:cleanText(row.pdf_brochure),seoTitle:cleanText(row.seo_title),seoDescription:cleanText(row.seo_description),createdAt:cleanText(row.created_at),updatedAt:cleanText(row.updated_at),deletedAt:row.deleted_at?cleanText(row.deleted_at):null
  });
}

async function tableProducts(includeDeleted=false):Promise<ProductRecord[]>{
  const db=sql();
  const rows=includeDeleted?await db`SELECT * FROM products ORDER BY updated_at DESC`:await db`SELECT * FROM products WHERE deleted_at IS NULL ORDER BY updated_at DESC`;
  const images=await db`SELECT product_id,url,position,is_cover FROM product_images ORDER BY product_id,position`;
  return rows.map(row=>rowProduct(row as Row,images as Row[]));
}

export async function getProducts(options:{includeDeleted?:boolean;publishedOnly?:boolean;strict?:boolean}={}):Promise<ProductRecord[]>{
  if(catalogDatabaseConfigured()){
    try{
      const count=await tableProductCount(true);
      if(count!==null&&count>0){
        let products=await tableProducts(Boolean(options.includeDeleted));
        if(options.publishedOnly)products=products.filter(item=>item.status==='Published'&&!item.deletedAt);
        return products;
      }
      if(options.strict){
        let products=await legacyDatabaseProducts();
        if(!options.includeDeleted)products=products.filter(p=>p.status!=='Deleted');
        if(options.publishedOnly)products=products.filter(p=>p.status==='Published');
        return products;
      }
    }catch{
      if(options.strict)throw new Error('数据库读取失败，未使用备用商品数据 / Database unavailable. Retry before editing.');
    }
  }
  let products=await getLegacyProducts();
  if(!options.includeDeleted)products=products.filter(item=>item.status!=='Deleted');
  if(options.publishedOnly)products=products.filter(item=>item.status==='Published');
  return products;
}

function validateProduct(product:ProductRecord){
  if(!product.model)throw new Error('Model is required.');
  if(!product.category||product.category==='uncategorized')throw new Error('Select a valid category.');
  if(!product.slug)throw new Error('A valid slug is required.');
  if(!PRODUCT_STATUSES.includes(normalizeStatus(product.status)))throw new Error('Invalid product status.');
}

async function assertNoConflict(product:ProductRecord,exceptId?:string){
  const db=sql();
  const model=cleanText(product.model),brand=cleanText(product.brand),slug=cleanText(product.slug);
  const modelRows=await db`SELECT id FROM products WHERE deleted_at IS NULL AND lower(brand)=lower(${brand}) AND lower(model)=lower(${model}) LIMIT 1`;
  if(modelRows[0]&&String(modelRows[0].id)!==exceptId)throw new Error('A non-deleted product with the same brand and model already exists.');
  const slugRows=await db`SELECT id FROM products WHERE slug=${slug} LIMIT 1`;
  if(slugRows[0]&&String(slugRows[0].id)!==exceptId)throw new Error('Another product already uses this page slug.');
}

async function saveVersion(product:ProductRecord,action:string){
  const db=sql();
  const latest=await db`SELECT coalesce(max(version),0)::int AS version FROM product_versions WHERE product_id=${product.id}`;
  const version=Number(latest[0]?.version||0)+1;
  const id=`version-${product.id}-${version}-${Date.now()}`;
  await db`INSERT INTO product_versions (id,product_id,version,snapshot,action) VALUES (${id},${product.id},${version},${JSON.stringify(product)}::jsonb,${action})`;
}

async function upsertImages(product:ProductRecord){
  const db=sql();
  await db`DELETE FROM product_images WHERE product_id=${product.id}`;
  const images=[...new Set(product.images.filter(Boolean))];
  for(const [position,url] of images.entries()){
    await db`INSERT INTO product_images (id,product_id,url,position,is_cover) VALUES (${`product-image-${product.id}-${position}-${Date.now()}`},${product.id},${url},${position},${url===product.image})`;
  }
}

async function insertRow(product:ProductRecord){
  const db=sql();
  await db`INSERT INTO products (id,brand,model,name,slug,category,sub_category,source,description,short_description,image,status,specifications,engine,operating_weight,bucket_capacity,rated_power,dimension,fob_price,moq,delivery_time,sea_freight,destination_port,cif_price,deposit_30,balance_70,validity,video,pdf_brochure,seo_title,seo_description,created_at,updated_at,deleted_at)
    VALUES (${product.id},${product.brand},${product.model},${product.name},${product.slug},${product.category},${product.subCategory},${product.source||null},${product.description},${product.shortDescription||null},${product.image},${normalizeStatus(product.status)},${JSON.stringify(normalizeSpecs(product.specifications))}::jsonb,${product.engine||null},${product.operatingWeight||null},${product.bucketCapacity||null},${product.ratedPower||null},${product.dimension||null},${product.fobPrice||null},${product.moq||null},${product.deliveryTime||null},${product.seaFreight||null},${product.destinationPort||null},${product.cifPrice||null},${product.deposit30||null},${product.balance70||null},${product.validity||null},${product.video||null},${product.pdfBrochure||null},${product.seoTitle||null},${product.seoDescription||null},${product.createdAt||new Date().toISOString()},now(),${product.status==='Deleted'?product.deletedAt||new Date().toISOString():null})`;
  await upsertImages(product);
}

async function updateRow(product:ProductRecord){
  const db=sql();
  await db`UPDATE products SET brand=${product.brand},model=${product.model},name=${product.name},slug=${product.slug},category=${product.category},sub_category=${product.subCategory},source=${product.source||null},description=${product.description},short_description=${product.shortDescription||null},image=${product.image},status=${normalizeStatus(product.status)},specifications=${JSON.stringify(normalizeSpecs(product.specifications))}::jsonb,engine=${product.engine||null},operating_weight=${product.operatingWeight||null},bucket_capacity=${product.bucketCapacity||null},rated_power=${product.ratedPower||null},dimension=${product.dimension||null},fob_price=${product.fobPrice||null},moq=${product.moq||null},delivery_time=${product.deliveryTime||null},sea_freight=${product.seaFreight||null},destination_port=${product.destinationPort||null},cif_price=${product.cifPrice||null},deposit_30=${product.deposit30||null},balance_70=${product.balance70||null},validity=${product.validity||null},video=${product.video||null},pdf_brochure=${product.pdfBrochure||null},seo_title=${product.seoTitle||null},seo_description=${product.seoDescription||null},updated_at=now(),deleted_at=${product.status==='Deleted'?product.deletedAt||new Date().toISOString():null} WHERE id=${product.id}`;
  await upsertImages(product);
}

async function currentProduct(id:string){
  const product=(await tableProducts(true)).find(item=>item.id===id);
  if(!product)throw new Error('Product not found.');
  return product;
}

export async function createCatalogBackup(reason:string,snapshot?:ProductRecord[]){
  await ensureProductSchema();
  const value=(snapshot||await getProducts({includeDeleted:true})).map(normalizeProduct);
  const id=`catalog-backup-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  await sql()`INSERT INTO cms_backups (id,collection,value,item_count,reason) VALUES (${id},'products',${JSON.stringify(value)}::jsonb,${value.length},${reason})`;
  return {id,itemCount:value.length,reason};
}

async function requireTableCatalog(){
  if(!await tableExists('products'))throw new Error('CATALOG_MIGRATION_REQUIRED: Run npm run products:migrate -- --apply after the database backup succeeds. Legacy cms_store.products remains read-only.');
  const count=await tableProductCount(true);
  if(!count)throw new Error('CATALOG_MIGRATION_REQUIRED: Run npm run products:migrate -- --apply after the database backup succeeds. Legacy cms_store.products remains read-only.');
}

export async function createProduct(input:Partial<ProductRecord>){
  await requireTableCatalog();
  const product=normalizeProduct(input);
  validateProduct(product);
  await assertNoConflict(product);
  await createCatalogBackup('before-product-create');
  await insertRow(product);
  await saveVersion(product,'Created');
  return product;
}

export async function updateProduct(id:string,input:Partial<ProductRecord>){
  await requireTableCatalog();
  const previous=await currentProduct(id);
  const product=normalizeProduct({...previous,...input,id,createdAt:previous.createdAt,deletedAt:normalizeStatus(input.status||previous.status)==='Deleted'?previous.deletedAt||new Date().toISOString():null});
  validateProduct(product);
  await assertNoConflict(product,id);
  await createCatalogBackup('before-product-update');
  await saveVersion(previous,'Updated');
  await updateRow(product);
  return product;
}

export async function trashProduct(id:string){
  await requireTableCatalog();
  const previous=await currentProduct(id);
  if(previous.status==='Deleted')return previous;
  await createCatalogBackup('before-product-delete');
  await saveVersion(previous,'Deleted');
  const product=normalizeProduct({...previous,status:'Deleted',deletedAt:new Date().toISOString()});
  await updateRow(product);
  return product;
}

export async function restoreProduct(id:string){
  await requireTableCatalog();
  const previous=await currentProduct(id);
  await assertNoConflict({...previous,status:'Published'},id);
  await createCatalogBackup('before-product-restore');
  await saveVersion(previous,'Restored');
  const product=normalizeProduct({...previous,status:'Published',deletedAt:null});
  await updateRow(product);
  return product;
}

export async function permanentlyDeleteProduct(id:string,confirmed:boolean){
  if(!confirmed)throw new Error('PERMANENT_DELETE_CONFIRMATION_REQUIRED');
  await requireTableCatalog();
  const previous=await currentProduct(id);
  if(previous.status!=='Deleted')throw new Error('Only products in Trash can be permanently deleted.');
  await createCatalogBackup('before-product-permanent-delete');
  await saveVersion(previous,'Permanently deleted');
  const db=sql();
  await db`DELETE FROM product_images WHERE product_id=${id}`;
  await db`DELETE FROM products WHERE id=${id}`;
}

export function assertSafeCatalogReduction(oldCount:number,newCount:number,confirmed=false){
  if(!confirmed&&oldCount>=20&&newCount<oldCount*0.8)throw new CatalogSafetyError(oldCount,newCount);
}

export async function listProductVersions(id:string):Promise<Version[]>{
  if(!await tableExists('product_versions'))return [];
  const rows=await sql()`SELECT id,product_id,version,snapshot,created_at,action FROM product_versions WHERE product_id=${id} ORDER BY version DESC`;
  return rows.map(row=>({...row,snapshot:normalizeProduct(row.snapshot as ProductRecord)}) as Version);
}

export async function restoreProductVersion(id:string,versionId:string){
  await requireTableCatalog();
  const rows=await sql()`SELECT snapshot,action FROM product_versions WHERE id=${versionId} AND product_id=${id} LIMIT 1`;
  if(!rows[0]?.snapshot)throw new Error('Version not found.');
  const previous=await currentProduct(id),product=normalizeProduct({...rows[0].snapshot as ProductRecord,id,deletedAt:null});
  validateProduct(product);
  await assertNoConflict(product,id);
  await createCatalogBackup('before-product-version-restore');
  await saveVersion(previous,`Restored version ${versionId}`);
  await updateRow(product);
  return product;
}

export async function listCatalogBackups():Promise<Backup[]>{
  if(!await tableExists('cms_backups'))return [];
  const rows=await sql()`SELECT id,collection,value,item_count,created_at,reason FROM cms_backups WHERE collection='products' ORDER BY created_at DESC`;
  return rows.map(row=>({...row,value:Array.isArray(row.value)?row.value.map((item:ProductRecord)=>normalizeProduct(item)):[]}) as Backup);
}

export async function restoreCatalogBackup(id:string,confirmedReduction=false){
  await requireTableCatalog();
  const rows=await sql()`SELECT value,item_count FROM cms_backups WHERE id=${id} AND collection='products' LIMIT 1`;
  if(!rows[0])throw new Error('Backup not found.');
  const snapshot=(Array.isArray(rows[0].value)?rows[0].value:[]).map((item:ProductRecord)=>normalizeProduct(item));
  const current=await tableProducts(true),active=current.filter(item=>item.status!=='Deleted');
  assertSafeCatalogReduction(active.length,snapshot.filter(item=>item.status!=='Deleted').length,confirmedReduction);
  await createCatalogBackup('before-catalog-backup-restore',current);
  const snapshotIds=new Set(snapshot.map(item=>item.id));
  for(const existing of current.filter(item=>!snapshotIds.has(item.id)&&item.status!=='Deleted')){
    await saveVersion(existing,'Removed by catalog backup restore');
    await updateRow(normalizeProduct({...existing,status:'Deleted',deletedAt:new Date().toISOString()}));
  }
  for(const product of snapshot){
    const currentItem=current.find(item=>item.id===product.id);
    if(currentItem){await saveVersion(currentItem,'Restored from catalog backup');await updateRow(product);}else{await assertNoConflict(product);await insertRow(product);await saveVersion(product,'Restored from catalog backup');}
  }
  return {restored:snapshot.length};
}

export async function migrateLegacyProductsToTable(){
  await ensureProductSchema();
  const count=await tableProductCount(true);
  if(count&&count>0)return {migrated:0,alreadyMigrated:count,images:0};
  const legacy=await legacyDatabaseProducts();
  if(!legacy.length)throw new Error('Legacy cms_store.products is empty. Migration stopped: no production source was found.');
  const selected:ProductRecord[]=[];
  const identities=new Set<string>(),slugs=new Set<string>();
  for(const candidate of legacy){
    const product=normalizeProduct(candidate),identity=productIdentity(product);
    if(!product.model||identities.has(identity)||slugs.has(product.slug||''))continue;
    identities.add(identity);slugs.add(product.slug||'');selected.push(product);
  }
  if(selected.length!==legacy.length)throw new Error(`Migration stopped: ${legacy.length-selected.length} legacy products are duplicate or invalid and require review.`);
  await createCatalogBackup('before-product-table-migration',legacy);
  for(const product of selected){await insertRow(product);await saveVersion(product,'Migrated from cms_store.products');}
  const after=await tableProductCount(true);
  if(after!==selected.length)throw new Error(`Migration verification failed: expected ${selected.length} products but found ${after}.`);
  return {migrated:after,alreadyMigrated:0,images:selected.reduce((total,item)=>total+item.images.length,0)};
}

function duplicateGroups(products:ProductRecord[],key:(product:ProductRecord)=>string){
  const groups=new Map<string,ProductRecord[]>();
  for(const product of products){const value=key(product);if(!value)continue;groups.set(value,[...(groups.get(value)||[]),product]);}
  return [...groups.entries()].filter(([,items])=>items.length>1).map(([value,items])=>({key:value,products:items}));
}

export async function getProductHealth():Promise<ProductHealth>{
  const products=await getProducts({includeDeleted:true,strict:true});
  const statuses=products.map(item=>normalizeStatus(item.status));
  const invalidStatus=products.filter((item,index)=>cleanText(item.status)&&!PRODUCT_STATUSES.includes(statuses[index]));
  return {
    total:products.length,published:products.filter(item=>item.status==='Published').length,draft:products.filter(item=>item.status==='Draft').length,archived:products.filter(item=>item.status==='Archived').length,trash:products.filter(item=>item.status==='Deleted').length,
    missingImages:products.filter(item=>!item.image||item.image===PLACEHOLDER),duplicateModels:duplicateGroups(products.filter(item=>item.status!=='Deleted'),productIdentity),duplicateSlugs:duplicateGroups(products.filter(item=>item.status!=='Deleted'),item=>cleanText(item.slug).toLowerCase()),invalidCategories:products.filter(item=>!KNOWN_CATEGORIES.has(String(item.category))),emptyModels:products.filter(item=>!cleanText(item.model)),missingDescriptions:products.filter(item=>!cleanText(item.description)&&!cleanText(item.shortDescription)),invalidStatuses:invalidStatus
  };
}
