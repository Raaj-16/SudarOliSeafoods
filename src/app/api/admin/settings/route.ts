import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { hasDatabaseConfig, prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

async function authorize() {
  const user = await getAuthenticatedUser();
  return user?.isAdmin ? user : null;
}

export async function GET() {
  if (!hasDatabaseConfig()) return NextResponse.json({ ok: false, message: 'Database is not configured.' }, { status: 503 });
  if (!await authorize()) return NextResponse.json({ ok: false, message: 'Not found.' }, { status: 404 });
  const row = await prisma.siteContent.findUnique({ where: { key: 'storefront' } });
  return NextResponse.json({ ok: true, settings: row?.json ?? null });
}

export async function PUT(request: Request) {
  if (!hasDatabaseConfig()) return NextResponse.json({ ok: false, message: 'Database is not configured.' }, { status: 503 });
  const user = await authorize();
  if (!user) return NextResponse.json({ ok: false, message: 'Not found.' }, { status: 404 });
  const body = await request.json().catch(() => null);
  const phoneNumbers = Array.isArray(body?.phoneNumbers) ? body.phoneNumbers.filter((value: unknown) => typeof value === 'string').map((value: string) => value.trim()).filter(Boolean).slice(0, 8) : [];
  const settings = {
    shippingPaise: Number(body?.shippingPaise),
    businessName: typeof body?.businessName === 'string' ? body.businessName.trim().slice(0, 120) : '',
    address: typeof body?.address === 'string' ? body.address.trim().slice(0, 500) : '',
    mapUrl: typeof body?.mapUrl === 'string' ? body.mapUrl.trim().slice(0, 500) : '',
    phoneNumbers,
    email: typeof body?.email === 'string' ? body.email.trim().slice(0, 254) : '',
    hours: typeof body?.hours === 'string' ? body.hours.trim().slice(0, 160) : '',
    whatsappNumber: typeof body?.whatsappNumber === 'string' ? body.whatsappNumber.replace(/\D/g, '').slice(0, 15) : '',
    instagramUrl: typeof body?.instagramUrl === 'string' ? body.instagramUrl.trim().slice(0, 500) : '',
    facebookUrl: typeof body?.facebookUrl === 'string' ? body.facebookUrl.trim().slice(0, 500) : '',
    fssaiLicense: typeof body?.fssaiLicense === 'string' ? body.fssaiLicense.trim().slice(0, 80) : '',
    heroStats: Array.isArray(body?.heroStats) ? body.heroStats.slice(0, 3).map((entry: unknown) => ({ value: typeof (entry as { value?: unknown })?.value === 'string' ? (entry as { value: string }).value.trim().slice(0, 30) : '', label: typeof (entry as { label?: unknown })?.label === 'string' ? (entry as { label: string }).label.trim().slice(0, 80) : '' })).filter((entry: { value: string; label: string }) => entry.value && entry.label) : [],
    trustItems: Array.isArray(body?.trustItems) ? body.trustItems.filter((value: unknown) => typeof value === 'string').map((value: string) => value.trim().slice(0, 160)).filter(Boolean).slice(0, 4) : [],
  };
  if (!Number.isSafeInteger(settings.shippingPaise) || settings.shippingPaise < 0 || settings.shippingPaise > 100_000_000) {
    return NextResponse.json({ ok: false, message: 'Courier charge must be a non-negative amount in paise.' }, { status: 400 });
  }
  for (const url of [settings.mapUrl, settings.instagramUrl, settings.facebookUrl]) {
    if (url && !/^https:\/\//i.test(url)) return NextResponse.json({ ok: false, message: 'Business links must use HTTPS.' }, { status: 400 });
  }
  const before = await prisma.siteContent.findUnique({ where: { key: 'storefront' } });
  await prisma.siteContent.upsert({ where: { key: 'storefront' }, update: { json: settings }, create: { key: 'storefront', json: settings } });
  await prisma.auditLog.create({ data: { adminId: user.id, entity: 'SiteContent', entityId: 'storefront', beforeJson: before?.json as object | undefined, afterJson: settings } });
  return NextResponse.json({ ok: true, settings });
}
