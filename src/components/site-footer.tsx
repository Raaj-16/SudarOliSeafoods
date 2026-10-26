import Link from 'next/link';
import Image from 'next/image';
import { Camera, UsersRound, MessageCircle } from 'lucide-react';
import { getCatalogProducts } from '@/lib/catalog';
import { getStorefrontSettings } from '@/lib/site-settings';

export async function SiteFooter() {
  const [fishProducts, settings] = await Promise.all([getCatalogProducts(), getStorefrontSettings()]);
  return (
    <footer>
      <div className="wrap footer-top">
        <div className="footer-brand">
          <Image className="footer-logo" src="/logo-440.png" alt="Sudar Oli Dry Sea Foods emblem" width={76} height={76} />
          <p>Traditional sun-dried fish and prawns from the Tamil Nadu coast, sourced by availability and packed fresh for delivery across Tamil Nadu.</p>
          <div className="social-row" aria-label="Social links">
            {settings?.instagramUrl && <a href={settings.instagramUrl} aria-label="Instagram" target="_blank" rel="noreferrer"><Camera size={15} /></a>}
            {settings?.whatsappNumber && <a href={`https://wa.me/${settings.whatsappNumber}`} aria-label="WhatsApp" target="_blank" rel="noreferrer"><MessageCircle size={15} /></a>}
            {settings?.facebookUrl && <a href={settings.facebookUrl} aria-label="Facebook" target="_blank" rel="noreferrer"><UsersRound size={15} /></a>}
          </div>
        </div>

        <div>
          <h5>Shop</h5>
          <ul>
            {fishProducts.map((product) => <li key={product.slug}><Link href={`/products/${product.slug}`}>{product.name}</Link></li>)}
          </ul>
        </div>

        <div>
          <h5>Shop info</h5>
          <ul>
            <li><Link href="/how-we-dry">Our process</Link></li>
            <li><Link href="/bulk-order">Bulk / wholesale orders</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
            <li><Link href="/shipping">Shipping</Link></li>
            <li><Link href="/refunds">Returns &amp; refunds</Link></li>
          </ul>
        </div>

        <div>
          <h5>Contact</h5>
          <ul>
            {settings?.address && <li>{settings.mapUrl ? <a href={settings.mapUrl} target="_blank" rel="noreferrer">{settings.address}</a> : settings.address}</li>}
            {settings?.phoneNumbers.map((phone) => <li key={phone}><a href={`tel:${phone.replace(/\D/g, '')}`}>{phone}</a></li>)}
            {settings?.email && <li><a href={`mailto:${settings.email}`}>{settings.email}</a></li>}
            {settings?.hours && <li>{settings.hours}</li>}
            {!settings && <li>Store contact details are being configured.</li>}
          </ul>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <p>© 2026 Sudar Oli Dry Sea Foods. All rights reserved. · <Link href="/login">Login</Link></p>
        {settings?.fssaiLicense && <p className="fssai">FSSAI Lic. No. {settings.fssaiLicense}</p>}
      </div>
    </footer>
  );
}
