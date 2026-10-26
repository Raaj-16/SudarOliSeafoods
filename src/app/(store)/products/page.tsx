import { ProductsRack } from '@/components/products-rack';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getCatalogProducts } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await getCatalogProducts();
  return (
    <>
      <SiteHeader />
      <main><ProductsRack products={products} /></main>
      <SiteFooter />
    </>
  );
}
