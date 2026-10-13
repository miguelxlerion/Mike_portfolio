import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// __ADMIN_ENABLED__ es una constante TEXTUAL de compilación:
// - `npm run dev` (mode=development) → true, el panel existe.
// - `npm run build` (mode=production, lo que sube a Pages) → false y el
//   bundler elimina las ramas muertas: el chunk del admin ni se emite.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  define: {
    __ADMIN_ENABLED__: mode !== "production",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
}));
