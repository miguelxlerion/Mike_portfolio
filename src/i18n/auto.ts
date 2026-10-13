// ─────────────────────────────────────────────
//  Traducción viva ES→EN sin duplicar el modelo.
//  Estrategia (mini-Weglot propio):
//  - Al pasar a EN se recorren los nodos de texto visibles y se traducen
//    1:1 (nunca por bloques: así jamás se descuadra un texto).
//  - Caché persistente en localStorage: la primera visita traduce,
//    las siguientes cuestan 0 peticiones.
//  - MutationObserver (con debounce) traduce el contenido dinámico
//    (modales, filtros, repos de GitHub, contadores).
//  - Se omite código (pre/code), scripts y [data-notranslate].
//  - Si la API falla, el nodo se queda en español. Nunca se rompe nada.
// ─────────────────────────────────────────────

export type Lang = "es" | "en";

const CACHE_KEY = "mike-i18n-cache-en-v1";
const MAX_CACHE = 3000;
const CONCURRENCY = 6;

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function loadCache(): Map<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return new Map();
    const obj = JSON.parse(raw) as Record<string, string>;
    return new Map(Object.entries(obj).slice(-MAX_CACHE));
  } catch {
    return new Map();
  }
}

let cache: Map<string, string> | null = null;
const getCache = () => (cache ??= loadCache());

function saveCache() {
  try {
    if (!cache) return;
    const entries = [...cache.entries()].slice(-MAX_CACHE);
    cache = new Map(entries);
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    /* almacenamiento lleno: se sigue en memoria */
  }
}

const inflight = new Map<string, Promise<string>>();

// Términos de UI donde Google elige mal: corrección directa, sin gastar API.
const OVERRIDES: Record<string, string> = {
  INICIO: "Home",
};

async function fetchOne(text: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`http-${res.status}`);
  const data = (await res.json()) as unknown;
  // Forma: [[[traducido, original, ...], ...], ...]
  const sentences = (data as { 0?: string }[][])?.[0];
  if (!Array.isArray(sentences)) throw new Error("bad-shape");
  const out = sentences.map((s) => (Array.isArray(s) ? String(s[0] ?? "") : "")).join("");
  if (!out.trim()) throw new Error("empty");
  return out;
}

/** Traduce un texto ES→EN con caché + deduplicación. Lanza si falla. */
export async function translateString(text: string): Promise<string> {
  const src = text.trim();
  if (!src) return text;
  // Sin letras o ya no-español obvio: no gastar peticiones
  if (!/[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]/.test(src)) return text;
  const key = hash(src);
  // El DOM guarda "Inicio" pero innerText muestra "INICIO" (CSS uppercase):
  // buscar en ambas formas para que los overrides siempre apliquen.
  const fixed = OVERRIDES[src] ?? OVERRIDES[src.toUpperCase()];
  if (fixed) {
    getCache().set(key, fixed);
    return fixed;
  }
  const hit = getCache().get(key);
  if (hit) return hit;
  const pending = inflight.get(key);
  if (pending) return pending;
  const p = (async () => {
    try {
      // Textos largos: por frases para no recortar
      const CHUNK = 1500;
      let out: string;
      if (src.length <= CHUNK) {
        out = await fetchOne(src);
      } else {
        const parts = src.split(/(?<=[.!?])\s+/);
        const chunks: string[] = [];
        let cur = "";
        for (const part of parts) {
          if ((cur + " " + part).length > CHUNK && cur) {
            chunks.push(cur);
            cur = part;
          } else cur = cur ? cur + " " + part : part;
        }
        if (cur) chunks.push(cur);
        out = "";
        for (const c of chunks) out += (out ? " " : "") + (await fetchOne(c));
      }
      getCache().set(key, out);
      saveCache();
      return out;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

// Nodo traducido → texto original (para volver a ES exacto)
const originals = new WeakMap<Node, string>();

function insideNoTranslate(node: Node): boolean {
  let el = node.parentElement;
  while (el) {
    const tag = el.tagName;
    if (tag === "PRE" || tag === "CODE" || tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA") return true;
    if (el.hasAttribute?.("data-notranslate")) return true;
    el = el.parentElement;
  }
  return false;
}

function collectCandidates(root: ParentNode): { node: Text; text: string }[] {
  const out: { node: Text; text: string }[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Text | null;
  while ((n = walker.nextNode() as Text | null)) {
    if (originals.has(n)) continue;
    const text = n.nodeValue ?? "";
    if (text.trim().length < 2) continue;
    if (!/[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]{2}/.test(text)) continue;
    if (insideNoTranslate(n)) continue;
    out.push({ node: n, text });
  }
  return out;
}

function collectPlaceholders(root: ParentNode): HTMLElement[] {
  const out: HTMLElement[] = [];
  root.querySelectorAll?.("[placeholder]").forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    const h = el as HTMLElement & { placeholder?: string };
    if (typeof h.placeholder === "string" && h.placeholder.trim().length > 1 && !originals.has(el)) {
      out.push(el);
    }
  });
  return out;
}

async function runPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const item = items[i++];
      try {
        await fn(item);
      } catch {
        /* ese nodo se queda en español */
      }
    }
  });
  await Promise.all(workers);
}

