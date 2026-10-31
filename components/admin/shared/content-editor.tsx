'use client';
import {useEffect,useState} from 'react';
import {AlertTriangle,Edit3,Eye,History,ImagePlus,LoaderCircle,Plus,RotateCcw,Save,Trash2,Upload} from 'lucide-react';
import {defaultSubCategory} from '@/lib/catalog-config';
import {useAdminLanguage} from '@/components/admin/layout/admin-shell';
import {fieldLabels} from './labels';
type Item=Record<string,any>;
export type ModuleKey='dashboard'|'products'|'productCategories'|'cases'|'factory'|'shipping'|'homeShipments'|'blog'|'media'|'inquiries';
const statuses=['Published','Draft','Archived','Deleted'];
const inquiryStatuses=['New','Contacted','Quoted','PI Sent','Deal','Lost'];
export function Editor({active,draft,setDraft,save,remove,permanentlyRemoveProduct,busy,categoryOptions}:{active:ModuleKey;draft:Item|null;setDraft:(item:Item|null)=>void;save:(itemToSave?:Item|null,successMessage?:string)=>Promise<void>;remove:(item:Item)=>void;permanentlyRemoveProduct:(item:Item)=>void;busy:boolean;categoryOptions:{value:string;label:string;subCategory:string}[]}){
  const {t}=useAdminLanguage();
  if(!draft)return <div className="rounded-3xl bg-white p-8 text-gray-500 shadow-sm">Select an item or click Add New.</div>;
  return <div className="rounded-3xl bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-black">{draft.id?t('编辑','Edit'):t('新增','Add new')}</h2>{draft.id&&active==='products'&&draft.status==='Deleted'?<div className="flex gap-2"><button type="button" onClick={()=>void save({...draft,status:'Published',deletedAt:null},'Product restored from Trash.')} className="inline-flex items-center gap-2 rounded-full bg-lime px-4 py-2 text-sm font-black"><RotateCcw size={15}/>Restore</button><button type="button" onClick={()=>permanentlyRemoveProduct(draft)} className="rounded-full p-3 text-red-600 hover:bg-red-50" aria-label="Permanently delete product"><Trash2/></button></div>:draft.id&&<button onClick={()=>remove(draft)} className="rounded-full p-3 text-red-600 hover:bg-red-50" aria-label="Move to trash"><Trash2/></button>}</div>
    {active==='products'&&<ProductFields draft={draft} setDraft={setDraft} save={save} categoryOptions={categoryOptions}/>}
    {active==='productCategories'&&<CategoryFields draft={draft} setDraft={setDraft}/>}
    {active==='cases'&&<CaseFields draft={draft} setDraft={setDraft} save={save}/>}
    {active==='factory'&&<FactoryFields draft={draft} setDraft={setDraft} save={save}/>}
    {active==='shipping'&&<GenericFields draft={draft} setDraft={setDraft} fields={['title','destinationCountry','destinationPort','machineModel','shippingMethod','shippingDate','description','images','video','status']}/>}
    {active==='homeShipments'&&<HomeShipmentFields draft={draft} setDraft={setDraft} save={save}/>}
    {active==='blog'&&<GenericFields draft={draft} setDraft={setDraft} fields={['title','slug','coverImage','content','seoTitle','seoDescription','status','createdDate']}/>}
    {active==='media'&&<MediaFields draft={draft} setDraft={setDraft}/>}
    {active==='inquiries'&&<><dl className="mt-4 space-y-3">{['name','company','country','port','phone','email','productModel','quantity','message','createdAt'].map(field=><div key={field}><dt className="text-xs text-gray-500">{t(fieldLabels[field]||field,field)}</dt><dd className="whitespace-pre-wrap break-words">{String(draft[field]||'—')}</dd></div>)}</dl><GenericFields draft={draft} setDraft={setDraft} fields={['status','followUpNotes','nextAction']}/></>}
    <div className="mt-7 flex justify-end"><button onClick={()=>void save()} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3 font-black text-white disabled:opacity-50">{busy?<LoaderCircle className="animate-spin" size={18}/>:<Save size={18}/>}{t('保存当前状态','Save current status')}</button></div>
  </div>;
}

