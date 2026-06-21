import type {Metadata} from 'next';
import {ProductCategoryPage} from '@/components/product-category-page';

export const metadata:Metadata={title:{absolute:'Forklifts for Sale | ANLAN Machinery'},description:'Browse forklift sourcing options for warehouse, container loading, factory and construction material handling projects.',alternates:{canonical:'/products/forklift'}};
export default function ForkliftPage(){return <ProductCategoryPage category="forklift" intro="Browse forklift options for warehouse, yard, container loading and construction material handling projects. Add forklift products in the admin panel and they will appear here automatically."/>;}
