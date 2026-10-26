import Link from 'next/link';
import Image from 'next/image';
import { ProductsRack } from '@/components/products-rack';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { formatPrice } from '@/lib/store-data';
import { getCatalogProducts } from '@/lib/catalog';
import { getStorefrontSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [catalogProducts, settings] = await Promise.all([getCatalogProducts(), getStorefrontSettings()]);
  const featured = catalogProducts.filter((product) => product.featured).slice(0, 6);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <div className="eyebrow">Tamil Nadu coast · Sun-dried this week</div>
              <h1>Salted by the sea,<br /><em>dried under our sun.</em></h1>
              <p className="lead">Karuvadu sourced from Tamil Nadu fishing villages — cleaned, salted and sun-racked the traditional way, with no cold-storage shortcuts. Browse this week&apos;s availability and send an enquiry on WhatsApp.</p>
              <div className="hero-ctas">
                <Link className="btn btn-primary" href="#shop">Shop the catch</Link>
                <Link className="btn btn-outline" href="/how-we-dry">How we dry it</Link>
              </div>
              {settings?.heroStats.length ? <div className="hero-stats">{settings.heroStats.map((stat, index) => <div className="stat" key={`${stat.label}-${index}`}><div className="n">{stat.value}</div><div className="l">{stat.label}</div></div>)}</div> : null}
            </div>
            <div className="line-rig" role={featured.length ? 'img' : undefined} aria-label={featured.length ? 'Dry fish hanging on a line to dry in the sun' : undefined}>
              <div className="rope" />
              <div className="peg-row">{featured.map((product) => <div className="peg" key={product.id} />)}</div>
              <div className="hang-strip">
                {featured.map((product) => (
                  <Link className="hang-card" href={`/products/${product.slug}`} key={product.id} aria-label={`View ${product.name}`}>
                    <div className="clip" />
                    <div className="fish-ico">{product.image ? <Image src={product.image} alt={product.name} width={160} height={110} unoptimized /> : <span aria-hidden="true">{product.name.slice(0, 1)}</span>}</div>
                    <div className="name">{product.name}</div>
                    <div className="tag-price">from {formatPrice(product.price)}</div>
                  </Link>
                ))}
              </div>
              <div className="rope" />
            </div>
          </div>
        </section>
        <section className="trust-strip">
          <div className="wrap trust-grid">
            {(settings?.trustItems ?? []).map((item, index) => <div className="trust-item" key={`${index}-${item}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="8" /><path d="m8 12 2.5 2.5L16 9" /></svg><div><div className="t">{item}</div></div></div>)}
          </div>
        </section>
        <ProductsRack products={catalogProducts} />
        <section className="section" id="about" style={{ background: 'var(--sand-deep)' }}>
          <div className="wrap" style={{ maxWidth: 760 }}>
            <h2 style={{ fontSize: 26, marginBottom: 14 }}>From the drying yard to your kitchen</h2>
            <p style={{ color: 'var(--ink-soft)', lineHeight: 1.7, fontSize: 15 }}>Sudar Oli works with fishing families along the Rameswaram coast — cleaned, salted and sun-racked the traditional way, with no chemical dryers or bleaching agents. That&apos;s also why stock runs out some weeks rather than being backordered.</p>
            <Link className="btn btn-outline" style={{ marginTop: 18 }} href="/how-we-dry">See the full drying process →</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
