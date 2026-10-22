/**
 * Client-side helper to show the Bold payment button.
 *
 * Asks /api/bold-signature for a signed order (the server prices it from
 * Supabase and saves it as 'pending'), then injects Bold's script.
 * Used by the product page (BoldPayButton) and the cart page.
 */

const BOLD_SCRIPT_URL = 'https://checkout.bold.co/library/boldPaymentButton.js';
const CONFIRMATION_PATH = '/pedido/confirmacion';

export type BoldMountResult = 'ok' | 'unavailable' | 'error' | 'stale';

export async function mountBoldButton(
  container: HTMLElement,
  items: { id: string; quantity: number }[],
  isCurrent: () => boolean = () => true,
): Promise<BoldMountResult> {
  try {
    const res = await fetch('/api/bold-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });

    // A newer request was started (e.g. quantity changed) — drop this one
    if (!isCurrent()) return 'stale';

    if (!res.ok) {
      container.innerHTML = '';
      return res.status === 409 ? 'unavailable' : 'error';
    }

    const data = await res.json();
    if (!isCurrent()) return 'stale';

    container.innerHTML = '';
    const script = document.createElement('script');
    script.src = BOLD_SCRIPT_URL;
    script.setAttribute('data-bold-button', '');
    script.setAttribute('data-api-key', data.apiKey);
    script.setAttribute('data-amount', String(data.amount));
    script.setAttribute('data-currency', data.currency);
    script.setAttribute('data-description', data.description);
    script.setAttribute('data-order-id', data.orderId);
    script.setAttribute('data-integrity-signature', data.integritySignature);
    // Bold only accepts HTTPS redirection URLs (so not on http://localhost)
    if (location.protocol === 'https:') {
      script.setAttribute('data-redirection-url', `${location.origin}${CONFIRMATION_PATH}`);
    }
    container.appendChild(script);
    return 'ok';
  } catch {
    if (isCurrent()) container.innerHTML = '';
    return 'error';
  }
}
