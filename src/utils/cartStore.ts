export interface CartItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  brand?: string;
  selectedUpgrades?: string[];
  maxOrderQuantity?: number;
}

export const COURIER_CHARGE = 450;
const STORAGE_KEY = 'tyrelink_cart_v1';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read cart from localStorage', err);
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('tyrelink:cart-updated', { detail: items }));
  } catch (err) {
    console.error('Failed to save cart to localStorage', err);
  }
}

export function addToCart(item: Omit<CartItem, 'quantity'> & { quantity?: number; maxOrderQuantity?: number }): void {
  const current = getCart();
  const existingIdx = current.findIndex((i) => i.id === item.id);
  const maxLimit = item.maxOrderQuantity && item.maxOrderQuantity > 0 ? item.maxOrderQuantity : 3;
  const qtyToAdd = Math.min(item.quantity ?? 1, maxLimit);

  let updated: CartItem[];
  if (existingIdx > -1) {
    updated = current.map((i, idx) => {
      if (idx === existingIdx) {
        const itemMax = i.maxOrderQuantity || maxLimit;
        return { ...i, quantity: Math.min(i.quantity + qtyToAdd, itemMax) };
      }
      return i;
    });
  } else {
    updated = [...current, { ...item, quantity: qtyToAdd, maxOrderQuantity: maxLimit }];
  }

  saveCart(updated);
  openCartDrawer();
}

export function updateCartQuantity(id: string, delta: number): void {
  const current = getCart();
  const updated = current
    .map((item) => {
      if (item.id === id) {
        const itemMax = item.maxOrderQuantity && item.maxOrderQuantity > 0 ? item.maxOrderQuantity : 3;
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        return { ...item, quantity: Math.min(newQty, itemMax) };
      }
      return item;
    })
    .filter(Boolean) as CartItem[];

  saveCart(updated);
}

export function removeFromCart(id: string): void {
  const current = getCart();
  const updated = current.filter((item) => item.id !== id);
  saveCart(updated);
}

export function clearCart(): void {
  saveCart([]);
}

export function getCartCount(items?: CartItem[]): number {
  const list = items ?? getCart();
  return list.reduce((total, item) => total + item.quantity, 0);
}

export function getCartSubtotal(items?: CartItem[]): number {
  const list = items ?? getCart();
  return list.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function openCartDrawer(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tyrelink:open-cart'));
  }
}

export function closeCartDrawer(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tyrelink:close-cart'));
  }
}

export interface CheckoutPayload {
  items: Array<{
    id: string;
    title: string;
    price: number;
    quantity: number;
    image?: string;
    selectedUpgrades?: string[];
  }>;
}

export function openCheckoutModal(payload: CheckoutPayload): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tyrelink:open-checkout', { detail: payload }));
  }
}
