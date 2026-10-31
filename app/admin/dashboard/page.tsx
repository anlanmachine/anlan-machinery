import {AdminOverview} from '@/components/admin/dashboard/overview';
import {requireAdmin} from '@/lib/admin-auth';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Page(){try{await requireAdmin();}catch{redirect('/admin/login');}return <AdminOverview/>;}

