import { cache } from 'react';
import { hasDatabaseConfig, prisma } from '@/lib/prisma';
import type { Product } from '@/lib/store-data';
import { getAvailability } from '@/lib/availability';

const productInclude = {
  category: true,
  variants: { orderBy: { pricePaise: 'asc' as const } },
  images: { orderBy: { sortOrder: 'asc' as const } },
};

function toStoreProduct(product: Awaited<ReturnType<typeof prisma.product.findFirstOrThrow<{ include: typeof productInclude }>>>): Product {
  const variants = product.variants.map((variant) => ({
    id: variant.id,
    label: variant.label,
    price: Math.round(variant.pricePaise / 100),
    stock: variant.stockQty,
  }));
  const availability = getAvailability(variants);
  return {
    id: product.slug,
    name: product.name,
    local: product.localName,
    slug: product.slug,
    category: product.category.name,
    badge: availability.badge,
    shortDescription: product.shortDescription,
    description: product.description,
    image: product.images[0]?.url ?? '',
    // "From" price = cheapest pack that can actually be bought, else cheapest overall.
    price: (variants.find((variant) => variant.stock > 0) ?? variants[0])?.price ?? 0,
    rating: product.rating,
    stock: Math.max(0, ...product.variants.map((variant) => variant.stockQty)),
    featured: product.featured,
    variants,
    availability,
  };
}

export const getCatalogProducts = cache(async function getCatalogProducts() {
  if (!hasDatabaseConfig()) return [];
  try {
    const databaseProducts = await prisma.product.findMany({ where: { isActive: true }, include: productInclude, orderBy: [{ featured: 'desc' }, { name: 'asc' }] });
    return databaseProducts.map(toStoreProduct);
  } catch (error) {
    console.error('getCatalogProducts error:', error instanceof Error ? error.message : 'Database query failed');
    return [];
  }
});

export const getCatalogProductBySlug = cache(async function getCatalogProductBySlug(slug: string) {
  if (!hasDatabaseConfig()) return undefined;
  try {
    const product = await prisma.product.findUnique({ where: { slug, isActive: true }, include: productInclude });
    return product ? toStoreProduct(product) : undefined;
  } catch (error) {
    console.error('getCatalogProductBySlug error:', error instanceof Error ? error.message : 'Database query failed');
    return undefined;
  }
});
