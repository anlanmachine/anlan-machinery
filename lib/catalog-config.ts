export const CATEGORY_LINKS=[
 {key:'excavator',path:'excavator',label:'Excavator',title:'XCMG Excavators'},
 {key:'loader',path:'loader',label:'Loader',title:'XCMG Loaders'},
 {key:'backhoe-loader',path:'backhoe-loader',label:'Backhoe Loader',title:'XCMG Backhoe Loaders'},
 {key:'roller',path:'roller',label:'Roller',title:'XCMG Road Rollers'},
 {key:'forklift',path:'forklift',label:'Forklift',title:'Forklift Sourcing'},
 {key:'dump-truck',path:'dump-truck',label:'Dump Truck',title:'Dump Trucks'},
 {key:'grader',path:'motor-grader',label:'Motor Grader',title:'XCMG Motor Graders'},
 {key:'crane',path:'crane',label:'Crane',title:'Cranes'},
 {key:'mixer',path:'concrete-mixer',label:'Concrete Mixer',title:'Self Loading Concrete Mixers'}
] as const;
export type CatalogCategory=typeof CATEGORY_LINKS[number]['key'];
export type ProductNavKey=typeof CATEGORY_LINKS[number]['key'];
export const categoryForProduct=(category:string)=>CATEGORY_LINKS.find(item=>item.key===category)||CATEGORY_LINKS[0];

export const PRODUCT_CATEGORY_OPTIONS=[
 {value:'excavator',label:'Excavator',subCategory:'crawler-excavator'},
 {value:'loader',label:'Loader',subCategory:'wheel-loader'},
 {value:'backhoe-loader',label:'Backhoe Loader',subCategory:'backhoe-loader'},
 {value:'roller',label:'Road Roller',subCategory:'single-drum-roller'},
 {value:'forklift',label:'Forklift',subCategory:'forklift'},
 {value:'dump-truck',label:'Dump Truck',subCategory:'dump-truck'},
 {value:'grader',label:'Motor Grader',subCategory:'motor-grader'},
 {value:'crane',label:'Crane',subCategory:'crane'},
 {value:'mixer',label:'Concrete Mixer',subCategory:'self-loading-concrete-mixer'}
] as const;

const CATEGORY_ALIASES:Record<string,CatalogCategory>={
 excavator:'excavator',loader:'loader','backhoe-loader':'backhoe-loader',backhoe:'backhoe-loader',
 'road-roller':'roller',roller:'roller',forklift:'forklift','dump-truck':'dump-truck',
 'motor-grader':'grader',grader:'grader',crane:'crane','concrete-mixer':'mixer',mixer:'mixer'
};
const VALID_SUBCATEGORIES:Record<CatalogCategory,string[]>={
 excavator:['crawler-excavator','wheel-excavator','mini-excavator'],loader:['wheel-loader','skid-steer-loader'],
 'backhoe-loader':['backhoe-loader'],roller:['single-drum-roller','pneumatic-roller'],forklift:['forklift'],
 'dump-truck':['dump-truck'],grader:['motor-grader'],crane:['crane'],mixer:['self-loading-concrete-mixer']
};
export function normalizeProductCategory(value:string):CatalogCategory|null{
 const key=value.toLowerCase().trim().replace(/[ _]+/g,'-');
 return CATEGORY_ALIASES[key]||null;
}
export function defaultSubCategory(category:CatalogCategory){return PRODUCT_CATEGORY_OPTIONS.find(option=>option.value===category)!.subCategory;}
export function normalizeSubCategory(category:CatalogCategory,value:string){
 const key=value.toLowerCase().trim().replace(/[ _]+/g,'-');
 return VALID_SUBCATEGORIES[category].includes(key)?key:defaultSubCategory(category);
}
