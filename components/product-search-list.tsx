'use client';

import Image from 'next/image';
import Link from 'next/link';
import {Mail,MessageCircle,Search,X} from 'lucide-react';
import {useMemo,useState} from 'react';
import {COMPANY_EMAIL,COMPANY_EMAIL_LINK,wa} from '@/lib/data';

export type ProductSearchCard={
  id:string;
  brand:string;
  name:string;
  model:string;
  category:string;
  subCategory:string;
  subCategoryLabel:string;
  image:string;
  href:string;
  description:string;
  specs:Array<[string,string]>;
};

export function ProductSearchList({products,emptyMessage,searchLabel='Search machinery',searchPlaceholder='Search by model, name, category, engine, weight...'}:{products:ProductSearchCard[];emptyMessage?:string;searchLabel?:string;searchPlaceholder?:string}){
  const [query,setQuery]=useState('');
  const normalizedQuery=query.trim().toLowerCase();
  const visible=useMemo(()=>products.filter(product=>{
    if(!normalizedQuery)return true;
    const haystack=[
      product.brand,
      product.name,
      product.model,
      product.category,
      product.subCategory,
      product.subCategoryLabel,
      product.description,
      ...product.specs.flat()
    ].join(' ').toLowerCase();
    return haystack.includes(normalizedQuery);
  }),[products,normalizedQuery]);

  if(products.length===0){
    return <div className="mt-12 rounded-3xl border border-dashed border-black/15 bg-white p-8 text-center shadow-sm">
      <h2 className="text-2xl font-black">Available on request</h2>
      <p className="mx-auto mt-3 max-w-2xl text-gray-500">{emptyMessage||'This category is available through ANLAN Machinery sourcing service. Send us your model, quantity and destination port for a fast quotation.'}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3"><a href={wa('Hi, I want a quotation for construction machinery. Please send available models, price, specs, and shipping details.')} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-bold text-white"><MessageCircle size={17}/>Request Quote</a><a href={COMPANY_EMAIL_LINK} className="inline-flex items-center gap-2 rounded-full border border-black/15 px-6 py-3 font-bold"><Mail size={17}/>Email: {COMPANY_EMAIL}</a></div>
    </div>;
  }

  return <div className="mt-12">
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#789400]">{searchLabel}</p>
          <p className="mt-1 text-sm text-gray-500">Showing {visible.length} of {products.length} machines</p>
        </div>
        <label className="relative block w-full md:max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={19}/>
          <input value={query} onChange={event=>setQuery(event.target.value)} placeholder={searchPlaceholder} className="w-full rounded-full border border-black/10 bg-gray-50 py-3 pl-12 pr-12 text-sm font-semibold outline-none transition focus:border-black focus:bg-white"/>
          {query&&<button type="button" onClick={()=>setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-ink"><X size={16}/></button>}
        </label>
      </div>
    </div>

    {visible.length===0?<div className="mt-6 rounded-3xl border border-dashed border-black/15 bg-white p-8 text-center">
      <h2 className="text-2xl font-black">No matching machine found</h2>
      <p className="mt-3 text-gray-500">Try another model number like XE215G, ZL50GN, XC870K, GR215, or send us your required model for sourcing.</p>
      <a href={wa(`Hi, I am looking for ${query}. Please help me find this machine and send quotation.`)} target="_blank" rel="noopener" className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-bold text-white"><MessageCircle size={17}/>Ask ANLAN to source it</a>
    </div>:<div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{visible.map(product=><article key={product.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
      <Link href={product.href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#f3f5f2]">
          <Image src={product.image} alt={product.name} fill className="object-contain p-5" sizes="(max-width:768px) 100vw,33vw"/>
          <span className="absolute left-4 top-4 rounded-full bg-lime px-3 py-1 text-[11px] font-black uppercase tracking-wider">Factory New</span>
        </div>
      </Link>
      <div className="p-6">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">{product.brand} - {product.subCategoryLabel}</p>
        <h2 className="mt-2 text-2xl font-black"><Link href={product.href}>{product.model}</Link></h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500">{product.description}</p>
        {product.specs.length>0&&<dl className="mt-5 divide-y divide-black/5 rounded-xl bg-gray-50 px-4">{product.specs.slice(0,3).map(([key,value])=><div className="flex justify-between gap-3 py-2 text-xs" key={key}><dt className="text-gray-500">{key}</dt><dd className="text-right font-bold">{value}</dd></div>)}</dl>}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={product.href} className="rounded-full border border-black/15 px-5 py-3 font-bold">View Details</Link>
          <a href={wa(`Hi, I want a quotation for ${product.name}. Please send price, specs, and shipping details.`)} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-bold text-white"><MessageCircle size={17}/>Request Quote</a>
          <a href={COMPANY_EMAIL_LINK} className="inline-flex items-center gap-2 rounded-full border border-black/15 px-5 py-3 font-bold"><Mail size={17}/>Email: {COMPANY_EMAIL}</a>
        </div>
      </div>
    </article>)}</div>}
  </div>;
}
