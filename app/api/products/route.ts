import {NextResponse} from 'next/server';
import {readFile} from 'fs/promises';
import path from 'path';

export const dynamic='force-dynamic';

export async function GET(){
  try{
    const file=path.join(process.cwd(),'data','products.json');
    const products=JSON.parse(await readFile(file,'utf8'));
    return NextResponse.json(products,{headers:{'Cache-Control':'no-store'}});
  }catch(error){
    return NextResponse.json({success:false,error:error instanceof Error?error.message:'Unable to read products'},{status:500});
  }
}
