// POST /api/rag/ingest — re-indexa el conocimiento SIN terminal.
// El panel local manda sus chunks editados; el Worker los incrusta
// (Workers AI) y los guarda en Vectorize. Sin redeploy: el índice
// se actualiza en el acto y el widget lo usa al instante.
//
// Protegido por RAG_ADMIN_KEY (secret del Worker). Sin la clave
// configurada, o con clave incorrecta, responde 403 siempre.
// Úsalo desde Panel > RAG con la misma clave guardada en local.
//
//   POST { key: "...", chunks: [{id, title, text}] }
//   → { ok: true, inserted: N } | { ok: false, error }

import RAG_CONFIG from "./rag-config.json";

const EMBED_MODEL = (RAG_CONFIG.embedModel as string) || "@cf/baai/bge-small-en-v1.5";

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

interface RagEnv {
  AI?: {
    run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
  };
  VECTORIZE?: {
    upsert: (
      vectors: { id: string; values: number[]; metadata?: Record<string, unknown> }[],
    ) => Promise<unknown>;
  };
  RAG_ADMIN_KEY?: string;
}

interface InChunk {
  id?: unknown;
  title?: unknown;
  text?: unknown;
}

export async function handleRagIngest(request: Request, env: RagEnv): Promise<Response> {
  const expected = (env.RAG_ADMIN_KEY ?? "").trim();
  if (!expected) return json({ ok: false, error: "rag-admin-disabled" }, 403);

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "bad-json" }, 400);
  }
  const { key, chunks } = (body ?? {}) as { key?: unknown; chunks?: unknown };
  if (typeof key !== "string" || key !== expected) {
    return json({ ok: false, error: "forbidden" }, 403);
  }
  if (!env.AI || !env.VECTORIZE) return json({ ok: false, error: "rag-not-configured" }, 501);
  if (!Array.isArray(chunks) || chunks.length === 0 || chunks.length > 120) {
    return json({ ok: false, error: "bad-chunks" }, 400);
  }

  const clean: { id: string; title: string; text: string }[] = [];
  let total = 0;
  for (const c of chunks as InChunk[]) {
    const id = String(c.id ?? "").trim().slice(0, 120);
    const title = String(c.title ?? "").trim().slice(0, 160);
    const text = String(c.text ?? "").trim().slice(0, 2500);
    if (!id || !text) return json({ ok: false, error: "bad-chunks" }, 400);
    total += text.length;
    if (total > 120000) return json({ ok: false, error: "too-much" }, 413);
    clean.push({ id, title: title || id, text });
  }

  try {
    let done = 0;
    for (let i = 0; i < clean.length; i += 10) {
      const batch = clean.slice(i, i + 10);
      const emb = (await env.AI.run(EMBED_MODEL, {
        text: batch.map((c) => `${c.title}. ${c.text}`),
      })) as { data?: number[][] };
      const vecs = emb?.data ?? [];
      if (vecs.length !== batch.length || !vecs.every((v) => Array.isArray(v) && v.length > 0)) {
        return json({ ok: false, error: "embed-failed" }, 502);
      }
      await env.VECTORIZE.upsert(
        batch.map((c, j) => ({
          id: c.id,
          values: vecs[j],
          metadata: { title: c.title, text: c.text },
        })),
      );
      done += batch.length;
    }
    return json({ ok: true, inserted: done }, 200);
  } catch {
    return json({ ok: false, error: "rag-error" }, 502);
  }
}
