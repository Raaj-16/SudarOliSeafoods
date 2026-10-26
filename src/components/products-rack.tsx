'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Product } from '@/lib/store-data';
import { ProductCard } from '@/components/product-card';
import { useFavoriteIds, writeFavoriteIds } from '@/lib/favorites-store';

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Raw fish', value: 'Raw' },
  { label: 'Cleaned fish', value: 'Cleaned' },
  { label: 'Favourites', value: 'favourites' },
];
export function ProductsRack({ products }: { products: Product[] }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const favourites = useFavoriteIds();
  const visibleProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return products.filter((product) => {
      const matchesFilter = activeFilter === 'all'
        || (activeFilter === 'favourites' ? favourites.includes(product.id) : product.category === activeFilter);
      const matchesSearch = !query || `${product.name} ${product.local} ${product.category}`.toLocaleLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, favourites, products, search]);

  function toggleFavourite(id: string) {
    writeFavoriteIds(favourites.includes(id) ? favourites.filter((item) => item !== id) : [...favourites, id]);
  }

  return (
    <section className="section" id="shop">
      <div className="wrap">
        <div className="section-head">
          <div>
            <h2>Today&apos;s rack</h2>
            <p>Every batch shows real stock — what&apos;s sold out stays listed so you can ask us to notify you.</p>
          </div>
        </div>
        <div className="filters">
          {filters.map((filter) => (
            <button key={filter.value} type="button" className={`chip${activeFilter === filter.value ? ' active' : ''}`} onClick={() => setActiveFilter(filter.value)}>
              {filter.label}{filter.value === 'favourites' && favourites.length ? ` (${favourites.length})` : ''}
            </button>
          ))}
          <label className="search-box">
            <Search size={14} aria-hidden="true" />
            <span className="visually-hidden">Search dry fish</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search dry fish…" />
          </label>
        </div>
        {visibleProducts.length ? (
          <div className="grid">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} isFavourite={favourites.includes(product.id)} onToggleFavourite={toggleFavourite} />
            ))}
          </div>
        ) : (
          <p className="empty-rack">{activeFilter === 'favourites' ? 'No favourite items yet — tap the heart icon on any product to save it here.' : `No dry fish matches “${search}” — try another name.`}</p>
        )}
      </div>
    </section>
  );
}