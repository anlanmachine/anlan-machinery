import {NextRequest,NextResponse} from 'next/server';
import {mkdir,writeFile} from 'fs/promises';
import path from 'path';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const MAX_SIZE=12*1024*1024;
const TYPES=new Map([['image/jpeg','jpg'],['image/png','png'],['image/webp','webp']]);
function authorized(request:NextRequest){return request.headers.get('x-admin-password')===(process.env.ADMIN_PASSWORD||'anlan2026');}

export async function POST(request:NextRequest){
  if(!authorized(request))return NextResponse.json({success:false,error:'Incorrect admin password.'},{status:401});
  try{
    const form=await request.formData(),files=form.getAll('images').filter((item):item is File=>item instanceof File);
    if(!files.length)return NextResponse.json({success:false,error:'Choose at least one image.'},{status:400});
    const output=path.join(process.cwd(),'public','uploads','products');await mkdir(output,{recursive:true});const images:string[]=[];
    for(const file of files){const extension=TYPES.get(file.type);if(!extension)throw new Error('Only JPG, PNG and WebP images are supported.');if(file.size>MAX_SIZE)throw new Error('Each image must be smaller than 12 MB.');const base=path.basename(file.name,path.extname(file.name)).replace(/[^a-z0-9-]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'product';const filename=`${base}-${Date.now()}-${images.length+1}.${extension}`;await writeFile(path.join(output,filename),Buffer.from(await file.arrayBuffer()));images.push(`/uploads/products/${filename}`);}
    return NextResponse.json({success:true,images});
  }catch(error){return NextResponse.json({success:false,error:error instanceof Error?error.message:'Upload failed.'},{status:400});}
}
