import {CATEGORY_LINKS,DEFAULT_PRODUCT_CATEGORIES} from './catalog-config';
import {readCollection,slugify} from './cms-store';

export type SiteCategory={id:string;label:string;subCategory:string;path:string;isCustom:boolean};

function text(value:unknown){return String(value??'').trim();}
const placeholderId=/^productcategories-item(?:-\d+)?$/;

export async function getSiteCategories():Promise<SiteCategory[]>{
  let saved:Record<string,unknown>[]=DEFAULT_PRODUCT_CATEGORIES;
  try{
    const items=await readCollection<Record<string,unknown>[]>('productCategories',DEFAULT_PRODUCT_CATEGORIES);
    if(Array.isArray(items))saved=items;
  }catch{/* Keep built-in navigation available when the CMS is unavailable. */}
  const byId=new Map<string,SiteCategory>();
  for(const item of CATEGORY_LINKS){
    const stored=saved.find(entry=>text(entry.id)===item.key);
    byId.set(item.key,{id:item.key,label:text(stored?.label)||item.label,subCategory:text(stored?.subCategory)||item.key,path:`/products/${item.path}`,isCustom:false});
  }
  for(const item of saved){
    const originalId=text(item.id);
    const label=text(item.label)||text(item.name);
    if(!label)continue;
    // Older CMS versions assigned the same placeholder ID to every new category.
    // Use a label-derived public identity without changing production data on GET.
    const id=placeholderId.test(originalId)?slugify(label):slugify(originalId||label);
    if(!id||byId.has(id))continue;
    byId.set(id,{id,label,subCategory:text(item.subCategory)||id,path:`/products/categories/${id}`,isCustom:true});
  }
  return [...byId.values()];
}
