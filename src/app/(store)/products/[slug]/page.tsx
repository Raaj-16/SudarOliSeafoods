import { notFound } from 'next/navigation';
import { ProductDetailInteractions } from '@/components/product-detail-interactions';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getCatalogProductBySlug, getCatalogProducts } from '@/lib/catalog';
import { getStorefrontSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, settings, catalogProducts] = await Promise.all([
    getCatalogProductBySlug(slug),
    getStorefrontSettings(),
    getCatalogProducts(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main><ProductDetailInteractions product={product} related={catalogProducts.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 4)} whatsappNumber={settings?.whatsappNumber ?? ''} /></main>
      <SiteFooter />
    </>
  );
}
