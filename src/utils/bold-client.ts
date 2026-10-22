/**
 * Client-side helpers for Bold's custom checkout button.
 *
 * Bold's library is loaded when the page loads (this creates nothing). The
 * order is only created when the customer clicks "Pagar": we ask
 * /api/bold-signature for a signed order (priced on the server from Supabase
 * and saved as 'pending'), then open Bold's checkout with `BoldCheckout`.
 *
 * Docs: https://developers.bold.co/pagos-en-linea/boton-de-pagos/integracion-manual/integracion-personalizada
 */

const BOLD_SCRIPT_URL = 'https://checkout.bold.co/library/boldPaymentButton.js';
const CONFIRMATION_PATH = '/pedido/confirmacion';

interface BoldCheckoutInstance {
  open(): void;
}

declare global {
  interface Window {
    BoldCheckout?: new (config: Record<string, string>) => BoldCheckoutInstance;
  }
}

let libraryPromise: Promise<void> | null = null;

/** Loads Bold's checkout library once. Safe to call many times. */
export function loadBoldLibrary(): Promise<void> {
  if (window.BoldCheckout) return Promise.resolve();
  if (!libraryPromise) {
    libraryPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = BOLD_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        // Allow a retry on the next click (e.g. flaky network)
        libraryPromise = null;
        script.remove();
        reject(new Error('Could not load Bold checkout'));
      };
      document.head.appendChild(script);
    });
  }
  return libraryPromise;
}

export type BoldCheckoutResult = 'opened' | 'unavailable' | 'error';

/**
 * Creates the order on the server and opens Bold's checkout.
 * Call this from a click handler.
 */
export async function startBoldCheckout(
  items: { id: string; quantity: number }[],
): Promise<BoldCheckoutResult> {
  try {
    // Load the library first, so an ad blocker doesn't leave an orphan order
    await loadBoldLibrary();
    if (!window.BoldCheckout) return 'error';

    const res = await fetch('/api/bold-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      return res.status === 409 ? 'unavailable' : 'error';
    }
    const data = await res.json();

    const config: Record<string, string> = {
      orderId: data.orderId,
      currency: data.currency,
      amount: String(data.amount),
      apiKey: data.apiKey,
      integritySignature: data.integritySignature,
      description: data.description,
    };
    // Bold only accepts HTTPS redirection URLs (so not on http://localhost)
    if (location.protocol === 'https:') {
      config.redirectionUrl = `${location.origin}${CONFIRMATION_PATH}`;
    }

    new window.BoldCheckout(config).open();
    return 'opened';
  } catch {
    return 'error';
  }
}
