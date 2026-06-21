import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin-auth';
import {CmsCollection,nowIso,readCollection,slugify,writeCollection} from '@/lib/cms-store';
import {readFile} from 'fs/promises';
import path from 'path';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const allowed=new Set<CmsCollection>(['products','cases','factory','shipping','blog','media','inquiries']);

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
  return readCollection<Record<string,unknown>[]>(collection,[]);
}

function normalize(collection:CmsCollection,input:Record<string,unknown>){
  const item={...input} as Record<string,unknown>;
  const title=String(item.title||item.name||item.model||item.caseTitle||'item');
  if(!item.id)item.id=`${collection}-${slugify(String(item.slug||title))||Date.now()}`;
  if(collection==='products'){
    const brand=String(item.brand||'XCMG').trim();
    const model=String(item.model||'').trim();
    item.brand=brand;
    item.model=model;
    item.name=String(item.name||item.productName||`${brand} ${model}`).trim();
    item.slug=slugify(String(item.slug||`${brand}-${model}`));
    item.category=String(item.category||'excavator').trim().toLowerCase().replaceAll(' ','-');
    const images=Array.isArray(item.images)?item.images.map(String).filter(Boolean):[item.image].map(String).filter(Boolean);
    item.images=images;
    item.image=String(item.image||images[0]||'/uploads/placeholder-machine.svg');
    item.status=String(item.status||'Published');
    item.localOnly=true;
  }
  if(collection==='blog')item.slug=slugify(String(item.slug||item.title||item.id));
  item.updatedAt=nowIso();
  if(!item.createdAt)item.createdAt=nowIso();
  return item;
}

export async function GET(_:NextRequest,{params}:{params:Promise<{collection:string}>}){
  try{await requireAdmin();return NextResponse.json(await readItems(normalizeCollection((await params).collection)),{headers:{'Cache-Control':'no-store'}});}
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
    if(index<0)return NextResponse.json({success:false,error:'Item not found.'},{status:404});
    items[index]=item;
    await writeCollection(collection,items);
    return NextResponse.json({success:true,item});
  }catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Save failed.'},{status:400});}
}

export async function DELETE(request:NextRequest,{params}:{params:Promise<{collection:string}>}){
  try{
    await requireAdmin();
    const collection=normalizeCollection((await params).collection),id=request.nextUrl.searchParams.get('id');
    if(!id)return NextResponse.json({success:false,error:'ID is required.'},{status:400});
    const items=await readItems(collection),next=items.filter(item=>item.id!==id);
    await writeCollection(collection,next);
    return NextResponse.json({success:true});
  }catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Delete failed.'},{status:400});}
}
