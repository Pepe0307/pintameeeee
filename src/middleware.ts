import { defineMiddleware } from 'astro:middleware';

// Security headers for every server-rendered page and API response.
// No full CSP yet: the Bold checkout script loads from Bold's domains and
// would need its sources listed first. frame-ancestors alone is safe.
const SECURITY_HEADERS = {
  'Content-Security-Policy': "frame-ancestors 'none'", // no one can embed the site (clickjacking on /admin)
  'X-Frame-Options': 'DENY', // same, for older browsers
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
});