function ProductFields({draft,setDraft,save,categoryOptions}:{draft:Item;setDraft:(item:Item)=>void;save:(itemToSave?:Item|null,successMessage?:string)=>Promise<void>;categoryOptions:{value:string;label:string;subCategory:string}[]}){
  function chooseCategory(category:{value:string;subCategory:string}){
    const next:Item={...draft,category:category.value,subCategory:category.subCategory||defaultSubCategory(category.value)};
    setDraft(next);
  }
  async function attachUploadedMedia(urls:string[]){
    const next:Item={...draft,image:draft.image||urls[0],images:[...(draft.images||[]),...urls]};
    setDraft(next);
  }
  function completeProductBasics(){
    const brand=String(draft.brand||'XCMG').trim()||'XCMG';
    const model=String(draft.model||'').trim();
    if(!model)return;
    const slug=`${brand}-${model}`.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    setDraft({...draft,brand,name:String(draft.name||'').trim()||`${brand} ${model}`,slug:String(draft.slug||'').trim()||slug});
  }
  return <div className="mt-6 space-y-7">
    <CatalogHealth/>
    <section><div className="flex items-center justify-between gap-3"><p className="text-sm font-black">1. Choose product category</p><p className="text-xs text-gray-500">Manage categories from Product Categories.</p></div><div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">{categoryOptions.map(option=><button type="button" key={option.value} onClick={()=>chooseCategory(option)} className={`rounded-xl border p-3 text-left text-sm font-black transition ${draft.category===option.value?'border-ink bg-lime text-ink':'border-black/10 hover:border-black/40'}`}>{option.label}</button>)}</div><p className="mt-2 text-xs text-gray-500">Selected: <b>{categoryOptions.find(option=>option.value===draft.category)?.label||'Choose a category'}</b>. This controls the storefront page.</p></section>
    <section className="grid gap-4 md:grid-cols-2"><Input field="model" draft={draft} setDraft={setDraft}/><Input field="brand" draft={draft} setDraft={setDraft}/><div className="md:col-span-2 -mt-1"><button type="button" onClick={completeProductBasics} disabled={!String(draft.model||'').trim()} className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-black transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-40">Use brand + model for product name and page link</button><p className="mt-2 text-xs text-gray-500">A quick shortcut for new products. You can still edit the product name and slug below.</p></div><Input field="name" draft={draft} setDraft={setDraft}/><Select field="status" options={statuses} draft={draft} setDraft={setDraft}/><Input field="shortDescription" draft={draft} setDraft={setDraft} textarea/><Input field="description" draft={draft} setDraft={setDraft} textarea/></section>
    <section className="rounded-2xl bg-sand p-4"><p className="font-black">2. Product photos</p><div className="mt-3 flex flex-wrap items-start gap-4">{draft.image&&<img src={draft.image} alt="Product preview" className="size-28 rounded-xl border border-black/10 bg-white object-contain p-1"/>}<div><MediaUpload onUploaded={attachUploadedMedia}/><p className="mt-2 max-w-md text-xs leading-5 text-gray-500">Upload JPG, PNG or WebP. Existing published products save the new photo automatically. For a new product, click Save & Publish after entering the model.</p></div></div><ArrayField field="images" draft={draft} setDraft={setDraft}/></section>
    <details className="rounded-2xl border border-black/10 p-4"><summary className="cursor-pointer font-black">Specifications, price and SEO (optional)</summary><div className="mt-5 grid gap-4 md:grid-cols-2">{['engine','operatingWeight','bucketCapacity','ratedPower','dimension','fobPrice','moq','deliveryTime','seaFreight','destinationPort','cifPrice','deposit30','balance70','validity','video','pdfBrochure','slug','seoTitle','seoDescription'].map(field=><Input key={field} field={field} draft={draft} setDraft={setDraft} textarea={['seoDescription'].includes(field)}/>)}<Input field="specifications" draft={draft} setDraft={setDraft} textarea/></div></details>{draft.id&&<ProductVersionHistory productId={String(draft.id)} onRestored={setDraft}/>}
  </div>;
}

