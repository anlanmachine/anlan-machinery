'use client';
import {usePathname} from 'next/navigation';
import {Header,Footer,FloatingWA} from '@/components/ui';
export function SiteFrame({children}:{children:React.ReactNode}){
  const path=usePathname();
  if(path==='/admin'||path.startsWith('/admin/'))return <>{children}</>;
  return <><Header/><main>{children}</main><Footer/><FloatingWA/></>;
}
