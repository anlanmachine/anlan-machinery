'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {BarChart3,Edit3,Eye,FileText,FolderOpen,ImagePlus,Inbox,LayoutDashboard,LoaderCircle,LogOut,Package,Plus,Save,Search,Ship,Trash2,Upload} from 'lucide-react';

type Item=Record<string,any>;
type ModuleKey='dashboard'|'products'|'cases'|'factory'|'shipping'|'blog'|'media'|'inquiries';
const modules:{key:ModuleKey;label:string;icon:any}[]=[
  {key:'dashboard',label:'Dashboard',icon:LayoutDashboard},{key:'products',label:'Products',icon:Package},{key:'cases',label:'Cases',icon:FolderOpen},{key:'factory',label:'Factory',icon:BarChart3},{key:'shipping',label:'Shipping',icon:Ship},{key:'blog',label:'Blog',icon:FileText},{key:'media',label:'Media Library',icon:ImagePlus},{key:'inquiries',label:'Inquiries',icon:Inbox}
];
const collections=modules.filter(item=>item.key!=='dashboard').map(item=>item.key);
const productCategories=['Excavator','Loader','Backhoe Loader','Road Roller','Forklift','Dump Truck','Motor Grader','Crane','Concrete Mixer'];
const statuses=['Published','Draft'];
const inquiryStatuses=['New','Contacted','Quoted','PI Sent','Deal','Lost'];
const emptyProduct={brand:'XCMG',model:'',category:'Excavator',name:'',shortDescription:'',description:'',specifications:'',engine:'',operatingWeight:'',bucketCapacity:'',ratedPower:'',dimension:'',fobPrice:'',moq:'1 unit',deliveryTime:'15-30 days',seaFreight:'',destinationPort:'',cifPrice:'',deposit30:'',balance70:'',validity:'15 days',image:'',images:[],video:'',pdfBrochure:'',seoTitle:'',seoDescription:'',slug:'',status:'Published'};
const emptyByModule:Record<string,Item>={
  products:emptyProduct,
  cases:{title:'',country:'',customerIndustry:'',machineModel:'',quantity:'',year:new Date().getFullYear(),description:'',images:[],video:'',status:'Published'},
  factory:{title:'',description:'',images:[],video:'',category:'Workshop',status:'Published'},
  shipping:{title:'',destinationCountry:'',destinationPort:'',machineModel:'',shippingMethod:'Container',description:'',images:[],video:'',shippingDate:'',status:'Published'},
  blog:{title:'',slug:'',coverImage:'',content:'',seoTitle:'',seoDescription:'',status:'Published',createdDate:new Date().toISOString().slice(0,10)},
  media:{title:'',type:'image',url:'',category:'general',status:'Published'},
  inquiries:{status:'New'}
};

