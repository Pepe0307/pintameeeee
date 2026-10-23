/**
 * Shared Bold.co helpers (server-only).
 *
 * Keys are read through `astro:env/server`:
 *   - PUBLIC_BOLD_API_KEY: identity key (public)
 *   - BOLD_SECRET_KEY: integrity secret, read at runtime and never
 *     inlined into the build output or sent to the browser.
 *   - BOLD_TEST_MODE: "true" only where Bold test keys are used (see below).
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
 * Bold signs test-mode webhooks with an empty key, so in test mode anyone can
 * forge a valid signature. Must never be enabled in production.
 */
export function isBoldTestMode(): boolean {
  return String(getSecret('BOLD_TEST_MODE') ?? '').trim().toLowerCase() === 'true';
}

/**
 * Product IDs that test-mode webhooks may act on (comma-separated
 * BOLD_TEST_PRODUCT_IDS). Empty means no test-mode event is applied.
 */
export function getBoldTestProductIds(): Set<string> {
  return new Set(
    String(getSecret('BOLD_TEST_PRODUCT_IDS') ?? '')
      .split(',')
      .map(id => id.trim())
      .filter(Boolean),
  );
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
  return toHex(hashBuffer);
}

/**
 * Verifies the `x-bold-signature` header of a webhook:
 * hex(HMAC-SHA256(key, base64(rawBody))).
 *
 * `key` is the secret key in production and '' in test mode.
 */
export async function verifyWebhookSignature(
  rawBody: Uint8Array,
  signature: string | null,
  key: string,
): Promise<boolean> {
  if (!signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;

  // Web Crypto rejects zero-length HMAC keys. HMAC zero-pads short keys to the
  // block size (64 bytes for SHA-256), so 64 zero bytes is equivalent to ''.
  const keyBytes = key ? new TextEncoder().encode(key) : new Uint8Array(64);
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const message = new TextEncoder().encode(bytesToBase64(rawBody));
  const expected = toHex(await crypto.subtle.sign('HMAC', cryptoKey, message));

  return timingSafeEqual(expected, signature.toLowerCase());
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
