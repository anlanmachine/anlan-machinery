import {NextRequest,NextResponse} from 'next/server';
import {neon} from '@neondatabase/serverless';

export const runtime='nodejs';
export const dynamic='force-dynamic';

function sql(){
  const url=process.env.DATABASE_URL;
  if(!url)throw new Error('DATABASE_URL is not configured.');
  return neon(url);
}

export async function GET(_:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    const rows=await sql()`SELECT filename,mime,encode(bytes,'base64') AS data FROM media_files WHERE id=${id} LIMIT 1`;
    const file=rows[0];
    if(!file)return new NextResponse('Not found',{status:404});
    return new NextResponse(Buffer.from(String(file.data),'base64'),{
      headers:{
        'Content-Type':String(file.mime||'application/octet-stream'),
        'Cache-Control':'public, max-age=31536000, immutable',
        'Content-Disposition':`inline; filename="${String(file.filename).replaceAll('"','')}"`,
      }
    });
  }catch(error){
    return NextResponse.json({success:false,error:error instanceof Error?error.message:'Media unavailable.'},{status:500});
  }
}
