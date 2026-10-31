import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {productSpecifications} from '../lib/catalog';
import {normalizeProduct} from '../lib/product-store';
test('public specification formatting does not mutate a shared request result',()=>{
  const p=normalizeProduct({model:'TEST',brand:'XCMG',category:'loader',specifications:{Weight:'100'},engine:'Example'});
  const before=JSON.stringify(p);
  assert.ok(productSpecifications(p).some(([key])=>key==='Engine'));
  assert.equal(JSON.stringify(p),before);
});
test('catalog memoization is request scoped, not a cache of private records',async()=>{
  const source=await readFile('lib/catalog.ts','utf8');
  assert.match(source,/getCatalog=cache/);
  assert.match(source,/publishedOnly:true/);
  assert.doesNotMatch(source,/unstable_cache|setInterval/);
});
test('liveness route is independent of database',async()=>{
  const source=await readFile('app/api/live/route.ts','utf8');
  assert.doesNotMatch(source,/from ['"].*(?:store|db|neon)/);
  assert.match(source,/not-checked/);
});
test('read collection does not issue schema DDL on cold requests',async()=>{
  const source=await readFile('lib/cms-store.ts','utf8');
  const reader=source.slice(source.indexOf('export async function readCollection'),source.indexOf('export async function writeCollection'));
  assert.doesNotMatch(reader,/await ensureSchema/);
  assert.match(source.slice(source.indexOf('export async function writeCollection')),/await ensureSchema/);
});
