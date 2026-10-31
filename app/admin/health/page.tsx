import {CatalogHealth} from '@/components/admin/shared/content-editor';
import {requireAdmin} from '@/lib/admin-auth';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Page(){try{await requireAdmin();}catch{redirect('/admin/login');}return <CatalogHealth/>;}

