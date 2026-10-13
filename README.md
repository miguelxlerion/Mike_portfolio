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

- **Lanzador rápido (Windows):** doble clic a **`Abrir-Panel-Admin.bat`** — instala dependencias si faltan, levanta el servidor si no corre y abre `/#/admin` en tu navegador. No cierres la ventana del servidor mientras lo uses.
- El panel **solo existe** con `npm run dev`. El build de producción (`npm run build`, lo que sube a Pages) lo elimina por completo: sin ruta, sin botones, sin código (verificado: `dist/` no contiene rastros del admin).
- Abre `http://localhost:5173/#/admin` (o pulsa **Panel** en la navbar, visible solo en local).
- Contraseña por defecto: **`mike123`** (cámbiala en la pestaña *Datos*).
- Edita **todo**: identidad, hero, roles, stats, marquee, bio, habilidades, proyectos, sitios web, modelos 3D, GitHub, contacto, colores y visibilidad de secciones.
- Todo se **autoguarda en el navegador** (localStorage `mike-portfolio-v2`).

## Inglés automático (ES/EN) 🌐

- Interruptor **ES|EN** en la navbar (desktop + móvil). Sin duplicar el modelo: traduce el DOM en vivo vía Google (gtx), 1 petición por cadena única.
- **Caché persistente** (`mike-i18n-cache-en-v1`): la primera visita traduce, las siguientes cuestan 0 peticiones. `?lang=en` enlace compartible; preferencia guardada.
- Respeta **código** (`pre`/`code` jamás se tocan), nombres propios (marca nav) y el toggle; el typewriter del Hero traduce sus roles aparte.
- Un `MutationObserver` traduce el contenido dinámico (modales, filtros, repos). Volver a ES restaura el texto exacto. Si la API falla, el nodo queda en español: nunca se rompe.
- Arquitectura anti-429: el navegador pide **lotes de 15** a `POST /api/translate` (Worker), que agrupa, cachea 30 días en el edge y reintenta con backoff. Sin el Worker (dev local), cae a Google directo.
- Para producción blindada: variable `TRANSLATE_API_KEY` (Google Cloud Translation, calentar todo el sitio ≈ $0.40 una vez; luego todo es caché). Sin ella usa el endpoint público con backoff.
- Correcciones puntuales en `OVERRIDES` de `src/i18n/auto.ts` (ej. INICIO→Home).

## Medios: imágenes y videos 🖼

Pestaña **Medios** del panel (requiere token):

- **Subir desde el PC**: jpg/png/webp/gif/svg/avif hasta 10 MB → van a `public/uploads/` del repo → Cloudflare las sirve en ~1–2 min como `/uploads/archivo.jpg`. Copia la ruta y pégala en Retrato, Proyecto, Modelo o Sitio.
- **Importar por URL**: trae una imagen externa al repo (si el origen bloquea CORS, te avisa y la subes desde el PC).
- **Galería**: lista lo subido (miniaturas inmediatas vía raw), copiar ruta y borrar.
- **Videos (solo URL)**: los videos no se suben (pesan demasiado). Pega la URL del .mp4, elige proyecto y **Asignar**: la ficha mostrará reproductor en vez de foto. CSP ya permite `media-src https:`.

## Asistente RAG 🤖 (Workers AI + Vectorize)

Burbuja inferior-izquierda: responde sobre el perfil (experiencia, stack, proyectos, contacto) con búsqueda semántica + Llama 3.1 8B, citando fuentes. Bilingüe ES/EN, sugerencias, historial de sesión.

- `worker/knowledge.mjs` → la base (edítala y re-ejecuta ingest).
- `worker/chat.ts` → `POST /api/chat {question, history?}` con tope 12 req/min por IP (más regla Rate Limiting recomendada en dashboard).
- Sin bindings responde `501/502` y el widget deriva al email: nunca se rompe.
- Activarlo (una vez):
  ```bash
  npx wrangler vectorize create portfolio-kb --dimensions=384 --metric=cosine
  $env:CLOUDFLARE_API_TOKEN="<token con Workers AI + Vectorize>"
  $env:CLOUDFLARE_ACCOUNT_ID="<account id>"
  npm run rag:ingest
  ```
  Probar: `POST /api/chat {"question":"¿En qué stack trabajas?"}`.

## Publicar cambios 🚀 (cero terminal)

Pestaña **Publicar** del panel local, con tu token de GitHub:

1. **Publicar contenido** — sube solo `src/data/content.ts` (rápido, para cambios de textos/fotos/colores).
2. **Publicar TODO el proyecto** — 1) *Comparar con GitHub* (lista Añadidos/Modificados), 2) *Publicar N archivos*: sube código + contenido en un solo commit, subiendo solo lo cambiado (compara SHA-1 de blob git). Lee los archivos frescos del disco vía `/__sources.json` (solo existe en dev), así nunca sube código viejo. Los borrados en local se conservan en GitHub.
3. Cloudflare detecta el push y **redespliega solo** en 1–2 min. Si luego usas la terminal, haz `git pull` primero.
4. Primera vez: haz el push inicial del proyecto (los comandos están en la propia pestaña Publicar).

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
