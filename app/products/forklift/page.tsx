import type {Metadata} from 'next';
import {CategoryNavigation} from '@/components/category-navigation';
import {ProductListSection} from '@/components/product-list-section';

export const metadata:Metadata={
  title:{absolute:'Forklifts for Sale | ANLAN Machinery'},
  description:'Request forklift sourcing support for warehouse, container loading, factory and construction material handling projects.',
  alternates:{canonical:'/products/forklift'}
};

export default function ForkliftPage(){
  return <section className="section pt-36"><div className="wrap">
    <p className="eyebrow">Material handling</p><h1 className="title mt-3">Forklift Sourcing</h1><p className="sub mt-5">Tell us the required lifting capacity, mast height, fuel type and destination port. ANLAN Machinery can source suitable forklift options for export quotation.</p>
    <CategoryNavigation active={undefined}/>
    <ProductListSection products={[]} emptyMessage="Forklift listings are prepared on request. Send your capacity, mast height, tire type and destination country, and our team will provide available models with photos, specifications and shipping cost."/>
  </div></section>;
}
