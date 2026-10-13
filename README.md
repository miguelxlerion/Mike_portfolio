# Portafolio de Miguel Rodriguez ✦

Senior Full-Stack Engineer · Real-Time 3D & AI Data Platforms.

Fusión de lo mejor de los 3 ejemplos, con base visual del **Ejemplo 1 (dark ácido)**:

| Origen | Lo que se aprovecha |
|---|---|
| **Ejemplo 1** | Tema dark + lima ácido, grano, Hero en 2 columnas con retrato + typewriter + partículas + contadores, About con barras, Projects con filtros + buscador + modal con CodeWindow, cursor custom, marquee, footer con marca de agua |
| **Ejemplo 2** | GitHub **real** (fetch a la API + skeletons + fallback), navbar con **barra de progreso + scroll-spy**, ordenación de repos, formulario que genera `mailto`, BackToTop |
| **Ejemplo 3** | Sistema `SectionHeader 01–04`, validación de formularios, empty-states, detalles editoriales |

Secciones finales: **Hero · Sobre mí · Proyectos · Sitios Web · GitHub en vivo · Modelos 3D · Contacto**.

## Sección Sitios Web 🌐

- Tarjetas estilo navegador con miniatura real (hotlink verificado a cada sitio), hostname y botón de visita.
- **Punto "En vivo"**: verifica con `fetch no-cors` que cada sitio responde (verde = responde, gris = sin respuesta, con timeout de 8s para no colgar nunca).
- Sin iframes (pesan y suelen estar bloqueados por `X-Frame-Options`) y sin dependencias de favicons externos.
- CRUD total en Panel → **Sitios Web**: título, descripción, URL, año, etiquetas, miniatura.

## Sección 3D ⚡ (rendimiento primero)

- **0 KB de 3D al cargar**: `three.js` (~590 KB) vive en chunk separado vía `React.lazy` y solo se descarga al pulsar **"Ver en 3D"**. El `GLTFLoader` (+46 KB) solo si hay un `.glb` que cargar.
- **Un solo canvas activo**, sin sombras, DPR limitado (auto ≤1.75, alta ≤2, baja =1), loop pausado fuera de pantalla (`IntersectionObserver`) y con pestaña oculta, `dispose` total de geometrías/materiales/renderer al cerrar.
- HUD en vivo con **tris + FPS**, selector de calidad, giro auto (respeta `prefers-reduced-motion`), drag con inercia + zoom por rueda.
- **Publicar tus modelos**: optimiza a `.glb` (<5 MB, texturas WebP) → súbelo a `public/models/` o a R2 → Panel → **Modelos 3D** → preset *"URL de mi .glb"* + pega la ruta. Hay 3 demos procedurales incluidas como placeholder.

## Panel de control ⚙ (solo local, nunca se publica)

- El panel **solo existe** con `npm run dev`. El build de producción (`npm run build`, lo que sube a Pages) lo elimina por completo: sin ruta, sin botones, sin código (verificado: `dist/` no contiene rastros del admin).
- Abre `http://localhost:5173/#/admin` (o pulsa **Panel** en la navbar, visible solo en local).
- Contraseña por defecto: **`mike123`** (cámbiala en la pestaña *Datos*).
- Edita **todo**: identidad, hero, roles, stats, marquee, bio, habilidades, proyectos, sitios web, modelos 3D, GitHub, contacto, colores y visibilidad de secciones.
- Todo se **autoguarda en el navegador** (localStorage `mike-portfolio-v2`).

## Publicar cambios 🚀 (flujo recomendado)

1. Edita en el panel local y comprueba en **Ver sitio**.
2. Ve a la pestaña **Publicar**, pega tu token de GitHub y pulsa **Publicar contenido en GitHub**.
3. Eso hace commit de `src/data/content.ts` en tu repo → Cloudflare Pages **redespliega solo** en 1–2 min.
4. Primera vez: el botón no basta — haz el push inicial del proyecto (los comandos están en la propia pestaña Publicar).

Alternativa sin token: pestaña *Datos* → Exportar JSON → commitea a mano.

## Comandos

```bash
npm install
npm run dev      # desarrollo en http://localhost:5173
npm run build    # build multi-archivo a dist/ (assets con hash para caché edge)
npm run preview  # previsualizar el build
```

## Deploy en Cloudflare ☁ (Worker + assets)

1. Sube el repo a GitHub y conéctalo en **Cloudflare Dashboard → Workers & Pages → Create → Import a repository** (el flujo dice "Worker": es el correcto, Pages vive ahí ahora).
2. Project name `mike-portfolio`. Deja tal cual: Build `npm run build`, Deploy `npx wrangler deploy`, Preview `npx wrangler preview` (el `wrangler.toml` ya define Worker + `dist/` + SPA fallback).
3. Obtendrás `https://mike-portfolio.workers.dev` + **preview deployments** por cada cambio (déjalas activadas).
4. Variables (Worker → Settings → Variables and Secrets):
   - `GITHUB_TOKEN` (opcional): el proxy `/api/github` pasa de 60 a 5000 req/h.
   - `RESEND_API_KEY` + `CONTACT_TO`: activan el envío real del formulario (sin ellas, cae a `mailto`).
   - `TURNSTILE_SECRET` (+ sitekey en el front): anti-spam del formulario.
5. Activa gratis en el dashboard: **Web Analytics** (sin cookies), **Speed → Optimization**, **WAF**, **DNSSEC** cuando apuntes tu dominio.

Qué demuestra cada pieza:

| Pieza | Uso correcto que demuestra |
|---|---|
| Build multi-archivo + `public/_headers` | Assets `immutable` 1 año en edge, HTML revalidado; CSP + hardening sin plugins raros |
| `worker/github.ts` | No quemar el rate-limit del visitante: caché edge 1h + `stale-while-revalidate` + token server-side (nunca expuesto) |
| `worker/contact.ts` | Serverless progresivo: Resend si hay clave, `mailto` si no; validación + Turnstile en servidor |
| Preview deployments | Cada cambio se revisa en URL temporal antes de producción |

> Nota: `vite-plugin-singlefile` sigue instalado pero desactivado en `vite.config.ts`. Úsalo solo si necesitas un `.html` portable fuera de Cloudflare.

## Personalizar rápido sin panel

- `src/data/content.ts` → todo el contenido inicial.
- `src/index.css` → tokens Tailwind v4 (`--color-acid`, fuentes, animaciones).
- Imágenes: pega URLs en el panel (retrato y proyectos) o coloca ficheros en `public/images/`.
