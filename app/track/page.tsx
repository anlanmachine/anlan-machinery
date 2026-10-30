import type { Metadata } from 'next';
import { ShipmentTracker } from '@/components/shipment-tracker';

export const metadata: Metadata = {
  title: 'Track Your Shipment | AOLAN Machinery',
  description: 'Track your AOLAN Machinery cargo using a master bill of lading or container number. Review port milestones and latest available arrival estimates.',
  alternates: { canonical: '/track' }
};

export default function TrackPage() {
  return <main className="min-h-screen bg-[#eff1ed]">
    <section className="bg-ink px-5 pb-32 pt-36 text-white">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-black uppercase tracking-[.25em] text-lime">AOLAN MACHINERY · GLOBAL LOGISTICS</p>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">Track your shipment.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">From China to your destination port. Follow your construction machinery shipment with clear milestones and arrival updates.</p>
      </div>
    </section>
    <ShipmentTracker/>
  </main>;
}
