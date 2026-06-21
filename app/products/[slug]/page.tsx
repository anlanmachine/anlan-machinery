import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowLeft,MessageCircle} from 'lucide-react';
import {wa} from '@/lib/data';
import {categoryForProduct} from '@/lib/catalog-config';
import {getCatalog,productDescription,productSlug,productSpecifications} from '@/lib/catalog';
export const dynamic='force-dynamic';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const product=(await getCatalog()).find(item=>productSlug(item.model)===slug);return product?{title:`${product.name} for Export`,description:productDescription(product),alternates:{canonical:`/products/${slug}`}}:{};}

export default async function Detail({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const product=(await getCatalog()).find(item=>productSlug(item.model)===slug);
  if(!product)notFound();
  const category=categoryForProduct(product.category),description=productDescription(product),specifications=productSpecifications(product);
  const schema={'@context':'https://schema.org','@type':'Product',name:product.name,image:product.images,brand:{'@type':'Brand',name:product.brand},description};
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/><div className="pt-28">
    <div className="mx-auto max-w-7xl px-5 py-5 text-sm text-gray-500"><Link href="/">Home</Link><span className="mx-2">›</span><Link href="/products">Products</Link><span className="mx-2">›</span><Link href={`/products/${category.path}`}>{category.label}</Link><span className="mx-2">›</span>{product.name}</div>
    <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 lg:grid-cols-2"><div><div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#f3f5f2]"><Image src={product.image} alt={product.name} fill priority className="object-contain p-5"/></div>{product.images.length>1&&<div className="mt-3 grid grid-cols-4 gap-3">{product.images.slice(1,5).map(image=><div className="relative aspect-square overflow-hidden rounded-xl bg-[#f3f5f2]" key={image}><Image src={image} alt="" fill className="object-contain p-2"/></div>)}</div>}</div>
      <div><p className="eyebrow">{product.brand} · {product.subCategory.replaceAll('-',' ')}</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">{product.model}</h1><p className="mt-6 text-lg leading-8 text-gray-600">{description}</p>{specifications.length>0&&<div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-gray-200">{specifications.map(([key,value])=><div className="bg-white p-4" key={key}><p className="text-xs text-gray-400">{key}</p><b>{value}</b></div>)}</div>}<div className="mt-8 flex flex-wrap gap-3"><Link href={`/products/${category.path}`} className="inline-flex items-center gap-2 rounded-full border border-black/15 px-6 py-3 font-black"><ArrowLeft size={18}/>Back to {category.label}</Link><a href={wa(`Hi, I want a quotation for ${product.name}. Please send price, specs, and shipping details.`)} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full bg-lime px-6 py-3 font-black"><MessageCircle size={18}/>Request Quote</a></div></div>
    </section>
  </div></>;
}
