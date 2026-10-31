import assert from 'node:assert/strict';
import test from 'node:test';
import {getCategoryProducts} from '../lib/catalog';
import {CatalogSafetyError,assertSafeCatalogReduction,canonicalModel,normalizeProduct,productIdentity} from '../lib/product-store';

delete process.env.DATABASE_URL;

test('bulk catalog reduction from 100 to 20 is blocked',()=>{
  assert.throws(()=>assertSafeCatalogReduction(100,20),CatalogSafetyError);
  assert.doesNotThrow(()=>assertSafeCatalogReduction(100,20,true));
});

test('model identity ignores case, spaces, underscores and hyphens',()=>{
  assert.equal(canonicalModel('XE60GA PRO'),'XE60GA-PRO');
  assert.equal(productIdentity(normalizeProduct({brand:'XCMG',model:'XE60GA PRO'})),productIdentity(normalizeProduct({brand:'xcmg',model:'xe60ga-pro'})));
});

test('legacy grader and mixer categories remain visible on their category pages',async()=>{
  assert.ok((await getCategoryProducts('grader')).length>0);
  assert.ok((await getCategoryProducts('mixer')).length>0);
});

test('a product without a cover image remains a product and receives the placeholder',()=>{
  const product=normalizeProduct({id:'test-image',brand:'XCMG',model:'TEST',category:'loader',images:[]});
  assert.equal(product.image,'/uploads/placeholder-machine.svg');
  assert.equal(product.images[0],'/uploads/placeholder-machine.svg');
});
