import {requireAdmin,ADMIN_EMAIL} from '@/lib/admin-auth';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Page(){try{await requireAdmin();}catch{redirect('/admin/login');}return <section className="rounded-xl border bg-white p-6"><h2 className="text-xl font-bold">管理员设置 / Administrator settings</h2><p className="mt-4">{ADMIN_EMAIL}</p><p className="mt-4">密码通过 ADMIN_PASSWORD 环境变量管理，浏览器不会保存明文密码。</p><p className="mt-2">Manage your password with the ADMIN_PASSWORD environment variable. Passwords are not stored in the browser.</p></section>;}
