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

/** Flat shipping fee per order, in COP (also charged by /api/bold-signature) */
export const SHIPPING_COP = 18000;

/** Products in this category are courses: nothing to ship */
export const COURSE_CATEGORY = 'courses';

/** Shipping for an order: free when every item is a course */
export function shippingFor(categories: (string | null)[]): number {
  return categories.some(c => c !== COURSE_CATEGORY) ? SHIPPING_COP : 0;
}

/** Most units per order for a product: one per course, MAX_QUANTITY otherwise */
export function maxQuantityFor(category: string | null): number {
  return category === COURSE_CATEGORY ? 1 : MAX_QUANTITY;
}

/** Bundle discount in COP: 10% off the courses for 2 different courses, 15% for 3 or more */
export function courseDiscount(items: { category: string | null; price: number; quantity: number }[]): number {
  const courses = items.filter(i => i.category === COURSE_CATEGORY);
  const rate = courses.length >= 3 ? 0.15 : courses.length === 2 ? 0.1 : 0;
  return Math.round(courses.reduce((sum, i) => sum + i.price * i.quantity, 0) * rate);
}

/** Add a product to the cart (or increment quantity if already exists) */
export function addToCart(item: Omit<CartItem, 'quantity'>): void {
  const cart = getCart();
  const existing = cart.find(i => i.id === item.id);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + 1, maxQuantityFor(existing.category));
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
    item.quantity = Math.min(quantity, maxQuantityFor(item.category));
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
