import {readFile} from 'fs/promises';import path from 'path';
export type MediaImage={id:string;type:'image';category:string;section:string;title:string;alt:string;src:string;width:number;height:number;bytes:number;source:string};
export type MediaVideo={id:string;type:'video';category:string;section:string;title:string;alt:string;src:string;poster:string;width:number;height:number;duration:number;bytes:number;source:string};
export type MediaDocument={id:string;type:'document';category:string;section:string;title:string;src:string;extension:string;bytes:number;source:string};
export type MediaLibrary={generatedAt:string;source:string;summary:{images:number;videos:number;documents:number};images:MediaImage[];videos:MediaVideo[];documents:MediaDocument[]};
export async function getMedia():Promise<MediaLibrary>{return JSON.parse(await readFile(path.join(process.cwd(),'data','media.json'),'utf8'));}
