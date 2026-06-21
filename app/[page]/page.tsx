import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {IndustrialHero} from '@/components/industrial-hero';
import {ContactActions,EmailLink,LeadForm} from '@/components/ui';

const pages:Record<string,{title:string;kicker:string;body:string;keywords:string[]}>= {
  'quality-control':{title:'Pre-shipment machinery inspection.',kicker:'Quality control',body:'Our inspection workflow covers model and serial checks, operating functions, leaks, visible wear, safety systems, photos, videos and third-party inspection when requested.',keywords:['machinery inspection China','pre shipment inspection']},
  faq:{title:'Machinery buying questions, answered clearly.',kicker:'Buyer FAQ',body:'Clear answers about machine condition, configurations, warranty, inspection, payment, lead time, parts, documents and international freight.',keywords:['machinery buying FAQ','import equipment China']},
  contact:{title:'Request a machinery quotation.',kicker:'Contact ANLAN',body:'Send the model, quantity and destination port. Our export team will reply with availability, specifications, pricing and shipping options.',keywords:['machinery quotation','contact equipment exporter']},
  'privacy-policy':{title:'Privacy policy',kicker:'Legal',body:'We collect only the information needed to respond to inquiries, prepare quotations and provide customer service. We do not sell personal information.',keywords:['ANLAN privacy policy']},
  terms:{title:'Terms of service',kicker:'Legal',body:'Product availability, specifications and freight rates must be confirmed in a formal quotation. Final commercial terms are defined by the signed contract and invoice.',keywords:['ANLAN terms']}
};

export async function generateMetadata({params}:{params:Promise<{page:string}>}):Promise<Metadata>{
  const {page}=await params,item=pages[page];
  return item?{title:item.title,description:item.body,keywords:item.keywords,alternates:{canonical:`/${page}`},openGraph:{title:item.title,description:item.body}}:{};
}

export default async function Info({params}:{params:Promise<{page:string}>}){
  const {page}=await params,item=pages[page];
  if(!item)notFound();
  return <><IndustrialHero kicker={item.kicker} title={item.title} description={item.body}/><section className="section"><div className="wrap grid gap-12 lg:grid-cols-2"><div><p className="eyebrow">Start a conversation</p><h2 className="title mt-3">Get a clear answer and delivered quotation.</h2><p className="mt-5 leading-8 text-gray-600">Tell us what your project needs. We will respond with suitable models, commercial options and the next practical step.</p><div className="mt-7"><ContactActions quoteText="WhatsApp inquiry"/></div><p className="mt-4 text-sm font-bold text-gray-600"><EmailLink/></p></div><LeadForm/></div></section></>;
}
