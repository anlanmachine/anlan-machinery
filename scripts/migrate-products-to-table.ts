import './load-local-env';
import {migrateLegacyProductsToTable} from '../lib/product-store';

async function main(){
  if(!process.argv.includes('--apply')){
    console.log('Dry run only. This command does not modify Neon without --apply.');
    console.log('Before migration, run: npm run products:audit');
    console.log('Then run: npm run products:migrate -- --apply');
    return;
  }
  console.log(JSON.stringify(await migrateLegacyProductsToTable(),null,2));
}
void main().catch(error=>{console.error(error instanceof Error?error.message:error);process.exitCode=1;});
