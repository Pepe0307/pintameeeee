/**
 * Shared Bold.co helpers (server-only).
 *
 * Keys are read through `astro:env/server`:
 *   - PUBLIC_BOLD_API_KEY: identity key (public)
 *   - BOLD_SECRET_KEY: integrity secret, read at runtime and never
 *     inlined into the build output or sent to the browser.
 */

import { getSecret, PUBLIC_BOLD_API_KEY } from 'astro:env/server';

export interface BoldConfig {
  apiKey: string;
  secretKey: string;
}

/** Returns the Bold keys, or null if either one is missing. */
export function getBoldConfig(): BoldConfig | null {
  const apiKey = (PUBLIC_BOLD_API_KEY ?? '').trim();
  // getSecret() reads the value from the runtime environment on each call
  const secretKey = (getSecret('BOLD_SECRET_KEY') ?? '').trim();
  return apiKey && secretKey ? { apiKey, secretKey } : null;
}

/**
 * Bold integrity signature: SHA-256("{orderId}{amount}{currency}{secretKey}") as hex.
 * Uses Web Crypto, so it works in both the Node dev server and Cloudflare Workers.
 */
export async function computeIntegritySignature(
  orderId: string,
  amount: number,
  currency: string,
  secretKey: string,
): Promise<string> {
  const data = `${orderId}${amount}${currency}${secretKey}`;
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
