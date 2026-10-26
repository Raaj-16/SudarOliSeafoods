'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Heart, MessageCircle } from 'lucide-react';
import { formatPrice, type Product } from '@/lib/store-data';
import { formatWeightLabel, variantMessage } from '@/lib/availability';
import { addToCart, MAX_PER_LINE } from '@/lib/cart-store';
import { useFavoriteIds, writeFavoriteIds } from '@/lib/favorites-store';
import { productEnquiryMessage, whatsappLink } from '@/lib/whatsapp-enquiry';
import { ProductCard } from '@/components/product-card';

const accordionItems = [
  { title: 'Storage & shelf life', body: 'Keep away from the refrigerator or store in an airtight container away from moisture. Best used within 3 months of purchase for full flavour. Sun-dried fish naturally intensifies in saltiness over time — a light rinse before cooking is recommended.' },
  { title: 'Delivery & packaging', body: 'Vacuum-sealed in food-grade pouches to control odour in transit. Chennai orders placed before 3 PM are delivered the same day. Other Tamil Nadu districts: 2–3 working days.' },
  { title: "Where it's from", body: 'Sourced weekly from fishing families along the Tamil Nadu coast. Batches are seasonal — availability shifts with the catch, weather and drying time, which is why some weeks a variety may run low or sell out.' },
];

