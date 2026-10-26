export type ProductVariant = {
  id?: string;
  label: string;
  price: number;
  stock: number;
};

import type { Availability } from '@/lib/availability';

export type Product = {
  id: string;
  name: string;
  local: string;
  slug: string;
  category: string;
  badge: string;
  shortDescription: string;
  description: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  stock: number;
  featured: boolean;
  variants: ProductVariant[];
  availability: Availability;
};

export function formatPrice(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}
