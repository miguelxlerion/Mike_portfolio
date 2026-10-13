import type { SiteContent } from "../data/content";

// ─────────────────────────────────────────────
//  Publicar contenido editado al repo de GitHub.
//  Todo ocurre en el navegador (panel local): el token NUNCA viaja
//  a ningún servidor propio ni se publica en el build.
//  Flujo: lee content.ts del repo → reemplaza el bloque entre
//  <defaultContent>...</defaultContent> → commit → Cloudflare Pages
//  redespliega solo con el contenido nuevo.
// ─────────────────────────────────────────────

export const CONTENT_PATH = "src/data/content.ts";
export const START_MARKER = "// <defaultContent>";
export const END_MARKER = "// </defaultContent>";

export interface PublishConfig {
  token: string;
  repo: string; // "usuario/repo"
  branch: string;
  message: string;
}

export interface PublishResult {
  commitSha: string;
  commitUrl: string;
  fileUrl: string;
}

function toBase64Unicode(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function fromBase64Unicode(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function buildContentBlock(content: SiteContent): string {
  return `export const defaultContent: SiteContent = ${JSON.stringify(content, null, 2)};`;
}

export function replaceBlock(fileText: string, content: SiteContent): string {
  const i = fileText.indexOf(START_MARKER);
  const j = fileText.indexOf(END_MARKER);
  if (i === -1 || j === -1 || j <= i) {
    throw new Error("markers-missing");
  }
  return fileText.slice(0, i + START_MARKER.length) + "\n" + buildContentBlock(content) + "\n" + fileText.slice(j);
}

async function gh(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  return res;
}

export async function publishContent(content: SiteContent, cfg: PublishConfig): Promise<PublishResult> {
  const token = cfg.token.trim();
  const repo = cfg.repo.trim().replace(/\/$/, "");
  const branch = cfg.branch.trim() || "main";
  const message = cfg.message.trim() || "Actualizar contenido desde el panel";

  if (!token) throw new Error("no-token");
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error("bad-repo");

  // 1) Leer el archivo actual (para el SHA y conservar tipos/helpers)
  const getRes = await gh(`/repos/${repo}/contents/${CONTENT_PATH}?ref=${encodeURIComponent(branch)}`, token);
  if (getRes.status === 401 || getRes.status === 403) throw new Error("bad-token");
  if (getRes.status === 404) throw new Error("not-found");
  if (!getRes.ok) throw new Error(`http-${getRes.status}`);
  const file = (await getRes.json()) as { sha?: string; content?: string; html_url?: string };
  if (!file.sha || !file.content) throw new Error("bad-file");

  // 2) Reemplazar solo el bloque de datos
  let updated: string;
  try {
    updated = replaceBlock(fromBase64Unicode(file.content), content);
  } catch {
    throw new Error("markers-missing");
  }

  // 3) Commit
  const putRes = await gh(`/repos/${repo}/contents/${CONTENT_PATH}`, token, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: toBase64Unicode(updated),
      sha: file.sha,
      branch,
    }),
  });
  if (putRes.status === 401 || putRes.status === 403) throw new Error("bad-token");
  if (putRes.status === 409) throw new Error("conflict");
  if (putRes.status === 422) throw new Error("validation");
  if (!putRes.ok) throw new Error(`http-${putRes.status}`);
  const done = (await putRes.json()) as { commit?: { sha?: string; html_url?: string } };
  const sha = done.commit?.sha ?? "";
  return {
    commitSha: sha.slice(0, 7),
    commitUrl: done.commit?.html_url ?? `https://github.com/${repo}/commits/${branch}`,
    fileUrl: file.html_url ?? `https://github.com/${repo}/blob/${branch}/${CONTENT_PATH}`,
  };
}

export function publishErrorMessage(code: string): string {
  switch (code) {
    case "no-token":
      return "Pega tu token de GitHub primero (solo vive en este navegador).";
    case "bad-repo":
      return "El repo debe tener formato usuario/repo, ej. miguelxlerion/Mike_portfolio.";
    case "bad-token":
      return "Token inválido o sin permiso. Necesita acceso de escritura a Contents (o scope repo).";
    case "not-found":
      return "No encontré src/data/content.ts en ese repo/rama. Haz primero el push inicial del proyecto (ver comandos abajo).";
    case "markers-missing":
      return "El archivo del repo no tiene los marcadores <defaultContent>. No lo edites a mano fuera de ellos.";
    case "conflict":
      return "Alguien actualizó el archivo mientras publicabas (SHA desactualizado). Pulsa Publicar de nuevo.";
    case "validation":
      return "GitHub rechazó el commit (¿rama protegida?). Revisa las reglas de la rama main.";
    default:
      return code.startsWith("http-") ? `GitHub respondió ${code.slice(5)}. Reintenta en un minuto.` : "Error de red. Revisa tu conexión.";
  }
}

const CFG_KEY = "mike-publish-cfg";

export function loadPublishConfig(): PublishConfig {
  try {
    const raw = localStorage.getItem(CFG_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<PublishConfig>;
      return {
        token: String(p.token ?? ""),
        repo: String(p.repo ?? "miguelxlerion/Mike_portfolio"),
        branch: String(p.branch ?? "main"),
        message: String(p.message ?? "Actualizar contenido desde el panel"),
      };
    }
  } catch {
    /* noop */
  }
  return { token: "", repo: "miguelxlerion/Mike_portfolio", branch: "main", message: "Actualizar contenido desde el panel" };
}

export function savePublishConfig(cfg: PublishConfig) {
  try {
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
  } catch {
    /* noop */
  }
}

export function forgetPublishToken() {
  try {
    const cfg = loadPublishConfig();
    savePublishConfig({ ...cfg, token: "" });
  } catch {
    /* noop */
  }
}
