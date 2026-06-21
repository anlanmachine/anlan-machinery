import type {Metadata} from 'next';
import {getCategoryProducts} from '@/lib/catalog';
import {CategoryNavigation} from '@/components/category-navigation';
import {ProductListSection} from '@/components/product-list-section';

export const metadata:Metadata={
  title:{absolute:'XCMG Backhoe Loaders for Sale | ANLAN Machinery'},
  description:'Find XCMG backhoe loaders for construction, municipal work, farming, utility and road maintenance projects.',
  alternates:{canonical:'/products/backhoe-loader'}
};

export default async function BackhoeLoaderPage(){
  const products=await getCategoryProducts('backhoe-loader');
  return <section className="section pt-36"><div className="wrap">
    <p className="eyebrow">New machinery catalog</p><h1 className="title mt-3">XCMG Backhoe Loaders</h1><p className="sub mt-5">Compare backhoe loader machines with local photos, model data and export quotation support from ANLAN Machinery.</p>
    <CategoryNavigation active="backhoe-loader"/>
    <ProductListSection products={products}/>
  </div></section>;
}
