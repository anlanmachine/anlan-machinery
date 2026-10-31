import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin-auth';
import {createProduct,getProducts,permanentlyDeleteProduct,restoreProduct,restoreProductVersion,trashProduct,updateProduct} from '@/lib/product-store';

export const runtime='nodejs';
export const dynamic='force-dynamic';

async function authorized(request:NextRequest){
  try{await requireAdmin();return true;}catch{
    return Boolean(process.env.ADMIN_PASSWORD)&&request.headers.get('x-admin-password')===process.env.ADMIN_PASSWORD;
  }
}
function denied(){return NextResponse.json({success:false,error:'Unauthorized.'},{status:401});}
function failure(error:unknown){
  const message=error instanceof Error?error.message:'Unable to save product.';
  const status=/CATALOG_SAFETY_BLOCK/.test(message)?409:/not found/i.test(message)?404:/MIGRATION_REQUIRED/.test(message)?503:400;
  return NextResponse.json({success:false,error:message},{status});
}

export async function GET(request:NextRequest){
  if(!await authorized(request))return denied();
  try{return NextResponse.json(await getProducts({includeDeleted:request.nextUrl.searchParams.get('scope')==='all',strict:true}),{headers:{'Cache-Control':'no-store'}});}catch(error){return failure(error);}
}

export async function POST(request:NextRequest){
  if(!await authorized(request))return denied();
  try{return NextResponse.json({success:true,product:await createProduct(await request.json())});}catch(error){return failure(error);}
}

export async function PUT(request:NextRequest){
  if(!await authorized(request))return denied();
  try{
    const input=await request.json(),id=String(input.id||'');
    if(!id)return NextResponse.json({success:false,error:'Product ID is required.'},{status:400});
    return NextResponse.json({success:true,product:await updateProduct(id,input)});
  }catch(error){return failure(error);}
}

export async function PATCH(request:NextRequest){
  if(!await authorized(request))return denied();
  try{
    const input=await request.json(),id=String(input.id||''),action=String(input.action||'');
    if(!id)return NextResponse.json({success:false,error:'Product ID is required.'},{status:400});
    if(action==='restore')return NextResponse.json({success:true,product:await restoreProduct(id)});
    if(action==='restore-version')return NextResponse.json({success:true,product:await restoreProductVersion(id,String(input.versionId||''))});
    return NextResponse.json({success:false,error:'Unknown product action.'},{status:400});
  }catch(error){return failure(error);}
}

export async function DELETE(request:NextRequest){
  if(!await authorized(request))return denied();
  try{
    const id=request.nextUrl.searchParams.get('id');
    if(!id)return NextResponse.json({success:false,error:'Product ID is required.'},{status:400});
    if(request.nextUrl.searchParams.get('permanent')==='true'){
      const body=await request.json().catch(()=>({}));
      await permanentlyDeleteProduct(id,body.confirmPermanentDelete===true);
      return NextResponse.json({success:true,permanentlyDeleted:true});
    }
    return NextResponse.json({success:true,product:await trashProduct(id)});
  }catch(error){return failure(error);}
}
