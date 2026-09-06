# 🎨 Pintameeeee - Arte de Lida

Pintame es una galería de arte en línea y tienda virtual diseñada para exhibir y vender piezas de arte únicas, hechas a mano y pintadas a mano por Lida, desde Colombia.

## 🚀 Tecnologías

- **Framework:** [Astro v5](https://astro.build/) (`^5.16.9`) en modo SSR
- **Backend:** [Supabase](https://supabase.com/) (PostgreSQL & Storage) — `@supabase/supabase-js` `^2.101.1`
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) (`^4.1.18`) con `@tailwindcss/vite`
- **Hosting:** [Cloudflare Pages](https://pages.cloudflare.com/) con `@astrojs/cloudflare` `^12.6.13`
- **Optimización de Imágenes:** [Sharp](https://sharp.pixelplumbing.com/) (`^0.34.5`)
- **SEO:** `@astrojs/sitemap` `^3.6.1`

## ✨ Características

- 🏷️ **Catálogo de productos** con filtrado por categorías en tiempo real
- 🖼️ **Galería de imágenes múltiples** con miniaturas interactivas
- 🟢 **Sistema de disponibilidad** (disponible / vendido)
- 💬 **Botones de WhatsApp contextuales** con información del producto
- 💎 **Diseño responsive** con glassmorphism y micro-animaciones
- 🔍 **SEO optimizado** (meta tags, Open Graph, canonical URLs, sitemap)
- 🛡️ **Tipado estricto** con TypeScript y tipos auto-generados de Supabase

## 🛠️ Estructura del Proyecto

```
src/
├── pages/
│   ├── index.astro           # Inicio (hero + destacados)
│   ├── catalogo.astro        # Catálogo completo con filtros
│   └── producto/[slug].astro # Detalle del producto
├── components/
│   ├── Header.astro          # Nav con glassmorphism
│   ├── Footer.astro          # Footer con enlaces y WhatsApp
│   ├── ProductCard.astro     # Tarjeta de producto
│   └── WhatsAppButton.astro  # CTA contextual de WhatsApp
├── layouts/
│   └── BaseLayout.astro      # Layout principal con SEO
├── lib/
│   ├── supabase.ts           # Cliente de Supabase tipado
│   └── database.types.ts     # Tipos auto-generados
├── utils/
│   ├── config.ts             # Configuración del sitio
│   ├── translations.ts       # Traducciones de categorías
│   └── formatters.ts         # Formato de precios
└── styles/
    └── global.css            # Tema, fuentes y animaciones
```

## ⚙️ Configuración

El proyecto requiere las siguientes variables de entorno de Supabase:

- `PUBLIC_SUPABASE_URL` — URL del proyecto Supabase
- `PUBLIC_SUPABASE_ANON_KEY` — Llave pública anónima

**En local:** Crea un archivo `.env` en la raíz del proyecto.
**En producción:** Configura las variables en **Cloudflare Pages > Settings > Environment variables**.

## 🧞 Comandos

| Comando | Acción |
| :--- | :--- |
| `npm install` | Instala las dependencias |
| `npm run dev` | Servidor de desarrollo en `localhost:4321` |
| `npm run build` | Compila para producción en `./dist/` |
| `npm run preview` | Previsualiza con `wrangler` |
| `npm run astro ...` | CLI de Astro |

## 📦 Despliegue

El sitio se despliega automáticamente en **Cloudflare Pages** a través de la integración con GitHub.