export function CatalogHealth(){
  const [health,setHealth]=useState<Item|null>(null),[error,setError]=useState('');
  useEffect(()=>{void fetch('/api/admin/catalog-health',{cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error('健康检查加载失败 / Health check failed');return response.json();}).then(setHealth).catch(e=>setError(String(e)));},[]);
  if(error)return <div role="alert" className="rounded-xl bg-red-50 p-4">{error}<button onClick={()=>location.reload()}>重试 / Retry</button></div>;
  if(!health)return <div className="rounded-2xl bg-sand p-4 text-sm text-gray-500">Catalog Health is loading…</div>;
  const entries=[['Products',health.total],['Published',health.published],['Draft',health.draft],['Archived',health.archived],['Trash',health.trash],['Missing image',health.missingImages?.length||0],['Duplicate models',health.duplicateModels?.length||0]];
  return <section className="rounded-2xl border border-black/10 p-4"><div className="flex items-center gap-2"><AlertTriangle size={18}/><p className="font-black">Catalog Health</p></div><div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">{entries.map(([label,value])=><div key={String(label)} className="rounded-xl bg-sand px-3 py-2"><p className="text-xs text-gray-500">{label}</p><b>{String(value)}</b></div>)}</div></section>;
}

export function ProductVersionHistory({productId,onRestored}:{productId:string;onRestored:(item:Item)=>void}){
  const [versions,setVersions]=useState<Item[]>([]),[message,setMessage]=useState('');
  useEffect(()=>{void fetch(`/api/admin/products/${encodeURIComponent(productId)}/versions`,{cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error('版本历史加载失败 / Unable to load versions');return response.json();}).then(setVersions).catch(e=>setMessage(String(e)));},[productId]);
  async function restore(versionId:string){
    if(!confirm('Restore this saved version? The current product state will be saved first.'))return;
    const response=await fetch(`/api/admin/products/${encodeURIComponent(productId)}/versions`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({versionId})});
    const result=await response.json().catch(()=>({}));
    if(!response.ok){setMessage(result.error||'Unable to restore version.');return;}
    onRestored(result.product);setMessage('Version restored.');
  }
  return <details className="rounded-2xl border border-black/10 p-4"><summary className="cursor-pointer font-black">Version history ({versions.length})</summary><div className="mt-4 space-y-2">{!versions.length?<p className="text-sm text-gray-500">No saved versions yet. The next edit, deletion, restore, or migration will create one.</p>:versions.map(version=><div className="flex items-center justify-between gap-3 rounded-xl bg-sand p-3" key={version.id}><span><b className="block text-sm">{version.action||'Updated'}</b><small className="text-gray-500">{String(version.created_at||'').slice(0,16).replace('T',' ')}</small></span><button type="button" onClick={()=>void restore(String(version.id))} className="rounded-lg border border-black/15 px-3 py-2 text-xs font-black">Restore</button></div>)}{message&&<p className="text-xs font-bold text-red-600">{message}</p>}</div></details>;
}

function CategoryFields({draft,setDraft}:{draft:Item;setDraft:(item:Item)=>void}){
  return <div className="mt-6 space-y-4"><p className="rounded-xl bg-sand p-4 text-sm text-gray-600">Add a category once and it will appear in the product editor. Category ID cannot be changed after saving, so existing products remain correctly grouped.</p>{!draft.id?<Input field="id" draft={draft} setDraft={setDraft}/>:<p className="text-sm font-bold">Category ID: <span className="font-mono text-gray-500">{draft.id}</span></p>}<Input field="label" draft={draft} setDraft={setDraft}/><Input field="subCategory" draft={draft} setDraft={setDraft}/></div>;
}

function HomeShipmentFields({draft,setDraft,save}:{draft:Item;setDraft:(item:Item)=>void;save:(itemToSave?:Item|null,successMessage?:string)=>Promise<void>}){
  async function replacePhoto(urls:string[]){
    const image=urls[0];
    if(!image)return;
    const next={...draft,image};
    setDraft(next);
  }
  async function restoreOriginal(){
    const image=String(draft.originalImage||'');
    if(!image)return;
    const next={...draft,image};
    setDraft(next);
  }
  return <div className="mt-6 space-y-5">
    <div className="rounded-2xl bg-sand p-4"><p className="font-black">Homepage shipment {draft.slot}</p><p className="mt-1 text-sm leading-6 text-gray-600">This card appears in the six-photo <b>Latest Shipments</b> section on the homepage. Replace only this photo; the other homepage cards stay unchanged.</p></div>
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#f3f5f2]">{draft.image?<img src={draft.image} alt={draft.alt||draft.title||'Homepage shipment preview'} className="aspect-[4/3] w-full object-cover"/>:<div className="grid aspect-[4/3] place-items-center text-sm text-gray-500">No image selected</div>}</div>
    <div className="flex flex-wrap gap-3"><MediaUpload label="Replace photo" accept="image/jpeg,image/png,image/webp" onUploaded={replacePhoto}/>{draft.originalImage&&<button type="button" onClick={()=>void restoreOriginal()} className="rounded-xl border border-black/15 bg-white px-4 py-3 text-sm font-black hover:border-black">Restore original photo</button>}</div>
    <p className="text-xs leading-5 text-gray-500">New photos are compressed and stored securely. The replacement is published automatically after upload.</p>
    <div className="grid gap-4 md:grid-cols-2"><Input field="title" draft={draft} setDraft={setDraft}/><Input field="alt" draft={draft} setDraft={setDraft}/><Select field="status" options={statuses} draft={draft} setDraft={setDraft}/></div>
  </div>;
}

