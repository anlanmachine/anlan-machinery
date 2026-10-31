'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {createContext,useContext,useEffect,useState} from 'react';
import {Menu,X,LogOut,ExternalLink} from 'lucide-react';

const Language=createContext({english:false,t:(zh:string,en:string)=>zh,setEnglish:(_value:boolean)=>{}});
export const useAdminLanguage=()=>useContext(Language);
const groups:readonly (readonly [string,string,readonly (readonly [string,string,string])[]])[]=[
  ['工作台','Workspace',[['dashboard','数据总览','Overview'],['inquiries','客户询盘','Inquiries']]],
  ['商品管理','Products',[['products','全部商品','All products'],['products/new','添加商品','Add product'],['categories','商品分类','Categories'],['products/trash','商品回收站','Trash']]],
  ['网站内容','Content',[['home','首页内容','Homepage'],['factory','工厂展示','Factory'],['cases','客户案例','Customer cases'],['media','图片与视频','Media library'],['blog','博客文章','Blog']]],
  ['物流管理','Logistics',[['tracking','货物追踪','Tracking'],['shipping','运输案例','Shipping']]],
  ['系统管理','System',[['backups','数据备份','Backups'],['health','商品健康检查','Catalog health'],['settings','管理员设置','Settings']]]
] as const;
export function AdminShell({children}:{children:React.ReactNode}){
  const pathname=usePathname();
  const [english,setEnglish]=useState(false),[open,setOpen]=useState(false);
  useEffect(()=>{setEnglish(localStorage.getItem('aolan-admin-language')==='en');sessionStorage.removeItem('aolan-admin-password');},[]);
  const t=(zh:string,en:string)=>english?en:zh;
  function language(value:boolean){setEnglish(value);localStorage.setItem('aolan-admin-language',value?'en':'zh');}
  if(pathname==='/admin/login')return children;
  const selected=groups.flatMap(group=>group[2]).find(item=>pathname==='/admin/'+item[0]);
  return <Language.Provider value={{english,t,setEnglish:language}}><div lang={english?'en':'zh-CN'} className="admin-v3 min-h-screen bg-[#f4f6f5] text-[#16352a]">
    {open&&<button aria-label={t('关闭导航','Close navigation')} onClick={()=>setOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden"/>}
    <aside className={`fixed inset-y-0 left-0 z-50 w-60 overflow-y-auto bg-[#123b2f] p-4 text-white transition-transform lg:translate-x-0 ${open?'translate-x-0':'-translate-x-full'}`}>
      <div className="mb-6 flex items-center justify-between px-3 py-4"><Link href="/admin/dashboard" className="font-black tracking-wide">AOLAN <span className="text-lime">ADMIN</span></Link><button aria-label={t('关闭','Close')} className="lg:hidden" onClick={()=>setOpen(false)}><X/></button></div>
      {groups.map(([zh,en,items])=><nav aria-label={t(zh,en)} key={en} className="mb-5"><p className="mb-2 px-3 text-xs text-white/50">{t(zh,en)}</p>{items.map(([route,cn,label])=><Link onClick={()=>setOpen(false)} aria-current={pathname==='/admin/'+route?'page':undefined} key={route} href={'/admin/'+route} className={`mb-1 block rounded-lg px-3 py-2.5 text-sm font-semibold ${pathname==='/admin/'+route?'bg-lime text-[#123b2f]':'text-white/80 hover:bg-white/10'}`}>{t(cn,label)}</Link>)}</nav>)}
    </aside>
    <div className="min-w-0 lg:pl-60"><header className="sticky top-0 z-30 flex flex-wrap items-center gap-4 border-b bg-white px-4 py-4 md:px-8">
      <button aria-label={t('打开导航','Open navigation')} aria-expanded={open} onClick={()=>setOpen(true)} className="lg:hidden"><Menu/></button><h1 className="mr-auto text-xl font-bold">{selected?t(selected[1],selected[2]):t('商品编辑','Product editor')}</h1>
      <button onClick={()=>language(!english)} className="rounded-lg border px-3 py-2 text-sm">{english?'中文':'English'}</button>
      <Link href="/" target="_blank" className="rounded-lg border p-2" aria-label={t('查看网站','View website')}><ExternalLink size={18}/></Link>
      <button aria-label={t('退出登录','Sign out')} onClick={async()=>{const r=await fetch('/api/admin/auth',{method:'DELETE'});if(r.ok)location.href='/admin/login';else alert(t('退出失败，请重试','Sign out failed. Retry.'));}} className="rounded-lg border p-2"><LogOut size={18}/></button>
    </header><div className="mx-auto max-w-[1500px] p-4 pb-28 md:p-8">{children}</div></div>
  </div></Language.Provider>;
}
