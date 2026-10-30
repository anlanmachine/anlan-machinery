'use client';

import { FormEvent, useState } from 'react';
import { Anchor, Check, Clock, Container, LoaderCircle, Search, Ship, ShieldCheck, Info } from 'lucide-react';
import type { TrackingShipment } from '@/lib/shipment-tracking';

export function ShipmentTracker() {
  const [number, setNumber] = useState('');
  const [shipment, setShipment] = useState<TrackingShipment | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function track(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = number.trim().toUpperCase();
    if (!query) return;
    setLoading(true); setShipment(null); setError('');
    try {
      const response = await fetch('/api/tracking?number=' + encodeURIComponent(query), { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not retrieve this shipment.');
      setShipment(data.shipment as TrackingShipment);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Tracking is currently unavailable.');
    } finally {
      setLoading(false);
    }
  }

  return <div className="mx-auto max-w-7xl px-5 pb-20">
    <div className="relative -mt-16 rounded-[2rem] border border-black/10 bg-white p-5 shadow-2xl md:p-10">
      <form onSubmit={track}>
        <label htmlFor="tracking-number" className="text-sm font-black uppercase tracking-widest text-gray-600">Bill of Lading / Container Number</label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input id="tracking-number" value={number} onChange={e => setNumber(e.target.value)} required
            autoComplete="off" maxLength={30} placeholder="e.g. MEDUADM48497 or MSMU5269853"
            className="min-h-14 flex-1 rounded-2xl border border-gray-300 bg-[#f5f7f2] px-5 font-semibold uppercase outline-none focus:border-[#789400] focus:ring-2 focus:ring-[#789400]/20" />
          <button disabled={loading} type="submit" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-ink px-8 font-extrabold text-white hover:bg-[#789400] disabled:opacity-60">
            {loading ? <LoaderCircle className="animate-spin" size={20}/> : <Search size={20}/>}
            {loading ? 'Checking…' : 'Track Shipment'}
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-500">Track shipments registered by AOLAN Machinery. For house bills or unsupported shipments, please contact us.</p>
      </form>
      {error && <div role="alert" className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900">{error}</div>}
      {shipment && <ShipmentResult shipment={shipment}/>}
    </div>
    <section className="mt-12 grid gap-5 md:grid-cols-3">
      {[
        {Icon: Search,title: 'Search by reference', copy: 'Enter your registered master bill of lading (MBL) or container number.'},
        {Icon: Ship,title: 'Port-to-port progress',copy: 'Follow completed ports, the current stage and upcoming transshipment stops.'},
        {Icon: ShieldCheck,title: 'Clear shipment updates',copy: 'See when the record was last updated and whether ETA is estimated or confirmed.'}
      ].map(({Icon,title,copy}) => <article key={title} className="rounded-3xl bg-white p-7"><Icon className="text-[#789400]" size={26}/><h2 className="mt-4 text-xl font-black">{title}</h2><p className="mt-3 text-gray-600">{copy}</p></article>)}
    </section>
  </div>;
}

function ShipmentResult({shipment}: {shipment: TrackingShipment}) {
  const completed = shipment.milestones.filter(x => x.status === 'completed').length;
  const currentStage = shipment.milestones.find(x => x.status === 'current');
  const remaining = shipment.milestones.filter(x => x.status === 'planned');
  const completedPorts = shipment.milestones.filter(x => x.status === 'completed').map(x => x.port);
  const hasCurrent = shipment.milestones.some(x => x.status === 'current');
  const arrival = shipment.milestones.length > 0 && shipment.milestones.every(x => x.status === 'completed');
  const status = arrival ? 'Journey complete' : hasCurrent ? 'In transit' : completed ? 'Latest recorded movement' : 'Awaiting first milestone';
  const update = new Date(shipment.updatedAt);
  return <article className="mt-9 border-t border-gray-200 pt-9">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-black uppercase tracking-widest text-gray-500">Shipment details</p><h2 className="mt-2 text-3xl font-black tracking-tight text-[#13283e]">{shipment.origin} <span className="text-[#789400]">→</span> {shipment.destination}</h2></div>
      <span className="rounded-full bg-[#eaf4e4] px-4 py-2 text-sm font-extrabold text-[#18724e]">{status}</span>
    </div>
    <div className="mt-7 grid gap-4 rounded-2xl bg-[#f5f7f9] p-5 sm:grid-cols-2 lg:grid-cols-4">
      <InfoField label="Bill of Lading" value={shipment.blNumber}/>
      <InfoField label="Container(s)" value={shipment.containerNumbers.join(', ') || 'Not provided'}/>
      <InfoField label="Shipping line" value={shipment.carrier}/>
      <InfoField label="Estimated arrival" value={shipment.eta ? shipment.eta + (shipment.etaType === 'confirmed' ? ' (confirmed)' : ' (estimated)') : 'Not available'}/>
    </div>
    {(shipment.currentVessel || shipment.nextVessel) && <div className="mt-5 flex flex-wrap gap-4 text-sm text-[#345]">
      {shipment.currentVessel && <span className="flex items-center gap-2"><Ship size={16}/><b>Current vessel:</b> {shipment.currentVessel}</span>}
      {shipment.nextVessel && <span className="flex items-center gap-2"><Anchor size={16}/><b>Next vessel:</b> {shipment.nextVessel}</span>}
    </div>}
    <h3 className="mb-6 mt-10 text-2xl font-black text-[#13283e]">Shipment journey</h3>
    {shipment.milestones.length ? <div className="overflow-x-auto pb-5">
      <div className="flex min-w-[700px]">
        {shipment.milestones.map((point,index) => {
          const done = point.status === 'completed', active = point.status === 'current';
          const tone = done ? 'bg-[#147957]' : active ? 'bg-[#db492f]' : 'bg-gray-300';
          return <div key={index} className="relative min-w-[120px] flex-1 px-1 text-center">
            <div className="mb-6 text-sm font-black uppercase text-[#15283f]">{point.port}</div>
            <div className="relative flex h-10 items-center justify-center">
              {index > 0 && <div className={`absolute right-1/2 left-0 top-[18px] h-1 w-1/2 ${done || active ? 'bg-[#147957]' : 'bg-gray-300'}`}/>}
              {index < shipment.milestones.length-1 && <div className={`absolute left-1/2 right-0 top-[18px] h-1 w-1/2 ${done ? 'bg-[#147957]' : 'bg-gray-300'}`}/>}
              <div className={`relative z-10 grid size-8 place-items-center rounded-full border-4 border-white ${tone} text-white shadow-sm`}>{done ? <Check size={15}/> : active ? <Container size={14}/> : null}</div>
            </div>
            <p className="mt-4 text-sm font-semibold text-gray-600">{point.date || 'Date pending'}</p>
            <p className="mt-1 text-xs text-gray-500">{point.note || (done ? 'Completed' : active ? 'Current stage' : 'Planned')}</p>
          </div>;
        })}
      </div>
    </div> : <p className="rounded-xl bg-gray-50 p-5 text-gray-500">Milestones have not been added yet.</p>}
    {currentStage && <div className="mx-auto mt-5 max-w-2xl rounded-2xl border-2 border-[#d93c2e] bg-[#fff0ed] px-5 py-4 text-center">
      <p className="text-lg font-black uppercase tracking-wide text-[#ca2d21]">Current recorded position</p>
      <p className="mt-1 text-[#34465b]">{currentStage.port}{currentStage.note ? ' · ' + currentStage.note : ''}</p>
    </div>}
    <div className="mt-8 space-y-2 text-sm font-bold sm:text-base">
      {completedPorts.length > 0 && <p className="text-[#16805d]">Completed: {completedPorts.join(' → ')}</p>}
      {remaining.length > 0 && <p className="text-[#b94e35]">Next: {remaining.map(p => p.port).join(' → ')}{shipment.eta ? ' · ETA ' + shipment.eta + (shipment.etaType === 'confirmed' ? ' (confirmed)' : ' (estimated)') : ''}</p>}
    </div>
    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-5 text-sm text-gray-500">
      <Clock size={16}/> Updated {Number.isNaN(update.getTime()) ? shipment.updatedAt : update.toLocaleString('en-GB', {timeZone:'UTC',timeZoneName:'short'})}
      <span className="mx-1">·</span><Info size={16}/> Information maintained by AOLAN Machinery; not a live carrier feed.
    </div>
    <p className="mt-2 text-xs text-gray-400">Shipping schedules, vessel transfers and ETA can change. Confirm critical delivery plans with your freight agent.</p>
  </article>;
}
function InfoField({label,value}: {label:string;value:string}) {return <div><p className="text-xs font-black uppercase tracking-wide text-gray-500">{label}</p><p className="mt-1 break-words font-bold text-[#13283e]">{value}</p></div>;}
