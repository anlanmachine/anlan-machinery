import type {Metadata} from 'next';import {ProductCategoryPage} from '@/components/product-category-page';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:{absolute:'XCMG Loaders for Sale | ANLAN Machinery'},description:'Find XCMG wheel loaders, skid steer loaders and backhoe loaders for construction, mining, agriculture and road projects.',alternates:{canonical:'/products/loader'}};
export default function Page(){return <ProductCategoryPage category="loader" intro="Find XCMG wheel loaders, skid steer loaders and backhoe loaders for construction, mining, agriculture and road projects."/>}
