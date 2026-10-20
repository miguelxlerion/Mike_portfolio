import { Suspense, lazy, useState } from "react";
import { Box, Loader2, Play, RotateCcw, Pause } from "lucide-react";
import { useSite } from "../store/SiteContext";
import { Reveal, SectionHeader } from "./ui";
import { cn } from "../utils/cn";

// three.js vive en chunk separado: ni se descarga hasta pulsar "Ver en 3D"
const ModelCanvas = lazy(() => import("./ModelCanvas"));

export default function Viewer3D() {
  const { content } = useSite();
  const { showcase3d } = content;
  const [selectedId, setSelectedId] = useState(showcase3d.models[0]?.id ?? "");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [quality, setQuality] = useState<"auto" | "high" | "low">("auto");
  const [autoRotate, setAutoRotate] = useState(true);
  const [stats, setStats] = useState<{ tris: number; fps: number } | null>(null);

  const selected = showcase3d.models.find((m) => m.id === selectedId) ?? showcase3d.models[0];
  const active = showcase3d.models.find((m) => m.id === activeId) ?? null;

  const open = (id: string) => {
    setSelectedId(id);
    setActiveId(id);
    setStats(null);
  };

  return (
    <section id="modelos-3d" className="relative border-y border-white/10 bg-coal/60 px-5 py-24 sm:px-8">
      <div className="glow-violet absolute right-0 top-10 h-[380px] w-[380px]" aria-hidden />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeader index="05" eyebrow={showcase3d.title} title={<>Modelos en 3D</>} text={showcase3d.text} />

        <div className="mt-12 grid gap-5 lg:grid-cols-12 [&>*]:min-w-0">
          {/* Visor */}
          <Reveal className="lg:col-span-8">
            <div className="border border-white/10 bg-panel">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0c0c0e] sm:aspect-[16/9]">
                {active && selected && active.id === selected.id ? (
                  <Suspense
                    fallback={
                      <div className="absolute inset-0 grid place-items-center gap-3 bg-[#0c0c0e]">
                        <Loader2 className="h-8 w-8 animate-spin text-acid" />
                        <p className="font-mono text-xs uppercase tracking-[0.25em] text-zinc-500">Cargando motor 3D…</p>
                      </div>
                    }
                  >
                    <ModelCanvas
                      model={selected}
                      quality={quality}
                      autoRotate={autoRotate}
                      accent={content.appearance.accent}
                      onStats={(tris, fps) => setStats({ tris, fps })}
                    />
                  </Suspense>
                ) : (
                  <>
                    {selected?.poster && (
                      <img src={selected.poster} alt={selected.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-60" />
                    )}
                    <div className="absolute inset-0 grid place-items-center bg-ink/55 p-6 text-center">
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-acid">Vista previa · 0 KB de 3D cargados</p>
                        <h3 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">{selected?.title}</h3>
                        <button
                          onClick={() => selected && open(selected.id)}
                          className="mx-auto mt-5 inline-flex items-center gap-2 bg-acid px-6 py-3.5 font-display text-base font-bold text-ink transition hover:bg-acid-soft"
                        >
                          <Play className="h-5 w-5" /> Ver en 3D
                        </button>
                        <p className="mt-3 font-mono text-[11px] text-zinc-500">Arrastra para rotar · rueda para zoom</p>
                      </div>
                    </div>
                  </>
                )}

                {/* HUD */}
                {active && (
                  <div className="pointer-events-none absolute left-3 top-3 flex gap-2 font-mono text-[10px] uppercase tracking-wider">
                    <span className="border border-white/15 bg-ink/80 px-2.5 py-1 text-zinc-300">
                      {stats ? `${stats.tris.toLocaleString("es")} tris` : "…"}
                    </span>
                    <span className="border border-white/15 bg-ink/80 px-2.5 py-1 text-acid">
                      {stats ? `${stats.fps} fps` : "…"}
                    </span>
                    <span className="hidden border border-white/15 bg-ink/80 px-2.5 py-1 text-zinc-400 sm:inline">
                      {quality === "auto" ? "calidad auto" : quality === "high" ? "calidad alta" : "calidad baja"}
                    </span>
                  </div>
                )}
              </div>

              {/* Controles */}
              <div className="flex flex-wrap items-center gap-2 border-t border-white/10 p-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">Calidad</span>
                {(["auto", "high", "low"] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    aria-pressed={quality === q}
                    className={cn(
                      "border px-3 py-1.5 font-mono text-xs transition",
                      quality === q ? "border-acid bg-acid/10 text-acid" : "border-white/12 text-zinc-400 hover:text-white",
                    )}
                  >
                    {q === "auto" ? "Auto" : q === "high" ? "Alta" : "Baja"}
                  </button>
                ))}
                <button
                  onClick={() => setAutoRotate((v) => !v)}
                  aria-pressed={autoRotate}
                  className={cn(
                    "inline-flex items-center gap-1.5 border px-3 py-1.5 font-mono text-xs transition",
                    autoRotate ? "border-acid bg-acid/10 text-acid" : "border-white/12 text-zinc-400 hover:text-white",
                  )}
                >
                  <Pause className="h-3.5 w-3.5" /> Giro auto
                </button>
                {active && (
                  <button
                    onClick={() => { setActiveId(null); setStats(null); }}
                    className="inline-flex items-center gap-1.5 border border-white/12 px-3 py-1.5 font-mono text-xs text-zinc-400 transition hover:border-red-400 hover:text-red-300"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Cerrar visor
                  </button>
                )}
                <span className="ml-auto hidden font-mono text-[10px] text-zinc-600 md:inline">
                  three.js bajo demanda · pausa fuera de pantalla
                </span>
              </div>
            </div>

            {/* Ficha del modelo */}
            {selected && (
              <div className="mt-4 border border-white/10 bg-panel p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-acid">{selected.preset === "custom" ? "Tu modelo .glb" : "Demo procedural"}</p>
                <h3 className="mt-1 font-display text-2xl font-bold text-white">{selected.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{selected.desc}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.tags.map((t) => (
                    <span key={t} className="border border-white/12 bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-zinc-300">#{t}</span>
                  ))}
                </div>
                {selected.specs && selected.specs.length > 0 && (
                  <dl className="mt-4 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
                    {selected.specs.map((s) => (
                      <div key={s.label} className="bg-coal px-4 py-3">
                        <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{s.label}</dt>
                        <dd className="mt-1 text-sm font-medium text-zinc-200">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            )}
          </Reveal>

          {/* Selector */}
          <Reveal delay={0.1} className="lg:col-span-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">
              Piezas ({showcase3d.models.length})
            </p>
            <div className="mt-3 space-y-2">
              {showcase3d.models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => open(m.id)}
                  aria-pressed={selectedId === m.id}
                  className={cn(
                    "group flex w-full items-center gap-3 border p-3 text-left transition",
                    selectedId === m.id ? "border-acid bg-acid/5" : "border-white/10 bg-panel hover:border-white/30",
                  )}
                >
                  {m.poster ? (
                    <img src={m.poster} alt="" loading="lazy" className="h-14 w-20 shrink-0 border border-white/10 object-cover" />
                  ) : (
                    <span className="grid h-14 w-20 shrink-0 place-items-center border border-white/10 bg-black/40">
                      <Box className="h-5 w-5 text-zinc-600" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className={cn("block truncate font-display text-sm font-bold", selectedId === m.id ? "text-acid" : "text-white")}>
                      {m.title}
                    </span>
                    <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      {m.preset === "custom" ? ".glb" : "procedural"} · {m.tags.slice(0, 2).join(" / ")}
                    </span>
                  </span>
                  {activeId === m.id && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-acid animate-pulse-dot" />}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}