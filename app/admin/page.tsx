import {AdminDashboard} from '@/components/admin-dashboard';
import {redirect} from 'next/navigation';
import {requireAdmin} from '@/lib/admin-auth';
export const metadata={title:'Admin | AOLAN Machinery',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Admin(){
  try{await requireAdmin();}catch{redirect('/admin/login');}
  return <AdminDashboard/>;
}
