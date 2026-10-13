import { gh, type PublishConfig } from "./publish";

// ─────────────────────────────────────────────
//  Medios: imágenes del PC o por URL → repo GitHub
//  (public/uploads/) → Cloudflare Pages los sirve.
//  Videos: solo por URL (no se suben binarios pesados).
// ─────────────────────────────────────────────

export const UPLOAD_DIR = "public/uploads";
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB (límite plataforma: 25 MB/archivo)
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"]);

export interface MediaItem {
  path: string; // public/uploads/xxx.jpg
  name: string;
  siteUrl: string; // /uploads/xxx.jpg (funciona tras el deploy)
  rawUrl: string; // vista inmediata, sin esperar deploy
}

export function slugFileName(name: string): string {
  const base = name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9.\-_]/g, "");
  return `${Date.now().toString(36)}-${base || "imagen"}`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function repoOf(cfg: PublishConfig): string {
  const repo = cfg.repo.trim().replace(/\/$/, "");
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error("bad-repo");
  return repo;
}

function siteUrlOf(path: string): string {
  return "/" + path.replace(/^public\//, "");
}

function rawUrlOf(repo: string, branch: string, path: string): string {
  return `https://raw.githubusercontent.com/${repo}/${branch}/${path}`;
}

async function putFile(cfg: PublishConfig, path: string, bytes: Uint8Array, message: string): Promise<void> {
  const token = cfg.token.trim();
  if (!token) throw new Error("no-token");
  const repo = repoOf(cfg);
  const branch = cfg.branch.trim() || "main";
  const res = await gh(`/repos/${repo}/contents/${path}`, token, {
    method: "PUT",
    body: JSON.stringify({ message, content: bytesToBase64(bytes), branch }),
  });
  if (res.status === 401 || res.status === 403) throw new Error("bad-token");
  if (res.status === 422) throw new Error("exists");
  if (!res.ok) throw new Error(`http-${res.status}`);
}

export function validateImageFile(file: File): string | null {
  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  if (!file.type.startsWith("image/") || !IMAGE_EXTS.has(ext)) {
    return `"${file.name}" no es una imagen válida (jpg, png, webp, gif, svg, avif).`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `"${file.name}" pesa ${(file.size / 1048576).toFixed(1)} MB: máximo 10 MB.`;
  }
  if (file.size === 0) return `"${file.name}" está vacío.`;
  return null;
}

/** Sube un archivo del PC tal cual (binario seguro). */
export async function uploadImageFile(cfg: PublishConfig, file: File): Promise<MediaItem> {
  const bad = validateImageFile(file);
  if (bad) throw new Error(bad);
  const repo = repoOf(cfg);
  const branch = cfg.branch.trim() || "main";
  const path = `${UPLOAD_DIR}/${slugFileName(file.name)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  await putFile(cfg, path, bytes, `Subir imagen ${path.split("/").pop()} desde el panel`);
  return { path, name: path.split("/").pop() ?? path, siteUrl: siteUrlOf(path), rawUrl: rawUrlOf(repo, branch, path) };
}

/** Intenta traer una imagen por URL al repo. Falla si el origen bloquea CORS. */
export async function importImageFromUrl(cfg: PublishConfig, url: string): Promise<MediaItem> {
  const clean = url.trim();
  if (!/^https?:\/\/.+\..+/.test(clean)) throw new Error("bad-url");
  const repo = repoOf(cfg);
  const branch = cfg.branch.trim() || "main";
  let res: Response;
  try {
    res = await fetch(clean);
  } catch {
    throw new Error("cors-or-network");
  }
  if (!res.ok) throw new Error("fetch-failed");
  const ct = (res.headers.get("content-type") ?? "").toLowerCase();
  if (!ct.startsWith("image/")) throw new Error("not-image");
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) throw new Error("too-big");
  const extGuess = (ct.split("/")[1] ?? "jpg").split("+")[0].split(";")[0].replace(/[^a-z]/g, "") || "jpg";
  const fromPath = clean.split("?")[0].split("/").pop() || `imagen.${extGuess}`;
  const dotted = fromPath.includes(".") ? fromPath : `${fromPath}.${extGuess}`;
  const path = `${UPLOAD_DIR}/${slugFileName(dotted)}`;
  await putFile(cfg, path, bytes, `Importar imagen ${path.split("/").pop()} desde el panel`);
  return { path, name: path.split("/").pop() ?? path, siteUrl: siteUrlOf(path), rawUrl: rawUrlOf(repo, branch, path) };
}

/** Lista lo que hay en public/uploads/ del repo. */
export async function listUploads(cfg: PublishConfig): Promise<MediaItem[]> {
  const token = cfg.token.trim();
  if (!token) throw new Error("no-token");
  const repo = repoOf(cfg);
  const branch = cfg.branch.trim() || "main";
  const res = await gh(`/repos/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`, token);
  if (res.status === 401 || res.status === 403) throw new Error("bad-token");
  if (!res.ok) throw new Error(`http-${res.status}`);
  const tree = (await res.json()) as { tree?: { path?: string; type?: string }[] };
  return (tree.tree ?? [])
    .filter((e) => e.type === "blob" && e.path?.startsWith(`${UPLOAD_DIR}/`))
    .map((e) => {
      const path = e.path as string;
      return { path, name: path.split("/").pop() ?? path, siteUrl: siteUrlOf(path), rawUrl: rawUrlOf(repo, branch, path) };
    })
    .sort((a, b) => b.name.localeCompare(a.name));
}

/** Borra un archivo del repo (libera la galería). */
export async function deleteMedia(cfg: PublishConfig, path: string): Promise<void> {
  const token = cfg.token.trim();
  if (!token) throw new Error("no-token");
  const repo = repoOf(cfg);
  const branch = cfg.branch.trim() || "main";
  const get = await gh(`/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`, token);
  if (!get.ok) throw new Error(`http-${get.status}`);
  const file = (await get.json()) as { sha?: string };
  if (!file.sha) throw new Error("bad-file");
  const del = await gh(`/repos/${repo}/contents/${path}`, token, {
    method: "DELETE",
    body: JSON.stringify({ message: `Borrar ${path} desde el panel`, sha: file.sha, branch }),
  });
  if (!del.ok) throw new Error(`http-${del.status}`);
}

export function mediaErrorMessage(code: string): string {
  switch (code) {
    case "no-token":
      return "Pega tu token de GitHub primero (pestaña Publicar).";
    case "bad-repo":
      return "El repo debe tener formato usuario/repo.";
    case "bad-token":
      return "Token inválido o sin permiso de escritura en Contents.";
    case "bad-url":
      return "Esa URL no parece válida (debe empezar por https://).";
    case "cors-or-network":
      return "Ese sitio bloquea la descarga directa (CORS) o no responde. Descarga la imagen y súbela desde el PC, o úsala como URL directa.";
    case "fetch-failed":
      return "No se pudo descargar esa URL (responde error).";
    case "not-image":
      return "Esa URL no devuelve una imagen.";
    case "too-big":
      return "La imagen supera 10 MB.";
    case "exists":
      return "Ya existe un archivo con ese nombre. Reintenta (el nombre lleva timestamp).";
    default:
      return code.startsWith("http-") ? `GitHub respondió ${code.slice(5)}.` : code;
  }
}
