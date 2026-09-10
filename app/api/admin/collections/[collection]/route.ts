import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin-auth';
import {CmsCollection,nowIso,readCollection,slugify,writeCollection} from '@/lib/cms-store';
import {readFile} from 'fs/promises';
import path from 'path';
import {DEFAULT_PRODUCT_CATEGORIES,normalizeProductCategory,normalizeSubCategory} from '@/lib/catalog-config';
import {getHomeShipmentSlots} from '@/lib/home-shipments';
import {getBaseMedia} from '@/lib/media';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const allowed=new Set<CmsCollection>(['products','productCategories','cases','factory','shipping','blog','media','homeShipments','inquiries']);

function normalizeCollection(value:string):CmsCollection{
  if(!allowed.has(value as CmsCollection))throw new Error('Unknown collection.');
  return value as CmsCollection;
}

async function readItems(collection:CmsCollection){
  if(collection==='products'){
    let fallback:Record<string,unknown>[]=[];
    try{fallback=JSON.parse(await readFile(path.join(process.cwd(),'data','products.json'),'utf8'));}catch{}
    return readCollection<Record<string,unknown>[]>(collection,fallback);
  }
  if(collection==='productCategories')return readCollection<Record<string,unknown>[]>(collection,DEFAULT_PRODUCT_CATEGORIES);
  return readCollection<Record<string,unknown>[]>(collection,[]);
}

async function defaultMediaItem(collection:'factory'|'cases'){
  const media=await getBaseMedia();
  const category=collection==='factory'?'factory':'customers';
  const images=media.images.filter(item=>item.category===category).map(item=>item.src);
  const videos=media.videos.filter(item=>item.category===category).map(item=>item.src);
  return collection==='factory'
    ? {id:'factory-default-media',isDefaultMedia:true,title:'Current Factory Photos & Videos',description:'The factory photos and videos currently shown on the public website. Replace or add media here without affecting other sections.',category:'Factory',images,videos,video:videos[0]||'',status:'Published'}
    : {id:'cases-default-media',isDefaultMedia:true,title:'Current Customer Case Photos & Videos',description:'The customer photos currently shown on the public website. Replace or add media here without affecting other sections.',country:'',customerIndustry:'',machineModel:'',quantity:'',year:new Date().getFullYear(),images,videos,video:videos[0]||'',status:'Published'};
}

async function adminItems(collection:CmsCollection){
  const items=await readItems(collection);
  if(collection!=='factory'&&collection!=='cases')return items;
  const defaultId=`${collection==='factory'?'factory':'cases'}-default-media`;
  if(items.some(item=>String(item.id)===defaultId))return items;
  return [await defaultMediaItem(collection),...items];
}

