'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Image from 'next/image';
import type { Product } from '@/lib/store-data';
import { MessageCircle } from 'lucide-react';
import { whatsappLink } from '@/lib/whatsapp-enquiry';

type SelectedFish = { id: string; quantityKg: number };

export function BulkOrderForm({ products, whatsappNumber }: { products: Product[]; whatsappNumber: string }) {
  const choices = products.filter((product) => product.category === 'Raw');
  const [selected, setSelected] = useState<SelectedFish[]>([]);
  const [name, setName] = useState('');
  const [business, setBusiness] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [waLink, setWaLink] = useState('');
  const selectedLabel = useMemo(() => selected.length ? `${selected.length} fish selected` : 'Select fish', [selected.length]);

  function toggleFish(productId: string) {
    setSelected((items) => items.some((item) => item.id === productId)
      ? items.filter((item) => item.id !== productId)
      : [...items, { id: productId, quantityKg: 2 }]);
  }

  function changeQuantity(productId: string, delta: number) {
    setSelected((items) => items.map((item) => item.id === productId
      ? { ...item, quantityKg: Math.max(2, item.quantityKg + delta) }
      : item));
  }

  async function submitInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback('');
    if (!selected.length) {
      setFeedback('Please select at least one fish type before sending the bulk inquiry.');
      return;
    }

    setSubmitting(true);
    const lines = selected.map((item) => `• ${choices.find((choice) => choice.id === item.id)?.name ?? item.id} — ${item.quantityKg} kg`);
    const message = [
      'Hi Sudar Oli, I would like a bulk quote:',
      '',
      ...lines,
      '',
      `Name: ${name}`,
      business ? `Business: ${business}` : '',
      `Phone: ${phone}`,
      location ? `Delivery: ${location}` : '',
      notes ? `Notes: ${notes}` : '',
    ].filter((row, index, all) => row !== '' || (index > 0 && all[index - 1] !== '')).join('\n');
    try {
      // Save a copy for the admin inquiries page. A failure here must not stop the WhatsApp message.
      await fetch('/api/storefront/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'bulk',
          customer: { name, business, phone, location },
          notes,
          items: selected.map((item) => ({ productId: item.id, quantityKg: item.quantityKg })),
        }),
      }).catch(() => undefined);
      const link = whatsappLink(whatsappNumber, message);
      if (!link) {
        setFeedback('Your request was saved, but the shop WhatsApp number is not set yet. Please call us to confirm.');
      } else {
        setWaLink(link);
        window.open(link, '_blank', 'noopener');
        setFeedback('Opening WhatsApp… if it did not open, use the button below to send your request.');
      }
      setSelected([]);
      setNotes('');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'We could not send your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bulk-layout">
      <form className="bulk-form" onSubmit={submitInquiry}>
        <div className="bulk-product-picker">
          <div className="label">Choose fish</div>
          <div className="bulk-grid">
            {choices.map((product) => {
              const isSelected = selected.some((item) => item.id === product.id);
              return (
                <button type="button" key={product.id} className={`bulk-product${isSelected ? ' active' : ''}`} onClick={() => toggleFish(product.id)} aria-pressed={isSelected}>
                  <span className="bulk-product-ico">{product.image ? <Image src={product.image} alt="" width={52} height={52} /> : <span aria-hidden="true">{product.name.slice(0, 1)}</span>}</span>
                  <span className="bulk-product-name">{product.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bulk-qty-block">
          <div className="label">Selected fish quantities</div>
          <div className="bulk-selected">{selectedLabel}</div>
          {selected.length > 0 && <div className="bulk-qty-list">
            {selected.map((item) => {
              const product = choices.find((choice) => choice.id === item.id);
              if (!product) return null;
              return <div key={item.id} className="bulk-qty-item">
                <div className="bulk-qty-name">{product.name}</div>
                <div className="stepper bulk-stepper">
                  <button type="button" aria-label={`Decrease quantity for ${product.name}`} onClick={() => changeQuantity(item.id, -2)}>−</button>
                  <div className="val">{item.quantityKg} kg</div>
                  <button type="button" aria-label={`Increase quantity for ${product.name}`} onClick={() => changeQuantity(item.id, 2)}>+</button>
                </div>
              </div>;
            })}
          </div>}
        </div>

        <label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required /></label>
        <label>Business / restaurant<input value={business} onChange={(event) => setBusiness(event.target.value)} placeholder="Example: Hotel, canteen, retail store" /></label>
        <label>Contact number<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Enter your phone number" minLength={10} maxLength={18} required /></label>
        <label>Delivery location<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City / delivery pincode" /></label>
        <label>Notes<textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Preferred delivery dates, packing needs, or any special request" /></label>
        {feedback && <p role="status" aria-live="polite">{feedback}</p>}
        {waLink && <a className="btn btn-outline btn-block wa-btn" href={waLink} target="_blank" rel="noreferrer"><MessageCircle size={16} aria-hidden="true" /> Open WhatsApp</a>}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>{submitting ? 'Preparing…' : 'Send bulk inquiry on WhatsApp'}</button>
      </form>

      <aside className="bulk-side">
        <h3>Why bulk buyers choose us</h3>
        <ul>
          <li>Freshly landed and salted within hours</li>
          <li>Natural sun-dried batches without shortcuts</li>
          <li>Flexible quantities for restaurants, retailers and events</li>
          <li>Fast WhatsApp follow-up for pricing and delivery</li>
        </ul>
        <div className="bulk-callout"><strong>Need a quick answer?</strong><p>Call us directly and we’ll confirm availability the same day.</p></div>
      </aside>
    </div>
  );
}
