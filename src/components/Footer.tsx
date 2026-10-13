import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useSite } from "../store/SiteContext";

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Volver arriba"
      className="fixed bottom-6 right-6 z-50 grid h-11 w-11 place-items-center bg-acid text-ink shadow-lg transition hover:bg-acid-soft"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

export default function Footer() {
  const { content } = useSite();
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-coal">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-3">
        <div>
          <p className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center bg-acid font-display text-sm font-bold text-ink">{content.profile.initials}</span>
            <span className="font-display text-base font-bold text-white">{content.profile.shortName.toUpperCase()}<span className="text-acid">.</span></span>
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500">{content.profile.role} · {content.profile.location}</p>
          <p className="mt-2 text-sm text-zinc-600">{content.footer.note}</p>
        </div>
        <nav aria-label="Índice">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">Índice</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {[["#inicio", "Inicio"], ["#sobre-mi", "Sobre mí"], ["#proyectos", "Proyectos"], ["#sitios-web", "Sitios"], ["#github", "GitHub"], ["#modelos-3d", "3D"], ["#contacto", "Contacto"], ...(__ADMIN_ENABLED__ ? [["#/admin", "⚙ Panel"] as [string, string]] : [])].map(([href, label]) => (
              <a key={href} href={href} className="text-zinc-400 transition hover:text-acid">{label}</a>
            ))}
          </div>
        </nav>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">Contacto</p>
          <a href={`mailto:${content.profile.email}`} className="mt-4 block font-display text-lg font-bold text-white hover:text-acid">{content.profile.email}</a>
          <div className="mt-3 flex flex-wrap gap-2">
            {content.contact.socials.map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="border border-white/12 px-3 py-1.5 font-mono text-xs text-zinc-400 hover:border-acid hover:text-acid">{s.label}</a>
            ))}
          </div>
        </div>
      </div>
      <div aria-hidden className="text-outline pointer-events-none select-none whitespace-nowrap text-center font-display text-[15.5vw] font-bold leading-[0.8] text-white/[0.05]">
        {content.footer.watermark}
      </div>
      <div className="border-t border-white/10 py-5 text-center font-mono text-[11px] text-zinc-600">
        © {new Date().getFullYear()} {content.profile.shortName} · Todos los derechos reservados
      </div>
    </footer>
  );
}
