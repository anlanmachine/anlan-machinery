import type {Metadata} from 'next';
import {ProductCategoryPage} from '@/components/product-category-page';

export const metadata:Metadata={title:{absolute:'Cranes for Sale | AOLAN Machinery'},description:'Source truck cranes, crawler cranes and lifting equipment for global construction projects through AOLAN Machinery.',alternates:{canonical:'/products/crane'}};
export default function CranePage(){return <ProductCategoryPage category="crane" intro="Browse crane and lifting equipment options. Add crane products in the admin panel and this page will update automatically."/>;}
export const dynamic='force-dynamic';
