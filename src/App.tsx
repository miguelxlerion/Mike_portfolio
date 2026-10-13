import { Suspense, lazy, useEffect, useState } from "react";
import Cursor from "./components/Cursor";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import About from "./components/About";
import Projects from "./components/Projects";
import WebWorks from "./components/WebWorks";
import GitHubReal from "./components/GitHubReal";
import Viewer3D from "./components/Viewer3D";
import Contact from "./components/Contact";
import Footer, { BackToTop } from "./components/Footer";

// Patrón ternary a propósito: con __ADMIN_ENABLED__ en false (producción)
// el bundler elimina la rama del import() y el chunk del admin no se emite.
// El panel, por tanto, NO existe en el sitio público de ninguna forma.
const AdminPanel = __ADMIN_ENABLED__ ? lazy(() => import("./admin/AdminPanel")) : null;

function AdminDisabled() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-5">
      <div className="max-w-md border border-white/12 bg-panel p-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-acid">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">Nada por aquí</h1>
        <p className="mt-2 text-sm text-zinc-400">El panel de control solo existe en local, nunca se publica.</p>
        <a href="#inicio" className="mt-6 inline-block bg-acid px-6 py-3 font-display text-sm font-bold text-ink hover:bg-acid-soft">
          Volver al inicio
        </a>
      </div>
    </div>
  );
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === "#/admin");

  useEffect(() => {
    const onHash = () => {
      setIsAdmin(window.location.hash === "#/admin");
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (isAdmin) {
    if (!AdminPanel) return <AdminDisabled />;
    return (
      <Suspense fallback={<div className="grid min-h-screen place-items-center bg-ink font-mono text-sm text-zinc-500">Cargando panel…</div>}>
        <AdminPanel />
      </Suspense>
    );
  }

  return (
    <div className="relative min-h-screen bg-ink">
      {/* Grano cinematográfico global */}
      <div className="bg-noise pointer-events-none fixed inset-0 z-[95] opacity-[0.05]" aria-hidden />

      <Cursor />
      <Navbar />

      <main>
        <Hero />
        <Marquee />
        <About />
        <Projects />
        <WebWorks />
        <GitHubReal />
        <Viewer3D />
        <Contact />
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
