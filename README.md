# Pintame - Galería de Arte de Lida

Pintame es una galería de arte en línea y plataforma de comercio electrónico diseñada para exhibir y vender obras de arte únicas, hechas a mano y pintadas a mano por Lida, desde Colombia.

## 🚀 Tecnologías

- **Framework:** [Astro v5](https://astro.build/) (SSR)
- **Backend:** [Supabase](https://supabase.com/) (PostgreSQL & Storage)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Hosting:** [Cloudflare Pages](https://pages.cloudflare.com/)
- **Optimización de Imágenes:** [Sharp](https://sharp.pixelplumbing.com/)

## 🛠️ Estructura del Proyecto

- `src/pages/`: Rutas del sitio (Inicio, Catálogo, Detalle de Producto).
- `src/components/`: Componentes reutilizables de la interfaz.
- `src/layouts/`: Plantillas base para las páginas.
- `src/lib/supabase.ts`: Configuración del cliente de Supabase.
- `src/utils/`: Funciones de utilidad y configuración global.

## ⚙️ Configuración

El proyecto requiere las siguientes variables de entorno:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

## 🧞 Comandos

| Comando | Acción |
| :--- | :--- |
| `npm install` | Instala las dependencias |
| `npm run dev` | Inicia el servidor de desarrollo en `localhost:4321` |
| `npm run build` | Compila el sitio para producción en `./dist/` |
| `npm run preview` | Previsualiza la compilación localmente con `wrangler` |
| `npm run astro ...` | Ejecuta comandos de la CLI de Astro |

## 📦 Despliegue

El sitio está configurado para desplegarse automáticamente en **Cloudflare Pages** a través de la integración con GitHub.
