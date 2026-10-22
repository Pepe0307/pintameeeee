/**
 * API endpoint: POST /api/bold-webhook
 *
 * Receives Bold payment notifications (https://developers.bold.co/webhook)
 * and updates the `orders` table.
 *
 * SECURITY:
 *   - The `x-bold-signature` header is verified: hex(HMAC-SHA256(key, base64(body))).
 *     The key is BOLD_SECRET_KEY in production and '' in test mode.
 *   - In test mode signatures can be forged, so every event is additionally
 *     confirmed with Bold's API before it is trusted.
 *   - mark_order_paid() only accepts an event whose amount and currency match
 *     the saved order, and marks products sold atomically.
 *
 * Bold requires a 200 within 2 seconds; any other status is retried
 * (15 min, 1 h, 4 h, 8 h, 24 h). We return 500 only for errors worth retrying.
 */

import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../lib/supabase-admin';
import { getBoldConfig, isBoldTestMode, verifyWebhookSignature } from '../../lib/bold';

const ORDER_PREFIX = 'PNT-';
const BOLD_NOTIFICATIONS_URL = 'https://integrations.api.bold.co/payments/webhook/notifications';

interface BoldEvent {
  id?: string;
  type?: string;
  data?: {
    payment_id?: string;
    amount?: { total?: number; currency?: string };
    metadata?: { reference?: string };
    payer_email?: string;
    payment_method?: string;
  };
}

function text(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** Test mode only: ask Bold whether this exact notification really exists. */
async function confirmWithBold(event: BoldEvent, apiKey: string): Promise<boolean> {
  const paymentId = event.data?.payment_id;
  if (!paymentId) return false;
  try {
    const res = await fetch(`${BOLD_NOTIFICATIONS_URL}/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `x-api-key ${apiKey}` },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return false;
    const body = (await res.json()) as { notifications?: BoldEvent[] };
    return (body.notifications ?? []).some(n =>
      n.type === event.type &&
      n.data?.payment_id === paymentId &&
      n.data?.metadata?.reference === event.data?.metadata?.reference &&
      n.data?.amount?.total === event.data?.amount?.total
    );
  } catch (err) {
    console.error('bold-webhook: could not confirm event with Bold', err);
    return false;
  }
}

export const POST: APIRoute = async ({ request }) => {
  const testMode = isBoldTestMode();
  const bold = getBoldConfig();
  const supabaseAdmin = getSupabaseAdmin();

  if (!bold || !supabaseAdmin) {
    console.error('bold-webhook: Bold keys or service role key not configured');
    return text('Not configured', 503); // Bold will retry once it is fixed
  }

  // ---- 1. Verify the signature over the exact raw bytes ----
  const rawBody = new Uint8Array(await request.arrayBuffer());
  const signingKey = testMode ? '' : bold.secretKey;
  const validSignature = await verifyWebhookSignature(
    rawBody,
    request.headers.get('x-bold-signature'),
    signingKey,
  );
  if (!validSignature) {
    console.warn('bold-webhook: invalid signature');
    return text('Invalid signature', 401);
  }

  let event: BoldEvent;
  try {
    event = JSON.parse(new TextDecoder().decode(rawBody));
  } catch {
    return text('Invalid JSON', 400);
  }

  const reference = event.data?.metadata?.reference ?? '';
  const paymentId = event.data?.payment_id ?? null;

  // Events from other Bold channels (POS, payment links…) are not ours
  if (!reference.startsWith(ORDER_PREFIX)) {
    return text('Ignored');
  }

  if (testMode && !(await confirmWithBold(event, bold.apiKey))) {
    console.warn('bold-webhook: test-mode event not confirmed by Bold', event.id);
    return text('Unconfirmed event', 401);
  }

  // ---- 2. Apply the event ----
  switch (event.type) {
    case 'SALE_APPROVED': {
      const { data: result, error } = await supabaseAdmin.rpc('mark_order_paid', {
        p_order_id: reference,
        p_payment_id: paymentId ?? '',
        p_amount: Number(event.data?.amount?.total ?? 0),
        p_currency: event.data?.amount?.currency ?? '',
        p_payer_email: event.data?.payer_email ?? null,
        p_payment_method: event.data?.payment_method ?? null,
      });
      if (error) {
        console.error('bold-webhook: mark_order_paid failed', error.message);
        return text('Database error', 500);
      }
      if (result !== 'paid' && result !== 'already_paid') {
        console.warn(`bold-webhook: order ${reference} needs attention: ${result}`);
      }
      return text('OK');
    }

    case 'SALE_REJECTED': {
      const { error } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'rejected',
          bold_payment_id: paymentId,
          last_event: event.type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reference)
        .eq('status', 'pending');
      if (error) {
        console.error('bold-webhook: could not mark order rejected', error.message);
        return text('Database error', 500);
      }
      return text('OK');
    }

    case 'VOID_APPROVED': {
      // Payment cancelled/refunded. Products are NOT put back on sale
      // automatically — Lida decides that in the admin.
      const { error } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'voided',
          last_event: event.type,
          note: 'Pago anulado en Bold. Revisar si la pieza vuelve a estar disponible.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', reference);
      if (error) {
        console.error('bold-webhook: could not mark order voided', error.message);
        return text('Database error', 500);
      }
      return text('OK');
    }

    default:
      // VOID_REJECTED and any future event types: acknowledge, nothing to do
      return text('Ignored');
  }
};
