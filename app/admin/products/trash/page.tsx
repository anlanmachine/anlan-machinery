import {ProductsPanel} from '@/components/admin/products/products-panel';
import {requireAdmin} from '@/lib/admin-auth';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Page(){try{await requireAdmin();}catch{redirect('/admin/login');}return <ProductsPanel trash/>;}

