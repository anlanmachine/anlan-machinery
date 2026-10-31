'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {adminRequest} from '../shared/api';
import {useAdminLanguage} from '../layout/admin-shell';
type Item=Record<string,any>;
export function ProductsPanel({trash=false}:{trash?:boolean}){
  const {t}=useAdminLanguage();
  const [items,setItems]=useState<Item[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[query,setQuery]=useState(''),[brand,setBrand]=useState(''),[category,setCategory]=useState(''),[status,setStatus]=useState(''),[page,setPage]=useState(1),[busy,setBusy]=useState(false);
  async function load(){setLoading(true);setError('');try{setItems(await adminRequest<Item[]>('/api/admin/products?scope=all'));}catch(e){setError(String(e));}finally{setLoading(false);}}
  useEffect(()=>{void load();},[]);
  async function action(item:Item){
    if(!confirm(t(trash?'恢复这件商品？':'移入回收站？可以稍后恢复。',trash?'Restore this product?':'Move to Trash? You can restore it later.')))return;
    setBusy(true);try{await adminRequest('/api/admin/products'+(trash?'':'?id='+encodeURIComponent(item.id)),{method:trash?'PATCH':'DELETE',headers:{'Content-Type':'application/json'},...(trash?{body:JSON.stringify({id:item.id,action:'restore'})}:{})});await load();}catch(e){setError(String(e));}finally{setBusy(false);}
  }
  const filtered=items.filter(p=>(trash?p.status==='Deleted':p.status!=='Deleted')&&(!brand||p.brand===brand)&&(!category||p.category===category)&&(!status||p.status===status)&&`${p.model} ${p.brand} ${p.name}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
  const pages=Math.max(1,Math.ceil(filtered.length/20)),current=Math.min(page,pages),visible=filtered.slice((current-1)*20,current*20);
  return <div className="space-y-5"><div className="flex flex-wrap items-center gap-3"><input aria-label={t('搜索型号','Search model')} value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}} placeholder={t('搜索型号、品牌或名称','Search model, brand or name')} className="min-w-0 flex-1 rounded-lg border p-3"/><Link className="rounded-lg bg-lime px-5 py-3 font-bold" href="/admin/products/new">{t('添加商品','Add product')}</Link></div>
    <div className="flex flex-wrap gap-3">{[[brand,setBrand,[...new Set(items.map(p=>p.brand))],t('全部品牌','All brands')],[category,setCategory,[...new Set(items.map(p=>p.category))],t('全部分类','All categories')],[status,setStatus,['Published','Draft','Archived'],t('全部状态','All statuses')]].map(([value,set,options,label])=><select key={String(label)} aria-label={String(label)} value={value as string} onChange={e=>{(set as (s:string)=>void)(e.target.value);setPage(1);}} className="max-w-full rounded-lg border bg-white p-3"><option value="">{String(label)}</option>{(options as string[]).filter(Boolean).map(v=><option key={v}>{v}</option>)}</select>)}</div>
    {error?<div role="alert" className="rounded-xl bg-red-50 p-5 text-red-800">{error}<button onClick={()=>void load()} className="ml-4 underline">{t('重试','Retry')}</button></div>:loading?<p>{t('加载中…','Loading…')}</p>:<>
    <p className="text-sm text-gray-500">{t('共','Total')} {filtered.length} {t('件商品','products')}</p>
    <div className="space-y-3">{visible.map(p=><article key={p.id} className="grid gap-4 rounded-xl border bg-white p-4 sm:grid-cols-[64px_1fr_auto]"><img loading="lazy" src={p.image||'/uploads/placeholder-machine.svg'} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src='/uploads/placeholder-machine.svg';}} alt="" width={64} height={64} className="h-16 w-16 rounded-lg bg-gray-50 object-contain"/><div className="min-w-0"><b className="block break-words">{p.model}</b><p className="text-sm text-gray-600">{p.brand} · {p.category}</p><p className="mt-1 text-xs text-gray-500">{p.status} · {String(p.updatedAt||'').slice(0,10)||'—'}</p></div><div className="flex flex-wrap items-center gap-3 text-sm"><Link className="rounded-lg border px-3 py-2" href={'/admin/products/'+encodeURIComponent(p.id)+'/edit'}>{t('编辑','Edit')}</Link>{!trash&&<Link target="_blank" href={'/products/'+encodeURIComponent(p.slug||p.id)}>{t('查看','View')}</Link>}<button disabled={busy} onClick={()=>void action(p)} className="rounded-lg border px-3 py-2 text-red-700">{trash?t('恢复','Restore'):t('移入回收站','Trash')}</button></div></article>)}</div>
    {!visible.length&&<div className="rounded-xl border bg-white p-8 text-center">{t('没有符合条件的商品','No matching products')}</div>}
    <div className="flex items-center justify-end gap-4"><button disabled={current===1} onClick={()=>setPage(current-1)}>{t('上一页','Previous')}</button><span>{current} / {pages}</span><button disabled={current===pages} onClick={()=>setPage(current+1)}>{t('下一页','Next')}</button></div></>}
  </div>;
}
