import { defineConfig, passthroughImageService } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://your-art-gallery.com',
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile'
  }),
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