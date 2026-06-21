import {NextRequest,NextResponse} from 'next/server';
import {readFile,rename,writeFile} from 'fs/promises';
import path from 'path';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const DATA_FILE=path.join(process.cwd(),'data','products.json');
const CATEGORIES=new Set(['excavator','loader','roller','grader','mixer']);
type Product={id:string;brand:string;name:string;model:string;category:string;subCategory:string;source:'xcmg'|'pdf';image:string;images:string[];description:string;specifications:Record<string,string>;localOnly:true};

function authorized(request:NextRequest){return request.headers.get('x-admin-password')===(process.env.ADMIN_PASSWORD||'anlan2026');}
async function readProducts():Promise<Product[]>{return JSON.parse(await readFile(DATA_FILE,'utf8'));}
async function saveProducts(products:Product[]){const temporary=`${DATA_FILE}.tmp`;await writeFile(temporary,JSON.stringify(products,null,2)+'\n','utf8');await rename(temporary,DATA_FILE);}
function normalize(input:Partial<Product>):Product{
  const model=String(input.model||'').trim(),category=String(input.category||'').trim();
  if(!model)throw new Error('Model is required.');
  if(!CATEGORIES.has(category))throw new Error('Select a valid category.');
  const images=(Array.isArray(input.images)?input.images:[]).map(String).filter(item=>item.startsWith('/uploads/'));
  const image=String(input.image||images[0]||'');
  if(!image.startsWith('/uploads/'))throw new Error('Upload at least one local product image.');
  const specifications=Object.fromEntries(Object.entries(input.specifications||{}).map(([key,value])=>[String(key).trim(),String(value).trim()]).filter(([key,value])=>key&&value));
  return {id:String(input.id||`manual-${model.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}`),brand:String(input.brand||'XCMG').trim(),name:String(input.name||`${input.brand||'XCMG'} ${model}`).trim(),model,category,subCategory:String(input.subCategory||category).trim(),source:input.source==='pdf'?'pdf':'xcmg',image,images:images.length?images:[image],description:String(input.description||'').trim(),specifications,localOnly:true};
}
function denied(){return NextResponse.json({success:false,error:'Incorrect admin password.'},{status:401});}

export async function GET(request:NextRequest){if(!authorized(request))return denied();return NextResponse.json(await readProducts(),{headers:{'Cache-Control':'no-store'}});}
export async function POST(request:NextRequest){if(!authorized(request))return denied();try{const product=normalize(await request.json()),products=await readProducts();if(products.some(item=>item.model.toLowerCase()===product.model.toLowerCase()))return NextResponse.json({success:false,error:'This model already exists.'},{status:409});products.push(product);await saveProducts(products);return NextResponse.json({success:true,product});}catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Unable to create product.'},{status:400});}}
export async function PUT(request:NextRequest){if(!authorized(request))return denied();try{const product=normalize(await request.json()),products=await readProducts(),index=products.findIndex(item=>item.id===product.id);if(index<0)return NextResponse.json({success:false,error:'Product not found.'},{status:404});if(products.some((item,i)=>i!==index&&item.model.toLowerCase()===product.model.toLowerCase()))return NextResponse.json({success:false,error:'This model already exists.'},{status:409});products[index]=product;await saveProducts(products);return NextResponse.json({success:true,product});}catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Unable to update product.'},{status:400});}}
export async function DELETE(request:NextRequest){if(!authorized(request))return denied();const id=request.nextUrl.searchParams.get('id');if(!id)return NextResponse.json({success:false,error:'Product ID is required.'},{status:400});const products=await readProducts(),next=products.filter(item=>item.id!==id);if(next.length===products.length)return NextResponse.json({success:false,error:'Product not found.'},{status:404});await saveProducts(next);return NextResponse.json({success:true});}