function normalize(collection:CmsCollection,input:Record<string,unknown>){
  const item={...input} as Record<string,unknown>;
  const title=String(item.title||item.name||item.model||item.caseTitle||'item');
  if(!item.id)item.id=`${collection}-${slugify(String(item.slug||title))||Date.now()}`;
  if(collection==='productCategories'){
    const id=slugify(String(item.id||item.label||''));
    if(!id)throw new Error('Category name is required.');
    item.id=id;
    item.label=String(item.label||id).trim();
    item.subCategory=slugify(String(item.subCategory||id))||id;
  }
  if(collection==='products'){
    const brand=String(item.brand||'XCMG').trim();
    const model=String(item.model||'').trim();
    if(!model)throw new Error('Product Model is required before publishing.');
    item.brand=brand;
    item.model=model;
    item.name=String(item.name||item.productName||`${brand} ${model}`).trim();
    item.slug=slugify(String(item.slug||`${brand}-${model}`));
    const category=normalizeProductCategory(String(item.category||''));
    if(!category)throw new Error('Select a valid product category.');
    item.category=category;
    item.subCategory=normalizeSubCategory(category,String(item.subCategory||''));
    const images=Array.isArray(item.images)?item.images.map(String).filter(Boolean):[item.image].map(String).filter(Boolean);
    item.images=images;
    item.image=String(item.image||images[0]||'/uploads/placeholder-machine.svg');
    item.status=String(item.status||'Published')==='Draft'?'Draft':'Published';
    item.localOnly=true;
  }
  if(collection==='blog')item.slug=slugify(String(item.slug||item.title||item.id));
  if(collection==='factory'||collection==='cases'){
    const images=Array.isArray(item.images)?item.images.map(String).filter(Boolean):[];
    const legacyVideo=String(item.video||'').trim();
    const videos=Array.isArray(item.videos)?item.videos.map(String).filter(Boolean):legacyVideo?[legacyVideo]:[];
    item.images=images;
    item.videos=videos;
    item.video=videos[0]||'';
    item.status=String(item.status||'Published')==='Draft'?'Draft':'Published';
  }
  if(collection==='homeShipments'){
    const slot=Number(item.slot);
    if(!Number.isInteger(slot)||slot<1||slot>6)throw new Error('Choose a valid homepage shipment slot.');
    item.id=`home-shipment-slot-${slot}`;
    item.slot=slot;
    item.title=String(item.title||`Shipping Loading ${slot}`).trim();
    item.alt=String(item.alt||item.title).trim();
    item.image=String(item.image||'').trim();
    if(!item.image)throw new Error('Upload or select a shipment photo first.');
    item.status=String(item.status||'Published')==='Draft'?'Draft':'Published';
  }
  item.updatedAt=nowIso();
  if(!item.createdAt)item.createdAt=nowIso();
  return item;
}

export async function GET(_:NextRequest,{params}:{params:Promise<{collection:string}>}){
  try{
    await requireAdmin();
    const collection=normalizeCollection((await params).collection);
    const items=collection==='homeShipments'?await getHomeShipmentSlots():await adminItems(collection);
    return NextResponse.json(items,{headers:{'Cache-Control':'no-store'}});
  }
  catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Unauthorized'},{status:401});}
}

export async function POST(request:NextRequest,{params}:{params:Promise<{collection:string}>}){
  try{
    await requireAdmin();
    const collection=normalizeCollection((await params).collection),items=await readItems(collection),item=normalize(collection,await request.json());
    items.unshift(item);
    await writeCollection(collection,items);
    return NextResponse.json({success:true,item});
  }catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Save failed.'},{status:400});}
}

export async function PUT(request:NextRequest,{params}:{params:Promise<{collection:string}>}){
  try{
    await requireAdmin();
    const collection=normalizeCollection((await params).collection),items=await readItems(collection),item=normalize(collection,await request.json());
    const index=items.findIndex(existing=>existing.id===item.id);
    if(index<0){
      const isDefaultMedia=(collection==='factory'||collection==='cases')&&String(item.id)===`${collection==='factory'?'factory':'cases'}-default-media`;
      if(collection!=='homeShipments'&&!isDefaultMedia)return NextResponse.json({success:false,error:'Item not found.'},{status:404});
      items.unshift(item);
    }else items[index]=item;
    await writeCollection(collection,items);
    return NextResponse.json({success:true,item});
  }catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Save failed.'},{status:400});}
}

export async function DELETE(request:NextRequest,{params}:{params:Promise<{collection:string}>}){
  try{
    await requireAdmin();
    const collection=normalizeCollection((await params).collection),id=request.nextUrl.searchParams.get('id');
    if(!id)return NextResponse.json({success:false,error:'ID is required.'},{status:400});
    const items=await readItems(collection);
    if(collection==='productCategories'){
      const products=await readItems('products');
      if(products.some(product=>String(product.category)===id))throw new Error('This category is still used by a product. Move those products first.');
    }
    const next=items.filter(item=>item.id!==id);
    await writeCollection(collection,next);
    return NextResponse.json({success:true});
  }catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Delete failed.'},{status:400});}
}