function CaseFields({draft,setDraft,save}:{draft:Item;setDraft:(item:Item)=>void;save:(itemToSave?:Item|null,successMessage?:string)=>Promise<void>}){
  return <ContentMediaFields draft={draft} setDraft={setDraft} save={save} folder="cases" heading="Customer case media" description="Replace the cover photo, add gallery photos, or replace the case video. Published changes appear on the Cases page automatically." fields={['title','country','customerIndustry','machineModel','quantity','year','description','status']}/>;
}

function FactoryFields({draft,setDraft,save}:{draft:Item;setDraft:(item:Item)=>void;save:(itemToSave?:Item|null,successMessage?:string)=>Promise<void>}){
  return <ContentMediaFields draft={draft} setDraft={setDraft} save={save} folder="factory" heading="Factory media" description="Replace the cover photo, add gallery photos, or replace the factory video. Published changes appear on the Factory page automatically." fields={['title','category','description','status']}/>;
}

function ContentMediaFields({draft,setDraft,save,folder,heading,description,fields}:{draft:Item;setDraft:(item:Item)=>void;save:(itemToSave?:Item|null,successMessage?:string)=>Promise<void>;folder:'cases'|'factory';heading:string;description:string;fields:string[]}){
  const images=Array.isArray(draft.images)?draft.images.map(String).filter(Boolean):[];
  const videos=Array.isArray(draft.videos)?draft.videos.map(String).filter(Boolean):draft.video?[String(draft.video)]:[];
  async function persist(next:Item,message:string){
    const nextVideos=Array.isArray(next.videos)?next.videos.map(String).filter(Boolean):next.video?[String(next.video)]:[];
    next={...next,videos:nextVideos,video:nextVideos[0]||''};
    setDraft(next);
  }
  async function replaceCover(urls:string[]){
    const image=urls[0];
    if(!image)return;
    await persist({...draft,images:[image,...images.slice(1)]},'Cover photo replaced and published.');
  }
  async function addPhotos(urls:string[]){
    if(!urls.length)return;
    await persist({...draft,images:[...images,...urls]},`${urls.length} gallery photo${urls.length===1?'':'s'} added.`);
  }
  async function removePhoto(image:string){
    await persist({...draft,images:images.filter(item=>item!==image)},'Photo removed from this page.');
  }
  async function addVideos(urls:string[]){
    const video=urls[0];
    if(!video)return;
    await persist({...draft,videos:[...videos,...urls]},`${urls.length} video${urls.length===1?'':'s'} added and published.`);
  }
  async function replaceVideo(index:number,urls:string[]){
    const video=urls[0];
    if(!video)return;
    const next=[...videos];next[index]=video;
    await persist({...draft,videos:next},'Video replaced and published.');
  }
  async function removeVideo(index:number){
    await persist({...draft,videos:videos.filter((_,videoIndex)=>videoIndex!==index)},'Video removed from this page.');
  }
  return <div className="mt-6 space-y-7">
    <section className="grid gap-4 md:grid-cols-2">{fields.map(field=>field==='status'?<Select key={field} field={field} options={statuses} draft={draft} setDraft={setDraft}/>:<Input key={field} field={field} draft={draft} setDraft={setDraft} textarea={field==='description'}/>)}</section>
    <section className="rounded-2xl bg-sand p-5"><p className="font-black">{heading}</p><p className="mt-1 text-sm leading-6 text-gray-600">{description}</p><div className="mt-5 grid gap-4 sm:grid-cols-2">{images.map((image,index)=><div className="overflow-hidden rounded-2xl border border-black/10 bg-white" key={image}><img src={image} alt={`${draft.title||heading} ${index+1}`} className="aspect-[4/3] w-full object-cover"/><div className="flex items-center justify-between gap-3 p-3"><span className="text-xs font-black">{index===0?'Cover photo':`Gallery photo ${index}`}</span><button type="button" onClick={()=>void removePhoto(image)} className="text-xs font-black text-red-600">Remove</button></div></div>)}</div>{!images.length&&<div className="mt-5 grid aspect-[4/3] place-items-center rounded-2xl border border-dashed border-black/20 bg-white text-sm text-gray-500">No photos uploaded yet</div>}<div className="mt-5 flex flex-wrap gap-3"><MediaUpload label="Replace cover photo" accept="image/jpeg,image/png,image/webp" folder={folder} multiple={false} onUploaded={urls=>void replaceCover(urls)}/><MediaUpload label="Add gallery photos" accept="image/jpeg,image/png,image/webp" folder={folder} onUploaded={urls=>void addPhotos(urls)}/></div><p className="mt-3 text-xs leading-5 text-gray-500">The first photo is the cover used at the top of the card. New photos are optimized automatically.</p></section>
    <section className="rounded-2xl border border-black/10 p-5"><div><p className="font-black">Videos</p><p className="mt-1 text-sm text-gray-500">MP4 only. Each video can be replaced individually and will play directly on the public page.</p></div><div className="mt-4 grid gap-4 md:grid-cols-2">{videos.map((video,index)=><div className="overflow-hidden rounded-2xl border border-black/10 bg-white" key={video}><video controls playsInline preload="metadata" className="aspect-video w-full bg-black"><source src={video} type="video/mp4"/></video><div className="flex flex-wrap items-center gap-2 p-3"><span className="mr-auto text-xs font-black">Video {index+1}</span><MediaUpload label="Replace video" accept="video/mp4" folder={folder} multiple={false} onUploaded={urls=>void replaceVideo(index,urls)}/><button type="button" onClick={()=>void removeVideo(index)} className="text-xs font-black text-red-600">Remove</button></div></div>)}</div>{!videos.length&&<p className="mt-4 rounded-xl bg-sand p-4 text-sm text-gray-500">No videos uploaded yet.</p>}<div className="mt-4"><MediaUpload label="Add video" accept="video/mp4" folder={folder} onUploaded={urls=>void addVideos(urls)}/></div></section>
  </div>;
}

