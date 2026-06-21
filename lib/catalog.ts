import {readFile} from 'fs/promises';import path from 'path';import type {CatalogCategory} from './catalog-config';import {readCollection,slugify} from './cms-store';
export type CatalogProduct={id:string;brand:string;name:string;model:string;category:CatalogCategory;subCategory:string;source?:'xcmg'|'pdf'|'manual';image:string;images:string[];description:string;shortDescription?:string;specifications:Record<string,string>|string;engine?:string;operatingWeight?:string;bucketCapacity?:string;ratedPower?:string;dimension?:string;fobPrice?:string;moq?:string;deliveryTime?:string;video?:string;pdfBrochure?:string;seoTitle?:string;seoDescription?:string;slug?:string;status?:string;localOnly?:true};
function normalizeCategory(value:string):CatalogCategory{
  const key=value.toLowerCase().replaceAll(' ','-') as CatalogCategory;
  if(key==='motor-grader')return 'grader';
  if(key==='road-roller')return 'roller';
  if(key==='concrete-mixer')return 'mixer';
  return key;
}
function normalizeProduct(product:CatalogProduct):CatalogProduct{
  const category=normalizeCategory(String(product.category||'excavator'));
  const images=(Array.isArray(product.images)?product.images:[]).filter(Boolean);
  return {...product,category,subCategory:product.subCategory||category,image:product.image||images[0]||'/uploads/placeholder-machine.svg',images:images.length?images:[product.image||'/uploads/placeholder-machine.svg'],status:product.status||'Published'};
}
export async function getCatalog():Promise<CatalogProduct[]>{
  let fallback:CatalogProduct[]=[];
  try{fallback=JSON.parse(await readFile(path.join(process.cwd(),'data','products.json'),'utf8'));}catch{}
  return (await readCollection<CatalogProduct[]>('products',fallback)).map(normalizeProduct).filter(product=>product.status!=='Draft');
}
export async function getCategoryProducts(category:CatalogCategory){
  const products=await getCatalog();
  if(category==='backhoe-loader')return products.filter(product=>product.category==='backhoe-loader'||product.subCategory==='backhoe-loader'||/backhoe/i.test(product.name));
  if(category==='loader')return products.filter(product=>product.category==='loader'&&product.subCategory!=='backhoe-loader');
  return products.filter(product=>product.category===category);
}
export const productSlug=(modelOrSlug:string)=>slugify(modelOrSlug);
export const productPath=(product:CatalogProduct)=>product.slug?slugify(product.slug):slugify(`${product.brand||'xcmg'}-${product.model}`);
const mojibake=/[�鈥鲁鍗鎿閾鍙鏈椤脳锝鈮\u3400-\u9fff]/;
export function productDescription(product:CatalogProduct){
  const text=product.shortDescription||product.description;
  if(!text||mojibake.test(text)||/proforma invoice|pending exact-model|(?:\b[A-Z]\s){5}/i.test(text))return `Factory-new ${product.brand||'XCMG'} ${product.model} ${product.subCategory.replaceAll('-',' ')} available for international delivery, with quotation and shipping support from ANLAN Machinery.`;
  return text;
}
export function productSpecifications(product:CatalogProduct){
  const specs:Record<string,string>=typeof product.specifications==='string'?Object.fromEntries(product.specifications.split('\n').map(line=>{const index=line.indexOf(':');return index>0?[line.slice(0,index).trim(),line.slice(index+1).trim()]:['',''];}).filter(([key,value])=>key&&value)):product.specifications||{};
  for(const [key,value] of [['Engine',product.engine],['Operating Weight',product.operatingWeight],['Bucket Capacity',product.bucketCapacity],['Rated Power',product.ratedPower],['Dimension',product.dimension],['FOB Price',product.fobPrice],['MOQ',product.moq],['Delivery Time',product.deliveryTime]])if(value&&!specs[key])specs[key]=value;
  return Object.entries(specs).filter(([key,value])=>!['Source','Image Source','Verification Status'].includes(key)&&!mojibake.test(`${key}${value}`));
}
