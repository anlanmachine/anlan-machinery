'use client';

import { FormEvent, useState } from 'react';
import type { TrackingShipment, ShipmentMilestone } from '@/lib/shipment-tracking';

type Editor = Omit<TrackingShipment, 'source' | 'updatedAt' | 'milestones' | 'containerNumbers'> & {
  containerList: string;
  milestoneLines: string;
  originalBlNumber?: string;
};
const blank: Editor = {
  blNumber: '', containerList: '', carrier: '', origin: '', destination: '',
  currentVessel: '', nextVessel: '', eta: '', etaType: 'estimated',
  published: false, milestoneLines: ''
};

function toEditor(item: TrackingShipment): Editor {
  return {
    blNumber: item.blNumber, originalBlNumber: item.blNumber,
    containerList: item.containerNumbers.join(', '), carrier: item.carrier,
    origin: item.origin, destination: item.destination, currentVessel: item.currentVessel || '',
    nextVessel: item.nextVessel || '', eta: item.eta || '', etaType: item.etaType,
    published: item.published,
    milestoneLines: item.milestones.map(m => [m.port, m.date, m.status, m.note || ''].join(' | ')).join('\n')
  };
}
const parseMilestones = (lines: string): ShipmentMilestone[] =>
  lines.split('\n').map(line => {
    const [port = '', date = '', rawStatus = 'planned', ...note] = line.split('|').map(v => v.trim());
    const status: ShipmentMilestone['status'] = rawStatus === 'completed' || rawStatus === 'current' ? rawStatus : 'planned';
    return { port, date, status, note: note.join(' | ') };
  }).filter(m => m.port);

