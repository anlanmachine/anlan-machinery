import {readFile} from 'fs/promises';
import path from 'path';
import {readCollection} from './cms-store';
import type {MediaImage,MediaLibrary} from './media';

export type HomeShipmentSlot={
  id:string;
  slot:number;
  title:string;
  alt:string;
  image:string;
  originalImage:string;
  status:'Published'|'Draft';
  createdAt?:string;
  updatedAt?:string;
};

async function defaultShipmentImages():Promise<MediaImage[]>{
  const file=path.join(process.cwd(),'data','media.json');
  const media=JSON.parse(await readFile(file,'utf8')) as MediaLibrary;
  return media.images.filter(item=>item.category==='shipping'&&item.section==='loading').slice(0,6);
}

export async function getHomeShipmentSlots():Promise<HomeShipmentSlot[]>{
  const [defaults,overrides]=await Promise.all([
    defaultShipmentImages(),
    readCollection<HomeShipmentSlot[]>('homeShipments',[])
  ]);
  return defaults.map((image,index)=>{
    const slot=index+1;
    const override=overrides.find(item=>Number(item.slot)===slot);
    return {
      id:`home-shipment-slot-${slot}`,
      slot,
      title:override?.title||image.title,
      alt:override?.alt||image.alt,
      image:override?.image||image.src,
      originalImage:image.src,
      status:override?.status||'Published',
      createdAt:override?.createdAt,
      updatedAt:override?.updatedAt
    };
  });
}

export async function getHomeShipmentMedia():Promise<MediaImage[]>{
  const [defaults,slots]=await Promise.all([defaultShipmentImages(),getHomeShipmentSlots()]);
  return defaults.map((image,index)=>{
    const slot=slots[index];
    if(!slot||slot.status==='Draft')return image;
    return {...image,id:slot.id,title:slot.title,alt:slot.alt,src:slot.image};
  });
}
