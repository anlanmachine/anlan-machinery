import type { Metadata } from 'next';
import { TrackingAdmin } from '@/components/tracking-admin';
import {requireAdmin} from '@/lib/admin-auth';
import {redirect} from 'next/navigation';

export const metadata: Metadata = { title: 'Shipment Tracking Admin | AOLAN Machinery', robots: {index:false, follow:false} };

export default async function TrackingAdminPage() {
  try{await requireAdmin();}catch{redirect('/admin/login');}
  return <TrackingAdmin/>;
}
