// Proxy de la API de GitHub con caché en el edge.
// Por qué existe: el navegador solo puede hacer 60 req/hora contra
// api.github.com sin token. Este endpoint cachea perfil+repos 1 hora
// en el PoP más cercano, así el sitio aguanta tráfico sin romperse.
// Con GITHUB_TOKEN (variable del Worker) el límite sube a 5000 req/hora.
//
//   GET /api/github?user=miguelxlerion&kind=profile
//   GET /api/github?user=miguelxlerion&kind=repos

// Tipos estructurales mínimos (sin dependencias): lo que el Worker usa.
export interface CtxLike {
  waitUntil: (p: Promise<unknown>) => void;
}

export interface GithubEnv {
  GITHUB_TOKEN?: string;
}

const USER_RE = /^[a-zA-Z0-9-]{1,39}$/;

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleGithub(request: Request, env: GithubEnv, ctx: CtxLike): Promise<Response> {
  const url = new URL(request.url);
  const user = (url.searchParams.get("user") || "miguelxlerion").trim();
  if (!USER_RE.test(user)) return json({ message: "bad user" }, 400);

  const kind = url.searchParams.get("kind") === "profile" ? "profile" : "repos";
  const target =
    kind === "profile"
      ? `https://api.github.com/users/${user}`
      : `https://api.github.com/users/${user}/repos?per_page=100&sort=updated`;

  // 1) Intentar caché del edge.
  // La clave lleva versión de forma: si cambia lo que servimos, los
  // visitantes jamás leen una forma vieja cacheada (ni tras un deploy).
  const CACHE_VERSION = "v2";
  const cacheKey = new Request(`${target}${target.includes("?") ? "&" : "?"}cv=${CACHE_VERSION}`, { method: "GET" });
  try {
    const cache = (caches as unknown as { default: Cache }).default;
    const hit = await cache.match(cacheKey);
    if (hit) return hit;

    // 2) Ir al origen con token si existe (nunca se expone al navegador)
    const headers: Record<string, string> = {
      "User-Agent": "mike-portfolio",
      Accept: "application/vnd.github+json",
    };
    if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;

    const upstream = await fetch(target, { headers });
    if (!upstream.ok) {
      if (upstream.status === 404) return json({ message: "not-found" }, 404);
      // Sin token, el límite de GitHub (60 req/h) se comparte entre miles de
      // Workers detrás del mismo egress: se agota a ratos. Con GITHUB_TOKEN
      // configurado esto casi nunca pasa (5000 req/h).
      if (upstream.status === 403 || upstream.status === 429) {
        return json({ message: "rate-limited" }, 429);
      }
      return json({ message: "upstream-error" }, 502);
    }

    // Respuesta adelgazada: solo los campos que usa el frontend.
    // 45 repos completos pesan ~250 KB; proyectados ~40 KB (caché + móvil).
    let body: BodyInit | null = upstream.body;
    if (kind === "repos") {
      const all = (await upstream.json().catch(() => null)) as Record<string, unknown>[] | null;
      if (!Array.isArray(all)) return json({ message: "upstream-error" }, 502);
      const slim = all.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? null,
        html_url: r.html_url,
        homepage: r.homepage ?? null,
        language: r.language ?? null,
        stargazers_count: r.stargazers_count ?? 0,
        forks_count: r.forks_count ?? 0,
        updated_at: r.updated_at,
        topics: Array.isArray(r.topics) ? (r.topics as string[]).slice(0, 5) : [],
        fork: !!r.fork,
      }));
      body = JSON.stringify(slim);
    }

    // 3) Guardar 1h en edge + servir (stale 24h si GitHub cae)
    const res = new Response(body, upstream);
    if (kind === "repos") res.headers.set("Content-Type", "application/json");
    res.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  } catch {
    return json({ message: "proxy-error" }, 502);
  }
}
