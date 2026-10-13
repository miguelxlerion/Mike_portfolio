import { useCallback, useEffect, useState } from "react";
import { ExternalLink, GitFork, Star } from "lucide-react";
import { useSite } from "../store/SiteContext";
import { Reveal, SectionHeader } from "./ui";

interface Repo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics?: string[];
  fork?: boolean;
}

interface Profile {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
}

const LANG_COLOR: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  "C++": "#f34b7d", "C#": "#178600", GLSL: "#5686a5", HTML: "#e34c26",
  CSS: "#563d7c", Rust: "#dea584", Go: "#00ADD8", Shell: "#89e051",
};

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  if (d < 1) return "hoy";
  if (d < 30) return `hace ${d} d`;
  if (d < 365) return `hace ${Math.floor(d / 30)} m`;
  return `hace ${Math.floor(d / 365)} a`;
}

function Contributions() {
  const cells = Array.from({ length: 26 * 7 }, (_, i) => {
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const v = seed - Math.floor(seed);
    return Math.floor(v * v * 5);
  });
  const colors = ["bg-white/10", "bg-acid/25", "bg-acid/50", "bg-acid/70", "bg-acid"];
  return (
    <div className="overflow-x-auto">
      <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
        {cells.map((c, i) => (
          <span key={i} title={`${c} contribuciones`} className={`h-2.5 w-2.5 rounded-[3px] ${colors[c]} transition hover:scale-125`} />
        ))}
      </div>
    </div>
  );
}

type Sort = "stars" | "updated" | "name";