export function ProductDetailInteractions({ product, related, whatsappNumber }: { product: Product; related: Product[]; whatsappNumber: string }) {
  const router = useRouter();
  const favourites = useFavoriteIds();
  const firstAvailable = Math.max(0, product.variants.findIndex((item) => item.stock > 0));
  const [variantIndex, setVariantIndex] = useState(firstAvailable);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState([true, true, true]);
  const [notice, setNotice] = useState('');

  const variant = product.variants[variantIndex];
  const isFavourite = favourites.includes(product.id);
  const status = variant ? variantMessage(variant) : null;
  const soldOut = !variant || variant.stock <= 0;
  const maxQty = variant ? Math.max(1, Math.min(variant.stock, MAX_PER_LINE)) : 1;
  const total = variant ? variant.price * quantity : 0;
  const { availability } = product;
  const imageBadgeClass = availability.state === 'out' ? 'out' : availability.state === 'ok' ? 'ok' : 'low';
  const enquiryLink = variant && !soldOut ? whatsappLink(whatsappNumber, productEnquiryMessage(product.name, variant.label, quantity, variant.price)) : '';

  function add() {
    if (!variant || soldOut) return false;
    const added = addToCart({ productId: product.id, name: product.name, image: product.image, variant: variant.label, price: variant.price }, quantity, variant.stock);
    setNotice(added > 0 ? `${product.name} (${variant.label}) added to your cart.` : `You already have all ${variant.stock} available in your cart.`);
    return added > 0;
  }

  function toggleFavorite() {
    writeFavoriteIds(isFavourite ? favourites.filter((id) => id !== product.id) : [...favourites, product.id]);
    setNotice(isFavourite ? 'Removed from favourites.' : 'Added to favourites.');
  }

  return (
    <>
      <div className="wrap" style={{ paddingTop: 26 }}>
        <div className="breadcrumb"><Link href="/">Home</Link> / <Link href="/products">Shop</Link> / <span>{product.name}</span></div>
        <div className="pdp-grid">
          <div>
            <div className="pdp-gallery-main">
              <span className={`badge ${imageBadgeClass}`}>{availability.badge}</span>
              {product.image ? <Image src={product.image} alt={product.name} width={720} height={720} /> : <span className="empty-product-image" aria-hidden="true">{product.name.slice(0, 1)}</span>}
            </div>
          </div>
          <div>
            <div className="pdp-local">{product.local}</div>
            <h1 className="pdp-title">{product.name}</h1>
            <div className="pdp-meta-row"><span style={{ color: 'var(--line)' }}>|</span><span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{product.category === 'Raw' ? 'Raw fish' : 'Cleaned fish'}</span></div>
            <p className="pdp-desc">{product.description} Sourced and salted within a day of landing, then dried on open racks for a natural, additive-free finish.</p>

            {product.variants.length === 0 ? (
              <div className="notify-box"><h4>No pack sizes listed yet</h4><p>Ask us on WhatsApp for today&apos;s availability.</p></div>
            ) : (
              <>
                {status && (
                  <div className="stock-panel">
                    <div className="stock-row"><span className={`dot ${status.state === 'last' ? 'low' : status.state}`} />{status.title}</div>
                    <div className="stock-sub">{status.detail}</div>
                  </div>
                )}
                <div className="weight-select">
                  <div className="label">Choose weight</div>
                  <div className="weight-opts">
                    {product.variants.map((item, index) => (
                      <button type="button" key={item.label} className={`wopt${index === variantIndex ? ' active' : ''}`} disabled={item.stock <= 0} onClick={() => { setVariantIndex(index); setQuantity((current) => Math.max(1, Math.min(current, item.stock, MAX_PER_LINE))); }}>
                        <span className="g">{item.label}{item.stock <= 0 ? ' · Sold out' : item.stock === 1 ? ` · Only ${formatWeightLabel(item.label)} is pending` : ''}</span>
                        <span className="p">{formatPrice(item.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="qty-row" style={soldOut ? { opacity: 0.35, pointerEvents: 'none' } : undefined}>
                  <div className="stepper">
                    <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
                    <div className="val">{quantity}</div>
                    <button type="button" aria-label="Increase quantity" disabled={quantity >= maxQty} onClick={() => setQuantity((value) => Math.min(maxQty, value + 1))}>+</button>
                  </div>
                  <div className="total-line">Total: <b>{formatPrice(total)}</b></div>
                </div>
                <div className="pdp-actions">
                  <button type="button" className="btn btn-primary btn-block" style={{ flex: 1 }} disabled={soldOut} onClick={add}>{soldOut ? 'Sold out' : 'Add to cart'}</button>
                  <button type="button" className="btn btn-outline" disabled={soldOut} onClick={() => { if (add()) router.push('/cart'); }}>Buy now <ArrowRight size={16} /></button>
                  <button type="button" className={`icon-btn${isFavourite ? ' active' : ''}`} aria-pressed={isFavourite} aria-label={isFavourite ? 'Remove from favourites' : 'Save to favourites'} onClick={toggleFavorite}><Heart size={17} fill={isFavourite ? 'currentColor' : 'none'} /></button>
                </div>
                {enquiryLink && <a className="btn btn-outline btn-block wa-btn" style={{ marginTop: 10 }} href={enquiryLink} target="_blank" rel="noreferrer"><MessageCircle size={16} aria-hidden="true" /> Enquire about this on WhatsApp</a>}
              </>
            )}

            {notice && <p role="status" style={{ color: 'var(--sea)', fontSize: 13 }}>{notice} <Link href="/cart">View cart</Link></p>}
            {availability.state === 'out' && <div className="notify-box"><h4>Out of stock right now</h4><p>Contact us about the next batch and we will confirm availability.</p><Link className="btn btn-rust btn-sm" href="/contact">Contact the shop</Link></div>}
            <div className="accordion">{accordionItems.map((item, index) => <div className={`acc-item${openAccordion[index] ? ' open' : ''}`} key={item.title}><button type="button" className="acc-head" onClick={() => setOpenAccordion((items) => items.map((value, itemIndex) => itemIndex === index ? !value : value))}>{item.title}<span className="plus">+</span></button><div className="acc-body">{item.body}</div></div>)}</div>
          </div>
        </div>
        {related.length > 0 && <div className="related-strip"><h3 style={{ fontSize: 20, marginBottom: 16 }}>You may also like</h3><div className="grid">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></div>}
      </div>
      <div style={{ height: 50 }} />
    </>
  );
}
