'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {adminRequest} from '../shared/api';
import {GenericFields,MediaUpload,ProductVersionHistory} from '../shared/content-editor';
import {useAdminLanguage} from '../layout/admin-shell';
type Item=Record<string,any>;
const tabs=[['基础信息','Basics'],['图片视频','Media'],['技术参数','Specifications'],['价格物流','Pricing & logistics'],['SEO','SEO'],['修改历史','History']];
const blank={brand:'XCMG',model:'',name:'',slug:'',category:'',status:'Draft',images:[],image:'',specifications:{}};
export function ProductEditor({id}:{id?:string}){
  const {t}=useAdminLanguage();
  const [draft,setDraft]=useState<Item>(blank),[baseline,setBaseline]=useState(JSON.stringify(blank)),[categories,setCategories]=useState<Item[]>([]),[tab,setTab]=useState(0),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[paste,setPaste]=useState(''),[preview,setPreview]=useState<Record<string,string>|null>(null);
  const dirty=JSON.stringify(draft)!==baseline;
  async function load(){
    setLoading(true);setError('');
    try{const [cats,products]=await Promise.all([adminRequest<Item[]>('/api/admin/collections/productCategories'),id?adminRequest<Item[]>('/api/admin/products?scope=all'):Promise.resolve([])]);setCategories(cats);if(id){const p=products.find(p=>p.id===id);if(!p)throw new Error('商品不存在 / Product not found');setDraft(p);setBaseline(JSON.stringify(p));}}
    catch(e){setError(String(e));}finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[id]);
  useEffect(()=>{function leave(e:BeforeUnloadEvent){if(dirty)e.preventDefault();}window.addEventListener('beforeunload',leave);return()=>window.removeEventListener('beforeunload',leave);},[dirty]);
  async function save(status:string){
    if(!draft.model||!draft.category){setError(t('请填写型号并选择分类。','Enter a model and category.'));return;}
    setBusy(true);setError('');setNotice('');
    try{const result=await adminRequest<{product:Item}>('/api/admin/products',{method:draft.id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...draft,status})});setDraft(result.product);setBaseline(JSON.stringify(result.product));setNotice(status==='Published'?t('保存成功，商品已发布。','Saved and published.'):t('保存成功，状态：','Saved. Status: ')+status);}
    catch(e){setError(String(e));}finally{setBusy(false);}
  }
  function suggest(){const name=`${draft.brand} ${draft.model}`.trim();setDraft({...draft,name:draft.name||name,slug:draft.slug||name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')});}
  if(loading)return <p>{t('加载中…','Loading…')}</p>;
  if(error&&categories.length===0)return <div role="alert">{error}<button onClick={()=>void load()} className="ml-3 underline">{t('重试','Retry')}</button></div>;
  return <div className="space-y-5"><div className="rounded-xl border bg-white p-6"><h2 className="text-2xl font-bold">{draft.brand} {draft.model||t('新商品','New product')}</h2><p className="mt-2 text-sm">{draft.status} {dirty?' · '+t('有未保存修改','Unsaved changes'):''}</p></div>
    <div className="flex flex-wrap gap-2">{tabs.map(([zh,en],i)=><button key={en} onClick={()=>setTab(i)} className={`rounded-lg px-4 py-3 text-sm ${tab===i?'bg-[#123b2f] text-white':'border bg-white'}`}>{t(zh,en)}</button>)}</div>
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}{notice&&<p role="status" className="rounded-xl bg-green-50 p-4 text-green-800">{notice}</p>}
    <section className="rounded-xl border bg-white p-5 md:p-8">
    {tab===0&&<><GenericFields draft={draft} setDraft={setDraft} fields={['brand','model','name','slug','shortDescription','description']}/><label className="mt-4 block text-sm font-bold">{t('商品分类','Category')}<select className="mt-2 block w-full rounded-lg border p-3" value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value,subCategory:categories.find(c=>c.id===e.target.value)?.subCategory||e.target.value})}><option value="">{t('请选择','Choose category')}</option>{categories.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}{draft.category&&!categories.some(c=>c.id===draft.category)&&<option>{draft.category}</option>}</select></label><button onClick={suggest} className="mt-4 rounded-lg border p-3">{t('根据品牌和型号补充名称与链接','Suggest name and slug')}</button></>}
    {tab===1&&<div className="space-y-5"><p className="text-sm text-amber-800">{t('上传不会自动发布。保存后，图片才会关联到商品。','Uploading does not publish. Save to attach images to the product.')}</p><MediaUpload label={t('上传多张图片','Upload images')} accept="image/jpeg,image/png,image/webp" onUploaded={urls=>setDraft(prev=>({...prev,image:prev.image||urls[0],images:[...new Set([...(prev.images||[]),...urls])]}))}/><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{(draft.images||[]).map((url:string,index:number)=><div key={url} className="rounded-lg border p-2"><img src={url} alt="" loading="lazy" className="aspect-square w-full object-contain"/><div className="flex flex-wrap gap-2 text-xs"><button onClick={()=>setDraft({...draft,image:url})}>{draft.image===url?t('封面','Cover'):t('设为封面','Set cover')}</button><button aria-label={t('前移','Move earlier')} disabled={index===0} onClick={()=>{const images=[...draft.images];[images[index-1],images[index]]=[images[index],images[index-1]];setDraft({...draft,images});}}>↑</button><button onClick={()=>{const images=draft.images.filter((s:string)=>s!==url);setDraft({...draft,images,image:draft.image===url?images[0]||'':draft.image});}}>{t('移除','Remove')}</button></div></div>)}</div><MediaUpload label={t('上传视频','Upload video')} accept="video/mp4" multiple={false} onUploaded={urls=>setDraft(prev=>({...prev,video:urls[0]}))}/><MediaUpload label={t('上传 PDF','Upload PDF')} accept="application/pdf" multiple={false} onUploaded={urls=>setDraft(prev=>({...prev,pdfBrochure:urls[0]}))}/><GenericFields draft={draft} setDraft={setDraft} fields={['video','pdfBrochure']}/></div>}
    {tab===2&&<><GenericFields draft={draft} setDraft={setDraft} fields={['engine','ratedPower','operatingWeight','bucketCapacity','dimension','specifications']}/><textarea aria-label={t('粘贴参数文本','Paste specifications')} value={paste} onChange={e=>setPaste(e.target.value)} className="mt-5 w-full rounded-lg border p-3" placeholder="Operating Weight: 21000 kg"/><button className="mt-2 rounded-lg border p-3" onClick={()=>setPreview(Object.fromEntries(paste.split('\n').map(line=>{const i=line.search(/[:：]/);return i<1?[]:[line.slice(0,i).trim(),line.slice(i+1).trim()];}).filter(pair=>pair.length===2)))}>{t('解析并预览','Parse and preview')}</button>{preview&&<div className="mt-3 rounded-lg bg-gray-50 p-4"><pre className="whitespace-pre-wrap">{JSON.stringify(preview,null,2)}</pre><button onClick={()=>{setDraft({...draft,specifications:{...(typeof draft.specifications==='object'?draft.specifications:{}),...preview}});setPreview(null);}} className="mt-3 rounded-lg bg-lime p-3">{t('确认添加参数','Confirm parameters')}</button></div>}</>}
    {tab===3&&<><p className="mb-4 text-sm text-gray-500">{t('以下为销售报价字段，不要填写内部成本。','Sales quote fields only. Do not enter internal costs.')}</p><GenericFields draft={draft} setDraft={setDraft} fields={['fobPrice','seaFreight','destinationPort','cifPrice','moq','deliveryTime','deposit30','balance70','validity']}/></>}
    {tab===4&&<GenericFields draft={draft} setDraft={setDraft} fields={['seoTitle','seoDescription']}/>}
    {tab===5&&(draft.id?<ProductVersionHistory productId={draft.id} onRestored={item=>{setDraft(item);setBaseline(JSON.stringify(item));}}/>:<p>{t('创建商品后可查看修改历史。','History is available after creation.')}</p>)}
    </section>
    <div className="sticky bottom-0 z-20 flex flex-wrap justify-end gap-3 rounded-xl border bg-white p-4 shadow-sm"><Link onClick={e=>{if(dirty&&!confirm(t('放弃修改？','Discard changes?')))e.preventDefault();}} href="/admin/products" className="rounded-lg border px-4 py-3">{t('取消','Cancel')}</Link><button disabled={busy} onClick={()=>void save('Draft')} className="rounded-lg border px-4 py-3">{t('保存草稿','Save draft')}</button><button disabled={busy} onClick={()=>void save(draft.status)} className="rounded-lg border px-4 py-3">{busy?t('保存中…','Saving…'):t('保存修改','Save changes')}</button><button disabled={busy||draft.status==='Deleted'} onClick={()=>void save('Published')} className="rounded-lg bg-lime px-5 py-3 font-bold">{t('发布','Publish')}</button></div>
  </div>;
}