export default function GitHubReal() {
  const { content } = useSite();
  const [username, setUsername] = useState(content.github.username);
  const [input, setInput] = useState(content.github.username);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("stars");

  useEffect(() => {
    setUsername(content.github.username);
    setInput(content.github.username);
  }, [content.github.username]);

  const load = useCallback(async (user: string) => {
    setLoading(true);
    setError(null);

    const parse = async (res: Response) => {
      const ct = res.headers.get("content-type") ?? "";
      if (res.status === 404) throw new Error("not-found");
      if (!res.ok || !ct.includes("json")) throw new Error("api");
      return res.json();
    };

    try {
      // 1) Proxy edge (/api/github en Cloudflare Pages): cache 1h, no gasta
      // rate-limit del visitante. Si no existe (dev local), cae al directo.
      let p: Profile | null = null;
      let r: Repo[] | null = null;
      try {
        const base = `/api/github?user=${encodeURIComponent(user)}`;
        const [pRes, rRes] = await Promise.all([
          fetch(`${base}&kind=profile`),
          fetch(`${base}&kind=repos`),
        ]);
        p = (await parse(pRes)) as Profile;
        r = (await parse(rRes)) as Repo[];
      } catch {
        // 2) Directo a la API pública (60 req/h por IP)
        const [pRes, rRes] = await Promise.all([
          fetch(`https://api.github.com/users/${encodeURIComponent(user)}`),
          fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=updated`),
        ]);
        p = (await parse(pRes)) as Profile;
        r = (await parse(rRes)) as Repo[];
      }
      setProfile(p);
      setRepos((r ?? []).filter((x) => !x.fork));
    } catch (e) {
      setProfile(null);
      setRepos([]);
      setError(e instanceof Error && e.message === "not-found" ? "No encontramos ese usuario en GitHub." : "No se pudo contactar con la API de GitHub (límite de peticiones). Prueba de nuevo en un minuto.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (username) load(username);
  }, [username, load]);

  const sorted = [...repos].sort((a, b) => {
    if (sort === "stars") return b.stargazers_count - a.stargazers_count;
    if (sort === "updated") return +new Date(b.updated_at) - +new Date(a.updated_at);
    return a.name.localeCompare(b.name);
  });

  const languages = Array.from(
    sorted.reduce((map, r) => {
      if (r.language) map.set(r.language, (map.get(r.language) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const totalLangs = languages.reduce((a, [, n]) => a + n, 0) || 1;
  const totalStars = sorted.reduce((a, r) => a + r.stargazers_count, 0);

  return (
    <section id="github" className="relative border-y border-white/10 bg-coal/60 px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader index="04" eyebrow={content.github.title} title={<>GitHub en vivo</>} text={content.github.text} />

        <Reveal className="mt-9">
          <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) setUsername(input.trim()); }} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-sm text-zinc-500">github.com/</span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full border border-white/12 bg-white/[0.04] py-3 pl-28 pr-4 font-mono text-sm text-white outline-none transition focus:border-acid"
                placeholder="usuario"
                aria-label="Usuario de GitHub"
              />
            </div>
            <button type="submit" className="bg-acid px-6 py-3 font-display text-sm font-bold text-ink transition hover:bg-acid-soft">
              {loading ? "Cargando…" : "Cargar perfil"}
            </button>
            <div className="flex gap-2">
              {([["stars", "★ Estrellas"], ["updated", "⟳ Recientes"], ["name", "A–Z"]] as [Sort, string][]).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSort(id)}
                  className={`border px-3 py-3 text-xs transition ${sort === id ? "border-acid bg-acid/10 text-acid" : "border-white/12 text-zinc-400 hover:text-white"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </form>
        </Reveal>

        {error && (
          <p className="mt-4 border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">{error}</p>
        )}

        <div className="mt-8 grid gap-5 lg:grid-cols-[320px_1fr] [&>*]:min-w-0">
          <Reveal className="h-fit space-y-4 border border-white/10 bg-panel p-6">
            <div className="flex items-center gap-4">
              {profile ? (
                <img src={profile.avatar_url} alt={profile.login} className="h-16 w-16 rounded-2xl border border-white/15 object-cover" />
              ) : (
                <div className="grid h-16 w-16 place-items-center bg-acid font-display text-xl font-bold text-ink">
                  {content.profile.initials}
                </div>
              )}
              <div>
                <p className="font-display text-lg font-bold text-white">{profile?.name ?? content.profile.shortName}</p>
                <p className="font-mono text-xs text-acid">@{profile?.login ?? username}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-zinc-400">{profile?.bio ?? content.profile.tagline}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { v: profile?.public_repos ?? "—", l: "repos" },
                { v: profile?.followers ?? "—", l: "followers" },
                { v: totalStars.toLocaleString("es"), l: "stars" },
              ].map((s) => (
                <div key={s.l} className="border border-white/10 bg-white/[0.03] py-3">
                  <p className="font-display text-base font-bold text-white">{s.v}</p>
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">{s.l}</p>
                </div>
              ))}
            </div>
            {languages.length > 0 && (
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">Lenguajes</p>
                <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/10">
                  {languages.map(([lang, n]) => (
                    <span key={lang} title={lang} style={{ width: `${(n / totalLangs) * 100}%`, background: LANG_COLOR[lang] ?? "#a3e635" }} />
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-400">
                  {languages.map(([lang, n]) => (
                    <span key={lang} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: LANG_COLOR[lang] ?? "#a3e635" }} />
                      {lang} <span className="text-zinc-600">{Math.round((n / totalLangs) * 100)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">Actividad</p>
              <Contributions />
            </div>
            <a href={profile?.html_url ?? `https://github.com/${username}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 border border-white/12 py-3 text-sm text-zinc-200 transition hover:border-acid hover:text-acid">
              Ver perfil completo <ExternalLink className="h-4 w-4" />
            </a>
          </Reveal>

          <div className="grid content-start gap-4 sm:grid-cols-2 [&>*]:min-w-0">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 animate-pulse border border-white/10 bg-white/[0.03]" />)
            ) : sorted.length === 0 && !error ? (
              <p className="text-sm text-zinc-500">Cargando repositorios…</p>
            ) : (
              sorted.slice(0, content.github.maxRepos).map((r) => (
                <a key={r.id} href={r.html_url} target="_blank" rel="noreferrer"                     className="group flex min-w-0 flex-col justify-between border border-white/10 bg-panel p-5 transition hover:-translate-y-1 hover:border-acid/60">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-mono text-sm font-bold text-acid">{r.name}</h3>
                      <span className="text-zinc-600 transition group-hover:text-acid">↗</span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400">{r.description ?? "Sin descripción."}</p>
                    {!!r.topics?.length && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {r.topics.slice(0, 3).map((t) => (
                          <span key={t} className="border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-zinc-400">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                    {r.language && (
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: LANG_COLOR[r.language] ?? "#a3e635" }} />
                        {r.language}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" />{r.stargazers_count.toLocaleString("es")}</span>
                    <span className="inline-flex items-center gap-1"><GitFork className="h-3 w-3" />{r.forks_count}</span>
                    <span className="ml-auto">{timeAgo(r.updated_at)}</span>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
