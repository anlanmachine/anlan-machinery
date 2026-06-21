import {NextRequest,NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin-auth';
import {nowIso,readCollection,saveUpload,writeCollection} from '@/lib/cms-store';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const MAX_SIZE=80*1024*1024;
const TYPES=new Set(['image/jpeg','image/png','image/webp','video/mp4','application/pdf']);

export async function POST(request:NextRequest){
  try{
    await requireAdmin();
    const form=await request.formData(),folder=String(form.get('folder')||'admin');
    const files=[...form.getAll('files'),...form.getAll('images')].filter((item):item is File=>item instanceof File);
    if(!files.length)return NextResponse.json({success:false,error:'Choose at least one file.'},{status:400});
    const assets=await readCollection<Record<string,unknown>[]>('media',[]);
    const uploaded:Record<string,unknown>[]=[];
    for(const file of files){
      if(!TYPES.has(file.type))throw new Error('Only JPG, PNG, WebP, MP4 and PDF files are supported.');
      if(file.size>MAX_SIZE)throw new Error('Each file must be smaller than 80 MB.');
      const saved=await saveUpload(file,folder);
      const asset:Record<string,unknown>={id:`media-${Date.now()}-${uploaded.length}`,title:file.name,type:file.type.startsWith('image/')?'image':file.type==='video/mp4'?'video':'document',url:saved.url,src:saved.url,bytes:file.size,mime:file.type,category:folder,status:'Published',createdAt:nowIso(),updatedAt:nowIso()};
      assets.unshift(asset);
      uploaded.push(asset);
    }
    await writeCollection('media',assets);
    return NextResponse.json({success:true,assets,images:uploaded.filter(item=>item.type==='image').map(item=>String(item.url))});
  }catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Upload failed.'},{status:400});}
}
