import Link from 'next/link';
import { BulkOrderForm } from '@/components/bulk-order-form';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getCatalogProducts } from '@/lib/catalog';
import { getStorefrontSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export default async function BulkOrderPage() {
  const [products, settings] = await Promise.all([getCatalogProducts(), getStorefrontSettings()]);
  return (
    <>
      <SiteHeader />
      <main id="view-bulk">
        <div className="wrap" style={{ paddingTop: 26 }}>
          <div className="breadcrumb"><Link href="/">Home</Link> / <Link href="/products">Shop</Link> / <span>Bulk Orders</span></div>
          <section style={{ maxWidth: 760, marginBottom: 32 }}>
            <div className="eyebrow">Bulk / wholesale</div>
            <h1 style={{ fontSize: 'clamp(30px,4vw,44px)', lineHeight: 1.08 }}>Custom orders for restaurants, caterers and stores.</h1>
            <p className="lead" style={{ marginTop: 16 }}>Choose the fish you need, set the quantity in 2 kg steps and send your request on WhatsApp. We will confirm availability and pricing there.</p>
          </section>
          <BulkOrderForm products={products} whatsappNumber={settings?.whatsappNumber ?? ''} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