export function GenericFields({draft,setDraft,fields}:{draft:Item;setDraft:(item:Item)=>void;fields:string[]}){
  return <div className="mt-6 grid gap-4 md:grid-cols-2">{fields.map(field=>field==='status'?<Select key={field} field={field} options={field==='status'&&draft.email?inquiryStatuses:statuses} draft={draft} setDraft={setDraft}/>:field==='images'?<><ArrayField key={field} field={field} draft={draft} setDraft={setDraft}/><MediaUpload onUploaded={urls=>setDraft({...draft,images:[...(draft.images||[]),...urls]})}/></>:<Input key={field} field={field} draft={draft} setDraft={setDraft} textarea={['description','content','message'].includes(field)}/>)}</div>;
}

function MediaFields({draft,setDraft}:{draft:Item;setDraft:(item:Item)=>void}){
  return <div className="mt-6 grid gap-4 md:grid-cols-2"><Input field="title" draft={draft} setDraft={setDraft}/><Input field="category" draft={draft} setDraft={setDraft}/><Input field="url" draft={draft} setDraft={setDraft}/><Select field="status" options={statuses} draft={draft} setDraft={setDraft}/><MediaUpload onUploaded={urls=>setDraft({...draft,url:urls[0],src:urls[0]})}/>{draft.url&&<a href={draft.url} target="_blank" className="rounded-xl border border-black/10 px-4 py-3 font-bold">Open / copy: {draft.url}</a>}</div>;
}

