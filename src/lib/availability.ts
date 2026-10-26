// Shared stock/availability rules. Pure functions, safe to use on server and client.
// Stock for each pack size ("variant") is a number of packs. When exactly one pack
// of a size remains we tell the customer which size is pending, e.g. "Only 250 gms is pending".

export const LOW_STOCK_THRESHOLD = 5;

export type StockVariant = { label: string; stock: number };

export type Availability = {
  state: 'out' | 'last' | 'low' | 'ok';
  /** Short text for the badge on the product card. */
  badge: string;
  /** Pack sizes where exactly one pack is left, e.g. ['250 g']. */
  lastPackLabels: string[];
  /** Pack sizes that are sold out. */
  soldOutLabels: string[];
};

export function formatWeightLabel(rawLabel: string): string {
  const trimmed = (rawLabel ?? '').trim();
  if (/^250\s*(g|gm|gms|gram|grams)?$/i.test(trimmed)) return '250 gms';
  if (/^500\s*(g|gm|gms|gram|grams)?$/i.test(trimmed)) return '500 gms';
  if (/^1\s*(kg|kgs|kilo|kilogram)?$/i.test(trimmed)) return '1 kg';
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(g|gm|gram|grams)$/i);
  if (match) return `${match[1]} gms`;
  return trimmed;
}

export function lastPackText(labels: string[]) {
  if (labels.length === 0) return '';
  const formatted = labels.map(formatWeightLabel);
  if (formatted.length === 1) return `Only ${formatted[0]} is pending`;
  return `Only ${formatted.slice(0, -1).join(', ')} & ${formatted[formatted.length - 1]} is pending`;
}

export function getAvailability(variants: StockVariant[]): Availability {
  const inStock = variants.filter((variant) => variant.stock > 0);
  const lastPackLabels = inStock.filter((variant) => variant.stock === 1).map((variant) => variant.label);
  const soldOutLabels = variants.filter((variant) => variant.stock <= 0).map((variant) => variant.label);

  if (inStock.length === 0) return { state: 'out', badge: 'Sold out', lastPackLabels, soldOutLabels };
  if (lastPackLabels.length > 0) return { state: 'last', badge: lastPackText(lastPackLabels), lastPackLabels, soldOutLabels };
  if (inStock.some((variant) => variant.stock <= LOW_STOCK_THRESHOLD)) return { state: 'low', badge: 'Few left', lastPackLabels, soldOutLabels };
  return { state: 'ok', badge: 'In stock', lastPackLabels, soldOutLabels };
}

/** Message for a single pack size on the product page. */
export function variantMessage(variant: StockVariant) {
  const formatted = formatWeightLabel(variant.label);
  if (variant.stock <= 0) {
    return {
      state: 'out' as const,
      title: 'Sold out',
      detail: 'This pack size is currently unavailable. Choose another size or ask us on WhatsApp about the next batch.',
    };
  }
  if (variant.stock === 1) {
    return {
      state: 'last' as const,
      title: `Only ${formatted} is pending`,
      detail: `Just one ${formatted} pack remains. Message us quickly on WhatsApp to reserve it.`,
    };
  }
  if (variant.stock <= LOW_STOCK_THRESHOLD) {
    return {
      state: 'low' as const,
      title: `Few left — ${variant.stock} packs`,
      detail: `This pack size is almost out (${variant.stock} packs remain).`,
    };
  }
  return {
    state: 'ok' as const,
    title: 'In stock',
    detail: 'Ready to pack and dispatch.',
  };
}
