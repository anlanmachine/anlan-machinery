import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin-auth';
import {createCatalogBackup,listCatalogBackups,restoreCatalogBackup} from '@/lib/product-store';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(){
  try{await requireAdmin();return NextResponse.json(await listCatalogBackups(),{headers:{'Cache-Control':'no-store'}});}catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Unauthorized'},{status:401});}
}

export async function POST(request:NextRequest){
  try{
    await requireAdmin();
    const body=await request.json();
    if(body.action==='restore')return NextResponse.json({success:true,...await restoreCatalogBackup(String(body.id||''),body.confirmBulkCatalogReduction===true)});
    return NextResponse.json({success:true,backup:await createCatalogBackup(String(body.reason||'manual-catalog-backup'))});
  }catch(error){
    const message=error instanceof Error?error.message:'Unable to manage backup.';
    return NextResponse.json({success:false,error:message},{status:/CATALOG_SAFETY_BLOCK/.test(message)?409:400});
  }
}
