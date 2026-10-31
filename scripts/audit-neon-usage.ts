import {readFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {neon} from '@neondatabase/serverless';

// Aggregate diagnostics only. No user/order rows, credentials or SQL text exported.
async function main(){
  const file=process.argv[2]||'.env';
  const env=parseEnv(await readFile(file,'utf8'));
  if(!env.DATABASE_URL)throw new Error('DATABASE_URL missing');
  const u=new URL(env.DATABASE_URL);
  const db=neon(env.DATABASE_URL);
  const identity={endpoint:u.hostname.replace('-pooler',''),database:u.pathname,pooled:u.hostname.includes('-pooler')};
  try{
    const results=await db.transaction([
      db`SELECT pg_database_size(current_database())::text AS database_bytes`,
      db`SELECT relname AS table_name,n_live_tup::text AS estimated_rows,pg_total_relation_size(relid)::text AS total_bytes FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC LIMIT 20`,
      db`SELECT state,count(*)::int AS connections FROM pg_stat_activity WHERE datname=current_database() GROUP BY state`,
      db`SELECT extname FROM pg_extension WHERE extname IN ('pg_cron','pg_stat_statements')`
    ],{readOnly:true});
    console.log(JSON.stringify({identity,readOnly:true,databaseSize:results[0],tables:results[1],connections:results[2],extensions:results[3]},null,2));
  }catch(error){
    const message=error instanceof Error?error.message:'Read failed';
    console.log(JSON.stringify({identity,readOnly:true,available:false,reason:message.includes('402')?'NEON_QUOTA_EXCEEDED_402':'CONNECTION_FAILED',databaseSize:'UNKNOWN',cuHours:'Not available through SQL; requires Neon usage dashboard'},null,2));
    process.exitCode=2;
  }
}
main().catch(()=>{console.error('Could not read the requested environment file. No credentials printed.');process.exitCode=1;});