export function TrackingAdmin() {
  const [password, setPassword] = useState('');
  const [list, setList] = useState<TrackingShipment[]>([]);
  const [editor, setEditor] = useState<Editor>({...blank});
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  function authHeaders() {
    return { 'content-type': 'application/json', 'x-admin-password': password };
  }
  async function load() {
    setBusy(true); setError(''); setMessage('');
    try {
      const res = await fetch('/api/admin/tracking', {headers:authHeaders(),cache:'no-store'});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign in');
      setList(data.shipments || []); setReady(true);
    } catch (e) {setError(e instanceof Error ? e.message : 'Request failed');}
    finally {setBusy(false);}
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const body = {
        ...editor, originalBlNumber: editor.originalBlNumber,
        containerNumbers: editor.containerList.split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean),
        milestones: parseMilestones(editor.milestoneLines)
      };
      const res = await fetch('/api/admin/tracking', {
        method: editor.originalBlNumber ? 'PUT' : 'POST',
        headers: authHeaders(), body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setMessage(editor.published ? 'Shipment saved and visible to customers.' : 'Draft saved (not public).');
      setEditor(toEditor(data.shipment));
      const refreshed = await fetch('/api/admin/tracking',{headers:authHeaders(),cache:'no-store'});
      if (refreshed.ok) setList((await refreshed.json()).shipments || []);
    } catch (e) {setError(e instanceof Error ? e.message : 'Save failed');}
    finally {setBusy(false);}
  }
  async function remove() {
    if (!editor.originalBlNumber || !window.confirm('Permanently delete this tracking record?')) return;
    setBusy(true);setError('');
    try {
      const res = await fetch('/api/admin/tracking?number=' + encodeURIComponent(editor.originalBlNumber), {
        method: 'DELETE',headers:authHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setList(prev => prev.filter(x => x.blNumber !== editor.originalBlNumber));
      setEditor({...blank});setMessage('Tracking record deleted.');
    } catch(e) {setError(e instanceof Error ? e.message : 'Delete failed');}
    finally {setBusy(false);}
  }
  const change = (patch: Partial<Editor>) => setEditor(old => ({...old,...patch}));
  const inputClass = 'mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[#14263a] outline-none focus:border-[#789400]';
  if (!ready) return <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-xl">
    <h1 className="text-2xl font-black">Shipment tracking admin</h1>
    <p className="mt-2 text-gray-600">Enter the existing AOLAN website admin password.</p>
    <form onSubmit={e => {e.preventDefault(); void load();}}>
      <label className="mt-6 block text-sm font-bold">Admin password
        <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className={inputClass}/>
      </label>
      <button disabled={busy} className="mt-4 w-full rounded-xl bg-ink px-6 py-3 font-bold text-white">{busy ? 'Checking…' : 'Open tracking manager'}</button>
    </form>
    {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
  </div>;
  return <div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-3xl font-black">Shipment tracking manager</h1><p className="mt-2 text-gray-600">Manually maintained records · Public lookup at <a className="underline" href="/track">/track</a></p></div>
      <button onClick={() => {setEditor({...blank});setMessage('');setError('');}} className="rounded-xl bg-ink px-5 py-3 font-bold text-white">+ New shipment</button>
    </div>
    {error && <p role="alert" className="my-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {message && <p role="status" className="my-4 rounded-xl bg-green-50 p-4 text-green-800">{message}</p>}
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl bg-white p-4">
        <h2 className="mb-4 font-black">Shipments ({list.length})</h2>
        {list.length === 0 && <p className="text-sm text-gray-500">No shipments yet.</p>}
        <div className="max-h-[550px] space-y-2 overflow-auto">
          {list.map(s => <button key={s.blNumber} onClick={()=>{setEditor(toEditor(s));setMessage('');setError('');}}
            className={`block w-full rounded-xl border px-4 py-3 text-left hover:bg-gray-50 ${s.blNumber===editor.originalBlNumber?'border-[#789400] bg-lime/10':'border-gray-200'}`}>
            <span className="block break-all font-black">{s.blNumber}</span>
            <span className="mt-1 block text-xs text-gray-600">{s.origin} → {s.destination}</span>
            <span className={`mt-1 block text-xs font-semibold ${s.published?'text-green-700':'text-amber-700'}`}>{s.published?'Published':'Draft'}</span>
          </button>)}
        </div>
      </aside>
      <form onSubmit={save} className="rounded-2xl bg-white p-5 shadow-sm sm:p-8">
        <h2 className="text-xl font-black">{editor.originalBlNumber ? 'Edit shipment' : 'Add shipment'}</h2>
        <p className="mt-1 text-sm text-gray-600">Enter carrier-confirmed information when available. Planned dates must not be presented as actual events.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold">Master B/L number *<input required maxLength={22} value={editor.blNumber} onChange={e=>change({blNumber:e.target.value})} className={inputClass}/></label>
          <label className="text-sm font-semibold">Shipping line *<input required placeholder="MSC" value={editor.carrier} onChange={e=>change({carrier:e.target.value})} className={inputClass}/></label>
          <label className="text-sm font-semibold sm:col-span-2">Container number(s) <input placeholder="MSMU5269853, ABCD1234567" value={editor.containerList} onChange={e=>change({containerList:e.target.value})} className={inputClass}/></label>
          <label className="text-sm font-semibold">Origin port *<input required placeholder="Qingdao" value={editor.origin} onChange={e=>change({origin:e.target.value})} className={inputClass}/></label>
          <label className="text-sm font-semibold">Destination port *<input required placeholder="Dakar" value={editor.destination} onChange={e=>change({destination:e.target.value})} className={inputClass}/></label>
          <label className="text-sm font-semibold">Current vessel <input placeholder="MSC NEW YORK" value={editor.currentVessel} onChange={e=>change({currentVessel:e.target.value})} className={inputClass}/></label>
          <label className="text-sm font-semibold">Next vessel <input placeholder="MSC SPRING III" value={editor.nextVessel} onChange={e=>change({nextVessel:e.target.value})} className={inputClass}/></label>
          <label className="text-sm font-semibold">Arrival date / ETA <input placeholder="11 Nov 2026" value={editor.eta} onChange={e=>change({eta:e.target.value})} className={inputClass}/></label>
          <label className="text-sm font-semibold">ETA accuracy
            <select value={editor.etaType} onChange={e=>change({etaType:e.target.value as Editor['etaType']})} className={inputClass}>
              <option value="estimated">Estimated / planned</option><option value="confirmed">Confirmed</option><option value="unknown">Unknown</option>
            </select>
          </label>
          <label className="text-sm font-semibold sm:col-span-2">Port milestones (one per line)
            <textarea rows={9} value={editor.milestoneLines} onChange={e=>change({milestoneLines:e.target.value})}
              placeholder={'Qingdao | 12 Aug 2026 | completed | Loaded\nShanghai | 13 Sep 2026 | completed | Transshipment\nAbidjan | 4 Nov 2026 | planned | Expected transshipment\nDakar | 11 Nov 2026 | planned | Estimated arrival'}
              className={inputClass + ' font-mono text-sm'}/>
            <span className="mt-2 block text-xs font-normal text-gray-500">Format: Port | Date | completed/current/planned | Note. Put events in route order.</span>
          </label>
          <label className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-gray-200 p-4 font-bold">
            <input type="checkbox" checked={editor.published} onChange={e=>change({published:e.target.checked})} className="size-5 accent-[#789400]"/>
            Publish this record for customers
          </label>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button disabled={busy} type="submit" className="rounded-xl bg-[#789400] px-7 py-3 font-bold text-white disabled:opacity-50">{busy?'Saving…':'Save shipment'}</button>
          {editor.originalBlNumber && <button disabled={busy} type="button" onClick={()=>void remove()} className="rounded-xl border border-red-300 px-6 py-3 font-bold text-red-700">Delete</button>}
        </div>
      </form>
    </div>
  </div>;
}
