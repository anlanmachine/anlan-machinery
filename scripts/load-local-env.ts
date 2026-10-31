import {existsSync,readFileSync} from 'fs';
import path from 'path';

const file=path.join(process.cwd(),'.env');
if(existsSync(file)){
  for(const line of readFileSync(file,'utf8').split(/\r?\n/)){
    const text=line.trim(),separator=text.indexOf('=');
    if(!text||text.startsWith('#')||separator<1)continue;
    const key=text.slice(0,separator).trim();
    const value=text.slice(separator+1).trim().replace(/^"|"$/g,'');
    if(!process.env[key])process.env[key]=value;
  }
}
