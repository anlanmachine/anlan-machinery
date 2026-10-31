import {normalizeProductCategory,type CatalogCategory} from './catalog-config';
import {slugify} from './cms-store';
import {getProducts} from './product-store';
import type {ProductRecord} from './product-types';
import {cache} from 'react';

export type CatalogProduct=ProductRecord;

// Request-local only: metadata and page rendering share one read, while the next
// request (including one after an admin edit) always sees current data.
export const getCatalog=cache(async ():Promise<CatalogProduct[]>=>{
  return getProducts({publishedOnly:true});
});
export async function getCategoryProducts(category:CatalogCategory){
  const products=await getCatalog();
  const normalized=normalizeProductCategory(String(category))||category;
  if(normalized==='backhoe-loader')return products.filter(product=>product.category==='backhoe-loader'||product.subCategory==='backhoe-loader'||/backhoe/i.test(product.name));
  if(normalized==='loader')return products.filter(product=>product.category==='loader'&&product.subCategory!=='backhoe-loader');
  return products.filter(product=>product.category===normalized);
}
export const productSlug=(modelOrSlug:string)=>slugify(modelOrSlug);
export const productPath=(product:CatalogProduct)=>product.slug?slugify(product.slug):slugify(`${product.brand||'xcmg'}-${product.model}`);
const mojibake=/[�鈥鲁鍗鎿閾鍙鏈椤脳锝鈮\u3400-\u9fff]/;
export function productDescription(product:CatalogProduct){
  const text=(product.shortDescription||product.description||'').replace(/\s+/g,' ').trim();
  const machineName=`${product.brand||'XCMG'} ${product.model}`.trim().toLowerCase();
  const looksLikeImportedDocument=/proforma invoice|pending exact-model|outline dimensions|main specifications|product brochure|image source|verification status|configuration parameters|manufacturer|customer service|unit address|no further information|(?:\b[A-Z]\s){5}/i.test(text);
  const isOnlyIdentifier=text.toLowerCase()===machineName||text.toLowerCase()===String(product.model||'').toLowerCase()||text.length<24;
  if(!text||mojibake.test(text)||looksLikeImportedDocument||isOnlyIdentifier||text.length>420)return `Factory-new ${product.brand||'XCMG'} ${product.model} ${product.subCategory.replaceAll('-',' ')} available for international delivery, with quotation and shipping support from AOLAN Machinery.`;
  return text;
}
export function productSpecifications(product:CatalogProduct){
  const specs:Record<string,string>=typeof product.specifications==='string'?Object.fromEntries(product.specifications.split('\n').map(line=>{const index=line.indexOf(':');return index>0?[line.slice(0,index).trim(),line.slice(index+1).trim()]:['',''];}).filter(([key,value])=>key&&value)):{...product.specifications};
  const optionalSpecs:Array<[string,string|undefined]>=[['Engine',product.engine],['Operating Weight',product.operatingWeight],['Bucket Capacity',product.bucketCapacity],['Rated Power',product.ratedPower],['Dimension',product.dimension],['FOB Price',product.fobPrice],['MOQ',product.moq],['Delivery Time',product.deliveryTime]];
  for(const [key,value] of optionalSpecs)if(value&&!specs[key])specs[key]=value;
  return Object.entries(specs).filter(([key,value])=>!['Source','Image Source','Verification Status'].includes(key)&&!mojibake.test(`${key}${value}`));
}
