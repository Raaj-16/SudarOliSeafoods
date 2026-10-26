'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { MessageCircle, ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/store-data';
import { getCartSnapshot, getServerCartSnapshot, MAX_PER_LINE, parseCartSnapshot, subscribeCart, writeCart, type CartItem } from '@/lib/cart-store';
import { buildEnquiryMessage, whatsappLink } from '@/lib/whatsapp-enquiry';

type LiveStock = Record<string, { name: string; image: string; variants: Record<string, { stock: number; price: number }> }>;
const lineKey = (item: Pick<CartItem, 'productId' | 'variant'>) => `${item.productId}::${item.variant}`;

export function CartContent() {
  const loaded = useSyncExternalStore(() => () => {}, () => true, () => false);
  const cartSnapshot = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const items = useMemo(() => parseCartSnapshot(cartSnapshot), [cartSnapshot]);
  const [live, setLive] = useState<LiveStock | null>(null);
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [place, setPlace] = useState('');

  // Refresh prices and stock from the shop so the customer never sees stale numbers.
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/catalog', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.ok || !Array.isArray(result.products)) throw new Error('Catalog unavailable.');
        return result as {
          products: Array<{
            slug: string;
            name: string;
            image: string;
            variants: Array<{ label: string; stock: number; price: number }>;
          }>;
          whatsappNumber?: string;
        };
      })
      .then((result) => {
        if (controller.signal.aborted) return;
        setWhatsappNumber(typeof result.whatsappNumber === 'string' ? result.whatsappNumber : '');
        const next: LiveStock = {};
        for (const product of result.products) {
          next[product.slug] = {
            name: product.name,
            image: product.image,
            variants: Object.fromEntries(product.variants.map((variant) => [variant.label, { stock: variant.stock, price: variant.price }])),
          };
        }
        setLive(next);
        setCatalogStatus('ready');
      })
      .catch(() => { if (!controller.signal.aborted) setCatalogStatus('error'); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (catalogStatus !== 'ready' || !live) return;

    let changed = false;
    const syncedItems = items.map((item) => {
      const product = live[item.productId];
      const variant = product?.variants[item.variant];
      if (!product || !variant) return item;

      const quantity = variant.stock > 0
        ? Math.max(1, Math.min(Math.floor(item.quantity), variant.stock, MAX_PER_LINE))
        : item.quantity;
      const synced = { ...item, name: product.name, image: product.image, price: variant.price, quantity };
      if (synced.name !== item.name || synced.image !== item.image || synced.price !== item.price || synced.quantity !== item.quantity) changed = true;
      return synced;
    });

    if (changed) writeCart(syncedItems);
  }, [catalogStatus, items, live]);

  function persist(nextItems: CartItem[]) {
    writeCart(nextItems);
  }

  const lines = useMemo(() => items.map((item) => {
    const product = live?.[item.productId];
    const info = product?.variants[item.variant];
    const unavailable = catalogStatus === 'ready' && (!info || info.stock <= 0);
    const maxQty = info ? Math.min(info.stock, MAX_PER_LINE) : MAX_PER_LINE;
    const price = info ? info.price : item.price;
    const quantity = info && !unavailable ? Math.min(item.quantity, maxQty) : item.quantity;
    return { item, price, quantity, maxQty, unavailable, shortBy: quantity < item.quantity, name: product?.name ?? item.name, image: product?.image ?? item.image };
  }), [catalogStatus, items, live]);

  const orderable = catalogStatus === 'ready' ? lines.filter((line) => !line.unavailable) : [];
  const subtotal = orderable.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const message = buildEnquiryMessage(
    orderable.map((line) => ({ name: line.name, variant: line.item.variant, quantity: line.quantity, price: line.price })),
    { name: customerName.trim(), place: place.trim() },
  );
  const link = orderable.length ? whatsappLink(whatsappNumber, message) : '';

  function logEnquiry() {
    // Fire and forget — opening WhatsApp must never wait on this.
    void fetch('/api/storefront/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: customerName.trim() || undefined,
        place: place.trim() || undefined,
        items: orderable.map((line) => ({ productId: line.item.productId, variant: line.item.variant, quantity: line.quantity })),
      }),
      keepalive: true,
    }).catch(() => undefined);
  }

  function setQuantity(index: number, quantity: number) {
    if (quantity <= 0) return persist(items.filter((_, itemIndex) => itemIndex !== index));
    const item = items[index];
    const stock = live?.[item.productId]?.variants[item.variant]?.stock;
    const limit = stock === undefined ? MAX_PER_LINE : Math.min(stock, MAX_PER_LINE);
    if (limit > 0) persist(items.map((entry, itemIndex) => itemIndex === index ? { ...entry, quantity: Math.min(quantity, limit) } : entry));
  }

  return (
    <section className="section">
      <div className="wrap">
        <div className="section-head"><div><h2>Your cart</h2><p>Send it to us on WhatsApp — we confirm stock and share the payment QR.</p></div><Link href="/products" className="btn btn-outline btn-sm">Continue shopping</Link></div>
        {!loaded ? null : items.length === 0 ? (
          <div className="cart-empty"><ShoppingBag aria-hidden="true" /><p>Your cart is empty.</p><Link className="btn btn-primary btn-sm" href="/products">Shop today&apos;s rack</Link></div>
        ) : (
          <div className="bulk-layout">
            <div>
              {lines.map((line, index) => (
                <article className="cart-item" key={lineKey(line.item)}>
                  <div className="ci-img">
                    {line.image
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={line.image} alt="" width={54} height={54} />
                      : <span className="empty-product-image" aria-hidden="true">{line.name.slice(0, 1)}</span>}
                  </div>
                  <div className="ci-info">
                    <div className="ci-name">{line.name}</div>
                    <div className="ci-meta">{line.item.variant} · {formatPrice(line.price)} each</div>
                    {line.unavailable && <div className="cart-warning">Sold out right now — remove it to continue, or ask us about the next batch.</div>}
                    {!line.unavailable && line.shortBy && <div className="cart-warning">Only {line.maxQty} available — quantity adjusted.</div>}
                    <div className="ci-row">
                      <div className="stepper">
                        <button type="button" aria-label={`Decrease ${line.name} quantity`} onClick={() => setQuantity(index, line.quantity - 1)}>−</button>
                        <div className="val">{line.quantity}</div>
                        <button type="button" aria-label={`Increase ${line.name} quantity`} disabled={line.unavailable || line.quantity >= line.maxQty} onClick={() => setQuantity(index, line.quantity + 1)}>+</button>
                      </div>
                      <strong>{line.unavailable ? '—' : formatPrice(line.price * line.quantity)}</strong>
                      <button type="button" className="ci-remove" onClick={() => persist(items.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <aside className="bulk-side">
              <h3>Order on WhatsApp</h3>
              <label>Your name (optional)<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Your name" maxLength={100} /></label>
              <label>Delivery city / pincode (optional)<input value={place} onChange={(event) => setPlace(event.target.value)} placeholder="e.g. Chennai 600001" maxLength={160} /></label>
              {catalogStatus === 'ready'
                ? <div className="subtotal-row"><span>Items subtotal</span><b>{formatPrice(subtotal)}</b></div>
                : <p role={catalogStatus === 'error' ? 'alert' : 'status'} className="cart-warning">{catalogStatus === 'error' ? 'The current subtotal is unavailable.' : 'Checking current prices and stock…'}</p>}
              <p className="p" style={{ marginTop: 8 }}>Courier charge is confirmed on WhatsApp. After you message us, we reply with the total and a payment QR code — pay there and we dispatch.</p>
              {catalogStatus === 'error' && <p role="alert" className="cart-warning">Could not check current prices and stock. Refresh the page before sending an enquiry.</p>}
              {catalogStatus === 'ready' && !whatsappNumber && <p role="status" className="cart-warning">The shop&apos;s WhatsApp number is not set yet. Add it in Admin → Store settings.</p>}
              {catalogStatus === 'loading' ? (
                <button type="button" className="btn btn-primary btn-block" disabled>Checking current prices and stock…</button>
              ) : link ? (
                <a className="btn btn-primary btn-block wa-btn" href={link} target="_blank" rel="noreferrer" onClick={logEnquiry}><MessageCircle size={16} aria-hidden="true" /> Send enquiry on WhatsApp</a>
              ) : (
                <button type="button" className="btn btn-primary btn-block" disabled>{catalogStatus === 'error' ? 'Current stock unavailable' : orderable.length === 0 ? 'Nothing available to order' : 'WhatsApp number not set'}</button>
              )}
              <button type="button" className="ci-remove" style={{ marginTop: 10 }} onClick={() => persist([])}>Clear cart</button>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
