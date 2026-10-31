'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {adminRequest} from '../shared/api';
import {useAdminLanguage} from '../layout/admin-shell';
type Item=Record<string,any>;
export function AdminOverview(){
  const {t}=useAdminLanguage();
  const [data,setData]=useState<Record<string,Item[]>>({}),[errors,setErrors]=useState<Record<string,string>>({}),[loading,setLoading]=useState(true);
  async function load(){setLoading(true);setErrors({});await Promise.all(['products','inquiries','cases','shipments'].map(async key=>{
    try{const result=await adminRequest<any>(key==='shipments'?'/api/admin/tracking':`/api/admin/collections/${key}`);setData(old=>({...old,[key]:key==='shipments'?result.shipments:result}));}
    catch(e){setErrors(old=>({...old,[key]:e instanceof Error?e.message:'Request failed'}));}
  }));setLoading(false);}
  useEffect(()=>{void load();},[]);
  const stats=[['products','商品总数','Products',data.products?.length],['products','已发布','Published',data.products?.filter(p=>p.status==='Published').length],['products','草稿','Draft',data.products?.filter(p=>p.status==='Draft').length],['inquiries','待处理询盘','New inquiries',data.inquiries?.filter(p=>p.status==='New').length],['cases','客户案例','Cases',data.cases?.filter(p=>!p.isDefaultMedia).length],['shipments','追踪记录','Shipments',data.shipments?.length]];
  return <div className="space-y-6"><p className="text-sm text-gray-500">{t('实际数据总览；读取失败不会显示为零。','Live data. Failed requests are not shown as zero.')}</p><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{stats.map(([key,zh,en,count])=><article className="rounded-xl border bg-white p-6" key={String(en)}><h2>{t(String(zh),String(en))}</h2>{errors[String(key)]?<div role="alert" className="mt-4 text-sm text-red-700"><p>{errors[String(key)]}</p><button onClick={()=>void load()} className="mt-2 underline">{t('加载失败，点击重试','Failed to load. Retry')}</button></div>:<p className="mt-4 text-3xl font-bold">{loading?'—':count??0}</p>}</article>)}</div>
    <section className="rounded-xl border bg-white p-6"><h2 className="mb-4 font-bold">{t('快捷操作','Quick actions')}</h2><div className="flex flex-wrap gap-3">{[['products/new','添加商品','Add product'],['media','上传素材','Upload media'],['cases','新增案例','Add case'],['inquiries','查看询盘','View inquiries'],['tracking','更新追踪','Update tracking'],['backups','数据备份','Backups']].map(([route,zh,en])=><Link className="rounded-lg border px-4 py-3 hover:bg-lime" key={route} href={'/admin/'+route}>{t(zh,en)}</Link>)}</div></section>
  </div>;
}
