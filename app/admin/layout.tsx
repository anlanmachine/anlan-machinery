import {AdminShell} from '@/components/admin/layout/admin-shell';
export const metadata={robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <AdminShell>{children}</AdminShell>;}
