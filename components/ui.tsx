'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {MessageCircle,X,Send,Menu,ChevronDown,Mail} from 'lucide-react';
import {COMPANY_EMAIL,COMPANY_EMAIL_LINK,wa} from '@/lib/data';
import {CATEGORY_LINKS} from '@/lib/catalog-config';

export function EmailLink({className=''}:{className?:string}){
  return <a className={className} href={COMPANY_EMAIL_LINK}>Email: {COMPANY_EMAIL}</a>;
}

export function WhatsApp({label='WhatsApp us',className=''}:{label?:string;className?:string}){
  return <a className={`inline-flex items-center justify-center gap-2 rounded-full bg-lime px-5 py-3 font-bold text-ink transition hover:scale-[1.02] ${className}`} href={wa()} target="_blank" rel="noopener"><MessageCircle size={18}/>{label}</a>;
}

const main=[['About','/about'],['Factory','/factory'],['Cases','/case-studies'],['Shipping','/shipping'],['Blog','/blog']];
const resources=[['Media Center','/media'],['Gallery','/gallery'],['Downloads','/downloads']];

export function Header(){
  const [open,setOpen]=useState(false);
  return <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink/95 text-white backdrop-blur">
    <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
      <Link href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-lime font-black text-ink">AM</span><span className="text-lg font-extrabold tracking-tight">ANLAN <span className="text-lime">MACHINERY</span></span></Link>
      <nav className="hidden items-center gap-5 text-sm font-semibold xl:flex"><Dropdown label="Products" href="/products/excavator" links={CATEGORY_LINKS.map(item=>[item.label,`/products/${item.path}`])}/>{main.map(([name,href])=><Link key={name} href={href} className="hover:text-lime">{name}</Link>)}<Dropdown label="Resources" href="/media" links={resources}/></nav>
      <div className="hidden xl:block"><WhatsApp label="Get a quote"/></div>
      <button onClick={()=>setOpen(!open)} className="xl:hidden" aria-label="Menu">{open?<X/>:<Menu/>}</button>
    </div>
    {open&&<nav className="max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-white/10 bg-ink p-5 xl:hidden">
      <p className="pb-2 text-xs font-black uppercase tracking-widest text-lime">Products</p>
      {CATEGORY_LINKS.map(item=><Link onClick={()=>setOpen(false)} key={item.key} href={`/products/${item.path}`} className="block border-b border-white/10 py-3 pl-3">{item.label}</Link>)}
      {[...main,...resources].map(([name,href])=><Link onClick={()=>setOpen(false)} key={name} href={href} className="block border-b border-white/10 py-3">{name}</Link>)}
      <div className="mt-5 grid gap-3"><WhatsApp className="w-full"/><EmailLink className="text-center text-sm font-bold text-white/80"/></div>
    </nav>}
  </header>;
}

function Dropdown({label,href,links}:{label:string;href:string;links:string[][]}){
  return <div className="group relative py-7"><Link href={href} className="flex items-center gap-1 hover:text-lime">{label}<ChevronDown size={14}/></Link><div className="invisible absolute left-0 top-[72px] w-64 translate-y-2 rounded-2xl bg-white p-2 text-ink opacity-0 shadow-2xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">{links.map(([name,url])=><Link key={name} href={url} className="block rounded-xl px-4 py-3 hover:bg-lime">{name}</Link>)}</div></div>;
}

