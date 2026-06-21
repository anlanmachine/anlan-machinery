import {getCategoryProducts} from '@/lib/catalog';
import {CATEGORY_LINKS,type CatalogCategory} from '@/lib/catalog-config';
import {CategoryNavigation} from './category-navigation';
import {ProductListSection} from './product-list-section';

export async function ProductCategoryPage({category,intro}:{category:CatalogCategory;intro:string}){
  const config=CATEGORY_LINKS.find(item=>item.key===category)!;
  const products=await getCategoryProducts(category);
  return <section className="section pt-36"><div className="wrap">
    <p className="eyebrow">New machinery catalog</p><h1 className="title mt-3">{config.title}</h1><p className="sub mt-5">{intro}</p>
    <CategoryNavigation active={category}/>
    <ProductListSection products={products}/>
  </div></section>;
}
