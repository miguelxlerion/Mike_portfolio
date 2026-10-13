import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Settings2, X } from "lucide-react";
import { useSite } from "../store/SiteContext";
import { LangToggle } from "../i18n/LangContext";
import { cn } from "../utils/cn";

const LINKS = [
  { id: "inicio", label: "Inicio" },
  { id: "sobre-mi", label: "Sobre mí" },
  { id: "proyectos", label: "Proyectos" },
  { id: "sitios-web", label: "Sitios" },
  { id: "github", label: "GitHub" },
  { id: "modelos-3d", label: "3D" },
  { id: "contacto", label: "Contacto" },
];

function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const onScroll = () => {
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 160) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ids]);
  return active;
}

export default function Navbar() {
  const { content } = useSite();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const active = useScrollSpy(LINKS.map((l) => l.id));

  // Navegación explícita: cierra el menú, mueve el scroll por JS y actualiza
  // el hash SIN disparar el scroll nativo del anchor (que compite con el
  // re-render del menú y en móvil nunca llega).
  // Si el menú estaba abierto, el scroll espera a que termine de desmontarse
  // (~350 ms): desmontarlo a mitad de un smooth-scroll lo cancela y clava y=0.
  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const wasMenu = open;
    (e.currentTarget as HTMLElement).blur();
    setOpen(false);
    const doScroll = () => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    };
    if (wasMenu) setTimeout(doScroll, 350);
    else doScroll();
  };

  // Red de seguridad nativa: si un tap llega al menú sin pasar por el
  // onClick de React, este listener (nativo, imposible de saltear) ejecuta
  // la misma navegación. Cinturón y tirantes para taps móviles.
  // Va en el <header> (siempre montado): el contenedor del menú solo
  // existe cuando está abierto y el ref llegaría null.
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const onTap = (e: Event) => {
      const a = (e.target as HTMLElement).closest?.("a[href^='#']") as HTMLAnchorElement | null;
      if (!a || !a.closest("[data-mobile-menu]")) return;
      if (a.getAttribute("href") === "#/admin") return;
      const id = a.getAttribute("href")!.slice(1);
      if (!document.getElementById(id)) return;
      e.preventDefault();
      (document.activeElement as HTMLElement | null)?.blur?.();
      setOpen(false);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", `#${id}`);
      }, 350);
    };
    header.addEventListener("click", onTap);
    return () => header.removeEventListener("click", onTap);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 transition-all", scrolled ? "bg-ink/85 backdrop-blur-md border-b border-white/10" : "bg-transparent border-b border-transparent")}>
      <div className="absolute inset-x-0 top-0 h-[2px] bg-white/5">
        <div className="h-full bg-acid transition-[width]" style={{ width: `${progress * 100}%` }} />
      </div>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <a data-notranslate href="#inicio" onClick={(e) => go(e, "inicio")} className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center bg-acid font-display text-sm font-bold text-ink">{content.profile.initials}</span>
          <span className="font-display text-sm font-bold tracking-wide text-white">
            {content.profile.shortName.toUpperCase()}
            <span className="text-acid">.</span>
          </span>
        </a>
        <div className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={(e) => go(e, l.id)}
              className={cn(
                "relative rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
                active === l.id ? "text-ink" : "text-zinc-400 hover:text-white",
              )}
            >
              {active === l.id && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-acid" />}
              <span className="relative">{l.label}</span>
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <LangToggle />
          <a
            href="#contacto"
            onClick={(e) => go(e, "contacto")}
            className="hidden bg-acid px-5 py-2.5 font-display text-sm font-bold text-ink transition-colors hover:bg-acid-soft sm:inline-flex"
          >
            Hablemos
          </a>
          {__ADMIN_ENABLED__ && (
            <a
              href="#/admin"
              title="Abrir panel de control (solo local)"
              className="inline-flex items-center gap-2 border border-white/15 px-3 py-2.5 font-mono text-xs text-zinc-300 transition-colors hover:border-acid hover:text-acid"
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden lg:inline">Panel</span>
            </a>
          )}
          <button onClick={() => setOpen((v) => !v)} className="grid h-10 w-10 place-items-center border border-white/15 text-white lg:hidden" aria-label="Abrir menú">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 bg-ink/95 backdrop-blur-md lg:hidden"
            data-mobile-menu
          >
            <div className="space-y-1 px-5 py-4">
              {LINKS.map((l) => (
                <a
                  key={l.id}
                  href={`#${l.id}`}
                  onClick={(e) => go(e, l.id)}
                  className={cn("block rounded-lg px-3 py-2.5 font-display text-base font-bold", active === l.id ? "bg-acid text-ink" : "text-zinc-300")}
                >
                  {l.label}
                </a>
              ))}
              {__ADMIN_ENABLED__ && (
                <a href="#/admin" onClick={() => setOpen(false)} className="block rounded-lg border border-white/15 px-3 py-2.5 font-mono text-sm text-zinc-300">
                  ⚙ Panel de control
                </a>
              )}
              <div className="px-3 py-2" onClick={() => setOpen(false)}>
                <LangToggle compact />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
