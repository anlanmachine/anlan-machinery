import './load-local-env';
import {readFile} from 'fs/promises';
import path from 'path';
import {createCatalogBackup,createProduct,getProducts,migrateLegacyProductsToTable,productIdentity} from '../lib/product-store';
import type {ProductRecord} from '../lib/product-types';

type Candidate={source:string;product:ProductRecord;safe:boolean;needsReview:boolean;reasons:string[]};
type Report={database:{available:boolean;error?:string};recoveryCandidates:Candidate[]};
const apply=process.argv.includes('--apply'),dryRun=process.argv.includes('--dry-run')||!apply;

async function main(){
  const report=JSON.parse(await readFile(path.join(process.cwd(),'diagnostics','product-recovery-report.json'),'utf8')) as Report;
  const safe=report.recoveryCandidates.filter(item=>item.safe&&!item.needsReview);
  const review=report.recoveryCandidates.filter(item=>item.needsReview);
  if(!report.database.available){
    console.log('Current products: DATABASE_UNAVAILABLE');
    console.log(`Would restore: ${safe.map(item=>item.product.model).join(', ')||'none'}`);
    console.log(`Would require manual review: ${review.map(item=>item.product.model||item.product.id).join(', ')||'none'}`);
    if(dryRun){console.log(`Recovery is disabled until the database read succeeds: ${report.database.error||'unknown error'}`);return;}
    throw new Error(`Recovery is disabled because the read-only database audit failed: ${report.database.error||'unknown error'}`);
  }
  const current=await getProducts({includeDeleted:true});
  const identities=new Set(current.map(productIdentity));
  const candidates=safe.filter(item=>!identities.has(productIdentity(item.product)));
  const skipped=safe.filter(item=>identities.has(productIdentity(item.product)));
  console.log(`Current products: ${current.length}`);
  console.log(`Would restore: ${candidates.map(item=>item.product.model).join(', ')||'none'}`);
  console.log(`Would skip duplicates: ${skipped.map(item=>item.product.model).join(', ')||'none'}`);
  console.log(`Would require manual review: ${review.map(item=>item.product.model||item.product.id).join(', ')||'none'}`);
  console.log(`Final projected count: ${current.length+candidates.length}`);
  if(dryRun)return;
  await migrateLegacyProductsToTable();
  await createCatalogBackup('before-product-recovery');
  let added=0;
  for(const candidate of candidates){await createProduct(candidate.product);added++;}
  const after=await getProducts({includeDeleted:true});
  console.log(JSON.stringify({before:current.length,added,after:after.length,skippedDuplicates:skipped.length,manualReview:review.length},null,2));
}
void main().catch(error=>{console.error(error instanceof Error?error.message:error);process.exitCode=1;});
