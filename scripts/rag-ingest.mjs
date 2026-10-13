// ─────────────────────────────────────────────
//  Ingesta RAG: embeddings (Workers AI) → Vectorize.
//  Lee worker/knowledge.json (la misma fuente que edita Panel > RAG).
//  Uso:
//    $env:CLOUDFLARE_API_TOKEN="tu-token-con-AI-y-Vectorize"
//    $env:CLOUDFLARE_ACCOUNT_ID="tu-account-id"
//    npm run rag:ingest
//  Re-ejecútalo cada vez que cambie el conocimiento.
//  (Alternativa sin terminal: Panel > RAG > Re-indexar ahora,
//  con RAG_ADMIN_KEY configurada en el Worker.)
// ─────────────────────────────────────────────
import fs from "node:fs";

const KNOWLEDGE = JSON.parse(fs.readFileSync(new URL("../worker/knowledge.json", import.meta.url), "utf8"));

const TOKEN = process.env.CLOUDFLARE_API_TOKEN ?? "";
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
const INDEX = "portfolio-kb";
const EMBED_MODEL = "@cf/baai/bge-small-en-v1.5";

if (!TOKEN || !ACCOUNT) {
  console.error("Falta CLOUDFLARE_API_TOKEN o CLOUDFLARE_ACCOUNT_ID.");
  console.error("Créalo en dash.cloudflare.com → My Profile → API Tokens");
  console.error("(permisos: Workers AI + Vectorize) y tu Account ID del dashboard.");
  process.exit(1);
}

const api = async (path, init) => {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(`${path} → ${res.status} ${JSON.stringify(data.errors ?? data).slice(0, 300)}`);
  }
  return data.result;
};

const embed = async (texts) => {
  const out = [];
  for (let i = 0; i < texts.length; i += 10) {
    const batch = texts.slice(i, i + 10);
    const r = await api(`/ai/run/${EMBED_MODEL}`, {
      method: "POST",
      body: JSON.stringify({ text: batch }),
    });
    const vecs = r?.data ?? [];
    if (vecs.length !== batch.length) throw new Error("embed incompleto");
    out.push(...vecs);
    console.log(`  embeddings ${Math.min(i + 10, texts.length)}/${texts.length}`);
  }
  return out;
};

const main = async () => {
  console.log(`Chunks: ${KNOWLEDGE.length}`);
  const vectors = await embed(KNOWLEDGE.map((c) => `${c.title}. ${c.text}`));
  const ndjson = KNOWLEDGE.map((c, i) =>
    JSON.stringify({ id: c.id, values: vectors[i], metadata: { title: c.title, text: c.text } }),
  ).join("\n");
  const up = await api(`/vectorize/v2/indexes/${INDEX}/insert`, {
    method: "POST",
    body: ndjson,
    headers: { "Content-Type": "application/x-ndjson" },
  });
  console.log(`Insertados ${KNOWLEDGE.length} vectores en ${INDEX} (respuesta API: ${JSON.stringify(up).slice(0, 120)}).`);
  console.log("Listo. Prueba: POST /api/chat {\"question\":\"¿En qué stack trabajas?\"}");
};

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
