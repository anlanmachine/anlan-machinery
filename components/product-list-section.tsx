import {productDescription,productPath,productSpecifications,type CatalogProduct} from '@/lib/catalog';
import {ProductSearchList,type ProductSearchCard} from './product-search-list';

function toSearchCard(product:CatalogProduct):ProductSearchCard{
  return {
    id:product.id,
    brand:product.brand||'XCMG',
    name:product.name,
    model:product.model,
    category:product.category,
    subCategory:product.subCategory,
    subCategoryLabel:product.subCategory.replaceAll('-',' '),
    image:product.image,
    href:`/products/${productPath(product)}`,
    description:productDescription(product),
    specs:productSpecifications(product).slice(0,6)
  };
}

export function ProductListSection({products,emptyMessage,searchLabel,searchPlaceholder}:{products:CatalogProduct[];emptyMessage?:string;searchLabel?:string;searchPlaceholder?:string}){
  return <ProductSearchList products={products.map(toSearchCard)} emptyMessage={emptyMessage} searchLabel={searchLabel} searchPlaceholder={searchPlaceholder}/>;
}
