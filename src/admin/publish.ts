import type { SiteContent } from "../data/content";

// ─────────────────────────────────────────────
//  Publicar contenido editado al repo de GitHub.
//  Todo ocurre en el navegador (panel local): el token NUNCA viaja
//  a ningún servidor propio ni se publica en el build.
//  Flujo (solo contenido): lee content.ts del repo → reemplaza el bloque
//  entre <defaultContent>...</defaultContent> → commit → Cloudflare
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

export async function gh(path: string, token: string, init?: RequestInit) {
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
      return "No encontré ese repo/rama o el archivo src/data/content.ts. Revisa el nombre y haz primero el push inicial (ver comandos abajo).";
    case "no-snapshot":
      return "No veo los archivos del disco. Reinicia el servidor local con Abrir-Panel-Admin.bat (el endpoint /__sources.json solo existe en dev).";
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

// ─────────────────────────────────────────────
//  Publicar TODO el proyecto (código + contenido) sin terminal.
//  El snapshot sale de /__sources.json, endpoint que solo existe en
//  `vite dev` y lee los archivos FRESCOS del disco en cada petición:
//  imposible publicar código desactualizado.
//  El content.ts del snapshot se reemplaza SIEMPRE por el estado actual
//  del panel (el panel nunca escribe al disco, así que manda él).
//  Se suben solo los archivos cambiados (comparando SHA-1 de blob git
//  calculado en local contra el árbol remoto). Un solo commit.
//  Límite conocido: los archivos BORRADOS en local se conservan en
//  GitHub (borrar desde la web si hace falta).
// ─────────────────────────────────────────────

export interface FileChange {
  path: string;
  status: "added" | "modified";
  bytes: number;
}

export interface PublishAllPreview {
  baseCommit: string;
  remoteFiles: number;
  changes: FileChange[];
}

async function gitBlobSha(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const header = new TextEncoder().encode(`blob ${bytes.length}\0`);
  const full = new Uint8Array(header.length + bytes.length);
  full.set(header);
  full.set(bytes, header.length);
  const digest = await crypto.subtle.digest("SHA-1", full);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function fetchSnapshot(): Promise<Record<string, string>> {
  let res: Response;
  try {
    res = await fetch("/__sources.json");
  } catch {
    throw new Error("no-snapshot");
  }
  if (!res.ok) throw new Error("no-snapshot");
  const data = (await res.json().catch(() => null)) as { files?: unknown } | null;
  if (!data || typeof data.files !== "object") throw new Error("no-snapshot");
  return data.files as Record<string, string>;
}

interface RemoteTree {
  baseCommit: string;
  baseTree: string;
  entries: Map<string, string>; // path -> blob sha
}

async function readRemoteTree(repo: string, branch: string, token: string): Promise<RemoteTree> {
  const refRes = await gh(`/repos/${repo}/git/ref/heads/${branch}`, token);
  if (refRes.status === 401 || refRes.status === 403) throw new Error("bad-token");
  if (refRes.status === 404) throw new Error("not-found");
  if (!refRes.ok) throw new Error(`http-${refRes.status}`);
  const ref = (await refRes.json()) as { object?: { sha?: string } };
  const baseCommit = ref.object?.sha ?? "";
  if (!baseCommit) throw new Error("bad-file");

  const commitRes = await gh(`/repos/${repo}/git/commits/${baseCommit}`, token);
  if (!commitRes.ok) throw new Error(`http-${commitRes.status}`);
  const commit = (await commitRes.json()) as { tree?: { sha?: string } };
  const baseTree = commit.tree?.sha ?? "";
  if (!baseTree) throw new Error("bad-file");

  const treeRes = await gh(`/repos/${repo}/git/trees/${baseTree}?recursive=1`, token);
  if (!treeRes.ok) throw new Error(`http-${treeRes.status}`);
  const tree = (await treeRes.json()) as { tree?: { path?: string; sha?: string; type?: string }[] };
  const entries = new Map<string, string>();
  for (const e of tree.tree ?? []) {
    if (e.type === "blob" && e.path && e.sha) entries.set(e.path, e.sha);
  }
  return { baseCommit, baseTree, entries };
}

function localFilesWithContent(files: Record<string, string>, content: SiteContent): Record<string, string> {
  const out = { ...files };
  const diskContent = out[CONTENT_PATH];
  if (typeof diskContent === "string") {
    out[CONTENT_PATH] = replaceBlock(diskContent, content);
  } else {
    out[CONTENT_PATH] = buildContentBlock(content);
  }
  return out;
}

export async function previewPublishAll(
  content: SiteContent,
  snapshot: Record<string, string>,
  cfg: PublishConfig,
): Promise<PublishAllPreview> {
  const token = cfg.token.trim();
  const repo = cfg.repo.trim().replace(/\/$/, "");
  const branch = cfg.branch.trim() || "main";
  if (!token) throw new Error("no-token");
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error("bad-repo");

  const remote = await readRemoteTree(repo, branch, token);
  const local = localFilesWithContent(snapshot, content);
  const changes: FileChange[] = [];
  for (const [path, text] of Object.entries(local)) {
    const sha = await gitBlobSha(text);
    const remoteSha = remote.entries.get(path);
    if (remoteSha !== sha) {
      changes.push({
        path,
        status: remoteSha ? "modified" : "added",
        bytes: new TextEncoder().encode(text).length,
      });
    }
  }
  changes.sort((a, b) => a.path.localeCompare(b.path));
  return { baseCommit: remote.baseCommit.slice(0, 7), remoteFiles: remote.entries.size, changes };
}

export async function publishAll(
  content: SiteContent,
  snapshot: Record<string, string>,
  cfg: PublishConfig,
): Promise<PublishResult> {
  const token = cfg.token.trim();
  const repo = cfg.repo.trim().replace(/\/$/, "");
  const branch = cfg.branch.trim() || "main";
  const message = cfg.message.trim() || "Actualizar proyecto desde el panel";
  if (!token) throw new Error("no-token");
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error("bad-repo");

  const remote = await readRemoteTree(repo, branch, token);
  const local = localFilesWithContent(snapshot, content);

  // Subir solo blobs cambiados
  const tree: { path: string; mode: "100644" | "100755"; type: "blob"; sha: string }[] = [];
  for (const [path, text] of Object.entries(local)) {
    const sha = await gitBlobSha(text);
    if (remote.entries.get(path) === sha) continue;
    const blobRes = await gh(`/repos/${repo}/git/blobs`, token, {
      method: "POST",
      body: JSON.stringify({ content: toBase64Unicode(text), encoding: "base64" }),
    });
    if (!blobRes.ok) throw new Error(`http-${blobRes.status}`);
    const blob = (await blobRes.json()) as { sha?: string };
    if (!blob.sha) throw new Error("bad-file");
    tree.push({
      path,
      mode: path.endsWith(".bat") || path.endsWith(".sh") ? "100755" : "100644",
      type: "blob",
      sha: blob.sha,
    });
  }
  if (tree.length === 0) {
    return {
      commitSha: remote.baseCommit.slice(0, 7),
      commitUrl: `https://github.com/${repo}/commit/${remote.baseCommit}`,
      fileUrl: `https://github.com/${repo}/blob/${branch}/${CONTENT_PATH}`,
    };
  }

  const treeRes = await gh(`/repos/${repo}/git/trees`, token, {
    method: "POST",
    body: JSON.stringify({ base_tree: remote.baseTree, tree }),
  });
  if (!treeRes.ok) throw new Error(`http-${treeRes.status}`);
  const newTree = (await treeRes.json()) as { sha?: string };
  if (!newTree.sha) throw new Error("bad-file");

  const commitRes = await gh(`/repos/${repo}/git/commits`, token, {
    method: "POST",
    body: JSON.stringify({ message, tree: newTree.sha, parents: [remote.baseCommit] }),
  });
  if (!commitRes.ok) throw new Error(`http-${commitRes.status}`);
  const commit = (await commitRes.json()) as { sha?: string };
  if (!commit.sha) throw new Error("bad-file");

  const refRes = await gh(`/repos/${repo}/git/ref/heads/${branch}`, token, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });
  if (refRes.status === 422) throw new Error("conflict");
  if (!refRes.ok) throw new Error(`http-${refRes.status}`);

  return {
    commitSha: commit.sha.slice(0, 7),
    commitUrl: `https://github.com/${repo}/commit/${commit.sha}`,
    fileUrl: `https://github.com/${repo}/blob/${branch}/${CONTENT_PATH}`,
  };
}
