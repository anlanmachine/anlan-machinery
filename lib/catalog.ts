import {readFile} from 'fs/promises';import path from 'path';import type {CatalogCategory} from './catalog-config';
export type CatalogProduct={id:string;brand:string;name:string;model:string;category:CatalogCategory;subCategory:string;source:'xcmg'|'pdf';image:string;images:string[];description:string;specifications:Record<string,string>;localOnly:true};
export async function getCatalog():Promise<CatalogProduct[]>{return JSON.parse(await readFile(path.join(process.cwd(),'data','products.json'),'utf8'));}
export async function getCategoryProducts(category:CatalogCategory){return (await getCatalog()).filter(product=>product.category===category);}
export const productSlug=(model:string)=>model.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
const mojibake=/[�鈥鲁鍗鎿閾鍙鏈椤脳锝鈮\u3400-\u9fff]/;
export function productDescription(product:CatalogProduct){
  if(!product.description||mojibake.test(product.description)||/proforma invoice|pending exact-model|(?:\b[A-Z]\s){5}/i.test(product.description))return `Factory-new XCMG ${product.model} ${product.subCategory.replaceAll('-',' ')} available for international delivery, with quotation and shipping support from ANLAN Machinery.`;
  return product.description;
}
export function productSpecifications(product:CatalogProduct){
  return Object.entries(product.specifications||{}).filter(([key,value])=>!['Source','Image Source','Verification Status'].includes(key)&&!mojibake.test(`${key}${value}`));
}
