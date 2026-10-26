import { NextResponse } from 'next/server';
import { getCatalogProducts } from '@/lib/catalog';
import { hasDatabaseConfig } from '@/lib/prisma';
import { getStorefrontSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!hasDatabaseConfig()) {
    return NextResponse.json(
      { ok: false, status: 'unavailable', message: 'Catalog database is not configured.' },
      { status: 503, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }

  try {
    const [products, settings] = await Promise.all([getCatalogProducts(), getStorefrontSettings()]);
    return NextResponse.json({ ok: true, products, shippingPaise: settings?.shippingPaise ?? null, whatsappNumber: settings?.whatsappNumber ?? '' }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error) {
    console.error('Catalog request failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ ok: false, message: 'Catalog is temporarily unavailable.' }, { status: 503 });
  }
}
