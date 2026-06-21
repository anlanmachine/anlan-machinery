import {cookies} from 'next/headers';
import crypto from 'crypto';

export const ADMIN_EMAIL='Anlanmachinery@gmail.com';
export const ADMIN_COOKIE='anlan_admin';

function secret(){
  const value=process.env.ADMIN_PASSWORD;
  if(!value)throw new Error('ADMIN_PASSWORD is not configured.');
  return value;
}

function sign(payload:string){
  return crypto.createHmac('sha256',secret()).update(payload).digest('hex');
}

export function createAdminToken(){
  const expires=Date.now()+1000*60*60*12;
  const payload=`${ADMIN_EMAIL}:${expires}`;
  return `${payload}:${sign(payload)}`;
}

export function verifyAdminToken(token?:string|null){
  if(!token)return false;
  try{
    const parts=token.split(':');
    if(parts.length<3)return false;
    const signature=parts.pop()!;
    const expires=Number(parts.pop());
    const email=parts.join(':');
    if(email!==ADMIN_EMAIL||!Number.isFinite(expires)||expires<Date.now())return false;
    const payload=`${email}:${expires}`;
    return crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(sign(payload)));
  }catch{return false;}
}

export async function requireAdmin(){
  const jar=await cookies();
  if(!verifyAdminToken(jar.get(ADMIN_COOKIE)?.value))throw new Error('Unauthorized');
}
