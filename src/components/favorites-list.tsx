'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Product } from '@/lib/store-data';
import { ProductCard } from '@/components/product-card';
import { useFavoriteIds, writeFavoriteIds } from '@/lib/favorites-store';

export function FavoritesList() {
  const favoriteIds = useFavoriteIds();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    void fetch('/api/catalog', { cache: 'no-store' })
      .then((response) => response.json())
      .then((result) => {
        if (Array.isArray(result.products)) setProducts(result.products);
      })
      .catch(() => setProducts([]));
  }, []);

  const favoriteProducts = products.filter((product) => favoriteIds.includes(product.id));

  return (
    <section className="section" id="favourites-page">
      <div className="wrap">
        <div className="section-head">
          <div><h2>Your favourites</h2><p>Saved products from the shop, kept here for quick ordering.</p></div>
          <Link className="btn btn-outline btn-sm" href="/products">Shop</Link>
        </div>
        {favoriteProducts.length === 0 ? (
          <div className="cart-empty" style={{ maxWidth: 560, margin: '24px auto 0' }}>
            <Heart aria-hidden="true" />
            <p>No favourites saved yet.<br />Tap the heart on any fish card to save it here.</p>
            <Link className="btn btn-outline btn-sm" href="/products">Go to shop</Link>
          </div>
        ) : (
          <div className="grid">
            {favoriteProducts.map((product) => (
              <ProductCard key={product.id} product={product} isFavourite onToggleFavourite={(id) => writeFavoriteIds(favoriteIds.filter((item) => item !== id))} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
