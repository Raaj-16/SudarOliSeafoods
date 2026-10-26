'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatWeightLabel, lastPackText } from '@/lib/availability';

type AdminVariant = { id: string; label: string; price: number; stock: number };
type AdminProduct = {
  id: string;
  name: string;
  localName: string;
  slug: string;
  category: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  featured: boolean;
  image: string;
  isActive: boolean;
  variants: AdminVariant[];
};
type AdminCategory = { id: string; name: string; slug: string };

const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** "250 g" -> 250, "1 kg" -> 1000, otherwise null */
function gramsFromLabel(label: string) {
  const match = label.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(kg|g|gm|gms|gram|grams)\b/);
  if (!match) return null;
  const amount = Number(match[1]);
  return match[2] === 'kg' ? amount * 1000 : amount;
}

async function call(method: string, body?: unknown, query = '') {
  const response = await fetch(`/api/admin/products${query}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.message || 'Something went wrong. Please try again.');
  return result as { ok: true; message?: string; [key: string]: unknown };
}

export function AdminProductsManager() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/products', { cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.message || 'Could not load inventory.');
    setProducts(result.products);
    setCategories(result.categories);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadInitialInventory() {
      try {
        const response = await fetch('/api/admin/products', { cache: 'no-store' });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error(result.message || 'Could not load inventory.');
        if (!cancelled) {
          setProducts(result.products);
          setCategories(result.categories);
        }
      } catch (error) {
        if (!cancelled) setFeedback(error instanceof Error ? error.message : 'Could not load inventory.');
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    void loadInitialInventory();
    return () => { cancelled = true; };
  }, []);

  async function run(key: string, action: () => Promise<string | void>) {
    setBusy(key);
    setFeedback('');
    try {
      const message = await action();
      await load();
      if (message) setFeedback(message);
      return true;
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      return false;
    } finally {
      setBusy(null);
    }
  }

  const duplicateIds = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const product of products) {
      for (const key of [normalizeName(product.name), normalizeName(product.localName)].filter(Boolean)) {
        groups.set(key, [...(groups.get(key) ?? []), product.id]);
      }
    }
    const ids = new Set<string>();
    for (const members of groups.values()) if (members.length > 1) members.forEach((id) => ids.add(id));
    return ids;
  }, [products]);

  const shown = products.filter((product) => !filter.trim() || `${product.name} ${product.localName}`.toLowerCase().includes(filter.trim().toLowerCase()));

  if (!loaded) return <p role="status">Loading inventory…</p>;

  return (
    <div className="space-y-6">
      {feedback && <p role="status" aria-live="polite" className="border border-amber-300 bg-amber-50 p-3 text-sm">{feedback}</p>}
      <AddProductForm categories={categories} busy={busy === 'new-product'} onCreate={(values) => run('new-product', async () => { await call('POST', values); return 'Product created and live on the shop.'; })} onError={setFeedback} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-600">{products.length} products{duplicateIds.size ? ` · ${duplicateIds.size} look like duplicates (marked below)` : ''}</p>
        <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Search products…" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Search products" />
      </div>

      {shown.map((product) => (
        <ProductEditor
          key={`${product.id}:${product.variants.map((variant) => variant.id).join(',')}`}
          product={product}
          categories={categories}
          isDuplicate={duplicateIds.has(product.id)}
          busy={busy}
          onRun={run}
          onError={setFeedback}
        />
      ))}
      {shown.length === 0 && <p className="text-stone-600">No products match.</p>}
    </div>
  );
}

function ProductEditor({ product, categories, isDuplicate, busy, onRun, onError }: {
  product: AdminProduct;
  categories: AdminCategory[];
  isDuplicate: boolean;
  busy: string | null;
  onRun: (key: string, action: () => Promise<string | void>) => Promise<boolean>;
  onError: (message: string) => void;
}) {
  const [rows, setRows] = useState(product.variants);
  const [perKg, setPerKg] = useState('');
  const [details, setDetails] = useState({ name: product.name, localName: product.localName, categorySlug: product.categorySlug, shortDescription: product.shortDescription, description: product.description, featured: product.featured });
  const [newPack, setNewPack] = useState({ label: '', price: '', stock: '' });
  const [uploading, setUploading] = useState(false);

  const dirty = rows.some((row) => { const original = product.variants.find((variant) => variant.id === row.id); return !original || original.price !== row.price || original.stock !== row.stock; });
  const lastPacks = rows.filter((row) => row.stock === 1).map((row) => row.label);
  const allSoldOut = rows.length > 0 && rows.every((row) => row.stock <= 0);

  function applyPerKg() {
    const base = Number(perKg);
    if (!Number.isFinite(base) || base <= 0) return onError('Enter today\'s price for 1 kg first.');
    setRows((current) => current.map((row) => {
      const grams = gramsFromLabel(row.label);
      return grams ? { ...row, price: Math.max(1, Math.round((base * grams) / 1000)) } : row;
    }));
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return onError('Choose an image smaller than 4 MB.');
    setUploading(true);
    try {
      const form = new FormData();
      form.set('file', file);
      const upload = await fetch('/api/admin/product-images', { method: 'POST', body: form });
      const uploaded = await upload.json().catch(() => ({}));
      if (!upload.ok || !uploaded.ok) throw new Error(uploaded.message || 'Could not upload this image.');
      await onRun(`image-${product.id}`, async () => { await call('PATCH', { productId: product.id, image: uploaded.url }); return 'Photo updated.'; });
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not upload this image.');
    } finally {
      setUploading(false);
    }
  }

  const numberInput = 'w-28 border border-stone-300 px-2 py-1';

  return (
    <article className={`border bg-white p-4 ${isDuplicate ? 'border-amber-500' : 'border-stone-300'} ${product.isActive ? '' : 'opacity-70'}`}>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex w-28 flex-col gap-2">
          {product.image
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={product.image} alt={`${product.name}`} className="h-24 w-24 rounded border border-stone-300 object-cover" />
            : <span className="flex h-24 w-24 items-center justify-center rounded border border-dashed border-stone-300 text-xs text-stone-500">No photo</span>}
          <label className="cursor-pointer text-xs font-semibold underline">{uploading ? 'Uploading…' : product.image ? 'Replace photo' : 'Upload photo'}
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => { void uploadImage(event.target.files?.[0]); event.target.value = ''; }} />
          </label>
        </div>
        <div className="min-w-56 flex-1">
          <h2 className="text-lg font-bold text-stone-900">{product.name} <span className="text-sm font-normal text-stone-500">· {product.localName} · {product.category}</span></h2>
          <p className="mt-1 text-xs text-stone-500">/products/{product.slug}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {!product.isActive && <span className="rounded bg-stone-200 px-2 py-1">Hidden from shop</span>}
            {isDuplicate && <span className="rounded bg-red-100 px-2 py-1 font-semibold text-red-800">⚠️ Duplicate product</span>}
            {allSoldOut && <span className="rounded bg-stone-200 px-2 py-1">Sold out</span>}
            {lastPacks.length > 0 && <span className="rounded bg-amber-100 px-2 py-1 text-amber-900">Shop shows: {lastPackText(lastPacks)}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDuplicate && (
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: '#dc2626', color: '#ffffff' }}
              disabled={busy === `delete-${product.id}`}
              onClick={() => {
                if (!window.confirm(`Delete duplicate product "${product.name}"? This removes the duplicate permanently.`)) return;
                void onRun(`delete-${product.id}`, async () => {
                  const result = await call('DELETE', undefined, `?productId=${encodeURIComponent(product.id)}`);
                  return result.deleted ? 'Duplicate product deleted.' : String(result.message ?? 'Product hidden.');
                });
              }}
            >
              Delete duplicate
            </button>
          )}
          <button type="button" className="btn btn-outline btn-sm" disabled={busy === `active-${product.id}`} onClick={() => void onRun(`active-${product.id}`, async () => { await call('PATCH', { productId: product.id, isActive: !product.isActive }); return product.isActive ? 'Product hidden from the shop.' : 'Product is live again.'; })}>{product.isActive ? 'Hide' : 'Show on shop'}</button>
          <button type="button" className="btn btn-outline btn-sm" style={{ color: '#9b2c1f' }} disabled={busy === `delete-${product.id}`} onClick={() => {
            if (!window.confirm(`Delete "${product.name}" permanently? This cannot be undone.`)) return;
            void onRun(`delete-${product.id}`, async () => { const result = await call('DELETE', undefined, `?productId=${encodeURIComponent(product.id)}`); return result.deleted ? 'Product deleted.' : String(result.message ?? 'Product hidden.'); });
          }}>Delete</button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-stone-100 text-stone-700"><tr><th className="px-3 py-2">Pack</th><th className="px-3 py-2">Price ₹</th><th className="px-3 py-2">Packs in stock</th><th className="px-3 py-2">Shop shows</th><th className="px-3 py-2" /></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-stone-200">
                <td className="px-3 py-2 font-medium">{row.label}</td>
                <td className="px-3 py-2"><input className={numberInput} type="number" min="1" step="1" value={row.price} aria-label={`${product.name} ${row.label} price`} onChange={(event) => setRows((current) => current.map((entry) => entry.id === row.id ? { ...entry, price: Number(event.target.value) } : entry))} /></td>
                <td className="px-3 py-2"><input className="w-24 border border-stone-300 px-2 py-1" type="number" min="0" step="1" value={row.stock} aria-label={`${product.name} ${row.label} stock`} onChange={(event) => setRows((current) => current.map((entry) => entry.id === row.id ? { ...entry, stock: Number(event.target.value) } : entry))} /></td>
                <td className="px-3 py-2 text-xs">{row.stock <= 0 ? 'Sold out' : row.stock === 1 ? `Only ${formatWeightLabel(row.label)} is pending` : row.stock <= 5 ? 'Few left' : 'In stock'}</td>
                <td className="px-3 py-2"><button type="button" className="text-xs underline" onClick={() => {
                  if (!window.confirm(`Remove the ${row.label} pack of ${product.name}?`)) return;
                  void onRun(`remove-${row.id}`, async () => { const result = await call('PATCH', { removeVariantId: row.id }); return result.archived ? String(result.message) : 'Pack size removed.'; });
                }}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-xs">Today&apos;s price for 1 kg ₹
          <input className="mt-1 block w-32 border border-stone-300 px-2 py-1 text-sm" type="number" min="1" value={perKg} onChange={(event) => setPerKg(event.target.value)} placeholder="e.g. 1200" />
        </label>
        <button type="button" className="btn btn-outline btn-sm" onClick={applyPerKg}>Fill pack prices from this</button>
        <button type="button" className="btn btn-primary btn-sm" disabled={!dirty || busy === `save-${product.id}`} onClick={() => void onRun(`save-${product.id}`, async () => { await call('PATCH', { productId: product.id, variants: rows.map((row) => ({ variantId: row.id, price: row.price, stock: row.stock })) }); return 'Saved. New prices and stock are live on the shop.'; })}>{busy === `save-${product.id}` ? 'Saving…' : dirty ? 'Save prices & stock' : 'Saved'}</button>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold">Add a pack size</summary>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <label className="text-xs">Label<input className="mt-1 block w-28 border border-stone-300 px-2 py-1 text-sm" value={newPack.label} onChange={(event) => setNewPack({ ...newPack, label: event.target.value })} placeholder="1 kg" maxLength={32} /></label>
          <label className="text-xs">Price ₹<input className="mt-1 block w-28 border border-stone-300 px-2 py-1 text-sm" type="number" min="1" value={newPack.price} onChange={(event) => setNewPack({ ...newPack, price: event.target.value })} /></label>
          <label className="text-xs">Packs in stock<input className="mt-1 block w-28 border border-stone-300 px-2 py-1 text-sm" type="number" min="0" value={newPack.stock} onChange={(event) => setNewPack({ ...newPack, stock: event.target.value })} /></label>
          <button type="button" className="btn btn-outline btn-sm" disabled={busy === `pack-${product.id}`} onClick={() => void onRun(`pack-${product.id}`, async () => { await call('PATCH', { productId: product.id, addVariant: { label: newPack.label, price: Number(newPack.price), stock: Number(newPack.stock) } }); setNewPack({ label: '', price: '', stock: '' }); return 'Pack size added.'; })}>Add pack</button>
        </div>
      </details>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm font-semibold">Edit name, category and description</summary>
        <div className="bulk-form mt-3">
          <label>Product name<input value={details.name} maxLength={120} onChange={(event) => setDetails({ ...details, name: event.target.value })} /></label>
          <label>Local name / type<input value={details.localName} maxLength={120} onChange={(event) => setDetails({ ...details, localName: event.target.value })} /></label>
          <label>Category<select value={details.categorySlug} onChange={(event) => setDetails({ ...details, categorySlug: event.target.value })}>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select></label>
          <label>Short description<input value={details.shortDescription} maxLength={300} onChange={(event) => setDetails({ ...details, shortDescription: event.target.value })} /></label>
          <label>Description<textarea rows={3} value={details.description} maxLength={2000} onChange={(event) => setDetails({ ...details, description: event.target.value })} /></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={details.featured} onChange={(event) => setDetails({ ...details, featured: event.target.checked })} /> Show on the home page rack</label>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy === `details-${product.id}`} onClick={() => void onRun(`details-${product.id}`, async () => { await call('PATCH', { productId: product.id, details }); return 'Product details saved.'; })}>Save details</button>
        </div>
      </details>
    </article>
  );
}

function AddProductForm({ categories, busy, onCreate, onError }: { categories: AdminCategory[]; busy: boolean; onCreate: (values: Record<string, unknown>) => Promise<boolean>; onError: (message: string) => void }) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const slug = name.trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 140);

  async function upload(file: File | undefined) {
    setImageUrl('');
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) return onError('Choose an image smaller than 4 MB.');
    setUploading(true);
    try {
      const form = new FormData();
      form.set('file', file);
      const response = await fetch('/api/admin/product-images', { method: 'POST', body: form });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'Could not upload this image.');
      setImageUrl(result.url);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not upload this image.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <details className="border border-stone-300 bg-white p-4">
      <summary className="cursor-pointer font-semibold">Add a new product</summary>
      <form className="bulk-form mt-4" onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const values = Object.fromEntries(new FormData(form).entries());
        void onCreate({ ...values, slug, image: imageUrl }).then((ok) => { if (ok) { form.reset(); setName(''); setImageUrl(''); } });
      }}>
        <label>Product name<input name="name" maxLength={120} required value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Local name / type<input name="localName" maxLength={120} required /></label>
        <label>Product page address<input value={slug ? `/products/${slug}` : 'Enter a product name'} readOnly /></label>
        <label>Category<select name="categorySlug" required defaultValue=""><option value="" disabled>Choose category</option>{categories.map((category) => <option value={category.slug} key={category.id}>{category.name}</option>)}</select></label>
        <label>Short description<input name="shortDescription" maxLength={300} required /></label>
        <label>Description<textarea name="description" rows={3} maxLength={2000} required /></label>
        <label>First pack size<input name="label" placeholder="250 g" maxLength={32} required /></label>
        <label>Price in rupees<input name="price" type="number" min="1" max="1000000" step="1" required /></label>
        <label>Packs in stock<input name="stock" type="number" min="0" max="1000000" step="1" required /></label>
        <label>Product photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void upload(event.target.files?.[0])} /></label>
        {uploading && <p role="status">Uploading photo…</p>}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {imageUrl && <img src={imageUrl} alt="Selected product preview" className="h-32 w-32 rounded border border-stone-300 object-cover" />}
        <button className="btn btn-primary" type="submit" disabled={busy || uploading || !slug}>{busy ? 'Creating…' : 'Create product'}</button>
      </form>
    </details>
  );
}
