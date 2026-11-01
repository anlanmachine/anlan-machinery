import {NextResponse} from 'next/server';
import {getSiteCategories} from '@/lib/site-categories';
export const dynamic='force-dynamic';
export async function GET(){
  try{return NextResponse.json(await getSiteCategories(),{headers:{'Cache-Control':'no-store'}});}
  catch{return NextResponse.json({error:'Unable to load categories'},{status:503});}
}
