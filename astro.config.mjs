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