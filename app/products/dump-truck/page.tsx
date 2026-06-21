import type {Metadata} from 'next';
import {ProductCategoryPage} from '@/components/product-category-page';

export const metadata:Metadata={title:{absolute:'Dump Trucks for Sale | ANLAN Machinery'},description:'Find dump trucks for mining, construction, earthmoving and heavy transport projects with export quotation support.',alternates:{canonical:'/products/dump-truck'}};
export default function DumpTruckPage(){return <ProductCategoryPage category="dump-truck" intro="Browse dump truck options for earthmoving, quarry, road and infrastructure projects. Add models in the admin panel and they will appear here automatically."/>;}