export function Footer(){
  return <footer className="bg-ink text-white"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-4"><div className="md:col-span-2"><div className="text-2xl font-black">ANLAN <span className="text-lime">MACHINERY</span></div><p className="mt-4 max-w-md text-white/60">Professional construction machinery sourcing, inspection and global shipping support from China to your project.</p></div><div><h3 className="font-bold">Explore</h3>{[['Products','/products'],['About','/about'],['Factory','/factory'],['Cases','/case-studies'],['Shipping','/shipping'],['Media','/media'],['Gallery','/gallery'],['Downloads','/downloads']].map(([name,href])=><Link className="mt-3 block text-sm text-white/60 hover:text-lime" href={href} key={name}>{name}</Link>)}</div><div><h3 className="font-bold">Contact</h3><p className="mt-3 text-sm leading-7 text-white/60">Chris Gao<br/>WhatsApp: +86 187 1546 7045<br/><EmailLink className="hover:text-lime"/><br/>Global export service</p></div></div><div className="border-t border-white/10 px-5 py-6 text-center text-xs text-white/40">(c) 2026 ANLAN Machinery | <Link href="/privacy-policy">Privacy</Link> | <Link href="/terms">Terms</Link></div></footer>;
}

export function LeadForm({compact=false}:{compact?:boolean}){
  const [sent,setSent]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    await fetch('/api/leads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.fromEntries(form))});
    setSent(true);
    window.open(wa(`Hi, I want a quotation for ${form.get('machine')||'machinery'}. Destination: ${form.get('country')||'Not specified'}. Please send price, specs, and shipping details.`),'_blank');
  }
  if(sent)return <div className="rounded-2xl bg-lime/15 p-6 font-bold text-ink">Thank you - opening WhatsApp so we can reply faster. You can also email us: <EmailLink className="underline"/></div>;
  return <form onSubmit={submit} className={`grid gap-3 ${compact?'':'rounded-3xl bg-white p-6 shadow-xl'}`}><input required name="name" placeholder="Your name" className="field"/><input required type="email" name="email" placeholder="Business email" className="field"/><div className="grid grid-cols-2 gap-3"><input name="country" placeholder="Destination" className="field"/><input name="machine" placeholder="Machine / model" className="field"/></div><textarea name="message" placeholder="Quantity, delivery port, required date..." className="field min-h-24"/><input name="website" tabIndex={-1} autoComplete="off" className="hidden"/><button className="flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-4 font-bold text-white hover:bg-lime hover:text-ink"><Send size={18}/>Request quotation</button><div className="flex flex-col items-center gap-1 text-center text-xs text-gray-500 sm:flex-row sm:justify-center"><span>Typical response within 30 minutes during business hours.</span><span className="hidden sm:inline">|</span><EmailLink className="font-bold text-ink hover:text-[#789400]"/></div></form>;
}

export function ContactActions({quoteText='Get a quote',emailClassName=''}:{quoteText?:string;emailClassName?:string}){
  return <div className="flex flex-wrap items-center gap-3"><WhatsApp label={quoteText}/><a href={COMPANY_EMAIL_LINK} className={`inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-5 py-3 font-bold text-ink hover:border-ink ${emailClassName}`}><Mail size={18}/>Email: {COMPANY_EMAIL}</a></div>;
}

export function FloatingWA(){
  return <a aria-label="WhatsApp" href={wa()} target="_blank" rel="noopener" className="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-2xl transition hover:scale-110"><MessageCircle/></a>;
}

export function ExitPopup(){
  const [show,setShow]=useState(false);
  useEffect(()=>{const seen=sessionStorage.getItem('quote-popup');const listener=(event:MouseEvent)=>{if(event.clientY<8&&!seen){setShow(true);sessionStorage.setItem('quote-popup','1')}};document.addEventListener('mouseout',listener);return()=>document.removeEventListener('mouseout',listener)},[]);
  if(!show)return null;
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4"><div className="relative max-w-lg rounded-3xl bg-sand p-7"><button onClick={()=>setShow(false)} className="absolute right-5 top-5" aria-label="Close"><X/></button><p className="eyebrow">Before you go</p><h2 className="mt-2 text-3xl font-black">Get today's machine and freight quote</h2><p className="my-5 text-gray-600">Tell us your destination and preferred machine. We will reply with available options.</p><div className="mb-5"><EmailLink className="font-bold text-ink underline"/></div><LeadForm compact/></div></div>;
}
