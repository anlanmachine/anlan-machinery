import type {Metadata} from 'next';
import {ProductCategoryPage} from '@/components/product-category-page';
export const dynamic='force-dynamic';
export const metadata:Metadata={
  title:{absolute:'Skid Steer Loaders for Sale | AOLAN Machinery'},
  description:'Explore new skid steer loaders, compact construction machinery and attachments for worldwide export.',
  alternates:{canonical:'/products/skid-steer'}
};
export default function Page(){
  return <ProductCategoryPage category="skid-steer" intro="Discover skid steer loaders for construction, landscaping and material handling. Request an FOB or CIF export quotation."/>;
}