export function AdminDashboard(){
  const [active,setActive]=useState<ModuleKey>('dashboard'),[data,setData]=useState<Record<string,Item[]>>({}),[draft,setDraft]=useState<Item|null>(null),[query,setQuery]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  useEffect(()=>{void loadAll();},[]);
  async function loadAll(){
    setBusy(true);
    const entries=await Promise.all(collections.map(async key=>[key,await fetch(`/api/admin/collections/${key}`,{cache:'no-store'}).then(r=>r.ok?r.json():[])] as const));
    setData(Object.fromEntries(entries));setBusy(false);
  }
  const items=data[active]||[];
  const filtered=useMemo(()=>items.filter(item=>JSON.stringify(item).toLowerCase().includes(query.toLowerCase())),[items,query]);
  const stats={products:(data.products||[]).length,cases:(data.cases||[]).length,blog:(data.blog||[]).length,media:(data.media||[]).length,updated:[...Object.values(data).flat()].map(item=>item.updatedAt||item.createdAt).filter(Boolean).sort().pop()||'Not yet'};
  async function save(){
    if(!draft||active==='dashboard')return;
    setBusy(true);setMessage('');
    const method=draft.id?'PUT':'POST';
    const response=await fetch(`/api/admin/collections/${active}`,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});
    const result=await response.json();
    setBusy(false);
    if(!response.ok){setMessage(result.error||'Save failed.');return;}
    setDraft(result.item);setMessage('Saved successfully.');await loadAll();
  }
  async function remove(item:Item){
    if(active==='dashboard'||!confirm('Delete this item?'))return;
    setBusy(true);
    await fetch(`/api/admin/collections/${active}?id=${encodeURIComponent(item.id)}`,{method:'DELETE'});
    setDraft(null);await loadAll();setBusy(false);setMessage('Deleted.');
  }
  async function logout(){await fetch('/api/admin/auth',{method:'DELETE'});location.href='/admin/login';}
  return <main className="min-h-screen bg-[#f3f5f2] pt-20">
    <div className="mx-auto grid max-w-[1600px] gap-5 px-4 py-6 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-3xl bg-ink p-4 text-white lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">
        <div className="px-3 py-4"><b className="text-xl">ANLAN Admin</b><p className="mt-1 text-xs text-white/50">Content management</p></div>
        <nav className="mt-3 space-y-1">{modules.map(item=>{const Icon=item.icon;return <button key={item.key} onClick={()=>{setActive(item.key);setDraft(null);setMessage('');}} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold ${active===item.key?'bg-lime text-ink':'text-white/75 hover:bg-white/10'}`}><Icon size={18}/>{item.label}</button>})}</nav>
        <div className="mt-6 space-y-2 px-3"><Link href="/" target="_blank" className="flex items-center gap-2 text-sm font-bold text-white/70"><Eye size={16}/>Preview website</Link><button onClick={logout} className="flex items-center gap-2 text-sm font-bold text-white/70"><LogOut size={16}/>Logout</button></div>
      </aside>
      <section className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm">
          <div><p className="eyebrow">Admin panel</p><h1 className="mt-2 text-3xl font-black">{modules.find(item=>item.key===active)?.label}</h1><p className="mt-1 text-sm text-gray-500">Edit content, upload media, publish to storefront.</p></div>
          {active!=='dashboard'&&active!=='inquiries'&&<button onClick={()=>setDraft({...emptyByModule[active]})} className="inline-flex items-center gap-2 rounded-full bg-lime px-5 py-3 font-black"><Plus size={18}/>Add New</button>}
        </div>
        {message&&<p className="mt-4 rounded-2xl bg-amber-50 px-5 py-3 text-sm font-bold text-amber-800">{message}</p>}
        {active==='dashboard'?<Dashboard stats={stats}/>:<div className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="relative"><Search className="absolute left-3 top-3.5 text-gray-400" size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search model, title, country, category..." className="w-full rounded-xl border border-black/10 py-3 pl-10 pr-4 outline-none focus:border-black"/></div>
            <div className="mt-4 max-h-[70vh] overflow-auto rounded-2xl border border-black/5">{busy&&!filtered.length?<p className="p-5 text-gray-500">Loading...</p>:filtered.map(item=><button key={item.id||item.url||JSON.stringify(item).slice(0,30)} onClick={()=>setDraft({...item})} className={`flex w-full items-center justify-between gap-4 border-b border-black/5 p-4 text-left hover:bg-gray-50 ${draft?.id===item.id?'bg-lime/30':''}`}><span><b className="block">{item.model||item.title||item.name||item.email||'Untitled'}</b><small className="text-gray-500">{item.category||item.country||item.destinationCountry||item.status||item.type}</small></span><Edit3 size={16}/></button>)}</div>
          </div>
          <Editor active={active} draft={draft} setDraft={setDraft} save={save} remove={remove} busy={busy}/>
        </div>}
      </section>
    </div>
  </main>;
}

function Dashboard({stats}:{stats:Record<string,any>}){
  return <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-5">{[['Products',stats.products],['Cases',stats.cases],['Blogs',stats.blog],['Uploaded media',stats.media],['Last update',String(stats.updated).slice(0,10)]].map(([label,value])=><article className="rounded-3xl bg-white p-6 shadow-sm" key={label}><p className="text-sm font-bold text-gray-500">{label}</p><b className="mt-3 block text-3xl font-black">{value}</b></article>)}</div>;
}

function Editor({active,draft,setDraft,save,remove,busy}:{active:ModuleKey;draft:Item|null;setDraft:(item:Item|null)=>void;save:()=>void;remove:(item:Item)=>void;busy:boolean}){
  if(!draft)return <div className="rounded-3xl bg-white p-8 text-gray-500 shadow-sm">Select an item or click Add New.</div>;
  return <div className="rounded-3xl bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between"><h2 className="text-2xl font-black">{draft.id?'Edit':'Add New'}</h2>{draft.id&&<button onClick={()=>remove(draft)} className="rounded-full p-3 text-red-600 hover:bg-red-50"><Trash2/></button>}</div>
    {active==='products'&&<ProductFields draft={draft} setDraft={setDraft}/>}
    {active==='cases'&&<GenericFields draft={draft} setDraft={setDraft} fields={['title','country','customerIndustry','machineModel','quantity','year','description','images','video','status']}/>}
    {active==='factory'&&<GenericFields draft={draft} setDraft={setDraft} fields={['title','category','description','images','video','status']}/>}
    {active==='shipping'&&<GenericFields draft={draft} setDraft={setDraft} fields={['title','destinationCountry','destinationPort','machineModel','shippingMethod','shippingDate','description','images','video','status']}/>}
    {active==='blog'&&<GenericFields draft={draft} setDraft={setDraft} fields={['title','slug','coverImage','content','seoTitle','seoDescription','status','createdDate']}/>}
    {active==='media'&&<MediaFields draft={draft} setDraft={setDraft}/>}
    {active==='inquiries'&&<GenericFields draft={draft} setDraft={setDraft} fields={['status','name','company','country','port','phone','email','productModel','quantity','message','createdAt']}/>}
    <div className="mt-7 flex justify-end"><button onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3 font-black text-white disabled:opacity-50">{busy?<LoaderCircle className="animate-spin" size={18}/>:<Save size={18}/>}Save</button></div>
  </div>;
}

function ProductFields({draft,setDraft}:{draft:Item;setDraft:(item:Item)=>void}){
  return <div className="mt-6 grid gap-4 md:grid-cols-2">
    {['brand','model','name','slug','shortDescription','description','engine','operatingWeight','bucketCapacity','ratedPower','dimension','fobPrice','moq','deliveryTime','seaFreight','destinationPort','cifPrice','deposit30','balance70','validity','video','pdfBrochure','seoTitle','seoDescription'].map(field=><Input key={field} field={field} draft={draft} setDraft={setDraft} textarea={['description','shortDescription','seoDescription'].includes(field)}/>)}
    <Select field="category" options={productCategories} draft={draft} setDraft={setDraft}/><Select field="status" options={statuses} draft={draft} setDraft={setDraft}/>
    <Input field="image" draft={draft} setDraft={setDraft}/><MediaUpload onUploaded={urls=>setDraft({...draft,image:draft.image||urls[0],images:[...(draft.images||[]),...urls]})}/>
    <ArrayField field="images" draft={draft} setDraft={setDraft}/><Input field="specifications" draft={draft} setDraft={setDraft} textarea/>
  </div>;
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
  const [busy,setBusy]=useState(false);
  async function upload(files:FileList|null){
    if(!files?.length)return;setBusy(true);
    const form=new FormData();[...files].forEach(file=>form.append('files',file));form.append('folder','admin');
    const result=await fetch('/api/admin/upload',{method:'POST',body:form}).then(r=>r.json());
    setBusy(false);if(result.assets)onUploaded(result.assets.map((item:Item)=>item.url));
  }
  return <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-black/15 px-4 py-3 font-black hover:border-black"><Upload size={18}/>{busy?'Uploading...':'Upload'}<input type="file" multiple accept="image/*,video/mp4,application/pdf" className="hidden" onChange={e=>upload(e.target.files)}/></label>;
}
