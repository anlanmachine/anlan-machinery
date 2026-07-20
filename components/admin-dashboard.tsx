'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {BarChart3,Edit3,Eye,FileText,FolderOpen,ImagePlus,Inbox,LayoutDashboard,LoaderCircle,LogOut,Package,Plus,Save,Search,Ship,Trash2,Upload} from 'lucide-react';
import {defaultSubCategory} from '@/lib/catalog-config';

type Item=Record<string,any>;
type ModuleKey='dashboard'|'products'|'productCategories'|'cases'|'factory'|'shipping'|'blog'|'media'|'inquiries';
const modules:{key:ModuleKey;label:string;icon:any}[]=[
  {key:'dashboard',label:'Dashboard',icon:LayoutDashboard},{key:'products',label:'Products',icon:Package},{key:'productCategories',label:'Product Categories',icon:FolderOpen},{key:'cases',label:'Cases',icon:FolderOpen},{key:'factory',label:'Factory',icon:BarChart3},{key:'shipping',label:'Shipping',icon:Ship},{key:'blog',label:'Blog',icon:FileText},{key:'media',label:'Media Library',icon:ImagePlus},{key:'inquiries',label:'Inquiries',icon:Inbox}
];
const collections=modules.filter(item=>item.key!=='dashboard').map(item=>item.key);
const statuses=['Published','Draft'];
const inquiryStatuses=['New','Contacted','Quoted','PI Sent','Deal','Lost'];
const emptyProduct={brand:'XCMG',model:'',category:'excavator',subCategory:'crawler-excavator',name:'',shortDescription:'',description:'',specifications:'',engine:'',operatingWeight:'',bucketCapacity:'',ratedPower:'',dimension:'',fobPrice:'',moq:'1 unit',deliveryTime:'15-30 days',seaFreight:'',destinationPort:'',cifPrice:'',deposit30:'',balance70:'',validity:'15 days',image:'',images:[],video:'',pdfBrochure:'',seoTitle:'',seoDescription:'',slug:'',status:'Published'};
const emptyByModule:Record<string,Item>={
  products:emptyProduct,
  productCategories:{id:'',label:'',subCategory:''},
  cases:{title:'',country:'',customerIndustry:'',machineModel:'',quantity:'',year:new Date().getFullYear(),description:'',images:[],video:'',status:'Published'},
  factory:{title:'',description:'',images:[],video:'',category:'Workshop',status:'Published'},
  shipping:{title:'',destinationCountry:'',destinationPort:'',machineModel:'',shippingMethod:'Container',description:'',images:[],video:'',shippingDate:'',status:'Published'},
  blog:{title:'',slug:'',coverImage:'',content:'',seoTitle:'',seoDescription:'',status:'Published',createdDate:new Date().toISOString().slice(0,10)},
  media:{title:'',type:'image',url:'',category:'general',status:'Published'},
  inquiries:{status:'New'}
};

