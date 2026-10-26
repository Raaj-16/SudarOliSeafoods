'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ExternalLink, LogOut, Package, Settings, MessageSquare, ShoppingBag, History } from 'lucide-react';

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/');
    router.refresh();
  }

  const navItems = [
    { label: 'Products & Stock', href: '/admin/products', icon: Package },
    { label: 'Store Settings', href: '/admin/settings', icon: Settings },
    { label: 'Inquiries', href: '/admin/inquiries', icon: MessageSquare },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Audit Log', href: '/admin/audit', icon: History },
  ];

  return (
    <header className="border-b border-stone-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin/products" className="flex items-center gap-3 text-stone-900 font-bold text-lg">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-amber-100 text-sm font-black">
                SO
              </span>
              <span>Sudar Oli <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 ml-1">Admin</span></span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
            >
              <span>View Store</span>
              <ExternalLink size={12} />
            </Link>

            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-100"
              title="Sign out from admin portal"
            >
              <LogOut size={12} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile horizontal scroller for admin tabs */}
        <div className="flex md:hidden overflow-x-auto space-x-2 pb-2.5 pt-1 text-xs scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold ${
                  active
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-700'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
