'use client';

// Cart lives in the visitor's browser (localStorage). No login is needed because
// orders are placed as a WhatsApp enquiry; the shop confirms stock and sends the QR.

export const CART_KEY = 'sudaroli-cart';
export const CART_EVENT = 'sudaroli:cart';
export const MAX_PER_LINE = 20;

export type CartItem = {
  productId: string; // product slug
  name: string;
  image: string;
  variant: string; // pack label, e.g. "250 g"
  price: number; // rupees
  quantity: number;
};

function parseCart(value: string): CartItem[] {
  try {
    const saved: unknown = JSON.parse(value);
    if (!Array.isArray(saved)) return [];
    return saved.filter((item): item is CartItem => Boolean(item) && typeof item.productId === 'string' && typeof item.variant === 'string' && Number(item.quantity) > 0);
  } catch {
    return [];
  }
}

export function subscribeCart(onChange: () => void) {
  window.addEventListener(CART_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CART_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function getCartSnapshot() {
  try {
    return window.localStorage.getItem(CART_KEY) || '[]';
  } catch {
    return '[]';
  }
}

export function getServerCartSnapshot() {
  return '[]';
}

export function parseCartSnapshot(snapshot: string) {
  return parseCart(snapshot);
}

export function readCart(): CartItem[] {
  return parseCart(getCartSnapshot());
}

export function writeCart(items: CartItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

/** Adds an item, never exceeding the packs in stock. Returns how many were actually added. */
export function addToCart(item: Omit<CartItem, 'quantity'>, quantity: number, stock: number) {
  const cart = readCart();
  const index = cart.findIndex((entry) => entry.productId === item.productId && entry.variant === item.variant);
  const already = index >= 0 ? cart[index].quantity : 0;
  const limit = Math.min(stock, MAX_PER_LINE);
  const next = Math.min(limit, already + quantity);
  const added = next - already;
  if (added <= 0) return 0;
  if (index >= 0) cart[index] = { ...cart[index], price: item.price, quantity: next };
  else cart.push({ ...item, quantity: next });
  writeCart(cart);
  return added;
}
