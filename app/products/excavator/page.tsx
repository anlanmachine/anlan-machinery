import type {Metadata} from 'next';import {ProductCategoryPage} from '@/components/product-category-page';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:{absolute:'XCMG Excavators for Sale | ANLAN Machinery'},description:'Explore new XCMG crawler excavators, mini excavators and wheel excavators with reliable performance, competitive pricing and export support.',alternates:{canonical:'/products/excavator'}};
export default function Page(){return <ProductCategoryPage category="excavator" intro="Explore new XCMG crawler excavators, mini excavators and wheel excavators with reliable performance, competitive pricing and export support."/>}
