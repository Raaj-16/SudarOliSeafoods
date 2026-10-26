import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export function PolicyPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="wrap policy-page">
        <p className="eyebrow">Customer information</p>
        <h1>{title}</h1>
        <p className="policy-updated">Sudar Oli Dry Sea Foods · Last reviewed October 2026</p>
        <div className="policy-content">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}