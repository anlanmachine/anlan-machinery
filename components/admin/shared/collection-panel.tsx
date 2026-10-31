'use client';
import {useEffect,useState} from 'react';
import {adminRequest} from './api';
import {Editor,type ModuleKey} from './content-editor';
import {useAdminLanguage} from '../layout/admin-shell';
type Item=Record<string,any>;
export function CollectionPanel({collection}:{collection:ModuleKey}){
  const {t}=useAdminLanguage();
  const [items,setItems]=useState<Item[]>([]),[draft,setDraft]=useState<Item|null>(null),[initial,setInitial]=useState('null'),[error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[query,setQuery]=useState('');
  const dirty=JSON.stringify(draft)!==initial;
  useEffect(()=>{const leave=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();}};window.addEventListener('beforeunload',leave);return()=>window.removeEventListener('beforeunload',leave);},[dirty]);
  async function load(){setLoading(true);setError('');try{setItems(await adminRequest<Item[]>(`/api/admin/collections/${collection}`));}catch(e){setError(String(e));}finally{setLoading(false);}}
  useEffect(()=>{void load();},[collection]);
  function edit(item:Item|null){if(dirty&&!confirm(t('放弃未保存修改？','Discard unsaved changes?')))return;setDraft(item);setInitial(JSON.stringify(item));}
  async function save(item:Item|null|undefined=draft){
    if(!item)return;setBusy(true);setError('');
    try{const result=await adminRequest<{item:Item}>(`/api/admin/collections/${collection}`,{method:item.id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(item)});setDraft(result.item);setInitial(JSON.stringify(result.item));await load();}
    catch(e){setError(String(e));}finally{setBusy(false);}
  }
  async function remove(item:Item){if(!confirm(t('确认删除这条内容？','Delete this content?'))||!confirm(t('再次确认删除。','Confirm deletion again.')))return;setBusy(true);try{await adminRequest(`/api/admin/collections/${collection}?id=${encodeURIComponent(item.id)}`,{method:'DELETE'});setDraft(null);setInitial('null');await load();}catch(e){setError(String(e));}finally{setBusy(false);}}
  return <div className="space-y-5"><div className="flex flex-wrap gap-3"><input aria-label={t('搜索','Search')} placeholder={t('搜索标题、国家、型号','Search title, country, model')} value={query} onChange={e=>setQuery(e.target.value)} className="min-w-0 flex-1 rounded-lg border p-3"/>{collection!=='inquiries'&&collection!=='homeShipments'&&<button className="rounded-lg bg-lime px-5 py-3 font-bold" onClick={()=>edit({status:'Draft',images:[],videos:[]})}>{t('新增','Add new')}</button>}</div>
    {error&&<div role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}<button onClick={()=>void load()} className="ml-3 underline">{t('重试','Retry')}</button></div>}
    {draft?<><button className="underline" onClick={()=>edit(null)}>{t('返回列表','Back to list')}</button><p className="rounded-lg bg-amber-50 p-3 text-sm">{t('上传只暂存到表单，点击保存后才会更新网站。','Uploads attach to this form only. Save explicitly to update the website.')}</p><Editor active={collection} draft={draft} setDraft={setDraft} save={save} remove={remove} permanentlyRemoveProduct={()=>{}} busy={busy} categoryOptions={[]}/></>:loading?<p role="status">{t('加载中…','Loading…')}</p>:!error&&<div className="grid gap-3 md:grid-cols-2">{items.filter(item=>JSON.stringify(item).toLowerCase().includes(query.toLowerCase())).map(item=><button key={item.id} onClick={()=>edit({...item})} className="rounded-xl border bg-white p-5 text-left"><b className="block">{item.title||item.name||item.label||item.email||item.id}</b><span className="text-sm text-gray-500">{item.status} · {item.country||item.category}</span></button>)}{!items.length&&<p>{t('暂无内容，点击新增。','No content yet. Add a record.')}</p>}</div>}
  </div>;
}
