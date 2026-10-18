import { useEffect, useState } from "react";
import { ArrowUpRight, Globe, TrendingUp } from "lucide-react";
import { useSite } from "../store/SiteContext";
import { Reveal, SectionHeader } from "./ui";
import { TechIcon } from "./TechIcon";
import { cn } from "../utils/cn";

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

;

export default function WebWorks() {
  const { content } = useSite();
  const { webworks } = content;
  // null = comprobando, true = responde, false = sin respuesta
  const [live, setLive] = useState<Record<string, boolean | null>>({});

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const ctrls: AbortController[] = [];
    for (const w of webworks.items) {
      const ctrl = new AbortController();
      ctrls.push(ctrl);
      let done = false;
      // Si la red cuelga, a los 8s se marca sin respuesta (nunca "Verificando…" eterno)
      const killer = setTimeout(() => {
        if (!done) {
          ctrl.abort();
          if (!cancelled) setLive((p) => (p[w.id] === undefined ? { ...p, [w.id]: false } : p));
        }
      }, 8000);
      timers.push(killer);
      timers.push(
        setTimeout(() => {
          fetch(w.url, { mode: "no-cors", signal: ctrl.signal })
            .then(() => {
              done = true;
              if (!cancelled) setLive((p) => ({ ...p, [w.id]: true }));
            })
            .catch(() => {
              done = true;
              if (!cancelled) setLive((p) => ({ ...p, [w.id]: false }));
            });
        }, 1200),
      );
    }
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      ctrls.forEach((c) => c.abort());
    };
  }, [webworks.items]);

  return (
    <section id="sitios-web" className="relative px-5 py-24 sm:px-8">
      <div className="glow-cyan absolute left-0 top-1/3 h-[420px] w-[420px]" aria-hidden />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeader index="03" eyebrow={webworks.title} title={<>Sitios web en producción</>} text={webworks.text} />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
          {webworks.items.map((w, i) => {
            const status = live[w.id];
            return (
              <Reveal key={w.id} delay={i * 0.08}>
                <article className="group flex h-full min-w-0 flex-col overflow-hidden border border-white/10 bg-panel transition-all hover:-translate-y-1 hover:border-acid/50">
                  {/* Barra de navegador */}
                  <div className="flex items-center gap-2 border-b border-white/10 bg-black/40 px-3.5 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                    <span className="ml-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1">
                      <Globe className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                      <span className="truncate font-mono text-[11px] text-zinc-400">{hostOf(w.url)}</span>
                    </span>
                    <span
                      title={status === true ? "El sitio responde ahora mismo" : status === false ? "Sin respuesta ahora mismo" : "Comprobando…"}
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        status === true && "bg-acid animate-pulse-dot",
                        status === false && "bg-zinc-600",
                        status == null && "animate-pulse bg-zinc-500",
                      )}
                    />
                  </div>

                  {/* Miniatura */}
                  <a href={w.url} target="_blank" rel="noreferrer" className="relative block overflow-hidden" aria-label={`Abrir ${w.title}`}>
                    {w.image ? (
                      <img
                        src={w.image}
                        alt={`Vista previa de ${w.title}`}
                        loading="lazy"
                        className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <span className="grid aspect-[16/10] w-full place-items-center bg-gradient-to-br from-panel2 to-coal">
                        <Globe className="h-10 w-10 text-zinc-700" />
                      </span>
                    )}
                    <span className="absolute inset-0 grid place-items-center bg-ink/0 opacity-0 transition group-hover:bg-ink/45 group-hover:opacity-100">
                      <span className="inline-flex translate-y-2 items-center gap-2 bg-acid px-5 py-2.5 font-display text-sm font-bold text-ink transition group-hover:translate-y-0">
                        Abrir sitio <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </span>
                  </a>

                  {/* Ficha */}
                  <div className="flex flex-1 flex-col p-5">
                    <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                      {w.year}
                      <span className={cn("inline-flex items-center gap-1", status === true ? "text-acid" : status === false ? "text-zinc-600" : "text-zinc-500")}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", status === true ? "bg-acid" : "bg-current")} />
                        {status === true ? "En vivo" : status === false ? "Sin respuesta" : "Verificando…"}
                      </span>
                    </p>
                    <h3 className="mt-2 font-display text-xl font-bold text-white transition-colors group-hover:text-acid">{w.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400">{w.desc}</p>
                    {w.result && (
                      <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-zinc-200">
                        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-acid" />
                        <span className="font-medium">{w.result}</span>
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {w.tags.map((t) => {
                        const icon = <TechIcon name={t} className="h-3.5 w-3.5" />;
                        return (
                          <span key={t} className="inline-flex items-center gap-1.5 border border-white/12 bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-zinc-300">
                            {icon}
                            {t}
                          </span>
                        );
                      })}
                    </div>
                    <a
                      href={w.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center justify-center gap-2 border border-white/15 px-4 py-2.5 font-display text-sm font-bold text-white transition hover:border-acid hover:text-acid"
                    >
                      Visitar sitio <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
