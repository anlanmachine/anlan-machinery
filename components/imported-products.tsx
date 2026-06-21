'use client';
import { useEffect, useState } from 'react';
import { LoaderCircle, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { wa } from '@/lib/data';

type Product = { id: string|number; source?: 'xcmg'|'pdf'; localOnly?: boolean; brand?: string; name: string; model: string; image: string; category: 'excavator'|'loader'|'roller'|'grader'|'mixer'; subCategory:string; description?: string; specifications?: Record<string,string> };
const groups = [
  { key: 'excavator', title: 'Excavator', zh: '挖掘机' },
  { key: 'loader', title: 'Loader', zh: '装载机' },
  { key: 'roller', title: 'Roller / Compaction', zh: '压路与压实机械' },
  { key: 'grader', title: 'Grader', zh: '平地机' },
  { key: 'mixer', title: 'Self Loading Concrete Mixer', zh: '自上料混凝土搅拌车' }
] as const;
const slugify = (model:string) => model.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

export function ImportedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { fetch('/api/products').then(response => { if (!response.ok) throw new Error('Unable to load products'); return response.json(); }).then(setProducts).catch(error => setError(error.message)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="flex items-center gap-2 py-20 text-gray-500"><LoaderCircle className="animate-spin"/>Loading products…</div>;
  if (error) return <div className="rounded-2xl bg-red-50 p-5 text-red-800">{error}</div>;
  return <div className="mt-14 space-y-20">{groups.map(group => {
    const items = products.filter(product => product.category === group.key && product.localOnly === true && /^\/uploads\/(xcmg|self-loading-mixer)\//.test(product.image));
    if (!items.length) return null;
    return <section key={group.key}>
      <div className="flex items-end justify-between border-b border-black/10 pb-5"><div><p className="eyebrow">{group.zh}</p><h2 className="mt-1 text-3xl font-black">{group.title}</h2></div><span className="text-sm font-bold text-gray-400">{items.length} machines</span></div>
      <div className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map(product => {
        const specs = Object.entries(product.specifications || {}).slice(0, 3);
        return <article key={product.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="relative aspect-[4/3] overflow-hidden bg-[#f3f5f2] p-4"><img src={product.image} alt={`Factory-new ${product.name}`} loading="lazy" className="h-full w-full object-contain"/><span className="absolute left-4 top-4 rounded-full bg-lime px-3 py-1 text-[11px] font-black uppercase tracking-wider">Factory New</span></div>
          <div className="p-6"><p className="text-xs font-black uppercase tracking-widest text-gray-400">{product.brand || 'XCMG'} · {product.model} · {product.subCategory.replaceAll('-',' ')}</p><h3 className="mt-2 text-xl font-black">{product.name}</h3>{product.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500">{product.description}</p>}
            {specs.length > 0 && <dl className="mt-5 divide-y divide-black/5 rounded-xl bg-gray-50 px-4">{specs.map(([key,value]) => <div className="flex justify-between gap-4 py-2 text-xs" key={key}><dt className="text-gray-500">{key}</dt><dd className="text-right font-bold">{value}</dd></div>)}</dl>}
            <div className="mt-6 flex flex-wrap gap-2"><Link href={`/products/${slugify(product.model)}`} className="inline-flex items-center rounded-full border border-black/15 px-5 py-3 font-bold">View Details</Link><a href={wa(`Hi, I want a quotation for ${product.name} (${product.model}). Please send price, specs, and shipping details.`)} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-bold text-white hover:bg-lime hover:text-ink"><MessageCircle size={18}/>Request Quote</a></div>
          </div>
        </article>;
      })}</div>
    </section>;
  })}</div>;
}
