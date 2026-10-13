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

  // 1) Intentar caché del edge
  const cacheKey = new Request(target, { method: "GET" });
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
      const status = upstream.status === 404 ? 404 : 502;
      return json({ message: upstream.status === 404 ? "not-found" : "upstream-error" }, status);
    }

    // 3) Guardar 1h en edge + servir (stale 24h si GitHub cae)
    const res = new Response(upstream.body, upstream);
    res.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  } catch {
    return json({ message: "proxy-error" }, 502);
  }
}
