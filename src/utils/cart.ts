/**
 * Cart utility module.
 * Manages a shopping cart using localStorage (client-side only).
 * 
 * Cart items are stored as an array of CartItem objects.
 */

export interface CartItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  category: string | null;
  quantity: number;
}

const CART_KEY = 'pintame_cart';

/** Get all items from the cart */
export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Save the cart to localStorage */
function saveCart(cart: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  // Dispatch a custom event so other components can react
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
}

/** Most units of one product per order (also enforced by /api/bold-signature) */
export const MAX_QUANTITY = 10;

/** Add a product to the cart (or increment quantity if already exists) */
export function addToCart(item: Omit<CartItem, 'quantity'>): void {
  const cart = getCart();
  const existing = cart.find(i => i.id === item.id);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + 1, MAX_QUANTITY);
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  saveCart(cart);
}

/** Remove a product entirely from the cart */
export function removeFromCart(id: string): void {
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
}

/** Update the quantity of an item (removes if quantity <= 0) */
export function updateQuantity(id: string, quantity: number): void {
  if (quantity <= 0) {
    removeFromCart(id);
    return;
  }
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) {
    item.quantity = Math.min(quantity, MAX_QUANTITY);
    saveCart(cart);
  }
}

/** Get total number of items in the cart */
export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

/** Get total price of all items in the cart */
export function getCartTotal(): number {
  return getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

/** Clear all items from the cart */
export function clearCart(): void {
  saveCart([]);
}
