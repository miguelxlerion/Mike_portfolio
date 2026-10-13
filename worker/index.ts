import { handleGithub } from "./github";
import { handleContact } from "./contact";
import { handleTranslate } from "./translate";
import { handleChat } from "./chat";
import { handleRagIngest } from "./rag";

// Worker único: sirve el sitio estático (dist/) y las rutas /api/*.
// Todo lo que no sea /api/* cae al asset estático (binding ASSETS).

interface Env {
  GITHUB_TOKEN?: string;
  TRANSLATE_API_KEY?: string;
  RAG_ADMIN_KEY?: string;
  TURNSTILE_SECRET?: string;
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

interface Ctx {
  waitUntil: (p: Promise<unknown>) => void;
}

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

async function withCors(res: Response): Promise<Response> {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(CORS)) out.headers.set(k, v);
  return out;
}

export default {
  async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
    const url = new URL(request.url);

    // Preflight para el panel local y cualquier origen (las APIs son
    // públicas salvo /api/rag/ingest, que exige su propia clave).
    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === "/api/github" && request.method === "GET") {
      return withCors(await handleGithub(request, env, ctx));
    }
    if (url.pathname === "/api/contact") {
      if (request.method === "POST") return withCors(await handleContact(request, env));
      return new Response("Method Not Allowed", { status: 405 });
    }
    if (url.pathname === "/api/translate") {
      if (request.method === "POST") return withCors(await handleTranslate(request, env, ctx));
      return new Response("Method Not Allowed", { status: 405 });
    }
    if (url.pathname === "/api/chat") {
      if (request.method === "POST") return withCors(await handleChat(request, env));
      return new Response("Method Not Allowed", { status: 405 });
    }
    if (url.pathname === "/api/rag/ingest") {
      if (request.method === "POST") return withCors(await handleRagIngest(request, env));
      return new Response("Method Not Allowed", { status: 405 });
    }

    return env.ASSETS.fetch(request);
  },
};
