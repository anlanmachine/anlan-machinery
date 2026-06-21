import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

export function middleware(req:NextRequest){
  const {pathname}=req.nextUrl;
  if(pathname.startsWith('/admin')&&!pathname.startsWith('/admin/login')&&!pathname.startsWith('/api/admin')&&!req.cookies.get('anlan_admin')?.value){
    return NextResponse.redirect(new URL('/admin/login',req.url));
  }
  const r=NextResponse.next();
  r.headers.set('X-Content-Type-Options','nosniff');
  r.headers.set('X-Frame-Options','SAMEORIGIN');
  r.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  r.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  return r;
}

export const config={matcher:'/((?!_next/static|_next/image|favicon.ico).*)'};
