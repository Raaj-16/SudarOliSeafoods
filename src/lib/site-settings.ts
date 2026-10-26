import { cache } from 'react';
import { hasDatabaseConfig, prisma } from '@/lib/prisma';

export type StorefrontSettings = {
  shippingPaise: number;
  businessName: string;
  address: string;
  mapUrl: string;
  phoneNumbers: string[];
  email: string;
  hours: string;
  whatsappNumber: string;
  instagramUrl: string;
  facebookUrl: string;
  fssaiLicense: string;
  heroStats: Array<{ value: string; label: string }>;
  trustItems: string[];
};

const fallbackHeroStats = [
  { value: 'Sun-dried daily', label: 'Fresh batches' },
  { value: 'Tamil Nadu', label: 'Coastal source' },
  { value: 'No additives', label: 'Traditional prep' },
];

const fallbackTrustItems = [
  'Freshly sun-dried in small batches',
  'No artificial preservatives or additives',
  'Packed clean and ready for home kitchens',
  'Trusted coastal sourcing and daily stock updates',
];

export const getStorefrontSettings = cache(async function getStorefrontSettings(): Promise<StorefrontSettings | null> {
  const fallbackSettings: StorefrontSettings = {
    shippingPaise: 0,
    businessName: 'Sudar Oli Dry Sea Foods',
    address: 'Tamil Nadu coast',
    mapUrl: '',
    phoneNumbers: [],
    email: '',
    hours: '',
    whatsappNumber: '',
    instagramUrl: '',
    facebookUrl: '',
    fssaiLicense: '',
    heroStats: fallbackHeroStats,
    trustItems: fallbackTrustItems,
  };

  if (!hasDatabaseConfig()) return fallbackSettings;
  try {
    const row = await prisma.siteContent.findUnique({ where: { key: 'storefront' } });
    if (!row || !row.json || typeof row.json !== 'object' || Array.isArray(row.json)) return fallbackSettings;
    const data = row.json as Record<string, unknown>;
    if (!Number.isSafeInteger(data.shippingPaise) || (data.shippingPaise as number) < 0) return fallbackSettings;
    const stringValue = (key: string) => typeof data[key] === 'string' ? data[key] as string : '';
    return {
      shippingPaise: data.shippingPaise as number,
      businessName: stringValue('businessName') || fallbackSettings.businessName,
      address: stringValue('address') || fallbackSettings.address,
      mapUrl: stringValue('mapUrl'),
      phoneNumbers: Array.isArray(data.phoneNumbers) ? data.phoneNumbers.filter((value): value is string => typeof value === 'string') : [],
      email: stringValue('email'),
      hours: stringValue('hours'),
      whatsappNumber: stringValue('whatsappNumber'),
      instagramUrl: stringValue('instagramUrl'),
      facebookUrl: stringValue('facebookUrl'),
      fssaiLicense: stringValue('fssaiLicense'),
      heroStats: Array.isArray(data.heroStats) && data.heroStats.length ? data.heroStats.filter((entry): entry is { value: string; label: string } => Boolean(entry && typeof entry === 'object' && typeof (entry as { value?: unknown }).value === 'string' && typeof (entry as { label?: unknown }).label === 'string')) : fallbackSettings.heroStats,
      trustItems: Array.isArray(data.trustItems) && data.trustItems.length ? data.trustItems.filter((value): value is string => typeof value === 'string') : fallbackSettings.trustItems,
    };
  } catch (error) {
    console.error('getStorefrontSettings error:', error instanceof Error ? error.message : 'Database query failed');
    return fallbackSettings;
  }
});
