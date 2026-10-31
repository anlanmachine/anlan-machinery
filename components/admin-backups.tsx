'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowLeft,Database,LoaderCircle,RotateCcw,Save} from 'lucide-react';

type Backup={id:string;item_count:number;created_at:string;reason?:string};

export function AdminBackups(){
  const [backups,setBackups]=useState<Backup[]>([]),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  async function load(){
    const response=await fetch('/api/admin/backups',{cache:'no-store'}),body=await response.json().catch(()=>[]);
    if(!response.ok)throw new Error(body.error||'Unable to load backups.');
    setBackups(body);
  }
  useEffect(()=>{void load().catch(error=>setMessage(error instanceof Error?error.message:'Unable to load backups.'));},[]);
  async function create(){
    setBusy(true);setMessage('');
    try{const response=await fetch('/api/admin/backups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason:'manual-catalog-backup'})}),body=await response.json();if(!response.ok)throw new Error(body.error);setMessage('Catalog backup created.');await load();}catch(error){setMessage(error instanceof Error?error.message:'Unable to create backup.');}finally{setBusy(false);}
  }
  async function restore(id:string){
    if(!confirm('Restore this catalog backup? The current catalog will be backed up first. Products not in this snapshot may be moved to Trash.'))return;
    const confirmBulkCatalogReduction=confirm('If this backup has fewer products, continue with the protected catalog reduction?');
    setBusy(true);setMessage('');
    try{const response=await fetch('/api/admin/backups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'restore',id,confirmBulkCatalogReduction})}),body=await response.json();if(!response.ok)throw new Error(body.error);setMessage(`Backup restored: ${body.restored} products.`);await load();}catch(error){setMessage(error instanceof Error?error.message:'Unable to restore backup.');}finally{setBusy(false);}
  }
  return <main className="min-h-screen bg-[#f3f5f2] px-5 pb-16 pt-28"><div className="mx-auto max-w-5xl"><Link href="/admin" className="inline-flex items-center gap-2 text-sm font-black text-gray-600"><ArrowLeft size={16}/>Back to admin</Link><div className="mt-5 flex flex-wrap items-end justify-between gap-4 rounded-3xl bg-white p-7 shadow-sm"><div><p className="eyebrow">Recovery protection</p><h1 className="mt-2 text-3xl font-black">Product Catalog Backups</h1><p className="mt-2 text-gray-500">Every product write creates a recoverable catalog snapshot. Restoring first saves today’s catalog.</p></div><button onClick={()=>void create()} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-3 font-black disabled:opacity-50">{busy?<LoaderCircle className="animate-spin" size={18}/>:<Save size={18}/>}Create backup</button></div>{message&&<p className="mt-4 rounded-2xl bg-sand p-4 text-sm font-bold">{message}</p>}<section className="mt-5 overflow-hidden rounded-3xl bg-white shadow-sm">{!backups.length?<p className="p-7 text-gray-500">No product backups yet. Backups appear after the first safe migration or product change.</p>:backups.map(backup=><article key={backup.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 p-5 last:border-0"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-sand"><Database size={20}/></span><span><b className="block">{new Date(backup.created_at).toLocaleString()}</b><small className="text-gray-500">{backup.item_count} products · {backup.reason||'Automatic backup'}</small></span></div><button onClick={()=>void restore(backup.id)} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-black/15 px-4 py-2 text-sm font-black disabled:opacity-50"><RotateCcw size={16}/>Restore</button></article>)}</section></div></main>;
}
