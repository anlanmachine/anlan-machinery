import {NextResponse} from 'next/server';
import {getCatalog} from '@/lib/catalog';

export const dynamic='force-dynamic';

export async function GET(){
  try{
    return NextResponse.json(await getCatalog(),{headers:{'Cache-Control':'no-store'}});
  }catch(error){
    return NextResponse.json({success:false,error:error instanceof Error?error.message:'Unable to read products'},{status:500});
  }
}
