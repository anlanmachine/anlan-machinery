import {ProductEditor} from '@/components/admin/products/product-editor';
import {requireAdmin} from '@/lib/admin-auth';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){try{await requireAdmin();}catch{redirect('/admin/login');}return <ProductEditor id={(await params).id}/>;}
