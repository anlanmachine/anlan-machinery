import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin-auth';
import {listProductVersions,restoreProductVersion} from '@/lib/product-store';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(_:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{await requireAdmin();return NextResponse.json(await listProductVersions((await params).id),{headers:{'Cache-Control':'no-store'}});}catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Unauthorized'},{status:401});}
}

export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    await requireAdmin();
    const body=await request.json(),product=await restoreProductVersion((await params).id,String(body.versionId||''));
    return NextResponse.json({success:true,product});
  }catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Unable to restore version.'},{status:400});}
}
