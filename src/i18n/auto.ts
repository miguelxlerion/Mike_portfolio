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


// Términos de UI donde Google elige mal: corrección directa, sin gastar API.
const OVERRIDES: Record<string, string> = {
  INICIO: "Home",
};
async function fetchOne(text: string, signal?: AbortSignal): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`http-${res.status}`);
  const data = (await res.json()) as unknown;
  // Forma: [[[traducido, original, ...], ...], ...]
  const sentences = (data as { 0?: string }[][])?.[0];
  if (!Array.isArray(sentences)) throw new Error("bad-shape");
  const out = sentences.map((s) => (Array.isArray(s) ? String(s[0] ?? "") : "")).join("");
  if (!out.trim()) throw new Error("empty");
  return out;
}

import { CHROME_EN } from "./chrome";

/** Traduce un texto ES→EN con caché + deduplicación. Lanza si falla. */
export async function translateString(text: string): Promise<string> {
  const src = text.trim();
  if (!src) return text;
  // Sin letras o ya no-español obvio: no gastar peticiones
  if (!/[a-záéíóúñüA-ZÁÉÍÓÚÑÜ]/.test(src)) return text;
  const key = hash(src);
  // 1) Diccionario curado (instantáneo, sin API). El DOM guarda "Inicio"
  // pero innerText muestra "INICIO" (CSS uppercase): probar ambas formas.
  const dict = CHROME_EN[src] ?? CHROME_EN[src.toUpperCase()] ?? OVERRIDES[src] ?? OVERRIDES[src.toUpperCase()];
  if (dict) {
    getCache().set(key, dict);
    saveCache();
    return dict;
  }
  const hit = getCache().get(key);
  if (hit) return hit;
  // Textos largos: por frases para no recortar (el worker corta a 2000)
  const parts = splitChunks(src);
  const got = await translateMany(parts);
  const pieces = parts.map((p) => got.get(p) ?? null);
  if (pieces.some((v) => !v)) throw new Error("untranslated");
  const out = pieces.join(" ");
  getCache().set(key, out);
  saveCache();
  return out;
}

function splitChunks(src: string): string[] {
  const CHUNK = 1500;
  if (src.length <= CHUNK) return [src];
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
  return chunks.length ? chunks : [src];
}

const BATCH = 15;

/** Traduce una lista (única) preservando orden. Nulo = ese índice falló. */
export async function translateMany(uniqueTexts: string[]): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  const pending: string[] = [];
  for (const t of uniqueTexts) {
    const dict = CHROME_EN[t] ?? CHROME_EN[t.toUpperCase()];
    if (dict) {
      getCache().set(hash(t), dict);
      out.set(t, dict);
      continue;
    }
    const hit = getCache().get(hash(t));
    if (hit) {
      out.set(t, hit);
    } else pending.push(t);
  }
  for (let k = 0; k < pending.length; k += BATCH) {
    const slice = pending.slice(k, k + BATCH);
    const got = await fetchBatch(slice);
    slice.forEach((t, j) => {
      const v = got[j] ?? null;
      out.set(t, v);
      if (v) getCache().set(hash(t), v);
    });
    saveCache();
  }
  return out;
}

/**
 * Un lote: primero el Worker same-origin (prod: agrupa + caché edge
 * compartida globalmente), si no existe (dev local) directo a Google.
 * Timeout duro: nada cuelga jamás; lo no resuelto queda en español.
 */
const BATCH_TIMEOUT = 12000;

async function fetchBatch(texts: string[]): Promise<(string | null)[]> {
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sl: "es", tl: "en", texts }),
      signal: AbortSignal.timeout(BATCH_TIMEOUT),
    });
    if (res.ok) {
      const data = (await res.json()) as { translations?: unknown };
      if (Array.isArray(data.translations) && data.translations.length === texts.length) {
        return data.translations.map((v) => (typeof v === "string" && v ? v : null));
      }
    }
  } catch {
    /* sin worker (dev): fallback directo */
  }
  const out: (string | null)[] = [];
  for (const t of texts) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), BATCH_TIMEOUT);
    try {
      out.push(await fetchOne(t, ctrl.signal));
    } catch {
      out.push(null);
    } finally {
      clearTimeout(timer);
    }
  }
  return out;
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

/** Separa espacios de borde para no perderlos al sustituir el nodo. */
function splitAffix(t: string): { pre: string; core: string; post: string } {
  const m = t.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return { pre: m?.[1] ?? "", core: m?.[2] ?? t, post: m?.[3] ?? "" };
}

/** Traduce todo el <main> + nav + footer al inglés (progresivo). */
export async function translatePageToEnglish(): Promise<void> {
  const roots = [document.querySelector("main"), document.querySelector("header"), document.querySelector("footer")].filter(
    (el): el is HTMLElement => !!el,
  );
  interface Job {
    key: string;
    pre: string;
    post: string;
    apply: (translated: string) => void;
  }
  const jobs: Job[] = [];
  for (const root of roots) {
    for (const { node, text } of collectCandidates(root)) {
      const { pre, core, post } = splitAffix(text);
      if (core.length < 2) continue;
      jobs.push({
        key: core,
        pre,
        post,
        apply: (translated) => {
          if (!node.isConnected) return;
          if (!originals.has(node)) originals.set(node, node.nodeValue ?? "");
          const fresh = document.createTextNode(pre + translated + post);
          originals.set(fresh, node.nodeValue ?? text);
          node.replaceWith(fresh);
        },
      });
    }
    for (const el of collectPlaceholders(root)) {
      const h = el as HTMLElement & { placeholder: string };
      const orig = h.placeholder;
      const { pre, core, post } = splitAffix(orig);
      jobs.push({
        key: core,
        pre,
        post,
        apply: (translated) => {
          if (!originals.has(el)) originals.set(el, orig);
          h.placeholder = pre + translated + post;
        },
      });
    }
  }
  const unique = [...new Set(jobs.map((j) => j.key))];
  const applyKey = (key: string, value: string) => {
    for (const j of jobs) {
      if (j.key !== key) continue;
      try {
        j.apply(value);
      } catch {
        /* nodo ya inexistente */
      }
    }
  };
  // 1) Instantáneo y sin red: diccionario + caché local. Esto pinta YA
  // aunque la red cuelgue: el progreso nunca depende de la API.
  const rest: string[] = [];
  for (const key of unique) {
    const dict = CHROME_EN[key] ?? CHROME_EN[key.toUpperCase()];
    if (dict) {
      getCache().set(hash(key), dict);
      applyKey(key, dict);
      continue;
    }
    const hit = getCache().get(hash(key));
    if (hit) applyKey(key, hit);
    else rest.push(key);
  }
  saveCache();
  if (rest.length === 0) return;
  // 2) Solo lo restante viaja por red, con timeout duro por lote.
  const got = await translateMany(rest);
  for (const [key, value] of got) {
    if (value) applyKey(key, value);
  }
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
