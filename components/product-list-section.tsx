import Image from 'next/image';
import Link from 'next/link';
import {Mail,MessageCircle} from 'lucide-react';
import {COMPANY_EMAIL,COMPANY_EMAIL_LINK,wa} from '@/lib/data';
import {productDescription,productPath,productSpecifications,type CatalogProduct} from '@/lib/catalog';

export function ProductListSection({products,emptyMessage}:{products:CatalogProduct[];emptyMessage?:string}){
  if(products.length===0){
    return <div className="mt-12 rounded-3xl border border-dashed border-black/15 bg-white p-8 text-center shadow-sm">
      <h2 className="text-2xl font-black">Available on request</h2>
      <p className="mx-auto mt-3 max-w-2xl text-gray-500">{emptyMessage||'This category is available through ANLAN Machinery sourcing service. Send us your model, quantity and destination port for a fast quotation.'}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3"><a href={wa('Hi, I want a quotation for forklift machinery. Please send available models, price, specs, and shipping details.')} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-bold text-white"><MessageCircle size={17}/>Request Quote</a><a href={COMPANY_EMAIL_LINK} className="inline-flex items-center gap-2 rounded-full border border-black/15 px-6 py-3 font-bold"><Mail size={17}/>Email: {COMPANY_EMAIL}</a></div>
    </div>;
  }

  return <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{products.map(product=>{
    const specs=productSpecifications(product).slice(0,3);
    const href=`/products/${productPath(product)}`;
    return <article key={product.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#f3f5f2]">
          <Image src={product.image} alt={product.name} fill className="object-contain p-5" sizes="(max-width:768px) 100vw,33vw"/>
          <span className="absolute left-4 top-4 rounded-full bg-lime px-3 py-1 text-[11px] font-black uppercase tracking-wider">Factory New</span>
        </div>
      </Link>
      <div className="p-6">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">{product.brand} - {product.subCategory.replaceAll('-',' ')}</p>
        <h2 className="mt-2 text-2xl font-black"><Link href={href}>{product.model}</Link></h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500">{productDescription(product)}</p>
        {specs.length>0&&<dl className="mt-5 divide-y divide-black/5 rounded-xl bg-gray-50 px-4">{specs.map(([key,value])=><div className="flex justify-between gap-3 py-2 text-xs" key={key}><dt className="text-gray-500">{key}</dt><dd className="text-right font-bold">{value}</dd></div>)}</dl>}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={href} className="rounded-full border border-black/15 px-5 py-3 font-bold">View Details</Link>
          <a href={wa(`Hi, I want a quotation for ${product.name}. Please send price, specs, and shipping details.`)} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-bold text-white"><MessageCircle size={17}/>Request Quote</a>
          <a href={COMPANY_EMAIL_LINK} className="inline-flex items-center gap-2 rounded-full border border-black/15 px-5 py-3 font-bold"><Mail size={17}/>Email: {COMPANY_EMAIL}</a>
        </div>
      </div>
    </article>;
  })}</div>;
}
