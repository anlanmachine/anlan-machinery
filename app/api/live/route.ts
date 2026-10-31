import {NextResponse} from 'next/server';
// Process liveness, NOT database readiness. Safe for uptime monitors.
export function GET(){
  return NextResponse.json({ok:true,service:'aolan-machinery',database:'not-checked'},
    {headers:{'Cache-Control':'no-store'}});
}
