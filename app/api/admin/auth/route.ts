import {NextRequest,NextResponse} from 'next/server';
import {ADMIN_COOKIE,ADMIN_EMAIL,createAdminToken,verifyAdminToken} from '@/lib/admin-auth';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(request:NextRequest){
  const ok=verifyAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);
  return NextResponse.json({authenticated:ok,email:ok?ADMIN_EMAIL:null},{headers:{'Cache-Control':'no-store'}});
}

export async function POST(request:NextRequest){
  const {email,password}=await request.json().catch(()=>({}));
  if(!process.env.ADMIN_PASSWORD)return NextResponse.json({success:false,error:'ADMIN_PASSWORD is not configured.'},{status:500});
  if(email!==ADMIN_EMAIL||password!==process.env.ADMIN_PASSWORD)return NextResponse.json({success:false,error:'Incorrect email or password.'},{status:401});
  const response=NextResponse.json({success:true,email:ADMIN_EMAIL});
  response.cookies.set(ADMIN_COOKIE,createAdminToken(),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*12});
  return response;
}

export async function DELETE(){
  const response=NextResponse.json({success:true});
  response.cookies.set(ADMIN_COOKIE,'',{path:'/',maxAge:0});
  return response;
}
