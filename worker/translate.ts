// POST /api/translate — proxy de traducción con caché compartida en el edge.
// Por qué existe: llamar a Google directo desde cada navegador genera
// ~150 peticiones simultáneas por visita → 429 + errores CORS en cascada.
// Aquí se agrupan, se cachea cada cadena 30 días en el PoP y solo se va
// al origen en el primer miss global. Fallos → null (español intacto).
//
// Con TRANSLATE_API_KEY (Google Cloud, ~$0.40 calentar todo el sitio):
// un endpoint oficial por lotes, sin throttling. Sin ella: gtx público
// con backoff (funciona, pero Google estrangula ráfagas).
//
//   POST { sl: "es", tl: "en", texts: ["Hola", ...] }
//   → { translations: ["Hello" | null, ...] }

export interface CtxLike {
  waitUntil: (p: Promise<unknown>) => void;
}

const MAX_TEXTS = 60;
const MAX_CHARS_EACH = 2000;
const MAX_CHARS_TOTAL = 30000;
const CACHE_DAYS = 30;
const LANG_RE = /^[a-z]{2}(-[A-Z]{2})?$/;

function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 32 + h + s.charCodeAt(i)) >>> 0);
  return h.toString(36);
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function cacheKeyFor(sl: string, tl: string, text: string): Request {
  return new Request(`https://translate-cache.local/v1/${sl}/${tl}/${djb2(text)}`, { method: "GET" });
}

function unescapeHtml(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Lote oficial v2 (con TRANSLATE_API_KEY): hasta 128 textos por llamada. */
async function fetchBatchOfficial(
  sl: string,
  tl: string,
  texts: string[],
  apiKey: string,
): Promise<(string | null)[]> {
  try {
    const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: texts, source: sl, target: tl, format: "text" }),
    });
    if (!res.ok) return texts.map(() => null);
    const data = (await res.json().catch(() => null)) as {
      data?: { translations?: { translatedText?: unknown }[] };
    } | null;
    const list = data?.data?.translations ?? [];
    return texts.map((_, i) => {
      const v = list[i]?.translatedText;
      return typeof v === "string" && v ? unescapeHtml(v) : null;
    });
  } catch {
    return texts.map(() => null);
  }
}

async function fetchGoogle(sl: string, tl: string, text: string): Promise<string | null> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
  // Reintentos con backoff: el 429 se rinde solo si esperas.
  for (const wait of [0, 1200, 3500]) {
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    let res: Response;
    try {
      res = await fetch(url, { headers: { "User-Agent": "mike-portfolio" } });
    } catch {
      continue;
    }
    if (res.status === 429 || res.status >= 500) continue;
    if (!res.ok) return null;
    try {
      const data = (await res.json()) as unknown;
      const sentences = (data as { 0?: string }[][])?.[0];
      if (!Array.isArray(sentences)) return null;
      const out = sentences.map((s) => (Array.isArray(s) ? String(s[0] ?? "") : "")).join("");
      return out.trim() ? out : null;
    } catch {
      return null;
    }
  }
  return null;
}

export interface TranslateEnv {
  TRANSLATE_API_KEY?: string;
}

export async function handleTranslate(
  request: Request,
  env: TranslateEnv,
  ctx: { waitUntil: (p: Promise<unknown>) => void },
): Promise<Response> {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return json({ message: "bad-json" }, 400);
  }
  const { sl, tl, texts } = (body ?? {}) as { sl?: unknown; tl?: unknown; texts?: unknown };
  if (typeof sl !== "string" || typeof tl !== "string" || !LANG_RE.test(sl) || !LANG_RE.test(tl)) {
    return json({ message: "bad-lang" }, 400);
  }
  if (!Array.isArray(texts) || texts.length === 0 || texts.length > MAX_TEXTS) {
    return json({ message: "bad-texts" }, 400);
  }
  const clean: string[] = [];
  let total = 0;
  for (const t of texts) {
    if (typeof t !== "string") return json({ message: "bad-texts" }, 400);
    const s = t.slice(0, MAX_CHARS_EACH);
    total += s.length;
    if (total > MAX_CHARS_TOTAL) return json({ message: "too-much" }, 413);
    clean.push(s);
  }

  const cache = (caches as unknown as { default: Cache }).default;
  const out: (string | null)[] = new Array(clean.length).fill(null);
  const missing: number[] = [];
  // 1) Caché edge primero (el caso común: todo hits, 0 llamadas a Google)
  await Promise.all(
    clean.map(async (text, i) => {
      if (!text.trim()) return;
      try {
        const hit = await cache.match(cacheKeyFor(sl, tl, text));
        if (hit) {
          const saved = (await hit.json().catch(() => null)) as { v?: unknown } | null;
          if (saved && typeof saved.v === "string" && saved.v) {
            out[i] = saved.v;
            return;
          }
        }
      } catch {
        /* sin caché: a origen */
      }
      missing.push(i);
    }),
  );

  // 2) Origen: primero el lote oficial (1 llamada, orden garantizado),
  // resto por gtx con concurrencia baja + backoff (sin ráfagas → sin 429).
  // El caso común no llega aquí: la caché edge ya resolvió casi todo.
  const deadline = Date.now() + 20000;
  const fresh: Promise<unknown>[] = [];
  const remember = (i: number, translated: string) => {
    out[i] = translated;
    fresh.push(
      cache
        .put(
          cacheKeyFor(sl, tl, clean[i]),
          new Response(JSON.stringify({ v: translated }), {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": `public, s-maxage=${CACHE_DAYS * 86400}, stale-while-revalidate=${CACHE_DAYS * 86400}`,
            },
          }),
        )
        .catch(() => {}),
    );
  };
  let queue = [...missing];
  const apiKey = env.TRANSLATE_API_KEY?.trim();
  if (apiKey && queue.length > 0) {
    const got = await fetchBatchOfficial(
      sl,
      tl,
      queue.map((i) => clean[i]),
      apiKey,
    );
    queue.forEach((i, j) => {
      const v = got[j];
      if (v) remember(i, v);
    });
    queue = queue.filter((i) => !out[i]);
  }
  const pump = async () => {
    while (queue.length > 0) {
      if (Date.now() > deadline) break;
      const i = queue.shift() as number;
      const translated = await fetchGoogle(sl, tl, clean[i]);
      if (translated) remember(i, translated);
    }
  };
  await Promise.all([pump(), pump(), pump()]);
  if (fresh.length > 0) ctx.waitUntil(Promise.allSettled(fresh).then(() => {}));

  return json({ translations: out }, 200);
}
