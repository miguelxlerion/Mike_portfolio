import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ExternalLink, Search, SearchX, Star, GitFork, X, Target, TrendingUp, Code2, Brain, Monitor, Zap, X as XIcon } from "lucide-react";
import { useSite } from "../store/SiteContext";
import type { CategoryId, Project } from "../data/content";
import { categoryColor } from "../data/content";
import { highlightCode, Reveal, SectionHeader } from "./ui";
import { TechIcon } from "./TechIcon";
import { cn } from "../utils/cn";

type ViewPreset = "all" | "frontend3d" | "ai-data";

const VIEW_PRESETS: Record<ViewPreset, { label: string; icon: React.ReactNode; description: string; filter?: CategoryId | "todos"; featuredIds: string[] }> = {
  all: { label: "Todos", icon: <Monitor className="h-4 w-4" />, description: "Todos los proyectos", featuredIds: [] },
  frontend3d: { label: "Frontend / 3D", icon: <Zap className="h-4 w-4" />, description: "React, Three.js, WebSockets, Tiempo real", filter: "codigo", featuredIds: ["smartfactory-3d", "fovis-platform"] },
  "ai-data": { label: "AI / Data Engineer", icon: <Brain className="h-4 w-4" />, description: "Python, RAG, LangChain, pgvector, IoT", filter: "codigo", featuredIds: ["rag-x", "ingest-pipeline"] },
};

function CodeWindow({ title, lang, code }: { title: string; lang: string; code: string }) {
  return (
    <div className="overflow-hidden border border-white/10 bg-[#0c0c0e]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 truncate font-mono text-xs text-zinc-400">{title}</span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-acid">{lang}</span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-zinc-300">
        <code>{highlightCode(code)}</code>
      </pre>
    </div>
  );
}

