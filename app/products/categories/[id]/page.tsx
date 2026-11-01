import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getCatalog} from '@/lib/catalog';
import {getSiteCategories} from '@/lib/site-categories';
import {CategoryNavigation} from '@/components/category-navigation';
import {ProductListSection} from '@/components/product-list-section';

export const dynamic='force-dynamic';
type Params={params:Promise<{id:string}>};
export async function generateMetadata({params}:Params):Promise<Metadata>{
  const {id}=await params;
  const category=(await getSiteCategories()).find(item=>item.isCustom&&item.id===id);
  return category?{title:`${category.label} Machinery | AOLAN Machinery`,alternates:{canonical:category.path}}:{};
}
export default async function CustomCategoryPage({params}:Params){
  const {id}=await params;
  const category=(await getSiteCategories()).find(item=>item.isCustom&&item.id===id);
  if(!category)notFound();
  const products=(await getCatalog()).filter(product=>
    product.category===category.id ||
    (category.id==='skid-steer'&&product.category==='loader'&&product.subCategory==='skid-steer-loader')
  );
  return <section className="section pt-36"><div className="wrap">
    <p className="eyebrow">New machinery catalog</p>
    <h1 className="title mt-3">{category.label}</h1>
    <p className="sub mt-5">Explore available {category.label.toLowerCase()} models and request an export quotation.</p>
    <CategoryNavigation active={category.id}/>
    <ProductListSection products={products} searchLabel={`Search ${category.label} models`} searchPlaceholder="Search by model, brand or specifications..."/>
  </div></section>;
}
