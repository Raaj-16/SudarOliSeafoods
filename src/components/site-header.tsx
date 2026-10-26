'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Heart, LogOut, Menu, MessageCircle, Search, ShoppingCart, X, Shield } from 'lucide-react';
import type { Product } from '@/lib/store-data';
import { getCartSnapshot, getServerCartSnapshot, parseCartSnapshot, subscribeCart } from '@/lib/cart-store';
import { useFavoriteIds } from '@/lib/favorites-store';

export function SiteHeader() {
  const pathname = usePathname();
  const currentPathname = pathname ?? '';
  const router = useRouter();
  const [searchPath, setSearchPath] = useState<string | null>(null);
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const searchOpen = searchPath === currentPathname;
  const mobileMenuOpen = mobileMenuPath === currentPathname;
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<Product[]>([]);
  const cartSnapshot = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const cartCount = parseCartSnapshot(cartSnapshot).reduce((count, item) => count + item.quantity, 0);
  const favoriteCount = useFavoriteIds().length;
  const [accountRole, setAccountRole] = useState<'customer' | 'admin' | null>(null);

  useEffect(() => {
    void fetch('/api/auth/session', { cache: 'no-store' })
      .then((response) => response.json())
      .then((result) => {
        setAccountRole(result.user?.role === 'admin' ? 'admin' : result.user ? 'customer' : null);
      })
      .catch(() => setAccountRole(null));

  }, []);

  async function signOut() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    setAccountRole(null);
    setMobileMenuPath(null);
    router.push('/');
    router.refresh();
  }

  useEffect(() => {
    const normalized = query.trim();
    if (!normalized) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch('/api/catalog', { cache: 'no-store', signal: controller.signal })
        .then((response) => response.json())
        .then((result) => {
          if (!result.ok || !Array.isArray(result.products)) return;
          const needle = normalized.toLocaleLowerCase();
          setMatches(result.products.filter((product: Product) => `${product.name} ${product.local} ${product.category}`.toLocaleLowerCase().includes(needle)).slice(0, 8));
        })
        .catch(() => undefined);
    }, 160);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  return (
    <header className="site" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="header-inner">
        <Link href="/" className="logo" aria-label="Sudar Oli home">
          <Image className="logo-mark" src="/logo-220.png" alt="Sudar Oli Dry Sea Foods emblem" width={46} height={46} priority />
          <span className="logo-text">
            <span className="top">Sudar Oli</span>
            <span className="bottom"> Dry Sea Foods</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="main-nav" aria-label="Primary">
          <Link href="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
          <Link href={pathname === '/' ? '#shop' : '/products'} className={pathname.startsWith('/products') ? 'active' : ''}>Shop</Link>
          <Link href="/how-we-dry" className={pathname === '/how-we-dry' ? 'active' : ''}>How We Dry</Link>
          <Link href="/bulk-order" className={pathname === '/bulk-order' ? 'active' : ''}>Bulk Orders</Link>
          <Link href="/contact" className={pathname === '/contact' ? 'active' : ''}>Contact</Link>
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          {/* Search */}
          <div className="header-search">
            <button
              className="icon-btn"
              type="button"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={() => { setSearchPath(searchOpen ? null : currentPathname); setQuery(''); }}
            >
              <Search size={18} />
            </button>
            <div className={`search-panel${searchOpen ? ' show' : ''}`}>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search karuvadu…" autoComplete="off" />
              <div className="search-results">
                {!query.trim() && <div className="sr-hint">Try “vanjaram”, “nethili”, “soora”…</div>}
                {query.trim() && !matches.length && <div className="sr-empty">No dry fish matches “{query}”.</div>}
                {matches.map((product) => (
                  <Link className="sr-item" href={`/products/${product.slug}`} key={product.id} onClick={() => setSearchPath(null)}>
                    <span className="sr-ico">{product.image ? <Image src={product.image} alt="" width={30} height={30} /> : null}</span>
                    <span><span className="sr-name">{product.name}</span><span className="sr-sub">{product.category} · from ₹{product.price}</span></span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Favourites */}
          <Link className="icon-btn" href="/favorites" aria-label="Open favourites" title="Saved favourites">
            <Heart size={18} />
            {favoriteCount > 0 && <span className="cart-count">{favoriteCount}</span>}
          </Link>

          {/* Cart */}
          <Link className="icon-btn" href="/cart" aria-label="Open cart" title="Your cart">
            <ShoppingCart size={18} />
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </Link>

          {accountRole === null && (
            <Link className="btn btn-outline btn-sm admin-login-header-btn" href="/login">
              <Shield size={14} /> Login
            </Link>
          )}

          {accountRole === 'customer' && (
            <Link className="btn btn-outline btn-sm customer-inquiries-header-btn" href="/my-inquiries">
              My enquiries
            </Link>
          )}

          {/* Admin link if signed in */}
          {accountRole === 'admin' && (
            <Link className="btn btn-outline btn-sm admin-header-btn" href="/admin/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Shield size={14} /> Admin
            </Link>
          )}

          {/* Sign out if signed in */}
          {accountRole !== null && (
            <button className="icon-btn" type="button" aria-label="Sign out" title="Sign out" onClick={signOut}>
              <LogOut size={16} />
            </button>
          )}

          {/* Mobile Hamburger Menu Button */}
          <button
            className="icon-btn hamburger-toggle"
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuPath(mobileMenuOpen ? null : currentPathname)}
            style={{ display: 'none' }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Menu Bar */}
      {mobileMenuOpen && (
        <div
          className="mobile-menu-drawer"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--salt)',
            borderBottom: '2px solid var(--sea)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
            padding: '16px 20px',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            animation: 'slideDown 0.2s ease-out',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Link
              href="/"
              onClick={() => setMobileMenuPath(null)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: 15,
                color: pathname === '/' ? 'var(--rust)' : 'var(--ink)',
                background: pathname === '/' ? 'var(--sand)' : 'transparent',
                textDecoration: 'none',
              }}
            >
              🏠 Home
            </Link>
            <Link
              href="/products"
              onClick={() => setMobileMenuPath(null)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: 15,
                color: pathname.startsWith('/products') ? 'var(--rust)' : 'var(--ink)',
                background: pathname.startsWith('/products') ? 'var(--sand)' : 'transparent',
                textDecoration: 'none',
              }}
            >
              🐟 Shop Today&apos;s Catch
            </Link>
            <Link
              href="/how-we-dry"
              onClick={() => setMobileMenuPath(null)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: 15,
                color: pathname === '/how-we-dry' ? 'var(--rust)' : 'var(--ink)',
                background: pathname === '/how-we-dry' ? 'var(--sand)' : 'transparent',
                textDecoration: 'none',
              }}
            >
              ☀️ How We Dry (Our Process)
            </Link>
            <Link
              href="/bulk-order"
              onClick={() => setMobileMenuPath(null)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: 15,
                color: pathname === '/bulk-order' ? 'var(--rust)' : 'var(--ink)',
                background: pathname === '/bulk-order' ? 'var(--sand)' : 'transparent',
                textDecoration: 'none',
              }}
            >
              📦 Bulk &amp; Wholesale Orders
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuPath(null)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: 15,
                color: pathname === '/contact' ? 'var(--rust)' : 'var(--ink)',
                background: pathname === '/contact' ? 'var(--sand)' : 'transparent',
                textDecoration: 'none',
              }}
            >
              📞 Contact Us
            </Link>
            <Link
              href="/favorites"
              onClick={() => setMobileMenuPath(null)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: 15,
                color: 'var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textDecoration: 'none',
              }}
            >
              <span>❤️ Saved Favourites</span>
              {favoriteCount > 0 && <span style={{ background: 'var(--rust)', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{favoriteCount}</span>}
            </Link>
            <Link
              href="/cart"
              onClick={() => setMobileMenuPath(null)}
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                fontSize: 15,
                color: 'var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textDecoration: 'none',
              }}
            >
              <span>🛒 Cart (WhatsApp Order)</span>
              {cartCount > 0 && <span style={{ background: 'var(--sea)', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{cartCount}</span>}
            </Link>
          </div>

          <div style={{ paddingTop: 10, borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a
              href="https://wa.me/916379386564"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary btn-block btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <MessageCircle size={16} /> Chat on WhatsApp (+91 63793 86564)
            </a>

            {accountRole === 'admin' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <Link
                  href="/admin/products"
                  className="btn btn-outline btn-block btn-sm"
                  onClick={() => setMobileMenuPath(null)}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Shield size={14} /> Admin Portal
                </Link>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={signOut}
                  style={{ color: '#9b2c1f' }}
                  title="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : accountRole === 'customer' ? (
              <Link
                href="/my-inquiries"
                className="btn btn-outline btn-block btn-sm"
                onClick={() => setMobileMenuPath(null)}
                style={{ textAlign: 'center' }}
              >
                My enquiries
              </Link>
            ) : (
              <Link
                href="/login"
                className="btn btn-outline btn-block btn-sm"
                onClick={() => setMobileMenuPath(null)}
                style={{ textAlign: 'center' }}
              >
                Admin Sign In (Owner / Dad)
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
