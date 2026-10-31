import {AdminBackups} from '@/components/admin-backups';
import {redirect} from 'next/navigation';
import {requireAdmin} from '@/lib/admin-auth';

export const metadata={title:'Catalog Backups | AOLAN Admin',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';

export default async function Page(){
  try{await requireAdmin();}catch{redirect('/admin/login');}
  return <AdminBackups/>;
}
