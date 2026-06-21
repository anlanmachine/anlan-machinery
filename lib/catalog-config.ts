export const CATEGORY_LINKS=[
 {key:'excavator',path:'excavator',label:'Excavator',title:'XCMG Excavators'},
 {key:'loader',path:'loader',label:'Loader',title:'XCMG Loaders'},
 {key:'backhoe-loader',path:'backhoe-loader',label:'Backhoe Loader',title:'XCMG Backhoe Loaders'},
 {key:'roller',path:'roller',label:'Roller',title:'XCMG Road Rollers'},
 {key:'forklift',path:'forklift',label:'Forklift',title:'Forklift Sourcing'},
 {key:'grader',path:'motor-grader',label:'Motor Grader',title:'XCMG Motor Graders'},
 {key:'mixer',path:'concrete-mixer',label:'Concrete Mixer',title:'Self Loading Concrete Mixers'}
] as const;
export type CatalogCategory='excavator'|'loader'|'roller'|'grader'|'mixer';
export type ProductNavKey=typeof CATEGORY_LINKS[number]['key'];
export const categoryForProduct=(category:string)=>CATEGORY_LINKS.find(item=>item.key===category)||CATEGORY_LINKS[0];
