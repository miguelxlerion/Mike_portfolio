// POST /api/chat — asistente RAG del portafolio.
// Flujo: embed pregunta (bge-m3 multilingüe) → Vectorize topK → contexto +
// historial corto → Llama 3.1 8B. Sin bindings (dev) responde 503 y el
// widget muestra contacto directo. Con topes anti-abuso en el propio Worker.
//
// Ajustes vivos en ./rag-config.json (Panel > RAG, sin tocar código).
//
//   POST { question: "...", history?: [{role:"user"|"assistant", content}] }
//   → { answer, sources: [títulos] } | { error }

import RAG_CONFIG from "./rag-config.json";

const EMBED_MODEL = (RAG_CONFIG.embedModel as string) || "@cf/baai/bge-m3";
const CHAT_MODEL = (RAG_CONFIG.chatModel as string) || "@cf/meta/llama-3.1-8b-instruct";
const TOP_K = Number(RAG_CONFIG.topK) || 5;
const MAX_Q = 500;
const MAX_HISTORY = 4;
const MAX_TOKENS = Number(RAG_CONFIG.maxTokens) || 420;
const MIN_SCORE = Number(RAG_CONFIG.minScore) || 0.15;
const SYSTEM = (RAG_CONFIG.systemPrompt as string) || "Eres el asistente del portafolio de Miguel Rodriguez.";

// Anti-abuso simple por IP (además de la regla Rate Limiting del dashboard).
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_MIN = 12;

function throttled(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 2000) hits.clear();
  return arr.length > MAX_PER_MIN;
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

interface ChatEnv {
  AI?: {
    run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
  };
  VECTORIZE?: {
    query: (
      vector: number[],
      options: { topK: number; returnValues?: boolean; returnMetadata?: string },
    ) => Promise<{ matches?: { id?: string; score?: number; metadata?: Record<string, unknown> }[] }>;
  };
}

export async function handleChat(request: Request, env: ChatEnv): Promise<Response> {
  if (!env.AI || !env.VECTORIZE) {
    return json({ error: "rag-not-configured" }, 501);
  }
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad-json" }, 400);
  }
  const { question, history } = (body ?? {}) as {
    question?: unknown;
    history?: unknown;
  };
  if (typeof question !== "string" || question.trim().length < 2 || question.length > MAX_Q) {
    return json({ error: "bad-question" }, 400);
  }
  const ip =
    request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  if (throttled(ip)) return json({ error: "too-many" }, 429);

  const cleanHistory: { role: string; content: string }[] = [];
  if (Array.isArray(history)) {
    for (const m of history.slice(-MAX_HISTORY)) {
      const mm = m as { role?: unknown; content?: unknown };
      if ((mm.role === "user" || mm.role === "assistant") && typeof mm.content === "string") {
        cleanHistory.push({ role: mm.role, content: mm.content.slice(0, 600) });
      }
    }
  }

  try {
    // 1) Embedding de la pregunta (+ última pregunta previa si hay seguimiento)
    const queryText =
      cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === "user"
        ? `${cleanHistory[cleanHistory.length - 1].content}\n${question.trim()}`
        : question.trim();
    let emb: unknown;
    try {
      emb = await env.AI.run(EMBED_MODEL, { text: queryText });
    } catch {
      return json({ error: "stage-embed" }, 502);
    }
    const vector: number[] | undefined = Array.isArray((emb as { data?: unknown }).data?.[0])
      ? ((emb as { data: number[][] }).data[0] as number[])
      : ((emb as { data?: number[] }).data as number[] | undefined);
    if (!vector || vector.length === 0) return json({ error: "embed-failed" }, 502);

    // 2) Búsqueda semántica topK
    let found: {
      matches?: { id?: string; score?: number; metadata?: Record<string, unknown> }[];
    };
    try {
      found = await env.VECTORIZE.query(vector, {
        topK: TOP_K,
        returnValues: false,
        returnMetadata: "all",
      });
    } catch {
      return json({ error: "stage-query" }, 502);
    }
    const matches = (found.matches ?? []).filter((m) => (m.score ?? 0) > MIN_SCORE);
    if (matches.length === 0) {
      return json({
        answer:
          "No encontré eso en mi perfil. Escríbeme a miguelxlerion@gmail.com y te respondo en menos de 24 horas.",
        sources: [],
      });
    }
    const context = matches
      .map((m, i) => {
        const md = (m.metadata ?? {}) as { title?: unknown; text?: unknown };
        return `[${i + 1}] ${String(md.title ?? m.id ?? "")}: ${String(md.text ?? "").slice(0, 900)}`;
      })
      .join("\n\n");
    const sources = matches.map((m) => {
      const md = (m.metadata ?? {}) as { title?: unknown };
      return String(md.title ?? m.id ?? "perfil");
    });

    // 3) Generación con contexto estricto
    const messages = [
      { role: "system", content: SYSTEM },
      ...cleanHistory,
      {
        role: "user",
        content: `Contexto del perfil:\n${context}\n\nPregunta: ${question.trim()}`,
      },
    ];
    let out: { response?: unknown } | null = null;
    let lastErr = "";
    // Fallback de modelo: si el principal falla (cuenta, despliegue),
    // se intenta con uno liviano antes de rendirse.
    for (const m of [CHAT_MODEL, "@cf/meta/llama-3.2-3b-instruct"]) {
      try {
        const r = (await env.AI.run(m, {
          messages,
          max_tokens: MAX_TOKENS,
          temperature: Number(RAG_CONFIG.temperature ?? 0.3),
        })) as { response?: unknown };
        if (typeof r.response === "string" && r.response.trim()) {
          out = r;
          break;
        }
        lastErr = `${m}: empty-response`;
      } catch (e) {
        lastErr = `${m}: ${String((e as Error)?.message ?? e).slice(0, 160)}`;
      }
    }
    const answer = out && typeof out.response === "string" ? out.response.trim() : "";
    if (!answer) return json({ error: "stage-gen", detail: lastErr }, 502);
    return json({ answer, sources: [...new Set(sources)].slice(0, 5) });
  } catch {
    return json({ error: "rag-error" }, 502);
  }
}