function ProjectModal({ project, onClose, onPrev, onNext }: { project: Project; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  const { content } = useSite();
  const color = categoryColor(content.categories, project.category);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={project.title}>
      <motion.article
        initial={{ opacity: 0, y: 32, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl overflow-hidden border border-white/12 bg-coal"
      >
        {project.videoUrl ? (
          <video src={project.videoUrl} controls preload="metadata" playsInline className="aspect-video w-full bg-black" />
        ) : project.image ? (
          <img src={project.image} alt={project.title} className="aspect-[21/9] w-full object-cover" loading="lazy" />
        ) : project.repo ? (
          <div className="p-5 pb-0">
            <CodeWindow title={project.repo.name} lang={project.repo.snippetLang} code={project.repo.snippet} />
          </div>
        ) : null}

        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider" style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}>
              {project.category} · {project.year}
            </span>
            {project.repo && (
              <span className="flex items-center gap-3 font-mono text-xs text-zinc-400">
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: project.repo.langColor }} />{project.repo.language}</span>
                <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-300" />{project.repo.stars}</span>
                <span className="inline-flex items-center gap-1"><GitFork className="h-3.5 w-3.5" />{project.repo.forks}</span>
              </span>
            )}
            <button onClick={onClose} className="ml-auto grid h-9 w-9 place-items-center border border-white/15 text-zinc-300 hover:border-acid hover:text-acid" aria-label="Cerrar">
              <X className="h-4 w-4" />
            </button>
          </div>

          <h3 className="mt-4 font-display text-3xl font-bold text-white">{project.title}</h3>
          <p className="mt-1 font-display text-base text-acid">{project.tagline}</p>

          {(project.challenge || project.impact || project.solution) && (
            <dl className="mt-5 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3">
              {[
                { label: "El reto", value: project.challenge, Icon: Target, color: "#fb7185" },
                { label: "El impacto", value: project.impact, Icon: TrendingUp, color: "#a3e635" },
                { label: "La solución técnica", value: project.solution, Icon: Code2, color: "#22d3ee" },
              ].map((row) =>
                row.value ? (
                  <div key={row.label} className="bg-coal p-4">
                    <dt className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: row.color }}>
                      <row.Icon className="h-3.5 w-3.5" />
                      {row.label}
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-zinc-300">{row.value}</dd>
                  </div>
                ) : null,
              )}
            </dl>
          )}

          <p className="mt-4 leading-relaxed text-zinc-400">{project.longDescription || project.description}</p>

          {project.specs && project.specs.length > 0 && (
            <dl className="mt-6 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
              {project.specs.map((s) => (
                <div key={s.label} className="bg-coal px-4 py-3">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{s.label}</dt>
                  <dd className="mt-1 text-sm font-medium text-zinc-200">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {project.tags.map((t) => {
              const icon = <TechIcon name={t} className="h-3.5 w-3.5" />;
              return (
                <span key={t} className="inline-flex items-center gap-1.5 border border-white/12 bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-zinc-300">
                  {icon}
                  {t}
                </span>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {project.repoUrl && (
              <a href={project.repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-acid px-5 py-3 font-display text-sm font-bold text-ink hover:bg-acid-soft">
                Ver en GitHub <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 font-display text-sm font-bold text-white hover:border-acid hover:text-acid">
                Demo en vivo <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <div className="ml-auto flex gap-2">
              <button onClick={onPrev} className="border border-white/15 px-4 py-2.5 font-mono text-xs text-zinc-300 hover:border-acid hover:text-acid">← Anterior</button>
              <button onClick={onNext} className="border border-white/15 px-4 py-2.5 font-mono text-xs text-zinc-300 hover:border-acid hover:text-acid">Siguiente →</button>
            </div>
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
}

export default function Projects() {
  const { content } = useSite();
  const [filter, setFilter] = useState<CategoryId | "todos">("todos");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewPreset, setViewPreset] = useState<ViewPreset>("all");

  // Leer preset desde URL (?view=frontend3d|ai-data) para compartir enlaces directos
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view") as ViewPreset | null;
    if (view && VIEW_PRESETS[view]) {
      setViewPreset(view);
      if (VIEW_PRESETS[view].filter) setFilter(VIEW_PRESETS[view].filter!);
    }
  }, []);

  const updateUrlPreset = (preset: ViewPreset) => {
    const url = new URL(window.location.href);
    if (preset === "all") url.searchParams.delete("view");
    else url.searchParams.set("view", preset);
    window.history.replaceState({}, "", url);
    setViewPreset(preset);
  };

  const preset = VIEW_PRESETS[viewPreset];
  const featuredProjects = content.projects.filter((p) => preset.featuredIds.includes(p.id));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return content.projects.filter((p) => {
      const okCat = filter === "todos" || p.category === filter;
      const okQ = !q || p.title.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q));
      return okCat && okQ;
    });
  }, [content.projects, filter, query]);

  const selectedIndex = selectedId ? filtered.findIndex((p) => p.id === selectedId) : -1;
  const selected = selectedIndex >= 0 ? filtered[selectedIndex] : null;

  const countFor = (id: CategoryId | "todos") => (id === "todos" ? content.projects.length : content.projects.filter((p) => p.category === id).length);

  return (
    <section id="proyectos" className="relative px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader index="02" eyebrow="Proyectos" title={<>Trabajo seleccionado</>} text="Filtra por disciplina o busca por tecnología. Todo el contenido de esta sección se edita desde el panel de control." />

        {/* View Preset Selector */}
        <Reveal className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Ver como:</span>
            {(Object.keys(VIEW_PRESETS) as ViewPreset[]).map((key) => {
              const p = VIEW_PRESETS[key];
              return (
                <button
                  key={key}
                  onClick={() => { updateUrlPreset(key); if (p.filter) setFilter(p.filter); setQuery(""); }}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs uppercase tracking-wider rounded-lg border transition-all",
                    viewPreset === key
                      ? "bg-acid/20 border-acid/50 text-acid"
                      : "border-white/12 text-zinc-400 hover:border-white/30 hover:text-white"
                  )}
                  title={p.description}
                >
                  {p.icon}
                  {p.label}
                </button>
              );
            })}
            {viewPreset !== "all" && (
              <button
                onClick={() => { updateUrlPreset("all"); setFilter("todos"); setQuery(""); }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
                title="Quitar filtro de vista"
              >
                <XIcon className="h-3.5 w-3.5" />
                Limpiar
              </button>
            )}
          </div>
        </Reveal>

        {/* Featured Projects for current preset */}
        {featuredProjects.length > 0 && (
          <Reveal className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" />
              <span className="font-display text-lg font-bold text-white">Destacados para {preset.label}</span>
            </div>
            <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
              <AnimatePresence mode="popLayout">
                {featuredProjects.map((p) => {
                  const color = categoryColor(content.categories, p.category);
                  return (
                    <motion.article
                      layout
                      key={`featured-${p.id}`}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.35 }}
                      className="group flex min-w-0 cursor-pointer flex-col overflow-hidden border-2 border-amber-400/50 bg-panel transition-all hover:-translate-y-1 hover:border-amber-400 hover:bg-amber-400/5"
                      onClick={() => setSelectedId(p.id)}
                      data-cursor="hover"
                    >
                      <div className="relative overflow-hidden">
                        {(p.image || p.repo) && (
                          <>
                            {p.image ? (
                              <img src={p.image} alt={p.title} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                              <div className="border-b border-white/10 aspect-[16/10]">
                                <div className="flex items-center gap-2 px-4 py-2.5">
                                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                                  <span className="ml-2 truncate font-mono text-xs text-zinc-400">{p.repo?.name}</span>
                                  <span className="ml-auto font-mono text-[10px] uppercase" style={{ color }}>{p.category}</span>
                                </div>
                                <pre className="max-h-44 max-w-full overflow-auto bg-[#0c0c0e] p-4 font-mono text-[11.5px] leading-relaxed text-zinc-300">
                                  <code>{highlightCode(p.repo?.snippet.split("\n").slice(0, 8).join("\n") || "")}</code>
                                </pre>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                            <div className="absolute left-3 top-3 flex gap-2">
                              <span className="px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider" style={{ background: color, color: "#0a0a0b" }}>
                                {p.category}
                              </span>
                              <span className="px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-ink">
                                ★
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{p.year} · {p.tags.slice(0, 2).join(" / ")}</p>
                        <h3 className="mt-2 font-display text-xl font-bold text-white transition-colors group-hover:text-acid">{p.title}</h3>
                        <p className="mt-1 text-sm font-medium" style={{ color }}>{p.tagline}</p>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-400">{p.description}</p>
                        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                          <span className="font-mono text-xs text-zinc-500">{p.tags.length} tags</span>
                          <span className="inline-flex items-center gap-1 font-display text-sm font-bold text-white group-hover:text-acid">
                            Abrir ficha <ArrowUpRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </Reveal>
        )}

        <Reveal className="mt-9 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2">
            {content.categories.map((c) => (
              <button
                key={c.id}
                onClick={() => { setFilter(c.id); updateUrlPreset("all"); }}
                aria-pressed={filter === c.id}
                className={cn(
                  "inline-flex items-center gap-2 border px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition-colors",
                  filter === c.id ? "text-ink" : "border-white/12 text-zinc-400 hover:border-white/30 hover:text-white",
                )}
                style={filter === c.id ? { background: c.color, borderColor: c.color } : undefined}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: filter === c.id ? "#0a0a0b" : c.color }} />
                {c.label}
                <span className="opacity-70">({countFor(c.id)})</span>
              </button>
            ))}
          </div>
          <label className="relative lg:ml-auto lg:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar proyectos…"
              className="w-full border border-white/12 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-acid"
            />
          </label>
        </Reveal>

        {filtered.length === 0 ? (
          <div className="mt-10 grid place-items-center gap-3 border border-dashed border-white/15 py-20 text-center">
            <SearchX className="h-8 w-8 text-zinc-600" />
            <p className="font-display text-xl font-bold text-white">Sin resultados</p>
            <p className="text-sm text-zinc-500">Prueba con otra búsqueda o cambia de categoría.</p>
            <button onClick={() => { setQuery(""); setFilter("todos"); }} className="mt-2 bg-acid px-5 py-2.5 font-display text-sm font-bold text-ink">Ver todo</button>
          </div>
        ) : (
          <motion.div layout className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
            <AnimatePresence mode="popLayout">
              {filtered.map((p) => {
                const color = categoryColor(content.categories, p.category);
                return (
                  <motion.article
                    layout
                    key={p.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35 }}
                    className="group flex min-w-0 cursor-pointer flex-col overflow-hidden border border-white/10 bg-panel transition-all hover:-translate-y-1 hover:border-white/25"
                    onClick={() => setSelectedId(p.id)}
                    data-cursor="hover"
                  >
                    {p.image ? (
                      <div className="relative overflow-hidden">
                        <img src={p.image} alt={p.title} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <span className="absolute left-3 top-3 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider" style={{ background: color, color: "#0a0a0b" }}>
                          {p.category}
                        </span>
                      </div>
                    ) : p.repo ? (
                      <div className="border-b border-white/10">
                        <div className="flex items-center gap-2 px-4 py-2.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                          <span className="ml-2 truncate font-mono text-xs text-zinc-400">{p.repo.name}</span>
                          <span className="ml-auto font-mono text-[10px] uppercase" style={{ color }}>{p.category}</span>
                        </div>
                        <pre className="max-h-44 max-w-full overflow-auto bg-[#0c0c0e] p-4 font-mono text-[11.5px] leading-relaxed text-zinc-300">
                          <code>{highlightCode(p.repo.snippet.split("\n").slice(0, 8).join("\n"))}</code>
                        </pre>
                      </div>
                    ) : null}
                    <div className="flex flex-1 flex-col p-5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">{p.year} · {p.tags.slice(0, 2).join(" / ")}</p>
                      <h3 className="mt-2 font-display text-xl font-bold text-white transition-colors group-hover:text-acid">{p.title}</h3>
                      <p className="mt-1 text-sm font-medium" style={{ color }}>{p.tagline}</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-400">{p.description}</p>
                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                        <span className="font-mono text-xs text-zinc-500">{p.tags.length} tags</span>
                        <span className="inline-flex items-center gap-1 font-display text-sm font-bold text-white group-hover:text-acid">
                          Abrir ficha <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        <AnimatePresence>
          {selected && (
            <ProjectModal
              project={selected}
              onClose={() => setSelectedId(null)}
              onPrev={() => setSelectedId(filtered[(selectedIndex - 1 + filtered.length) % filtered.length].id)}
              onNext={() => setSelectedId(filtered[(selectedIndex + 1) % filtered.length].id)}
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
