import type {Metadata} from 'next';
import Image from 'next/image';
import {Quote} from 'lucide-react';
import {IndustrialHero} from '@/components/industrial-hero';
import {MediaGallery} from '@/components/media-gallery';
import {VideoGrid} from '@/components/video-grid';
import {getBaseMedia,getMedia,type MediaImage, type MediaVideo} from '@/lib/media';
import {readCollection} from '@/lib/cms-store';

export const metadata:Metadata={title:{absolute:'Construction Machinery Customer Cases | AOLAN'},description:'View real AOLAN Machinery customer meetings, equipment handovers, factory visits and delivery cases for global construction equipment buyers.',keywords:['machinery delivery cases','construction equipment customers','China machinery export cases'],alternates:{canonical:'/case-studies'}};

const caseInfo=[
  ['Wheel Loader Fleet Handover','Private / undisclosed','Wheel Loader','Flat Rack / RoRo','25–40 days'],
  ['Container-side Customer Handover','Private / undisclosed','Construction Machinery','Container Shipping','20–35 days'],
  ['Buyer Visit and Equipment Selection','International Buyer','Excavator Fleet','Project Logistics','Confirmed by route'],
  ['Contract Signing and Delivery Preparation','International Buyer','Mixed Equipment','Container / Flat Rack','20–45 days'],
  ['Factory Visit and Technical Review','International Buyer','Crawler Excavator','Bulk / Flat Rack','Confirmed by port'],
  ['Dealer Partnership Meeting','International Buyer','Dealer Stock Package','Multi-unit Shipping','Project schedule']
];

const uniqueBySource=<T extends {src:string}>(items:T[])=>[...new Map(items.map(item=>[item.src,item])).values()];
const toImage=(src:string,id:string,title:string):MediaImage=>({id,type:'image',category:'customers',section:'case',title,alt:title,src,width:1200,height:900,bytes:0,source:'admin'});
const toVideo=(src:string,id:string,title:string,poster:string):MediaVideo=>({id,type:'video',category:'customers',section:'case',title,alt:title,src,poster,width:1280,height:720,duration:0,bytes:0,source:'admin'});
const mediaUrls=(item:any)=>Array.isArray(item.videos)?item.videos.map(String).filter(Boolean):item.video?[String(item.video)]:[];

export default async function Cases(){
  const [base,media,cmsAll]=await Promise.all([getBaseMedia(),getMedia(),readCollection<any[]>('cases',[])]);
  const cms=cmsAll.filter(item=>item.status!=='Draft');
  const defaultMedia=cms.find(item=>item.id==='cases-default-media');
  const customCases=cms.filter(item=>item.id!=='cases-default-media');
  const baseImages=base.images.filter(item=>item.category==='customers');
  const baseVideos=base.videos.filter(item=>item.category==='customers');
  const defaultImages=defaultMedia?((defaultMedia.images||[]).map((src:string,index:number)=>toImage(src,`cases-default-${index}`,defaultMedia.title))):baseImages;
  const defaultVideos=defaultMedia?(mediaUrls(defaultMedia).map((src:string,index:number)=>toVideo(src,`cases-default-video-${index}`,defaultMedia.title,String(defaultMedia.images?.[0]||'')))):baseVideos;
  const baseImageSources=new Set(baseImages.map(item=>item.src)),baseVideoSources=new Set(baseVideos.map(item=>item.src));
  const libraryImages=media.images.filter(item=>item.category==='customers'&&!baseImageSources.has(item.src));
  const libraryVideos=media.videos.filter(item=>item.category==='customers'&&!baseVideoSources.has(item.src));
  const defaultCaseImages=uniqueBySource([...defaultImages,...libraryImages]);
  const customImages=customCases.flatMap(item=>(item.images||[]).map((src:string,index:number)=>toImage(src,`${item.id}-${index}`,item.title)));
  const customVideos=customCases.flatMap(item=>mediaUrls(item).map((src:string,index:number)=>toVideo(src,`${item.id}-video-${index}`,item.title||'Customer case video',String(item.images?.[0]||''))));
  const allImages=uniqueBySource([...customImages,...defaultCaseImages]);
  const allVideos=uniqueBySource([...customVideos,...defaultVideos,...libraryVideos]);
  const groups=customCases.length?customCases.map(item=>({
    info:[item.title,item.country,item.machineModel,item.customerIndustry,item.year],
    images:(item.images||[]).map((src:string,index:number)=>toImage(src,`${item.id}-${index}`,item.title)),
    video:mediaUrls(item)[0]||''
  })):caseInfo.map((info,index)=>({info,images:defaultCaseImages.slice(index*2,index*2+2),video:''}));
  return <><IndustrialHero kicker="Customer success" title="Real meetings. Real machines. Long-term partnerships." description="Customer-approved photos from machinery selection, contract signing, site visits and equipment handovers." image={groups[0]?.images?.[0]?.src||allImages[0]?.src}/><section className="section"><div className="wrap"><div className="grid gap-7 lg:grid-cols-2">{groups.map(({info,images:caseImages,video})=><article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5" key={String(info[0])}>{caseImages[0]&&<div className="grid h-72 grid-cols-2 gap-1 bg-gray-100">{caseImages.slice(0,2).map((image:MediaImage)=><div className="relative" key={image.id}><Image src={image.src} alt={image.alt} fill className="object-cover" sizes="50vw"/></div>)}</div>}<div className="p-7"><p className="eyebrow">Verified customer record</p><h2 className="mt-3 text-2xl font-black">{info[0]}</h2><dl className="mt-5 grid grid-cols-2 gap-4 text-sm">{[['Country',info[1]],['Machine',info[2]],['Industry / Method',info[3]],['Year / Delivery',info[4]]].map(([key,value])=><div key={String(key)}><dt className="text-gray-400">{key}</dt><dd className="mt-1 font-bold">{value}</dd></div>)}</dl>{video&&<div className="mt-5 overflow-hidden rounded-2xl bg-black"><video controls playsInline preload="metadata" className="aspect-video w-full"><source src={video} type="video/mp4"/></video></div>}<div className="mt-6 flex gap-3 rounded-2xl bg-sand p-4"><Quote className="shrink-0" size={20}/><p className="text-sm leading-6 text-gray-600">Customer feedback is kept private until publication approval. Photos are genuine supplied project records.</p></div></div></article>)}</div></div></section>{allVideos.length>0&&<section className="section bg-ink text-white"><div className="wrap"><p className="eyebrow !text-lime">Customer videos</p><h2 className="title mt-3">Machine delivery and buyer visits.</h2><div className="mt-10 text-ink"><VideoGrid videos={allVideos}/></div></div></section>}<section className="section bg-sand"><div className="wrap"><p className="eyebrow">All customer media</p><h2 className="title mt-3">Meetings and delivery gallery.</h2><div className="mt-10"><MediaGallery images={allImages}/></div></div></section></>;
}

export const dynamic='force-dynamic';
