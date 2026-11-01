import Link from 'next/link';
import {getSiteCategories} from '@/lib/site-categories';

export async function CategoryNavigation({active}:{active?:string}){
  const categories=await getSiteCategories();
  return <nav aria-label="Product categories" className="-mx-5 mt-9 overflow-x-auto px-5">
    <div className="flex min-w-max gap-2">{categories.map(item=><Link key={item.id} href={item.path} aria-current={active===item.id?'page':undefined}
      className={`rounded-full px-5 py-3 text-sm font-black transition ${active===item.id?'bg-lime text-ink shadow-sm':'border border-black/15 bg-white text-gray-600 hover:border-black hover:text-ink'}`}>{item.label}</Link>)}</div>
  </nav>;
}
