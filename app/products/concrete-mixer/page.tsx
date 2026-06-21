import type {Metadata} from 'next';import {ProductCategoryPage} from '@/components/product-category-page';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:{absolute:'Self Loading Concrete Mixers for Sale | ANLAN Machinery'},description:'View self loading concrete mixers with reliable mixing, loading and transport functions for construction sites.',alternates:{canonical:'/products/concrete-mixer'}};
export default function Page(){return <ProductCategoryPage category="mixer" intro="View self loading concrete mixers with reliable mixing, loading and transport functions for construction sites."/>}
