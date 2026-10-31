import type {CatalogCategory} from './catalog-config';

export const PRODUCT_STATUSES=['Published','Draft','Archived','Deleted'] as const;
export type ProductStatus=(typeof PRODUCT_STATUSES)[number];

export type ProductRecord={
  id:string;
  brand:string;
  name:string;
  model:string;
  category:CatalogCategory;
  subCategory:string;
  source?:'xcmg'|'pdf'|'manual'|string;
  image:string;
  images:string[];
  description:string;
  shortDescription?:string;
  specifications:Record<string,string>|string;
  engine?:string;
  operatingWeight?:string;
  bucketCapacity?:string;
  ratedPower?:string;
  dimension?:string;
  fobPrice?:string;
  moq?:string;
  deliveryTime?:string;
  seaFreight?:string;
  destinationPort?:string;
  cifPrice?:string;
  deposit30?:string;
  balance70?:string;
  validity?:string;
  video?:string;
  pdfBrochure?:string;
  seoTitle?:string;
  seoDescription?:string;
  slug?:string;
  status?:ProductStatus|string;
  localOnly?:true;
  createdAt?:string;
  updatedAt?:string;
  deletedAt?:string|null;
};

export type ProductHealth={
  total:number;
  published:number;
  draft:number;
  archived:number;
  trash:number;
  missingImages:ProductRecord[];
  duplicateModels:Array<{key:string;products:ProductRecord[]}>;
  duplicateSlugs:Array<{key:string;products:ProductRecord[]}>;
  invalidCategories:ProductRecord[];
  emptyModels:ProductRecord[];
  missingDescriptions:ProductRecord[];
  invalidStatuses:ProductRecord[];
};