export function AdminDashboard(){
  const [active,setActive]=useState<ModuleKey>('dashboard'),[data,setData]=useState<Record<string,Item[]>>({}),[draft,setDraft]=useState<Item|null>(null),[query,setQuery]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[messageType,setMessageType]=useState<'success'|'error'>('success');
  useEffect(()=>{void loadAll();},[]);
  async function loadAll(){
    setBusy(true);
    try{
      const entries=await Promise.all(collections.map(async key=>[key,await fetch(`/api/admin/collections/${key}`,{cache:'no-store'}).then(r=>r.ok?r.json():[])] as const));
      setData(Object.fromEntries(entries));
    }catch{
      setMessageType('error');setMessage('Could not load the latest content. Please refresh and try again.');
    }finally{setBusy(false);}
  }
  const items=data[active]||[];
  const filtered=useMemo(()=>items.filter(item=>JSON.stringify(item).toLowerCase().includes(query.toLowerCase())),[items,query]);
  const stats={products:(data.products||[]).length,cases:(data.cases||[]).length,blog:(data.blog||[]).length,media:(data.media||[]).length,updated:[...Object.values(data).flat()].map(item=>item.updatedAt||item.createdAt).filter(Boolean).sort().pop()||'Not yet'};
  const categoryOptions=(data.productCategories||[]).map(item=>({value:String(item.id),label:String(item.label||item.id),subCategory:String(item.subCategory||item.id)}));
  async function save(itemToSave:Item|null|undefined=draft,successMessage='Saved successfully.'){
    if(!itemToSave||active==='dashboard')return;
    setBusy(true);setMessage('');
    try{
      const method=itemToSave.id?'PUT':'POST';
      const response=await fetch(`/api/admin/collections/${active}`,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(itemToSave)});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||'Save failed.');
      setDraft(result.item);setMessageType('success');setMessage(successMessage);await loadAll();
    }catch(caught){
      setMessageType('error');setMessage(caught instanceof Error?caught.message:'Save failed. Please try again.');
    }finally{setBusy(false);}
  }
  async function remove(item:Item){
    if(active==='dashboard'||!confirm('Delete this item?'))return;
    setBusy(true);setMessage('');
    try{
      const response=await fetch(`/api/admin/collections/${active}?id=${encodeURIComponent(item.id)}`,{method:'DELETE'});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||'Delete failed.');
      setDraft(null);setMessageType('success');setMessage('Deleted.');await loadAll();
    }catch(caught){
      setMessageType('error');setMessage(caught instanceof Error?caught.message:'Delete failed. Please try again.');
    }finally{setBusy(false);}
  }
  async function logout(){await fetch('/api/admin/auth',{method:'DELETE'});location.href='/admin/login';}
  return <main className="min-h-screen bg-[#f3f5f2] pt-20">
    <div className="mx-auto grid max-w-[1600px] gap-5 px-4 py-6 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-3xl bg-ink p-4 text-white lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">
        <div className="px-3 py-4"><b className="text-xl">AOLAN Admin</b><p className="mt-1 text-xs text-white/50">Content management</p></div>
        <nav className="mt-3 space-y-1">{modules.map(item=>{const Icon=item.icon;return <button key={item.key} onClick={()=>{setActive(item.key);setDraft(null);setMessage('');}} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold ${active===item.key?'bg-lime text-ink':'text-white/75 hover:bg-white/10'}`}><Icon size={18}/>{item.label}</button>})}</nav>
        <div className="mt-6 space-y-2 px-3"><Link href="/" target="_blank" className="flex items-center gap-2 text-sm font-bold text-white/70"><Eye size={16}/>Preview website</Link><button onClick={logout} className="flex items-center gap-2 text-sm font-bold text-white/70"><LogOut size={16}/>Logout</button></div>
      </aside>
      <section className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm">
          <div><p className="eyebrow">Admin panel</p><h1 className="mt-2 text-3xl font-black">{modules.find(item=>item.key===active)?.label}</h1><p className="mt-1 text-sm text-gray-500">Edit content, upload media, publish to storefront.</p></div>
          {active!=='dashboard'&&active!=='inquiries'&&<button onClick={()=>setDraft({...emptyByModule[active]})} className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-3 font-black"><Plus size={18}/>Add New</button>}
        </div>
        {message&&<p role="status" className={`mt-4 rounded-2xl px-5 py-3 text-sm font-bold ${messageType==='error'?'bg-red-50 text-red-700':'bg-green-50 text-green-800'}`}>{message}</p>}
        {active==='dashboard'?<Dashboard stats={stats}/>:<div className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="relative"><Search className="absolute left-3 top-3.5 text-gray-400" size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search model, title, country, category..." className="w-full rounded-xl border border-black/10 py-3 pl-10 pr-4 outline-none focus:border-black"/></div>
            <div className="mt-4 max-h-[70vh] overflow-auto rounded-2xl border border-black/5">{busy&&!filtered.length?<p className="p-5 text-gray-500">Loading latest content...</p>:filtered.length===0?<p className="p-6 text-center text-sm text-gray-500">No matching items yet. Use Add New to create one.</p>:filtered.map(item=><button key={item.id||item.url||JSON.stringify(item).slice(0,30)} onClick={()=>setDraft({...item})} className={`flex w-full items-center justify-between gap-4 border-b border-black/5 p-4 text-left transition hover:bg-gray-50 ${draft?.id===item.id?'bg-lime/30':''}`}><span><b className="block">{item.model||item.title||item.name||item.email||'Untitled'}</b><small className="text-gray-500">{item.category||item.country||item.destinationCountry||item.status||item.type}</small></span><Edit3 size={16}/></button>)}</div>
          </div>
          <Editor active={active} draft={draft} setDraft={setDraft} save={save} remove={remove} busy={busy} categoryOptions={categoryOptions}/>
        </div>}
      </section>
    </div>
  </main>;
}

function Dashboard({stats}:{stats:Record<string,any>}){
  return <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-5">{[['Products',stats.products],['Cases',stats.cases],['Blogs',stats.blog],['Uploaded media',stats.media],['Last update',String(stats.updated).slice(0,10)]].map(([label,value])=><article className="rounded-3xl bg-white p-6 shadow-sm" key={label}><p className="text-sm font-bold text-gray-500">{label}</p><b className="mt-3 block text-3xl font-black">{value}</b></article>)}</div>;
}

function Editor({active,draft,setDraft,save,remove,busy,categoryOptions}:{active:ModuleKey;draft:Item|null;setDraft:(item:Item|null)=>void;save:(itemToSave?:Item|null,successMessage?:string)=>Promise<void>;remove:(item:Item)=>void;busy:boolean;categoryOptions:{value:string;label:string;subCategory:string}[]}){
  if(!draft)return <div className="rounded-3xl bg-white p-8 text-gray-500 shadow-sm">Select an item or click Add New.</div>;
  return <div className="rounded-3xl bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between"><h2 className="text-2xl font-black">{draft.id?'Edit':'Add New'}</h2>{draft.id&&<button onClick={()=>remove(draft)} className="rounded-full p-3 text-red-600 hover:bg-red-50"><Trash2/></button>}</div>
    {active==='products'&&<ProductFields draft={draft} setDraft={setDraft} save={save} categoryOptions={categoryOptions}/>}
    {active==='productCategories'&&<CategoryFields draft={draft} setDraft={setDraft}/>}
    {active==='cases'&&<GenericFields draft={draft} setDraft={setDraft} fields={['title','country','customerIndustry','machineModel','quantity','year','description','images','video','status']}/>}
    {active==='factory'&&<GenericFields draft={draft} setDraft={setDraft} fields={['title','category','description','images','video','status']}/>}
    {active==='shipping'&&<GenericFields draft={draft} setDraft={setDraft} fields={['title','destinationCountry','destinationPort','machineModel','shippingMethod','shippingDate','description','images','video','status']}/>}
    {active==='blog'&&<GenericFields draft={draft} setDraft={setDraft} fields={['title','slug','coverImage','content','seoTitle','seoDescription','status','createdDate']}/>}
    {active==='media'&&<MediaFields draft={draft} setDraft={setDraft}/>}
    {active==='inquiries'&&<GenericFields draft={draft} setDraft={setDraft} fields={['status','name','company','country','port','phone','email','productModel','quantity','message','createdAt']}/>}
    <div className="mt-7 flex justify-end"><button onClick={()=>void save()} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3 font-black text-white disabled:opacity-50">{busy?<LoaderCircle className="animate-spin" size={18}/>:<Save size={18}/>}Save & Publish</button></div>
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
    if(next.id)await save(next,next.status==='Draft'?'Photo attached and saved. This product remains a Draft.':'Photo attached, saved and visible on the storefront.');
  }
  function completeProductBasics(){
    const brand=String(draft.brand||'XCMG').trim()||'XCMG';
    const model=String(draft.model||'').trim();
    if(!model)return;
    const slug=`${brand}-${model}`.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    setDraft({...draft,brand,name:String(draft.name||'').trim()||`${brand} ${model}`,slug:String(draft.slug||'').trim()||slug});
  }
  return <div className="mt-6 space-y-7">
    <section><div className="flex items-center justify-between gap-3"><p className="text-sm font-black">1. Choose product category</p><p className="text-xs text-gray-500">Manage categories from Product Categories.</p></div><div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">{categoryOptions.map(option=><button type="button" key={option.value} onClick={()=>chooseCategory(option)} className={`rounded-xl border p-3 text-left text-sm font-black transition ${draft.category===option.value?'border-ink bg-lime text-ink':'border-black/10 hover:border-black/40'}`}>{option.label}</button>)}</div><p className="mt-2 text-xs text-gray-500">Selected: <b>{categoryOptions.find(option=>option.value===draft.category)?.label||'Choose a category'}</b>. This controls the storefront page.</p></section>
    <section className="grid gap-4 md:grid-cols-2"><Input field="model" draft={draft} setDraft={setDraft}/><Input field="brand" draft={draft} setDraft={setDraft}/><div className="md:col-span-2 -mt-1"><button type="button" onClick={completeProductBasics} disabled={!String(draft.model||'').trim()} className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-black transition hover:border-ink disabled:cursor-not-allowed disabled:opacity-40">Use brand + model for product name and page link</button><p className="mt-2 text-xs text-gray-500">A quick shortcut for new products. You can still edit the product name and slug below.</p></div><Input field="name" draft={draft} setDraft={setDraft}/><Select field="status" options={statuses} draft={draft} setDraft={setDraft}/><Input field="shortDescription" draft={draft} setDraft={setDraft} textarea/><Input field="description" draft={draft} setDraft={setDraft} textarea/></section>
    <section className="rounded-2xl bg-sand p-4"><p className="font-black">2. Product photos</p><div className="mt-3 flex flex-wrap items-start gap-4">{draft.image&&<img src={draft.image} alt="Product preview" className="size-28 rounded-xl border border-black/10 bg-white object-contain p-1"/>}<div><MediaUpload onUploaded={attachUploadedMedia}/><p className="mt-2 max-w-md text-xs leading-5 text-gray-500">Upload JPG, PNG or WebP. Existing published products save the new photo automatically. For a new product, click Save & Publish after entering the model.</p></div></div><ArrayField field="images" draft={draft} setDraft={setDraft}/></section>
    <details className="rounded-2xl border border-black/10 p-4"><summary className="cursor-pointer font-black">Specifications, price and SEO (optional)</summary><div className="mt-5 grid gap-4 md:grid-cols-2">{['engine','operatingWeight','bucketCapacity','ratedPower','dimension','fobPrice','moq','deliveryTime','seaFreight','destinationPort','cifPrice','deposit30','balance70','validity','video','pdfBrochure','slug','seoTitle','seoDescription'].map(field=><Input key={field} field={field} draft={draft} setDraft={setDraft} textarea={['seoDescription'].includes(field)}/>)}<Input field="specifications" draft={draft} setDraft={setDraft} textarea/></div></details>
  </div>;
}

function CategoryFields({draft,setDraft}:{draft:Item;setDraft:(item:Item)=>void}){
  return <div className="mt-6 space-y-4"><p className="rounded-xl bg-sand p-4 text-sm text-gray-600">Add a category once and it will appear in the product editor. Category ID cannot be changed after saving, so existing products remain correctly grouped.</p>{!draft.id?<Input field="id" draft={draft} setDraft={setDraft}/>:<p className="text-sm font-bold">Category ID: <span className="font-mono text-gray-500">{draft.id}</span></p>}<Input field="label" draft={draft} setDraft={setDraft}/><Input field="subCategory" draft={draft} setDraft={setDraft}/></div>;
}

function GenericFields({draft,setDraft,fields}:{draft:Item;setDraft:(item:Item)=>void;fields:string[]}){
  return <div className="mt-6 grid gap-4 md:grid-cols-2">{fields.map(field=>field==='status'?<Select key={field} field={field} options={field==='status'&&draft.email?inquiryStatuses:statuses} draft={draft} setDraft={setDraft}/>:field==='images'?<><ArrayField key={field} field={field} draft={draft} setDraft={setDraft}/><MediaUpload onUploaded={urls=>setDraft({...draft,images:[...(draft.images||[]),...urls]})}/></>:<Input key={field} field={field} draft={draft} setDraft={setDraft} textarea={['description','content','message'].includes(field)}/>)}</div>;
}

function MediaFields({draft,setDraft}:{draft:Item;setDraft:(item:Item)=>void}){
  return <div className="mt-6 grid gap-4 md:grid-cols-2"><Input field="title" draft={draft} setDraft={setDraft}/><Input field="category" draft={draft} setDraft={setDraft}/><Input field="url" draft={draft} setDraft={setDraft}/><Select field="status" options={statuses} draft={draft} setDraft={setDraft}/><MediaUpload onUploaded={urls=>setDraft({...draft,url:urls[0],src:urls[0]})}/>{draft.url&&<a href={draft.url} target="_blank" className="rounded-xl border border-black/10 px-4 py-3 font-bold">Open / copy: {draft.url}</a>}</div>;
}

function Input({field,draft,setDraft,textarea=false}:{field:string;draft:Item;setDraft:(item:Item)=>void;textarea?:boolean}){
  const label=field.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase());
  const value=Array.isArray(draft[field])?draft[field].join('\n'):String(draft[field]??'');
  const props={value,onChange:(e:any)=>setDraft({...draft,[field]:e.target.value}),className:'mt-2 w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black'};
  return <label className={`text-sm font-bold ${textarea?'md:col-span-2':''}`}>{label}{textarea?<textarea rows={field==='content'?10:4} {...props}/>:<input {...props}/>}</label>;
}
function ArrayField({field,draft,setDraft}:{field:string;draft:Item;setDraft:(item:Item)=>void}){
  return <label className="text-sm font-bold md:col-span-2">{field} <span className="font-normal text-gray-400">(one URL per line)</span><textarea value={(draft[field]||[]).join('\n')} onChange={e=>setDraft({...draft,[field]:e.target.value.split('\n').map(v=>v.trim()).filter(Boolean)})} rows={4} className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 outline-none focus:border-black"/></label>;
}
function Select({field,options,draft,setDraft}:{field:string;options:string[];draft:Item;setDraft:(item:Item)=>void}){
  return <label className="text-sm font-bold">{field.replace(/([A-Z])/g,' $1')}<select value={draft[field]||options[0]} onChange={e=>setDraft({...draft,[field]:e.target.value})} className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3">{options.map(item=><option key={item}>{item}</option>)}</select></label>;
}
function MediaUpload({onUploaded}:{onUploaded:(urls:string[])=>void}){
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[note,setNote]=useState('');
  async function upload(files:FileList|null){
    if(!files?.length)return;
    setBusy(true);setError('');setNote('Preparing files...');
    const controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),120000);
    try{
      const prepared=await Promise.all([...files].map(prepareUploadFile));
      const form=new FormData();
      prepared.forEach(file=>form.append('files',file));
      form.append('folder','admin');
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
    <label className={`inline-flex items-center justify-center gap-2 rounded-xl border border-black/15 px-4 py-3 font-black ${busy?'cursor-wait opacity-70':'cursor-pointer hover:border-black'}`}><Upload size={18}/>{busy?'Uploading...':'Upload'}<input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,application/pdf" className="hidden" disabled={busy} onChange={e=>{void upload(e.target.files);e.currentTarget.value='';}}/></label>
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