export function Input({field,draft,setDraft,textarea=false}:{field:string;draft:Item;setDraft:(item:Item)=>void;textarea?:boolean}){
  const {t}=useAdminLanguage();
  const label=t(fieldLabels[field]||field,field.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()));
  if(field==='specifications')textarea=true;
  const value=field==='specifications'&&typeof draft[field]==='object'?Object.entries(draft[field]||{}).map(([k,v])=>k+': '+v).join('\n'):Array.isArray(draft[field])?draft[field].join('\n'):String(draft[field]??'');
  const props={value,onChange:(e:any)=>setDraft({...draft,[field]:e.target.value}),className:'mt-2 w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black'};
  return <label className={`text-sm font-bold ${textarea?'md:col-span-2':''}`}>{label}{textarea?<textarea rows={field==='content'?10:4} {...props}/>:<input {...props}/>}</label>;
}
function ArrayField({field,draft,setDraft}:{field:string;draft:Item;setDraft:(item:Item)=>void}){
  return <label className="text-sm font-bold md:col-span-2">{field} <span className="font-normal text-gray-400">(one URL per line)</span><textarea value={(draft[field]||[]).join('\n')} onChange={e=>setDraft({...draft,[field]:e.target.value.split('\n').map(v=>v.trim()).filter(Boolean)})} rows={4} className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black"/></label>;
}
export function Select({field,options,draft,setDraft}:{field:string;options:string[];draft:Item;setDraft:(item:Item)=>void}){
  return <label className="text-sm font-bold">{field.replace(/([A-Z])/g,' $1')}<select value={draft[field]||options[0]} onChange={e=>setDraft({...draft,[field]:e.target.value})} className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3">{options.map(item=><option key={item}>{item}</option>)}</select></label>;
}
export function MediaUpload({onUploaded,label='Upload',accept='image/jpeg,image/png,image/webp,video/mp4,application/pdf',folder='admin',multiple=true}:{onUploaded:(urls:string[])=>void;label?:string;accept?:string;folder?:string;multiple?:boolean}){
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[note,setNote]=useState('');
  async function upload(files:FileList|null){
    if(!files?.length)return;
    setBusy(true);setError('');setNote('Preparing files...');
    const controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),120000);
    try{
      const prepared=await Promise.all([...files].map(prepareUploadFile));
      const form=new FormData();
      prepared.forEach(file=>form.append('files',file));
      form.append('folder',folder);
      setNote(`Uploading ${prepared.length} file(s)...`);
      const response=await fetch('/api/admin/upload',{method:'POST',body:form,signal:controller.signal});
      const result=await response.json().catch(()=>({success:false,error:'Upload failed. Please try a smaller JPG, PNG or WebP image.'}));
      if(!response.ok||!result.success)throw new Error(result.error||'Upload failed.');
      const urls=(result.assets||[]).map((item:Item)=>item.url).filter(Boolean);
      if(!urls.length)throw new Error('Upload finished but no file URL was returned.');
      onUploaded(urls);
      setNote(`${urls.length} file(s) uploaded successfully.`);
    }catch(error){
      setError(error instanceof Error&&error.name==='AbortError'?'Upload timed out. Please try fewer or smaller photos.':error instanceof Error?error.message:'Upload failed.');
      setNote('');
    }finally{
      window.clearTimeout(timeout);
      setBusy(false);
    }
  }
  return <div className="space-y-2">
    <label className={`inline-flex items-center justify-center gap-2 rounded-xl border border-black/15 px-4 py-3 font-black ${busy?'cursor-wait opacity-70':'cursor-pointer hover:border-black'}`}><Upload size={18}/>{busy?'Uploading...':label}<input type="file" multiple={multiple} accept={accept} className="hidden" disabled={busy} onChange={e=>{void upload(e.target.files);e.currentTarget.value='';}}/></label>
    {note&&<p className="text-xs font-bold text-green-700">{note}</p>}
    {error&&<p className="text-xs font-bold text-red-600">{error}</p>}
  </div>;
}

async function prepareUploadFile(file:File){
  if(!file.type.startsWith('image/'))return file;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Only JPG, PNG and WebP images are supported. Please convert the photo and upload again.');
  return compressImage(file);
}

async function compressImage(file:File){
  try{
    const bitmap=await createImageBitmap(file);
    const maxSide=1800,scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
    const width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));
    const canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;
    const context=canvas.getContext('2d');
    if(!context)return file;
    context.drawImage(bitmap,0,0,width,height);
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',0.82));
    bitmap.close();
    if(!blob)return file;
    if(blob.size>=file.size&&file.size<3.5*1024*1024)return file;
    const name=file.name.replace(/\.[^.]+$/,'')||'image';
    return new File([blob],`${name}.webp`,{type:'image/webp',lastModified:Date.now()});
  }catch{
    return file;
  }
}
