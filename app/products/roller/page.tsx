import type {Metadata} from 'next';import {ProductCategoryPage} from '@/components/product-category-page';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:{absolute:'XCMG Road Rollers for Sale | ANLAN Machinery'},description:'Browse XCMG single drum rollers and pneumatic rollers for road construction, compaction and earthwork projects.',alternates:{canonical:'/products/roller'}};
export default function Page(){return <ProductCategoryPage category="roller" intro="Browse XCMG single drum rollers and pneumatic rollers for road construction, compaction and earthwork projects."/>}
