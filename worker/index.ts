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

export default {
  async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/github" && request.method === "GET") {
      return handleGithub(request, env, ctx);
    }
    if (url.pathname === "/api/contact") {
      if (request.method === "POST") return handleContact(request, env);
      return new Response("Method Not Allowed", { status: 405 });
    }
    if (url.pathname === "/api/translate") {
      if (request.method === "POST") return handleTranslate(request, env, ctx);
      return new Response("Method Not Allowed", { status: 405 });
    }
    if (url.pathname === "/api/chat") {
      if (request.method === "POST") return handleChat(request, env);
      return new Response("Method Not Allowed", { status: 405 });
    }
    if (url.pathname === "/api/rag/ingest") {
      if (request.method === "POST") return handleRagIngest(request, env);
      return new Response("Method Not Allowed", { status: 405 });
    }

    return env.ASSETS.fetch(request);
  },
};