/** Traduce todo el <main> + nav + footer al inglés (progresivo). */
export async function translatePageToEnglish(): Promise<void> {
  const roots = [document.querySelector("main"), document.querySelector("header"), document.querySelector("footer")].filter(
    (el): el is HTMLElement => !!el,
  );
  const texts: { node: Text; text: string }[] = [];
  const holders: HTMLElement[] = [];
  for (const root of roots) {
    texts.push(...collectCandidates(root));
    holders.push(...collectPlaceholders(root));
  }
  // Deduplicar por texto: una petición por cadena única
  const byText = new Map<string, { node: Text; text: string }[]>();
  for (const t of texts) {
    const list = byText.get(t.text) ?? [];
    list.push(t);
    byText.set(t.text, list);
  }
  await runPool([...byText.values()], CONCURRENCY, async (group) => {
    const translated = await translateString(group[0].text);
    for (const { node } of group) {
      if (!node.isConnected) continue;
      if (!originals.has(node)) originals.set(node, node.nodeValue ?? "");
      const fresh = document.createTextNode(translated);
      originals.set(fresh, node.nodeValue ?? group[0].text);
      node.replaceWith(fresh);
    }
  });
  await runPool(holders, CONCURRENCY, async (el) => {
    const h = el as HTMLElement & { placeholder: string };
    const translated = await translateString(h.placeholder);
    if (!originals.has(el)) originals.set(el, h.placeholder);
    h.placeholder = translated;
  });
}

/** Restaura el español exacto en los nodos tocados. */
export function restoreSpanish(): void {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let n: Text | null;
  while ((n = walker.nextNode() as Text | null)) nodes.push(n);
  for (const node of nodes) {
    const orig = originals.get(node);
    if (orig !== undefined && node.nodeValue !== orig) node.nodeValue = orig;
  }
  document.querySelectorAll?.("[placeholder]").forEach((el) => {
    const orig = originals.get(el);
    if (orig !== undefined) (el as HTMLElement & { placeholder: string }).placeholder = orig;
  });
}

let observer: MutationObserver | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let activeLang: Lang = "es";

function schedule() {
  if (activeLang !== "en" || document.hidden) return;
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    void translatePageToEnglish();
  }, 450);
}

/** Vigila contenido dinámico (modales, filtros, repos) y lo traduce. */
export function watchDynamic(lang: Lang): void {
  activeLang = lang;
  if (lang !== "en") {
    observer?.disconnect();
    observer = null;
    return;
  }
  if (observer) return;
  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "characterData") {
        const t = m.target as Text;
        if (!originals.has(t) && (t.nodeValue ?? "").trim().length > 1 && !insideNoTranslate(t)) {
          schedule();
          break;
        }
      } else if (m.type === "childList" && (m.addedNodes.length > 0 || m.removedNodes.length > 0)) {
        schedule();
        break;
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}
