/**
 * API endpoint: POST /api/bold-signature
 *
 * Computes the Bold integrity signature (SHA-256) server-side for the cart.
 *
 * SECURITY: The client only sends product IDs and quantities. The amount,
 * currency, order ID and description are ALL derived on the server from the
 * prices stored in Supabase, so a customer cannot tamper with the price
 * (e.g. by editing localStorage or calling this endpoint directly).
 *
 * Before returning the signature, a 'pending' row is saved in the `orders`
 * table so the Bold webhook (/api/bold-webhook) knows what was bought.
 *
 * The buyer's delivery details are validated and saved on the order too
 * (see lib/customer.ts).
 *
 * Request body: { items: Array<{ id: string; quantity: number }>, customer: CustomerDetails }
 * Response:     { orderId, amount, currency, description, integritySignature, apiKey }
 * Errors:       400 invalid input · 409 unavailable/unknown products · 503 not configured
 */

import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { getSupabaseAdmin } from '../../lib/supabase-admin';
import { getBoldConfig, computeIntegritySignature } from '../../lib/bold';
import { parseCustomerDetails } from '../../lib/customer';
import { MAX_QUANTITY } from '../../utils/cart';

const MAX_ITEMS = 50;
const MAX_DESCRIPTION_LENGTH = 100;
const MIN_AMOUNT_COP = 1000; // Bold's minimum charge
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const bold = getBoldConfig();
  const supabaseAdmin = getSupabaseAdmin();

  if (!bold || !supabase || !supabaseAdmin) {
    console.error('bold-signature: Bold keys, Supabase client or service role key not configured');
    return json({ error: 'Payments unavailable' }, 503);
  }

  // ---- 1. Parse and validate input (only ids + quantities are accepted) ----
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const rawItems = (body as { items?: unknown })?.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > MAX_ITEMS) {
    return json({ error: 'Invalid items' }, 400);
  }

  // Merge duplicate ids and validate each entry
  const quantities = new Map<string, number>();
  for (const raw of rawItems) {
    const id = (raw as { id?: unknown })?.id;
    const quantity = (raw as { quantity?: unknown })?.quantity;
    if (
      typeof id !== 'string' || !UUID_RE.test(id) ||
      typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1
    ) {
      return json({ error: 'Invalid items' }, 400);
    }
    const total = (quantities.get(id) ?? 0) + quantity;
    if (total > MAX_QUANTITY) {
      return json({ error: 'Invalid quantity' }, 400);
    }
    quantities.set(id, total);
  }

  const parsedCustomer = parseCustomerDetails((body as { customer?: unknown })?.customer);
  if (!parsedCustomer.ok) {
    return json({ error: 'Invalid customer details', fields: parsedCustomer.fields }, 400);
  }
  const { customer } = parsedCustomer;

  // ---- 2. Load authoritative product data from Supabase ----
  const ids = [...quantities.keys()];
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, price, currency, available')
    .in('id', ids);

  if (error) {
    console.error('bold-signature: Supabase error', error.message);
    return json({ error: 'Could not load products' }, 500);
  }

  // Every requested product must exist, be available and have a valid price
  const invalidIds = ids.filter(id => {
    const p = products?.find(prod => prod.id === id);
    return !p || p.available !== true || typeof p.price !== 'number' || p.price <= 0;
  });
  if (invalidIds.length > 0) {
    return json({ error: 'Some products are no longer available', invalidIds }, 409);
  }

  // Bold only charges COP in whole pesos
  if (products!.some(p => (p.currency || 'COP').toUpperCase() !== 'COP')) {
    return json({ error: 'Only COP is supported for online payment' }, 400);
  }
  const currency = 'COP';

  // ---- 3. Compute amount, order ID and description on the server ----
  const amount = Math.round(
    products!.reduce((sum, p) => sum + p.price! * quantities.get(p.id)!, 0)
  );
  if (amount < MIN_AMOUNT_COP) {
    return json({ error: 'Amount below Bold minimum' }, 400);
  }

  const orderId = `PNT-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  let description = products!
    .map(p => `${p.title || 'Producto'} x${quantities.get(p.id)}`)
    .join(', ');
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    description = `${description.slice(0, MAX_DESCRIPTION_LENGTH - 1)}…`;
  }

  // ---- 4. Save the pending order (prices as charged, for the webhook) ----
  const { error: orderError } = await supabaseAdmin.from('orders').insert({
    id: orderId,
    amount,
    currency,
    description,
    items: products!.map(p => ({
      id: p.id,
      title: p.title,
      quantity: quantities.get(p.id)!,
      price: p.price,
    })),
    customer_name: customer.fullName,
    customer_email: customer.email,
    customer_phone: customer.phone,
    shipping_address: customer.address,
    shipping_city: customer.city,
    shipping_department: customer.department,
    shipping_notes: customer.notes,
  });
  if (orderError) {
    console.error('bold-signature: could not save order', orderError.message);
    return json({ error: 'Could not create order' }, 500);
  }

  // ---- 5. Sign: SHA-256("{orderId}{amount}{currency}{secretKey}") ----
  const integritySignature = await computeIntegritySignature(orderId, amount, currency, bold.secretKey);

  return json({
    orderId,
    amount,
    currency,
    description,
    integritySignature,
    apiKey: bold.apiKey,
  });
};
