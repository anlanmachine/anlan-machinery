import type {Metadata} from 'next';
import {ClipboardCheck,Factory,HardHat,ScanSearch,Warehouse} from 'lucide-react';
import {IndustrialHero} from '@/components/industrial-hero';
import {MediaGallery} from '@/components/media-gallery';
import {VideoGrid} from '@/components/video-grid';
import {getBaseMedia,getMedia} from '@/lib/media';
import {readCollection} from '@/lib/cms-store';

export const metadata:Metadata={title:{absolute:'Machinery Yard, Inspection & Factory Videos | AOLAN'},description:'Explore AOLAN Machinery equipment yards, stock machines, inspection workflow, testing, loading preparation and factory videos.',keywords:['construction machinery factory China','equipment yard','machine inspection'],alternates:{canonical:'/factory'}};
const areas=[[Factory,'Factory Overview','Manufacturer and supply-network coordination for current Chinese machinery models.'],[Warehouse,'Warehouse & Stock Yard','Available machines and export-ready inventory photographed on site.'],[ScanSearch,'Inspection Center','Identity, serial number, leaks, wear, controls and safety systems checked before loading.'],[HardHat,'Machine Assembly & Preparation','Attachments, transport dimensions and customer configurations confirmed before dispatch.'],[ClipboardCheck,'Machine Testing','Cold start, travel, hydraulics, steering, braking and working functions recorded on video.']];
const uniqueBySource=<T extends {src:string}>(items:T[])=>[...new Map(items.map(item=>[item.src,item])).values()];

export default async function FactoryPage(){
  const [base,media,cmsAll]=await Promise.all([getBaseMedia(),getMedia(),readCollection<any[]>('factory',[])]);
  const cms=cmsAll.filter(item=>item.status!=='Draft');
  const defaultMedia=cms.find(item=>item.id==='factory-default-media');
  const custom=cms.filter(item=>item.id!=='factory-default-media');
  const baseImages=base.images.filter(item=>item.category==='factory');
  const baseVideos=base.videos.filter(item=>item.category==='factory');
  const defaultImages=defaultMedia?((defaultMedia.images||[]).map((src:string,index:number)=>({id:`factory-default-${index}`,type:'image' as const,category:'factory',section:'factory',title:defaultMedia.title,alt:defaultMedia.title,src,width:1200,height:900,bytes:0,source:'admin'}))):baseImages;
  const defaultVideos=defaultMedia?((defaultMedia.videos||[]).map((src:string,index:number)=>({id:`factory-default-video-${index}`,type:'video' as const,category:'factory',section:'factory',title:defaultMedia.title||'Factory video',alt:defaultMedia.title||'AOLAN Machinery factory video',src,poster:String(defaultMedia.images?.[0]||''),width:1280,height:720,duration:0,bytes:0,source:'admin'}))):baseVideos;
  const customImages=custom.flatMap(item=>(item.images||[]).map((src:string,index:number)=>({id:`${item.id}-${index}`,type:'image' as const,category:'factory',section:item.category||'factory',title:item.title,alt:item.title,src,width:1200,height:900,bytes:0,source:'admin'})));
  const customVideos=custom.flatMap(item=>(item.videos||item.video?[...(item.videos||[]),...(!item.videos&&item.video?[item.video]:[])]:[]).map((src:string,index:number)=>({id:`${item.id}-video-${index}`,type:'video' as const,category:'factory',section:item.category||'factory',title:item.title||'Factory video',alt:item.title||'AOLAN Machinery factory video',src,poster:String(item.images?.[0]||''),width:1280,height:720,duration:0,bytes:0,source:'admin'})));
  const baseImageSources=new Set(baseImages.map(item=>item.src)),baseVideoSources=new Set(baseVideos.map(item=>item.src));
  const libraryImages=media.images.filter(item=>item.category==='factory'&&!baseImageSources.has(item.src));
  const libraryVideos=media.videos.filter(item=>item.category==='factory'&&!baseVideoSources.has(item.src));
  const images=uniqueBySource([...customImages,...defaultImages,...libraryImages]);
  const videos=uniqueBySource([...customVideos,...defaultVideos,...libraryVideos]);
  return <><IndustrialHero kicker="Factory & equipment yards" title="Supply strength you can see and verify." description="Real inventory, machine walkarounds, pre-delivery inspection and operating videos from our China supply network." image={images[1]?.src||images[0]?.src}/><section className="section"><div className="wrap"><p className="eyebrow">Operations</p><h2 className="title mt-3">From stock selection to loading release.</h2><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{areas.map(([Icon,title,copy])=>{const AreaIcon=Icon as typeof Factory;return <article className="rounded-3xl border border-black/10 p-7" key={String(title)}><AreaIcon size={30}/><h3 className="mt-5 text-xl font-black">{String(title)}</h3><p className="mt-3 leading-7 text-gray-500">{String(copy)}</p></article>})}<article className="rounded-3xl border border-dashed border-black/20 p-7"><b className="text-xl">Production Line</b><p className="mt-3 text-gray-500">Waiting For Material - add production photos in Admin / Factory when available.</p></article></div></div></section><section className="section bg-sand"><div className="wrap"><p className="eyebrow">Factory gallery</p><h2 className="title mt-3">Inventory and inspection records.</h2><div className="mt-10"><MediaGallery images={images}/></div></div></section><section className="section"><div className="wrap"><p className="eyebrow">Factory videos</p><h2 className="title mt-3">Walkarounds and machine tests.</h2><div className="mt-10"><VideoGrid videos={videos}/></div></div></section></>;
}
export const dynamic='force-dynamic';
