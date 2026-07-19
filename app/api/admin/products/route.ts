import {NextRequest,NextResponse} from 'next/server';
import {readCollection,writeCollection} from '@/lib/cms-store';
import {normalizeProductCategory,normalizeSubCategory} from '@/lib/catalog-config';

export const runtime='nodejs';
export const dynamic='force-dynamic';
type Product={id:string;brand:string;name:string;model:string;category:string;subCategory:string;source?:'xcmg'|'pdf'|'manual';image:string;images:string[];description:string;specifications:Record<string,string>;localOnly:true;status?:string;slug?:string};

function authorized(request:NextRequest){return Boolean(process.env.ADMIN_PASSWORD)&&request.headers.get('x-admin-password')===process.env.ADMIN_PASSWORD;}
async function readProducts():Promise<Product[]>{return readCollection<Product[]>('products',[]);}
async function saveProducts(products:Product[]){await writeCollection('products',products);}
function normalize(input:Partial<Product>):Product{
  const model=String(input.model||'').trim();
  const category=normalizeProductCategory(String(input.category||''));
  if(!model)throw new Error('Model is required.');
  if(!category)throw new Error('Select a valid category.');
  const images=(Array.isArray(input.images)?input.images:[]).map(String).filter(isAllowedMediaUrl);
  const image=String(input.image||images[0]||'');
  if(!isAllowedMediaUrl(image))throw new Error('Upload at least one product image.');
  const specifications=Object.fromEntries(Object.entries(input.specifications||{}).map(([key,value])=>[String(key).trim(),String(value).trim()]).filter(([key,value])=>key&&value));
  return {id:String(input.id||`manual-${model.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}`),brand:String(input.brand||'XCMG').trim(),name:String(input.name||`${input.brand||'XCMG'} ${model}`).trim(),model,category,subCategory:normalizeSubCategory(category,String(input.subCategory||'')),source:input.source||'manual',image,images:images.length?images:[image],description:String(input.description||'').trim(),specifications,localOnly:true,status:input.status||'Published',slug:input.slug};
}
function isAllowedMediaUrl(value:string){return value.startsWith('/uploads/')||value.startsWith('/api/media/')||value.startsWith('https://');}
function denied(){return NextResponse.json({success:false,error:'Incorrect admin password.'},{status:401});}

export async function GET(request:NextRequest){if(!authorized(request))return denied();return NextResponse.json(await readProducts(),{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:NextRequest){if(!authorized(request))return denied();try{const product=normalize(await request.json()),products=await readProducts();if(products.some(item=>item.model.toLowerCase()===product.model.toLowerCase()))return NextResponse.json({success:false,error:'This model already exists.'},{status:409});products.push(product);await saveProducts(products);return NextResponse.json({success:true,product});}catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Unable to create product.'},{status:400});}}
export async function PUT(request:NextRequest){if(!authorized(request))return denied();try{const product=normalize(await request.json()),products=await readProducts(),index=products.findIndex(item=>item.id===product.id);if(index<0)return NextResponse.json({success:false,error:'Product not found.'},{status:404});if(products.some((item,i)=>i!==index&&item.model.toLowerCase()===product.model.toLowerCase()))return NextResponse.json({success:false,error:'This model already exists.'},{status:409});products[index]=product;await saveProducts(products);return NextResponse.json({success:true,product});}catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Unable to update product.'},{status:400});}}
export async function DELETE(request:NextRequest){if(!authorized(request))return denied();const id=request.nextUrl.searchParams.get('id');if(!id)return NextResponse.json({success:false,error:'Product ID is required.'},{status:400});const products=await readProducts(),next=products.filter(item=>item.id!==id);if(next.length===products.length)return NextResponse.json({success:false,error:'Product not found.'},{status:404});await saveProducts(next);return NextResponse.json({success:true});}
