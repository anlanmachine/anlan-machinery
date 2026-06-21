import type {Metadata} from 'next';import {ProductCategoryPage} from '@/components/product-category-page';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:{absolute:'XCMG Motor Graders for Sale | ANLAN Machinery'},description:'Discover XCMG motor graders for road construction, land leveling and infrastructure projects.',alternates:{canonical:'/products/motor-grader'}};
export default function Page(){return <ProductCategoryPage category="grader" intro="Discover XCMG motor graders for road construction, land leveling and infrastructure projects."/>}
