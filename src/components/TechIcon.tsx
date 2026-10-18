import { cn } from "../utils/cn";

// ─────────────────────────────────────────────
//  Logos de tecnología (marca) servidos por simple-icons CDN:
//  https://cdn.simpleicons.org/<slug>  → SVG en color oficial.
//  Sin dependencias ni assets propios; en modo offline el logo simplemente
//  no carga y queda el texto, así que nunca se rompe el diseño.
// ─────────────────────────────────────────────

const SLUGS: Record<string, string> = {
  react: "react",
  react18: "react",
  javascript: "javascript",
  js: "javascript",
  typescript: "typescript",
  ts: "typescript",
  python: "python",
  asyncio: "python",
  django: "django",
  drf: "django",
  fastapi: "fastapi",
  nodejs: "nodedotjs",
  node: "nodedotjs",
  docker: "docker",
  dockercompose: "docker",
  kubernetes: "kubernetes",
  threejs: "threedotjs",
  webgl: "webgl",
  tailwind: "tailwindcss",
  tailwindcss: "tailwindcss",
  unity: "unity",
  unreal: "unrealengine",
  postgresql: "postgresql",
  mysql: "mysql",
  langchain: "langchain",
  openai: "openai",
  anthropic: "anthropic",
  claude: "anthropic",
  mqtt: "mqtt",
  git: "git",
  github: "github",
  figma: "figma",
  blender: "blender",
  numpy: "numpy",
  redis: "redis",
  nginx: "nginx",
  linux: "linux",
  wordpress: "wordpress",
  elementor: "elementor",
  cloudflare: "cloudflare",
  r2: "cloudflare",
  api: "swagger",
  jwt: "jsonwebtokens",
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Devuelve el slug de simple-icons de una tecnología, o null si no hay logo.
 * Soporta nombres compuestos ("React + TypeScript") probando cada parte.
 */
export function techSlug(name: string): string | null {
  const parts = name.split(/[+,\/·|&]/);
  for (const part of parts) {
    const slug = SLUGS[normalize(part)];
    if (slug) return slug;
  }
  return null;
}

/** Logo de marca de una tecnología. Devuelve null si no existe logo (el llamador muestra el texto). */
export function TechIcon({ name, className }: { name: string; className?: string }) {
  const slug = techSlug(name);
  if (!slug) return null;
  return (
    <img
      src={`https://cdn.simpleicons.org/${slug}`}
      alt=""
      loading="lazy"
      className={cn("h-4 w-4 shrink-0", className)}
    />
  );
}
