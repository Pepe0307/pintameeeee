import { defineConfig, envField, passthroughImageService } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// Dummy comment to trigger deployment test
export default defineConfig({
  site: 'https://pintameeeee.com',
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile'
  }),
  env: {
    schema: {
      // Bold identity key. Public by design (it appears in the page HTML).
      PUBLIC_BOLD_API_KEY: envField.string({ context: 'server', access: 'public', optional: true }),
      // Bold secret key for the integrity hash. Read at RUNTIME from the
      // environment (Cloudflare secret / local .env), never inlined in the build.
      BOLD_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Bold signs test-mode webhooks with an EMPTY key. Only set to "true" in
      // local/preview environments that use Bold test keys — never in production.
      BOLD_TEST_MODE: envField.boolean({ context: 'server', access: 'secret', default: false }),
      // Comma-separated product IDs that test-mode webhooks may mark paid.
      // Test-mode signatures can be forged, so only these pieces are at risk.
      BOLD_TEST_PRODUCT_IDS: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Supabase service role key: bypasses RLS. Server-only, used for orders.
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  integrations: [sitemap()],
  image: {
    service: passthroughImageService(),
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jxncyzrbjhoydsmjwsap.supabase.co',
      },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});