import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────
//  Snapshot del código fuente SOLO para `vite dev`.
//  El panel local (que también es solo-dev) lo pide al publicar
//  para commitear el proyecto completo sin pasar por la terminal.
//  En `vite build` este plugin no hace nada: no existe en producción.
// ─────────────────────────────────────────────
const SOURCE_FILES = [
  "index.html",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "vite.config.ts",
  "wrangler.toml",
  "README.md",
  ".gitignore",
  "Abrir-Panel-Admin.bat",
];

const SOURCE_DIRS = ["src", "public", "worker"];
const TEXT_EXTS = new Set([".ts", ".tsx", ".css", ".html", ".json", ".md", ".toml", ".svg", ".txt", ".bat", ".js", ".mjs", ".cjs"]);

function collectSources(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  const skip = (rel: string) =>
    rel.includes("node_modules") ||
    /(^|\/)(dist|\.git|\.wrangler)(?=\/|$)/.test(rel) ||
    rel.endsWith(".log") ||
    /(^|\/)(qa-.*\.mjs|shot-.*\.png)$/.test(rel);
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      const rel = path.relative(root, full).replace(/\\/g, "/");
      if (skip(rel)) continue;
      if (e.isDirectory()) {
        walk(full);
      } else if (TEXT_EXTS.has(path.extname(e.name).toLowerCase())) {
        try {
          out[rel] = fs.readFileSync(full, "utf8");
        } catch {
          /* binario o ilegible: se sube por git normal */
        }
      }
    }
  };
  for (const f of SOURCE_FILES) {
    try {
      out[f] = fs.readFileSync(path.join(root, f), "utf8");
    } catch {
      /* no existe: se ignora */
    }
  }
  for (const d of SOURCE_DIRS) {
    const full = path.join(root, d);
    if (fs.existsSync(full)) walk(full);
  }
  return out;
}

function sourcesPlugin(): Plugin {
  return {
    name: "mike-sources",
    configureServer(server) {
      server.middlewares.use("/__sources.json", (_req: unknown, res: unknown) => {
        const r = res as { setHeader: (k: string, v: string) => void; end: (b: string) => void; statusCode: number };
        try {
          r.setHeader("Content-Type", "application/json");
          r.setHeader("Cache-Control", "no-store");
          r.end(JSON.stringify({ files: collectSources(__dirname) }));
        } catch (e) {
          r.statusCode = 500;
          r.end(JSON.stringify({ error: String(e) }));
        }
      });
    },
  };
}

// __ADMIN_ENABLED__ es una constante TEXTUAL de compilación:
// - `npm run dev` (mode=development) → true, el panel existe.
// - `npm run build` (mode=production, lo que sube a Pages) → false y el
//   bundler elimina las ramas muertas: el chunk del admin ni se emite.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), sourcesPlugin()],
  define: {
    __ADMIN_ENABLED__: mode !== "production",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
}));
