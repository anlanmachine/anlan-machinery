import {readFile} from 'fs/promises';import path from 'path';import {readCollection} from './cms-store';
export type MediaImage={id:string;type:'image';category:string;section:string;title:string;alt:string;src:string;width:number;height:number;bytes:number;source:string};
export type MediaVideo={id:string;type:'video';category:string;section:string;title:string;alt:string;src:string;poster:string;width:number;height:number;duration:number;bytes:number;source:string};
export type MediaDocument={id:string;type:'document';category:string;section:string;title:string;src:string;extension:string;bytes:number;source:string};
export type MediaLibrary={generatedAt:string;source:string;summary:{images:number;videos:number;documents:number};images:MediaImage[];videos:MediaVideo[];documents:MediaDocument[]};
export async function getMedia():Promise<MediaLibrary>{
  const base:MediaLibrary=JSON.parse(await readFile(path.join(process.cwd(),'data','media.json'),'utf8'));
  const cms=await readCollection<any[]>('media',[]);
  const images=cms.filter(item=>item.status!=='Draft'&&item.type==='image').map(item=>({id:item.id,type:'image' as const,category:item.category||'general',section:item.category||'admin',title:item.title||'Uploaded image',alt:item.title||'ANLAN Machinery image',src:item.url||item.src,width:1200,height:900,bytes:item.bytes||0,source:'admin'}));
  const videos=cms.filter(item=>item.status!=='Draft'&&item.type==='video').map(item=>({id:item.id,type:'video' as const,category:item.category||'general',section:item.category||'admin',title:item.title||'Uploaded video',alt:item.title||'ANLAN Machinery video',src:item.url||item.src,poster:item.poster||'',width:1280,height:720,duration:0,bytes:item.bytes||0,source:'admin'}));
  const documents=cms.filter(item=>item.status!=='Draft'&&item.type==='document').map(item=>({id:item.id,type:'document' as const,category:item.category||'general',section:item.category||'admin',title:item.title||'Uploaded document',src:item.url||item.src,extension:'pdf',bytes:item.bytes||0,source:'admin'}));
  return {...base,images:[...images,...base.images],videos:[...videos,...base.videos],documents:[...documents,...base.documents],summary:{images:base.summary.images+images.length,videos:base.summary.videos+videos.length,documents:base.summary.documents+documents.length}};
}
