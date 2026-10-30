import type { Metadata } from 'next';
import { TrackingAdmin } from '@/components/tracking-admin';

export const metadata: Metadata = { title: 'Shipment Tracking Admin | AOLAN Machinery', robots: {index:false, follow:false} };

export default function TrackingAdminPage() {
  return <div className="min-h-screen bg-[#f1f3ef] px-5 pb-20 pt-32"><TrackingAdmin/></div>;
}
