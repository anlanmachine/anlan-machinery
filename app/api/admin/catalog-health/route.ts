import {NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin-auth';
import {getProductHealth} from '@/lib/product-store';

export const dynamic='force-dynamic';

export async function GET(){
  try{
    await requireAdmin();
    return NextResponse.json(await getProductHealth(),{headers:{'Cache-Control':'no-store'}});
  }catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Unauthorized'},{status:401});}
}
