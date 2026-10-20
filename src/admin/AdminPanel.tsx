import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Check, Download, Eye, FileJson, KeyRound, Lock, Plus,
  RefreshCcw, Save, Settings2, Trash2, Copy, FolderKanban, User,
  Rocket, Info, GitBranch, Mail, Palette, Database, Box, Globe, Upload, Image as ImageIcon, Bot as BotIcon, BookOpen as BookIcon,
} from "lucide-react";
import { useSite } from "../store/SiteContext";
import type { CategoryId, Model3D, Project, SiteContent, WebWork } from "../data/content";
import { cn } from "../utils/cn";
import {
  MAX_IMAGE_BYTES,
  deleteMedia,
  importImageFromUrl,
  listUploads,
  mediaErrorMessage,
  uploadImageFile,
  type MediaItem,
} from "./media";
import {
  fetchSnapshot,
  forgetPublishToken,
  loadPublishConfig,
  previewPublishAll,
  publishAll,
  publishContent,
  publishErrorMessage,
  savePublishConfig,
  type PublishAllPreview,
  type PublishConfig,
  type PublishResult,
} from "./publish";

type TabId = "general" | "hero" | "about" | "projects" | "sitios" | "medios" | "modelos" | "rag" | "github" | "contact" | "design" | "data" | "publicar" | "ayuda";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <User className="h-4 w-4" /> },
  { id: "hero", label: "Hero", icon: <Rocket className="h-4 w-4" /> },
  { id: "about", label: "Sobre mí", icon: <Info className="h-4 w-4" /> },
  { id: "projects", label: "Proyectos", icon: <FolderKanban className="h-4 w-4" /> },
  { id: "sitios", label: "Sitios Web", icon: <Globe className="h-4 w-4" /> },
  { id: "medios", label: "Medios", icon: <ImageIcon className="h-4 w-4" /> },
  { id: "modelos", label: "Modelos 3D", icon: <Box className="h-4 w-4" /> },
  { id: "rag", label: "RAG", icon: <BotIcon className="h-4 w-4" /> },
  { id: "github", label: "GitHub", icon: <GitBranch className="h-4 w-4" /> },
  { id: "contact", label: "Contacto", icon: <Mail className="h-4 w-4" /> },
  { id: "design", label: "Diseño", icon: <Palette className="h-4 w-4" /> },
  { id: "data", label: "Datos", icon: <Database className="h-4 w-4" /> },
  { id: "publicar", label: "Publicar", icon: <Upload className="h-4 w-4" /> },
  { id: "ayuda", label: "Ayuda", icon: <BookIcon className="h-4 w-4" /> },
];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-zinc-600">{hint}</span>}
    </label>
  );
}

const inputCls = "w-full border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-acid";
const btnPrimary = "inline-flex items-center gap-2 bg-acid px-4 py-2.5 font-display text-sm font-bold text-ink transition hover:bg-acid-soft";
const btnGhost = "inline-flex items-center gap-2 border border-white/15 px-4 py-2.5 font-display text-sm font-bold text-zinc-200 transition hover:border-acid hover:text-acid";

function newProject(): Project {
  const id = `proyecto-${Date.now().toString(36)}`;
  return {
    id, title: "Nuevo proyecto", category: "codigo", tagline: "Describe tu proyecto en una línea",
    description: "Descripción corta para la tarjeta.", longDescription: "Descripción larga para la ficha completa.",
    image: "", tags: ["Nuevo"], year: String(new Date().getFullYear()),
    demoUrl: "", repoUrl: "", featured: false, specs: [],
  };
}

export default function AdminPanel() {
  const { content, update, reset, exportJSON, importJSON } = useSite();
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("mike-admin") === "1");
  const [pass, setPass] = useState("");
  const [passError, setPassError] = useState("");
  const [tab, setTab] = useState<TabId>("general");
  const [saved, setSaved] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>(content.projects[0]?.id ?? "");
  const [selectedModel, setSelectedModel] = useState<string>(content.showcase3d.models[0]?.id ?? "");
  const [selectedSite, setSelectedSite] = useState<string>(content.webworks.items[0]?.id ?? "");
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [pubCfg, setPubCfgState] = useState<PublishConfig>(() => loadPublishConfig());
  const [pubStatus, setPubStatus] = useState<"idle" | "pushing" | "ok" | "error">("idle");
  const [pubMsg, setPubMsg] = useState("");
  const [pubResult, setPubResult] = useState<PublishResult | null>(null);

  const setPub = (patch: Partial<PublishConfig>) => {
    setPubCfgState((prev) => {
      const next = { ...prev, ...patch };
      savePublishConfig(next);
      return next;
    });
  };

  const doPublish = async () => {
    setPubStatus("pushing");
    setPubMsg("");
    setPubResult(null);
    try {
      const r = await publishContent(content, pubCfg);
      setPubResult(r);
      setPubStatus("ok");
    } catch (e) {
      setPubStatus("error");
      setPubMsg(publishErrorMessage(e instanceof Error ? e.message : "network"));
    }
  };

  const [snapStatus, setSnapStatus] = useState<"idle" | "comparing" | "ready" | "pushing" | "ok" | "error">("idle");
  const [snapshot, setSnapshot] = useState<Record<string, string> | null>(null);
  const [preview, setPreview] = useState<PublishAllPreview | null>(null);
  const [allMsg, setAllMsg] = useState("");
  const [allResult, setAllResult] = useState<PublishResult | null>(null);

  const errMsg = (e: unknown) => publishErrorMessage(e instanceof Error ? e.message : "network");

  const doCompare = async () => {
    setSnapStatus("comparing");
    setAllMsg("");
    setPreview(null);
    setAllResult(null);
    try {
      const snap = await fetchSnapshot();
      setSnapshot(snap);
      const pv = await previewPublishAll(content, snap, pubCfg);
      setPreview(pv);
      setSnapStatus("ready");
    } catch (e) {
      setSnapStatus("error");
      setAllMsg(errMsg(e));
    }
  };

  const doPublishAll = async () => {
    if (!snapshot) return;
    setSnapStatus("pushing");
    setAllMsg("");
    setAllResult(null);
    try {
      const r = await publishAll(content, snapshot, pubCfg);
      setAllResult(r);
      setSnapStatus("ok");
      setPreview(null);
    } catch (e) {
      setSnapStatus("error");
      setAllMsg(errMsg(e));
    }
  };

  // Botón reutilizable: sube una imagen del PC a GitHub y devuelve el item.
  // Muestra miniatura inmediata (raw de GitHub) porque la ruta pública
  // /uploads/... solo existe en local tras el deploy.
  // Se usa junto a los campos de imagen (proyecto, retrato, póster, sitio).
  function ImageUploadButton({ onDone }: { onDone: (item: MediaItem) => void }) {
    const [st, setSt] = useState<"idle" | "up" | "err">("idle");
    const [thumb, setThumb] = useState<string | null>(null);
    return (
      <span className="inline-flex items-center gap-2">
        <label
          title="Sube la imagen a public/uploads/ de tu repo (requiere token)"
          className="inline-flex cursor-pointer items-center gap-2 border border-white/15 px-3 py-2 font-mono text-xs text-zinc-300 transition hover:border-acid hover:text-acid"
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              setSt("up");
              uploadImageFile(pubCfg, f)
                .then((item) => {
                  onDone(item);
                  setThumb(item.rawUrl);
                  flashSaved();
                  setSt("idle");
                })
                .catch(() => {
                  setSt("err");
                  setTimeout(() => setSt("idle"), 2600);
                });
            }}
          />
          <Upload className="h-3.5 w-3.5" />
          {st === "up" ? "Subiendo…" : st === "err" ? "Error: ¿token?" : "Subir PC"}
        </label>
        {thumb && (
          <img src={thumb} alt="Subida correcta" className="h-9 w-14 border border-acid/50 object-cover" title="En GitHub ✓ — se verá en el sitio tras el deploy" />
        )}
      </span>
    );
  }

  // Vista previa que también funciona en local: si la ruta /uploads/...
  // aún no existe en el disco (subida reciente), reintenta vía raw de GitHub.
  function SmartPreview({ src, className, alt }: { src: string; className?: string; alt?: string }) {
    const [fallback, setFallback] = useState(false);
    useEffect(() => setFallback(false), [src]);
    const looksUpload = src.startsWith("/uploads/");
    const rawBase = `https://raw.githubusercontent.com/${pubCfg.repo.trim().replace(/\/$/, "")}/${(pubCfg.branch.trim() || "main")}/public`;
    return (
      <img
        src={!fallback && looksUpload ? rawBase + src : src}
        alt={alt ?? "Vista previa"}
        loading="lazy"
        onError={() => {
          if (!fallback && looksUpload) setFallback(true);
        }}
        className={className ?? "h-40 w-full border border-white/15 object-cover"}
      />
    );
  }

  // ── Medios ──
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaMsg, setMediaMsg] = useState("");
  const [uploadStates, setUploadStates] = useState<Record<string, string>>({});
  const [importUrl, setImportUrl] = useState("");
  const [importState, setImportState] = useState<"idle" | "working" | "ok" | "error">("idle");
  const [imported, setImported] = useState<MediaItem | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoProject, setVideoProject] = useState("");

  // ── RAG: conocimiento + ajustes + re-indexado ──
  interface KbChunk {
    id: string;
    title: string;
    text: string;
    /** Clave estable solo para React (nunca se guarda): evita que editar
        cualquier campo —incluido el ID— desmonte la tarjeta y robe el foco. */
    _key: string;
  }
  const [kbItems, setKbItems] = useState<KbChunk[]>([]);
  const [kbSha, setKbSha] = useState("");
  const [cfgSha, setCfgSha] = useState("");
  const [ragLoaded, setRagLoaded] = useState(false);
  const [ragLoading, setRagLoading] = useState(false);
  const [ragMsg, setRagMsg] = useState("");
  const [savingKb, setSavingKb] = useState(false);
  const [savingCfg, setSavingCfg] = useState(false);

  // El mensaje de resultado vive arriba del tab: llevarlo a la vista
  // para que nunca parezca que "no pasa nada" al guardar abajo.
  useEffect(() => {
    if (!ragMsg) return;
    const t = setTimeout(() => {
      document.getElementById("rag-msg")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    return () => clearTimeout(t);
  }, [ragMsg]);
  const [ragCfg, setRagCfg] = useState({
    chatModel: "@cf/meta/llama-3.1-8b-instruct",
    temperature: 0.3,
    maxTokens: 420,
    topK: 5,
    minScore: 0.15,
    systemPrompt: "",
  });
  const [ragWorker, setRagWorker] = useState(
    () => localStorage.getItem("mike-rag-worker") ?? "https://mike-portfolio.xlerionultimate.workers.dev",
  );
  const [ragKey, setRagKey] = useState(() => localStorage.getItem("mike-rag-key") ?? "");
  const [ingestState, setIngestState] = useState<"idle" | "working" | "ok" | "error">("idle");
  const [ingestMsg, setIngestMsg] = useState("");

  const ragGh = async (path: string, init?: RequestInit) => {
    const res = await fetch(`https://api.github.com${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${pubCfg.token.trim()}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    return res;
  };

  const loadRag = async () => {
    if (!pubCfg.token.trim()) {
      setRagMsg("Pega tu token de GitHub primero (pestaña Publicar).");
      return;
    }
    setRagLoading(true);
    setRagMsg("");
    try {
      const repo = pubCfg.repo.trim().replace(/\/$/, "");
      const branch = pubCfg.branch.trim() || "main";
      const [kbRes, cfgRes] = await Promise.all([
        ragGh(`/repos/${repo}/contents/worker/knowledge.json?ref=${encodeURIComponent(branch)}`),
        ragGh(`/repos/${repo}/contents/worker/rag-config.json?ref=${encodeURIComponent(branch)}`),
      ]);
      if (!kbRes.ok || !cfgRes.ok) throw new Error("not-found");
      const kbFile = (await kbRes.json()) as { sha?: string; content?: string; encoding?: string };
      const cfgFile = (await cfgRes.json()) as { sha?: string; content?: string; encoding?: string };
      const kbText = decodeURIComponent(escape(atob((kbFile.content ?? "").replace(/\s/g, ""))));
      const cfgText = decodeURIComponent(escape(atob((cfgFile.content ?? "").replace(/\s/g, ""))));
      const kb = JSON.parse(kbText) as KbChunk[];
      const cfg = JSON.parse(cfgText) as Record<string, unknown>;
      if (!Array.isArray(kb)) throw new Error("bad-kb");
      setKbItems(kb.map((k) => ({ ...k, _key: crypto.randomUUID() })));
      setKbSha(kbFile.sha ?? "");
      setRagCfg({
        chatModel: String(cfg.chatModel ?? "@cf/meta/llama-3.1-8b-instruct"),
        temperature: Number(cfg.temperature ?? 0.3),
        maxTokens: Number(cfg.maxTokens ?? 420),
        topK: Number(cfg.topK ?? 5),
        minScore: Number(cfg.minScore ?? 0.15),
        systemPrompt: String(cfg.systemPrompt ?? ""),
      });
      setCfgSha(cfgFile.sha ?? "");
      setRagLoaded(true);
      flashSaved();
    } catch {
      setRagMsg("No pude leer worker/knowledge.json o rag-config.json del repo. ¿Hiciste push del código RAG?");
    } finally {
      setRagLoading(false);
    }
  };

  const putRagFile = async (path: string, sha: string, text: string) => {
    const repo = pubCfg.repo.trim().replace(/\/$/, "");
    const branch = pubCfg.branch.trim() || "main";
    const bytes = new TextEncoder().encode(text);
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    try {
      const res = await ragGh(`/repos/${repo}/contents/${path}`, {
        method: "PUT",
        body: JSON.stringify({ message: `Actualizar ${path} desde el panel`, content: btoa(bin), sha, branch }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`http-${res.status}`);
      const done = (await res.json()) as { content?: { sha?: string } };
      return done.content?.sha ?? "";
    } finally {
      clearTimeout(timer);
    }
  };

  const saveKb = async () => {
    setRagMsg("");
    setSavingKb(true);
    try {
      const clean = kbItems
        .map((k) => ({ id: k.id.trim(), title: k.title.trim(), text: k.text.trim(), _key: k._key || crypto.randomUUID() }))
        .filter((k) => k.id && k.text);
      if (clean.some((k, i) => clean.findIndex((x) => x.id === k.id) !== i)) {
        setRagMsg("Hay IDs duplicados: cada chunk necesita un id único.");
        return;
      }
      const sha = await putRagFile(
        "worker/knowledge.json",
        kbSha,
        JSON.stringify(
          clean.map(({ _key, ...rest }) => rest),
          null,
          2,
        ) + "\n",
      );
      setKbSha(sha);
      setKbItems(clean);
      flashSaved();
      setRagMsg("✓ Conocimiento guardado en GitHub. Ahora pulsa Re-indexar para activarlo.");
    } catch {
      setRagMsg("Error guardando (¿sin conexión o token sin permiso?). Reintenta.");
    } finally {
      setSavingKb(false);
    }
  };

  const saveCfg = async () => {
    setRagMsg("");
    setSavingCfg(true);
    try {
      const current = await ragGh(
        `/repos/${pubCfg.repo.trim().replace(/\/$/, "")}/contents/worker/rag-config.json?ref=${encodeURIComponent(pubCfg.branch.trim() || "main")}`,
      );
      const cur = (await current.json()) as { sha?: string; content?: string };
      const base = JSON.parse(decodeURIComponent(escape(atob((cur.content ?? "").replace(/\s/g, ""))))) as Record<string, unknown>;
      const next = { ...base, ...ragCfg };
      const sha = await putRagFile("worker/rag-config.json", cfgSha || cur.sha || "", JSON.stringify(next, null, 2) + "\n");
      setCfgSha(sha);
      flashSaved();
      setRagMsg("✓ Ajustes guardados. Cloudflare redespliega en ~2 min y aplican solos.");
    } catch {
      setRagMsg("Error guardando ajustes. Recarga con Cargar e intenta de nuevo.");
    } finally {
      setSavingCfg(false);
    }
  };

  const doReingest = async () => {
    if (!ragKey.trim()) {
      setIngestMsg("Pega tu RAG_ADMIN_KEY primero (la misma del secret del Worker).");
      setIngestState("error");
      return;
    }
    setIngestState("working");
    setIngestMsg("");
    try {
      const base = ragWorker.trim().replace(/\/$/, "");
      const res = await fetch(`${base}/api/rag/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: ragKey.trim(), chunks: kbItems }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; inserted?: number; error?: string } | null;
      if (res.ok && data?.ok) {
        setIngestState("ok");
        setIngestMsg(`✓ Índice actualizado: ${data.inserted ?? "?"} chunks. El widget ya responde con lo nuevo.`);
        try {
          localStorage.setItem("mike-rag-worker", base);
          localStorage.setItem("mike-rag-key", ragKey.trim());
        } catch {
          /* noop */
        }
      } else if (data?.error === "forbidden") {
        setIngestState("error");
        setIngestMsg("Clave incorrecta (403). Revisa RAG_ADMIN_KEY.");
      } else if (data?.error === "rag-admin-disabled") {
        setIngestState("error");
        setIngestMsg("El Worker no tiene RAG_ADMIN_KEY configurada. Añádela en Settings → Variables and Secrets y redespliega.");
      } else {
        setIngestState("error");
        setIngestMsg(`Falló (${res.status}). Reintenta en un minuto.`);
      }
    } catch {
      setIngestState("error");
      setIngestMsg("Sin conexión con el Worker. Revisa la URL.");
    }
  };
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl((c) => (c === url ? null : c)), 1600);
  };

  const mediaErr = (e: unknown) => mediaErrorMessage(e instanceof Error ? e.message : "network");

  const refreshMedia = async () => {
    setMediaLoading(true);
    setMediaMsg("");
    try {
      setMediaItems(await listUploads(pubCfg));
    } catch (e) {
      setMediaMsg(mediaErr(e));
    } finally {
      setMediaLoading(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setMediaMsg("");
    for (const f of Array.from(files)) {
      setUploadStates((p) => ({ ...p, [f.name]: "subiendo…" }));
      try {
        const item = await uploadImageFile(pubCfg, f);
        setUploadStates((p) => ({ ...p, [f.name]: "✓ en GitHub" }));
        setMediaItems((prev) => [item, ...prev.filter((m) => m.path !== item.path)]);
      } catch (e) {
        setUploadStates((p) => ({ ...p, [f.name]: "error" }));
        setMediaMsg(mediaErr(e));
      }
    }
    flashSaved();
  };

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImportState("working");
    setMediaMsg("");
    setImported(null);
    try {
      const item = await importImageFromUrl(pubCfg, importUrl);
      setImported(item);
      setImportState("ok");
      setMediaItems((prev) => [item, ...prev.filter((m) => m.path !== item.path)]);
      setImportUrl("");
      flashSaved();
    } catch (e) {
      setImportState("error");
      setMediaMsg(mediaErr(e));
    }
  };

  const handleDeleteMedia = async (path: string) => {
    if (!confirm(`¿Borrar ${path} de GitHub?`)) return;
    try {
      await deleteMedia(pubCfg, path);
      setMediaItems((prev) => prev.filter((m) => m.path !== path));
      flashSaved();
    } catch (e) {
      setMediaMsg(mediaErr(e));
    }
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const patch = (p: Partial<SiteContent>) => {
    update(p);
    flashSaved();
  };

  const project = useMemo(
    () => content.projects.find((p) => p.id === selectedProject) ?? null,
    [content.projects, selectedProject],
  );

  const patchProject = (id: string, fn: (p: Project) => Project) => {
    update({ projects: content.projects.map((p) => (p.id === id ? fn(p) : p)) });
    flashSaved();
  };

  const currentModel = useMemo(
    () => content.showcase3d.models.find((m) => m.id === selectedModel) ?? null,
    [content.showcase3d.models, selectedModel],
  );

  const patchModel = (id: string, fn: (m: Model3D) => Model3D) => {
    update({ showcase3d: { ...content.showcase3d, models: content.showcase3d.models.map((m) => (m.id === id ? fn(m) : m)) } });
    flashSaved();
  };

  const currentSite = useMemo(
    () => content.webworks.items.find((w) => w.id === selectedSite) ?? null,
    [content.webworks.items, selectedSite],
  );

  const patchSite = (id: string, fn: (w: WebWork) => WebWork) => {
    update({ webworks: { ...content.webworks, items: content.webworks.items.map((w) => (w.id === id ? fn(w) : w)) } });
    flashSaved();
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-ink px-5 py-20">
        <div className="mx-auto max-w-md border border-white/12 bg-panel p-8">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-acid"><Lock className="h-4 w-4" /> Panel de control</p>
          <h1 className="mt-3 font-display text-3xl font-bold text-white">Acceso privado</h1>
          <p className="mt-2 text-sm text-zinc-400">Introduce tu contraseña de administrador para editar todo el contenido del sitio. Por defecto es <code className="bg-white/10 px-1.5 py-0.5 font-mono text-acid">mike123</code> (cámbiala en la pestaña Datos).</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pass === content.adminPassword) {
                sessionStorage.setItem("mike-admin", "1");
                setAuthed(true);
              } else setPassError("Contraseña incorrecta.");
            }}
            className="mt-6 space-y-3"
          >
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Contraseña" className={inputCls} autoFocus />
            {passError && <p className="text-sm text-red-300">{passError}</p>}
            <button className={cn(btnPrimary, "w-full justify-center")}><KeyRound className="h-4 w-4" /> Entrar al panel</button>
            <a href="#inicio" className={cn(btnGhost, "w-full justify-center")}><ArrowLeft className="h-4 w-4" /> Volver al sitio</a>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      {/* Barra superior */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-3 lg:px-8">
          <span className="flex items-center gap-2 font-display text-base font-bold text-white"><Settings2 className="h-5 w-5 text-acid" /> Panel de control</span>
          {saved && <span className="inline-flex items-center gap-1.5 border border-acid/50 bg-acid/10 px-2.5 py-1 font-mono text-xs text-acid"><Check className="h-3.5 w-3.5" /> Guardado ✓</span>}
          <span className="hidden font-mono text-xs text-zinc-600 sm:inline">Los cambios se guardan solos en este navegador</span>
          <div className="ml-auto flex gap-2">
            <a href="#inicio" className={btnGhost}><Eye className="h-4 w-4" /> Ver sitio</a>
            <button onClick={() => { sessionStorage.removeItem("mike-admin"); setAuthed(false); }} className={btnGhost}><Lock className="h-4 w-4" /> Salir</button>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 pb-3 lg:px-8">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex shrink-0 items-center gap-2 border px-3.5 py-2 font-mono text-xs uppercase tracking-wider transition", tab === t.id ? "border-acid bg-acid/10 text-acid" : "border-white/10 text-zinc-400 hover:text-white")}>
              {t.icon} {t.label}
              {t.id === "projects" && <span className="rounded-full bg-white/10 px-1.5 text-[10px]">{content.projects.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        {/* ── GENERAL ── */}
        {tab === "general" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4 border border-white/10 bg-panel p-6">
              <h2 className="font-display text-xl font-bold text-white">Identidad</h2>
              <Field label="Nombre grande (Hero)">
                <input value={content.profile.name} onChange={(e) => patch({ profile: { ...content.profile, name: e.target.value } })} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nombre corto"><input value={content.profile.shortName} onChange={(e) => patch({ profile: { ...content.profile, shortName: e.target.value } })} className={inputCls} /></Field>
                <Field label="Iniciales"><input value={content.profile.initials} onChange={(e) => patch({ profile: { ...content.profile, initials: e.target.value } })} className={inputCls} /></Field>
              </div>
              <Field label="Rol / titular"><input value={content.profile.role} onChange={(e) => patch({ profile: { ...content.profile, role: e.target.value } })} className={inputCls} /></Field>
              <Field label="Frase de presentación"><textarea value={content.profile.tagline} onChange={(e) => patch({ profile: { ...content.profile, tagline: e.target.value } })} rows={2} className={inputCls} /></Field>
              <Field label="Foto de retrato (URL)" hint="Pega la URL de tu foto o súbela desde tu PC. Recomendado: 800×1000px. Se verá tras el deploy.">
                <input value={content.profile.portrait} onChange={(e) => patch({ profile: { ...content.profile, portrait: e.target.value } })} className={inputCls} placeholder="https://…" />
              </Field>
              <ImageUploadButton onDone={(item) => patch({ profile: { ...content.profile, portrait: item.siteUrl } })} />
              {content.profile.portrait && <SmartPreview src={content.profile.portrait} className="h-40 w-32 border border-white/15 object-cover" />}
            </div>
            <div className="space-y-4 border border-white/10 bg-panel p-6">
              <h2 className="font-display text-xl font-bold text-white">Contacto y disponibilidad</h2>
              <Field label="Email"><input value={content.profile.email} onChange={(e) => patch({ profile: { ...content.profile, email: e.target.value } })} className={inputCls} /></Field>
              <Field label="Teléfono"><input value={content.profile.phone} onChange={(e) => patch({ profile: { ...content.profile, phone: e.target.value } })} className={inputCls} /></Field>
              <Field label="Ubicación"><input value={content.profile.location} onChange={(e) => patch({ profile: { ...content.profile, location: e.target.value } })} className={inputCls} /></Field>
              <Field label="Estado de disponibilidad"><input value={content.profile.availability} onChange={(e) => patch({ profile: { ...content.profile, availability: e.target.value } })} className={inputCls} /></Field>
              <Field label="Detalle de agenda"><input value={content.profile.availabilityDetail} onChange={(e) => patch({ profile: { ...content.profile, availabilityDetail: e.target.value } })} className={inputCls} /></Field>
              <Field label="Texto del CV descargable" hint="Es lo que se descarga al pulsar “Descargar CV”.">
                <textarea value={content.profile.cvText} onChange={(e) => patch({ profile: { ...content.profile, cvText: e.target.value } })} rows={8} className={cn(inputCls, "font-mono text-xs")} />
              </Field>
            </div>
          </div>
        )}

        {/* ── HERO ── */}
        {tab === "hero" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4 border border-white/10 bg-panel p-6">
              <h2 className="font-display text-xl font-bold text-white">Cabecera</h2>
              <Field label="Etiqueta superior"><input value={content.hero.badge} onChange={(e) => patch({ hero: { ...content.hero, badge: e.target.value } })} className={inputCls} /></Field>
              <Field label="Descripción"><textarea value={content.hero.description} onChange={(e) => patch({ hero: { ...content.hero, description: e.target.value } })} rows={3} className={inputCls} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Botón principal"><input value={content.hero.ctaPrimary} onChange={(e) => patch({ hero: { ...content.hero, ctaPrimary: e.target.value } })} className={inputCls} /></Field>
                <Field label="Botón secundario"><input value={content.hero.ctaSecondary} onChange={(e) => patch({ hero: { ...content.hero, ctaSecondary: e.target.value } })} className={inputCls} /></Field>
              </div>
              <Field label="Botón de contacto (email)" hint="Aparece en el Hero con el logo de correo y enlaza a tu email.">
                <input value={content.hero.ctaContact} onChange={(e) => patch({ hero: { ...content.hero, ctaContact: e.target.value } })} className={inputCls} />
              </Field>
              <Field label="Cinta infinita (una por línea)">
                <textarea value={content.marquee.join("\n")} onChange={(e) => patch({ marquee: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} rows={6} className={inputCls} />
              </Field>
            </div>
            <div className="space-y-4 border border-white/10 bg-panel p-6">
              <h2 className="font-display text-xl font-bold text-white">Roles del typewriter + estadísticas</h2>
              {content.hero.roles.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <input value={r.text} onChange={(e) => { const roles = [...content.hero.roles]; roles[i] = { ...roles[i], text: e.target.value }; patch({ hero: { ...content.hero, roles } }); }} className={inputCls} />
                  <input type="color" value={r.color} onChange={(e) => { const roles = [...content.hero.roles]; roles[i] = { ...roles[i], color: e.target.value }; patch({ hero: { ...content.hero, roles } }); }} className="h-10 w-12 shrink-0 cursor-pointer border border-white/15 bg-transparent" title="Color del rol" />
                  <button onClick={() => patch({ hero: { ...content.hero, roles: content.hero.roles.filter((_, j) => j !== i) } })} className="grid h-10 w-10 shrink-0 place-items-center border border-white/15 text-zinc-400 hover:border-red-400 hover:text-red-300" aria-label="Eliminar rol"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button onClick={() => patch({ hero: { ...content.hero, roles: [...content.hero.roles, { text: "Nuevo rol", color: "#a3e635" }] } })} className={btnGhost}><Plus className="h-4 w-4" /> Añadir rol</button>
              <div className="border-t border-white/10 pt-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">Estadísticas (valor · sufijo · etiqueta)</p>
                {content.hero.stats.map((s, i) => (
                  <div key={i} className="mt-2 flex gap-2">
                    <input type="number" value={s.value} onChange={(e) => { const stats = [...content.hero.stats]; stats[i] = { ...stats[i], value: Number(e.target.value) }; patch({ hero: { ...content.hero, stats } }); }} className={cn(inputCls, "w-20")} />
                    <input value={s.suffix} onChange={(e) => { const stats = [...content.hero.stats]; stats[i] = { ...stats[i], suffix: e.target.value }; patch({ hero: { ...content.hero, stats } }); }} className={cn(inputCls, "w-16")} placeholder="+" />
                    <input value={s.label} onChange={(e) => { const stats = [...content.hero.stats]; stats[i] = { ...stats[i], label: e.target.value }; patch({ hero: { ...content.hero, stats } }); }} className={inputCls} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ABOUT ── */}
        {tab === "about" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4 border border-white/10 bg-panel p-6">
              <h2 className="font-display text-xl font-bold text-white">Historia</h2>
              <Field label="Titular"><input value={content.about.title} onChange={(e) => patch({ about: { ...content.about, title: e.target.value } })} className={inputCls} /></Field>
              <Field label="Párrafos (uno por bloque)">
                <textarea value={content.about.paragraphs.join("\n\n")} onChange={(e) => patch({ about: { ...content.about, paragraphs: e.target.value.split(/\n\n+/).map((s) => s.trim()).filter(Boolean) } })} rows={6} className={inputCls} />
              </Field>
              <Field label="Cita destacada"><input value={content.about.quote} onChange={(e) => patch({ about: { ...content.about, quote: e.target.value } })} className={inputCls} /></Field>
              <Field label="Idiomas / etiquetas (una por línea)">
                <textarea value={content.about.languages.join("\n")} onChange={(e) => patch({ about: { ...content.about, languages: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) } })} rows={3} className={inputCls} />
              </Field>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">Disciplinas</p>
                {content.about.disciplines.map((d, i) => (
                  <div key={i} className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                    <input value={d.title} onChange={(e) => { const arr = [...content.about.disciplines]; arr[i] = { ...arr[i], title: e.target.value }; patch({ about: { ...content.about, disciplines: arr } }); }} className={inputCls} placeholder="Título" />
                    <input type="color" value={d.color} onChange={(e) => { const arr = [...content.about.disciplines]; arr[i] = { ...arr[i], color: e.target.value }; patch({ about: { ...content.about, disciplines: arr } }); }} className="h-10 w-12 cursor-pointer border border-white/15 bg-transparent" />
                    <input value={d.desc} onChange={(e) => { const arr = [...content.about.disciplines]; arr[i] = { ...arr[i], desc: e.target.value }; patch({ about: { ...content.about, disciplines: arr } }); }} className={cn(inputCls, "col-span-2")} placeholder="Descripción" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4 border border-white/10 bg-panel p-6">
              <h2 className="font-display text-xl font-bold text-white">Habilidades (barras)</h2>
              {content.skills.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={s.name} onChange={(e) => update({ skills: content.skills.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} className={inputCls} />
                  <select value={s.level} onChange={(e) => update({ skills: content.skills.map((x, j) => (j === i ? { ...x, level: e.target.value as "Experto" | "Avanzado" | "Intermedio" } : x)) })} className={cn(inputCls, "w-32")}>
                    <option value="Experto">Experto</option>
                    <option value="Avanzado">Avanzado</option>
                    <option value="Intermedio">Intermedio</option>
                  </select>
                  <input type="color" value={s.color} onChange={(e) => update({ skills: content.skills.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)) })} className="h-10 w-10 shrink-0 cursor-pointer border border-white/15 bg-transparent" />
                  <button onClick={() => { update({ skills: content.skills.filter((_, j) => j !== i) }); flashSaved(); }} className="grid h-10 w-10 shrink-0 place-items-center border border-white/15 text-zinc-400 hover:border-red-400 hover:text-red-300" aria-label="Eliminar habilidad"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button onClick={() => { update({ skills: [...content.skills, { name: "Nueva habilidad", level: "Avanzado", color: "#a3e635" }] }); flashSaved(); }} className={btnGhost}><Plus className="h-4 w-4" /> Añadir habilidad</button>
              <div className="mt-5 border border-white/10 bg-black/30 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">Bonus · Por qué trabajar conmigo</p>
                <p className="mt-1 text-xs text-zinc-600">Aparece justo antes del contacto, como valor agregado del perfil Senior.</p>
                <div className="mt-3 space-y-3">
                  <Field label="Título de la sección"><input value={content.whyMe.title} onChange={(e) => patch({ whyMe: { ...content.whyMe, title: e.target.value } })} className={inputCls} /></Field>
                  <Field label="Texto de la sección"><textarea value={content.whyMe.text} onChange={(e) => patch({ whyMe: { ...content.whyMe, text: e.target.value } })} rows={2} className={inputCls} /></Field>
                  {content.whyMe.cards.map((c, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto] gap-2 border-t border-white/5 pt-2">
                      <input value={c.title} onChange={(e) => { const cards = [...content.whyMe.cards]; cards[i] = { ...cards[i], title: e.target.value }; patch({ whyMe: { ...content.whyMe, cards } }); }} className={inputCls} placeholder="Título de la tarjeta" />
                      <input type="color" value={c.color} onChange={(e) => { const cards = [...content.whyMe.cards]; cards[i] = { ...cards[i], color: e.target.value }; patch({ whyMe: { ...content.whyMe, cards } }); }} className="h-10 w-12 cursor-pointer border border-white/15 bg-transparent" title="Color del acento" />
                      <textarea value={c.desc} onChange={(e) => { const cards = [...content.whyMe.cards]; cards[i] = { ...cards[i], desc: e.target.value }; patch({ whyMe: { ...content.whyMe, cards } }); }} rows={2} className={cn(inputCls, "col-span-2")} placeholder="Descripción de la tarjeta" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PROJECTS ── */}
        {tab === "projects" && (
          <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
            <div className="h-fit border border-white/10 bg-panel p-4">
              <button onClick={() => { const n = newProject(); update({ projects: [n, ...content.projects] }); setSelectedProject(n.id); flashSaved(); }} className={cn(btnPrimary, "w-full justify-center")}><Plus className="h-4 w-4" /> Nuevo proyecto</button>
              <div className="mt-3 max-h-[60vh] space-y-1 overflow-y-auto">
                {content.projects.map((p) => (
                  <button key={p.id} onClick={() => setSelectedProject(p.id)} className={cn("block w-full border px-3 py-2.5 text-left transition", selectedProject === p.id ? "border-acid bg-acid/10" : "border-white/10 hover:border-white/30")}>
                    <span className="block truncate font-display text-sm font-bold text-white">{p.title}</span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{p.category} · {p.year}</span>
                  </button>
                ))}
              </div>
            </div>
            {project ? (
              <div className="space-y-4 border border-white/10 bg-panel p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-bold text-white">Editando: {project.title}</h2>
                  <div className="ml-auto flex gap-2">
                    <button onClick={() => { const copy = { ...project, id: `proyecto-${Date.now().toString(36)}`, title: `${project.title} (copia)` }; update({ projects: [copy, ...content.projects] }); setSelectedProject(copy.id); flashSaved(); }} className={btnGhost}><Copy className="h-4 w-4" /> Duplicar</button>
                    <button onClick={() => { if (!confirm(`¿Eliminar “${project.title}”?`)) return; const rest = content.projects.filter((p) => p.id !== project.id); update({ projects: rest }); setSelectedProject(rest[0]?.id ?? ""); flashSaved(); }} className="inline-flex items-center gap-2 border border-red-400/50 px-4 py-2.5 font-display text-sm font-bold text-red-300 hover:bg-red-400/10"><Trash2 className="h-4 w-4" /> Eliminar</button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Título"><input value={project.title} onChange={(e) => patchProject(project.id, (p) => ({ ...p, title: e.target.value }))} className={inputCls} /></Field>
                  <Field label="Año"><input value={project.year} onChange={(e) => patchProject(project.id, (p) => ({ ...p, year: e.target.value }))} className={inputCls} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Categoría">
                    <select value={project.category} onChange={(e) => patchProject(project.id, (p) => ({ ...p, category: e.target.value as CategoryId }))} className={cn(inputCls, "bg-coal")}>
                      <option value="codigo">Código</option>
                      <option value="diseno3d">Diseño 3D</option>
                      <option value="grafico">Diseño Gráfico</option>
                      <option value="personajes">Personajes</option>
                    </select>
                  </Field>
                  <Field label="Etiquetas (separadas por comas)">
                    <input value={project.tags.join(", ")} onChange={(e) => patchProject(project.id, (p) => ({ ...p, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} className={inputCls} />
                  </Field>
                </div>
                <Field label="Tagline (una línea)"><input value={project.tagline} onChange={(e) => patchProject(project.id, (p) => ({ ...p, tagline: e.target.value }))} className={inputCls} /></Field>
                <Field label="Descripción corta"><textarea value={project.description} onChange={(e) => patchProject(project.id, (p) => ({ ...p, description: e.target.value }))} rows={2} className={inputCls} /></Field>
                <div className="border border-white/10 bg-black/30 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-acid">Narrativa de negocio (Reto → Impacto → Solución)</p>
                  <p className="mt-1 text-xs text-zinc-600">Si rellenas estos tres campos, la ficha muestra el bloque de negocio encima de la descripción técnica.</p>
                  <div className="mt-3 space-y-3">
                    <Field label="El reto (dolor del cliente)">
                      <textarea value={project.challenge ?? ""} onChange={(e) => patchProject(project.id, (p) => ({ ...p, challenge: e.target.value }))} rows={2} className={inputCls} />
                    </Field>
                    <Field label="El impacto (métrica de negocio)">
                      <textarea value={project.impact ?? ""} onChange={(e) => patchProject(project.id, (p) => ({ ...p, impact: e.target.value }))} rows={2} className={inputCls} />
                    </Field>
                    <Field label="La solución técnica (stack)">
                      <textarea value={project.solution ?? ""} onChange={(e) => patchProject(project.id, (p) => ({ ...p, solution: e.target.value }))} rows={2} className={inputCls} />
                    </Field>
                  </div>
                </div>
                <Field label="Descripción larga"><textarea value={project.longDescription} onChange={(e) => patchProject(project.id, (p) => ({ ...p, longDescription: e.target.value }))} rows={4} className={inputCls} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Imagen (URL)" hint="Vacío = tarjeta de código. Con URL = tarjeta con foto. O súbela desde tu PC:"><input value={project.image ?? ""} onChange={(e) => patchProject(project.id, (p) => ({ ...p, image: e.target.value }))} className={inputCls} placeholder="https://…" /></Field>
                  <ImageUploadButton onDone={(item) => patchProject(project.id, (p) => ({ ...p, image: item.siteUrl }))} />
                  <div className="grid gap-4">
                    <Field label="URL GitHub"><input value={project.repoUrl ?? ""} onChange={(e) => patchProject(project.id, (p) => ({ ...p, repoUrl: e.target.value }))} className={inputCls} placeholder="https://github.com/…" /></Field>
                    <Field label="URL demo"><input value={project.demoUrl ?? ""} onChange={(e) => patchProject(project.id, (p) => ({ ...p, demoUrl: e.target.value }))} className={inputCls} placeholder="https://…" /></Field>
                    <Field label="Video (URL .mp4, opcional)" hint="Si hay video, la ficha muestra reproductor en vez de foto."><input value={project.videoUrl ?? ""} onChange={(e) => patchProject(project.id, (p) => ({ ...p, videoUrl: e.target.value }))} className={inputCls} placeholder="https://…" /></Field>
                  </div>
                </div>
                {(project.image ?? "").length > 0 && <SmartPreview src={project.image ?? ""} />}
                <label className="flex items-center gap-3 border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200">
                  <input type="checkbox" checked={!!project.featured} onChange={(e) => patchProject(project.id, (p) => ({ ...p, featured: e.target.checked }))} className="h-4 w-4 accent-[#a3e635]" />
                  Proyecto destacado
                </label>
                <Field label="Specs (una por línea: Etiqueta | Valor)" hint="Ej: Cliente | VOLT Live">
                  <textarea
                    value={(project.specs ?? []).map((s) => `${s.label} | ${s.value}`).join("\n")}
                    onChange={(e) => patchProject(project.id, (p) => ({ ...p, specs: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const [label, ...rest] = l.split("|"); return { label: label.trim(), value: rest.join("|").trim() }; }) }))}
                    rows={3}
                    className={cn(inputCls, "font-mono text-xs")}
                  />
                </Field>
                <details className="border border-white/10 bg-black/30 p-4">
                  <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-zinc-400">Snippet de código (solo categoría Código)</summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <Field label="Nombre repo"><input value={project.repo?.name ?? ""} onChange={(e) => patchProject(project.id, (p) => ({ ...p, repo: { ...(p.repo ?? { language: "TypeScript", langColor: "#3178c6", stars: 0, forks: 0, updated: "hoy", snippetLang: "typescript", snippet: "" }), name: e.target.value } }))} className={inputCls} /></Field>
                    <Field label="Lenguaje"><input value={project.repo?.language ?? ""} onChange={(e) => patchProject(project.id, (p) => ({ ...p, repo: { ...(p.repo ?? { name: "", langColor: "#3178c6", stars: 0, forks: 0, updated: "hoy", snippetLang: "", snippet: "" }), language: e.target.value } }))} className={inputCls} /></Field>
                    <Field label="Tipo snippet"><input value={project.repo?.snippetLang ?? ""} onChange={(e) => patchProject(project.id, (p) => ({ ...p, repo: { ...(p.repo ?? { name: "", language: "", langColor: "#3178c6", stars: 0, forks: 0, updated: "hoy", snippet: "" }), snippetLang: e.target.value } }))} className={inputCls} /></Field>
                  </div>
                  <Field label="Código">
                    <textarea value={project.repo?.snippet ?? ""} onChange={(e) => patchProject(project.id, (p) => ({ ...p, repo: { ...(p.repo ?? { name: "", language: "TypeScript", langColor: "#3178c6", stars: 0, forks: 0, updated: "hoy", snippetLang: "typescript" }), snippet: e.target.value } }))} rows={8} className={cn(inputCls, "font-mono text-xs")} spellCheck={false} />
                  </Field>
                </details>
              </div>
            ) : (
              <p className="border border-dashed border-white/15 p-10 text-center text-zinc-500">No hay proyectos. Crea el primero con el botón.</p>
            )}
          </div>
        )}

        {/* ── SITIOS WEB ── */}
        {tab === "sitios" && (
          <div className="space-y-5">
            <div className="grid gap-4 border border-white/10 bg-panel p-6 lg:grid-cols-2">
              <Field label="Título de la sección"><input value={content.webworks.title} onChange={(e) => patch({ webworks: { ...content.webworks, title: e.target.value } })} className={inputCls} /></Field>
              <Field label="Texto de la sección"><textarea value={content.webworks.text} onChange={(e) => patch({ webworks: { ...content.webworks, text: e.target.value } })} rows={3} className={inputCls} /></Field>
            </div>
            <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
              <div className="h-fit border border-white/10 bg-panel p-4">
                <button
                  onClick={() => {
                    const n: WebWork = { id: `sitio-${Date.now().toString(36)}`, title: "Nuevo sitio", desc: "Describe el proyecto.", url: "https://", tags: ["Web"], year: String(new Date().getFullYear()), image: "" };
                    update({ webworks: { ...content.webworks, items: [...content.webworks.items, n] } });
                    setSelectedSite(n.id);
                    flashSaved();
                  }}
                  className={cn(btnPrimary, "w-full justify-center")}
                >
                  <Plus className="h-4 w-4" /> Nuevo sitio
                </button>
                <div className="mt-3 max-h-[50vh] space-y-1 overflow-y-auto">
                  {content.webworks.items.map((w) => (
                    <button key={w.id} onClick={() => setSelectedSite(w.id)} className={cn("block w-full border px-3 py-2.5 text-left transition", selectedSite === w.id ? "border-acid bg-acid/10" : "border-white/10 hover:border-white/30")}>
                      <span className="block truncate font-display text-sm font-bold text-white">{w.title}</span>
                      <span className="block truncate font-mono text-[10px] tracking-wider text-zinc-500">{w.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                    </button>
                  ))}
                </div>
              </div>
              {currentSite ? (
                <div className="space-y-4 border border-white/10 bg-panel p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-bold text-white">Editando: {currentSite.title}</h2>
                    <div className="ml-auto flex gap-2">
                      <a href={currentSite.url} target="_blank" rel="noreferrer" className={btnGhost}><Eye className="h-4 w-4" /> Abrir</a>
                      <button
                        onClick={() => { if (!confirm(`¿Eliminar “${currentSite.title}”?`)) return; const rest = content.webworks.items.filter((w) => w.id !== currentSite.id); update({ webworks: { ...content.webworks, items: rest } }); setSelectedSite(rest[0]?.id ?? ""); flashSaved(); }}
                        className="inline-flex items-center gap-2 border border-red-400/50 px-4 py-2.5 font-display text-sm font-bold text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4" /> Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Título"><input value={currentSite.title} onChange={(e) => patchSite(currentSite.id, (w) => ({ ...w, title: e.target.value }))} className={inputCls} /></Field>
                    <Field label="Año"><input value={currentSite.year} onChange={(e) => patchSite(currentSite.id, (w) => ({ ...w, year: e.target.value }))} className={inputCls} /></Field>
                  </div>
                  <Field label="URL del sitio" hint="Debe empezar por https:// — el punto verde la verifica en vivo."><input value={currentSite.url} onChange={(e) => patchSite(currentSite.id, (w) => ({ ...w, url: e.target.value }))} className={cn(inputCls, "font-mono text-xs")} placeholder="https://…" /></Field>
                  <Field label="Descripción"><textarea value={currentSite.desc} onChange={(e) => patchSite(currentSite.id, (w) => ({ ...w, desc: e.target.value }))} rows={3} className={inputCls} /></Field>
                  <Field label="Resultado de negocio (una línea)" hint="Se muestra destacado con el icono de tendencia. Ej: «Reduce el trabajo manual…».">
                    <textarea value={currentSite.result ?? ""} onChange={(e) => patchSite(currentSite.id, (w) => ({ ...w, result: e.target.value }))} rows={2} className={inputCls} />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Miniatura (URL imagen)" hint="Vacío = tarjeta con icono. Prueba hotlink del propio sitio, o súbela desde tu PC:"><input value={currentSite.image ?? ""} onChange={(e) => patchSite(currentSite.id, (w) => ({ ...w, image: e.target.value }))} className={inputCls} placeholder="https://…" /></Field>
                    <ImageUploadButton onDone={(item) => patchSite(currentSite.id, (w) => ({ ...w, image: item.siteUrl }))} />
                    <Field label="Etiquetas (separadas por comas)"><input value={currentSite.tags.join(", ")} onChange={(e) => patchSite(currentSite.id, (w) => ({ ...w, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} className={inputCls} /></Field>
                  </div>
                  {(currentSite.image ?? "").length > 0 && <SmartPreview src={currentSite.image ?? ""} />}
                </div>
              ) : (
                <p className="border border-dashed border-white/15 p-10 text-center text-zinc-500">No hay sitios. Crea el primero con el botón.</p>
              )}
            </div>
          </div>
        )}

        {/* ── MODELOS 3D ── */}
        {tab === "modelos" && (
          <div className="space-y-5">
            <div className="grid gap-4 border border-white/10 bg-panel p-6 lg:grid-cols-2">
              <Field label="Título de la sección"><input value={content.showcase3d.title} onChange={(e) => patch({ showcase3d: { ...content.showcase3d, title: e.target.value } })} className={inputCls} /></Field>
              <Field label="Texto de la sección"><textarea value={content.showcase3d.text} onChange={(e) => patch({ showcase3d: { ...content.showcase3d, text: e.target.value } })} rows={3} className={inputCls} /></Field>
            </div>
            <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
              <div className="h-fit border border-white/10 bg-panel p-4">
                <button
                  onClick={() => {
                    const n: Model3D = { id: `modelo-${Date.now().toString(36)}`, title: "Nuevo modelo", desc: "Describe tu pieza.", preset: "reactor", poster: "", tags: ["3D"], specs: [] };
                    update({ showcase3d: { ...content.showcase3d, models: [...content.showcase3d.models, n] } });
                    setSelectedModel(n.id);
                    flashSaved();
                  }}
                  className={cn(btnPrimary, "w-full justify-center")}
                >
                  <Plus className="h-4 w-4" /> Nuevo modelo
                </button>
                <div className="mt-3 max-h-[50vh] space-y-1 overflow-y-auto">
                  {content.showcase3d.models.map((m) => (
                    <button key={m.id} onClick={() => setSelectedModel(m.id)} className={cn("block w-full border px-3 py-2.5 text-left transition", selectedModel === m.id ? "border-acid bg-acid/10" : "border-white/10 hover:border-white/30")}>
                      <span className="block truncate font-display text-sm font-bold text-white">{m.title}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{m.preset === "custom" ? ".glb" : m.preset}</span>
                    </button>
                  ))}
                </div>
              </div>
              {currentModel ? (
                <div className="space-y-4 border border-white/10 bg-panel p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-bold text-white">Editando: {currentModel.title}</h2>
                    <button
                      onClick={() => { if (!confirm(`¿Eliminar “${currentModel.title}”?`)) return; const rest = content.showcase3d.models.filter((m) => m.id !== currentModel.id); update({ showcase3d: { ...content.showcase3d, models: rest } }); setSelectedModel(rest[0]?.id ?? ""); flashSaved(); }}
                      className="ml-auto inline-flex items-center gap-2 border border-red-400/50 px-4 py-2.5 font-display text-sm font-bold text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 className="h-4 w-4" /> Eliminar
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Título"><input value={currentModel.title} onChange={(e) => patchModel(currentModel.id, (m) => ({ ...m, title: e.target.value }))} className={inputCls} /></Field>
                    <Field label="Fuente del modelo">
                      <select value={currentModel.preset} onChange={(e) => patchModel(currentModel.id, (m) => ({ ...m, preset: e.target.value as Model3D["preset"] }))} className={cn(inputCls, "bg-coal")}>
                        <option value="reactor">Demo: Núcleo Reactor</option>
                        <option value="cristal">Demo: Cristal de Datos</option>
                        <option value="toroide">Demo: Toroide Industrial</option>
                        <option value="custom">URL de mi .glb</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="Descripción"><textarea value={currentModel.desc} onChange={(e) => patchModel(currentModel.id, (m) => ({ ...m, desc: e.target.value }))} rows={2} className={inputCls} /></Field>
                  {currentModel.preset === "custom" && (
                    <Field label="URL del .glb" hint="Ej: /models/mi-pieza.glb (carpeta public/models/) o URL de tu bucket R2. Máx. recomendado 5 MB.">
                      <input value={currentModel.modelUrl ?? ""} onChange={(e) => patchModel(currentModel.id, (m) => ({ ...m, modelUrl: e.target.value }))} className={inputCls} placeholder="/models/mi-pieza.glb" />
                    </Field>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Póster (URL imagen previa)"><input value={currentModel.poster ?? ""} onChange={(e) => patchModel(currentModel.id, (m) => ({ ...m, poster: e.target.value }))} className={inputCls} placeholder="https://…" /></Field>
                    <ImageUploadButton onDone={(item) => patchModel(currentModel.id, (m) => ({ ...m, poster: item.siteUrl }))} />
                    <Field label="Etiquetas (separadas por comas)"><input value={currentModel.tags.join(", ")} onChange={(e) => patchModel(currentModel.id, (m) => ({ ...m, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} className={inputCls} /></Field>
                  </div>
                  <Field label="Specs (una por línea: Etiqueta | Valor)">
                    <textarea
                      value={(currentModel.specs ?? []).map((s) => `${s.label} | ${s.value}`).join("\n")}
                      onChange={(e) => patchModel(currentModel.id, (m) => ({ ...m, specs: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const [label, ...rest] = l.split("|"); return { label: label.trim(), value: rest.join("|").trim() }; }) }))}
                      rows={3}
                      className={cn(inputCls, "font-mono text-xs")}
                    />
                  </Field>
                </div>
              ) : (
                <p className="border border-dashed border-white/15 p-10 text-center text-zinc-500">No hay modelos. Crea el primero con el botón.</p>
              )}
            </div>
          </div>
        )}

        {/* ── MEDIOS ── */}
        {tab === "medios" && (
          <div className="space-y-5">
            {!pubCfg.token && (
              <p className="border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200">
                Esta sección sube archivos a GitHub: pega tu token en la pestaña{" "}
                <button onClick={() => setTab("publicar")} className="underline hover:text-amber-100">Publicar</button>{" "}
                para activarla.
              </p>
            )}
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-4 border border-white/10 bg-panel p-6">
                <h2 className="font-display text-xl font-bold text-white">Subir desde el PC</h2>
                <p className="text-sm text-zinc-400">
                  Imágenes (jpg, png, webp, gif, svg, avif) de hasta {(MAX_IMAGE_BYTES / 1048576).toFixed(0)} MB.
                  Van a <code className="bg-white/10 px-1 font-mono text-xs text-acid">public/uploads/</code> del repo y Cloudflare las sirve en ~1–2 min.
                </p>
                <label className="block cursor-pointer border border-dashed border-white/20 bg-black/30 px-4 py-6 text-center transition hover:border-acid">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void handleFiles(e.target.files); e.target.value = ""; }} />
                  <span className="font-display text-sm font-bold text-zinc-200">Elegir imágenes…</span>
                  <span className="mt-1 block font-mono text-xs text-zinc-500">puedes seleccionar varias</span>
                </label>
                {Object.keys(uploadStates).length > 0 && (
                  <ul className="space-y-1 font-mono text-xs">
                    {Object.entries(uploadStates).slice(-6).map(([name, st]) => (
                      <li key={name} className="flex gap-2">
                        <span className={st.startsWith("✓") ? "text-acid" : st === "error" ? "text-red-300" : "text-amber-200"}>{st}</span>
                        <span className="truncate text-zinc-400">{name}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {mediaMsg && <p className="border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-200">{mediaMsg}</p>}
              </div>

              <div className="space-y-4 border border-white/10 bg-panel p-6">
                <h2 className="font-display text-xl font-bold text-white">Importar por URL</h2>
                <p className="text-sm text-zinc-400">Pega la URL de una imagen para traerla al repo (misma carpeta). Si el sitio bloquea descargas directas, te avisará.</p>
                <div className="flex gap-2">
                  <input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="https://…" className={cn(inputCls, "font-mono text-xs")} />
                  <button onClick={() => void handleImport()} disabled={importState === "working"} className={btnGhost}>
                    {importState === "working" ? "Trayendo…" : "Importar"}
                  </button>
                </div>
                {imported && (
                  <div className="flex items-center gap-3 border border-acid/40 bg-acid/5 p-3">
                    <img src={imported.rawUrl} alt="" className="h-12 w-16 border border-white/15 object-cover" />
                    <code className="min-w-0 flex-1 truncate font-mono text-xs text-acid">{imported.siteUrl}</code>
                    <button onClick={() => copyUrl(imported.siteUrl)} className={btnGhost}>
                      {copiedUrl === imported.siteUrl ? <Check className="h-4 w-4 text-acid" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-white/10 bg-panel p-6">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-xl font-bold text-white">Galería en GitHub ({mediaItems.length})</h2>
                <button onClick={() => void refreshMedia()} disabled={mediaLoading} className={cn(btnGhost, "ml-auto")}>
                  <RefreshCcw className="h-4 w-4" /> {mediaLoading ? "Cargando…" : mediaItems.length ? "Actualizar" : "Cargar galería"}
                </button>
              </div>
              <p className="mt-1 font-mono text-xs text-zinc-500">Copia la ruta y pégala en Retrato, Proyecto, Modelo o Sitio. Se sirve tras el deploy (~1–2 min).</p>
              {mediaItems.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {mediaItems.map((m) => (
                    <div key={m.path} className="border border-white/10 bg-black/30 p-3">
                      <img src={m.rawUrl} alt={m.name} loading="lazy" className="aspect-[16/10] w-full border border-white/10 object-cover" />
                      <p className="mt-2 truncate font-mono text-[11px] text-zinc-400" title={m.path}>{m.siteUrl}</p>
                      <div className="mt-2 flex gap-2">
                        <button onClick={() => copyUrl(m.siteUrl)} className={cn(btnGhost, "flex-1 justify-center !px-2 !py-1.5 !text-xs")}>
                          {copiedUrl === m.siteUrl ? "¡Copiada!" : "Copiar ruta"}
                        </button>
                        <button onClick={() => void handleDeleteMedia(m.path)} className="grid w-9 place-items-center border border-white/15 text-zinc-400 hover:border-red-400 hover:text-red-300" aria-label={`Borrar ${m.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-white/10 bg-panel p-6">
              <h2 className="font-display text-xl font-bold text-white">Videos (solo URL)</h2>
              <p className="text-sm text-zinc-400">Los videos no se suben al repo (pesan demasiado): pega la URL directa del .mp4 y asígnala a un proyecto. La ficha mostrará reproductor en vez de foto.</p>
              <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_240px_auto]">
                <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…/demo.mp4" className={cn(inputCls, "font-mono text-xs")} />
                <select value={videoProject} onChange={(e) => setVideoProject(e.target.value)} className={cn(inputCls, "bg-coal")}>
                  <option value="">Proyecto…</option>
                  {content.projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (!videoUrl.trim() || !videoProject) return;
                    patchProject(videoProject, (p) => ({ ...p, videoUrl: videoUrl.trim() }));
                    setVideoUrl("");
                  }}
                  disabled={!videoUrl.trim() || !videoProject}
                  className={btnPrimary}
                >
                  Asignar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── RAG ── */}
        {tab === "rag" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 border border-white/10 bg-panel p-6">
              <div>
                <h2 className="font-display text-xl font-bold text-white">Conocimiento del asistente ({kbItems.length})</h2>
                <p className="mt-1 text-sm text-zinc-400">Edita, añade o borra. Luego guarda e <strong className="text-white">re-indexa</strong>: sin re-indexar, el widget sigue con lo viejo.</p>
              </div>
              <button onClick={() => void loadRag()} disabled={ragLoading} className={cn(btnGhost, "ml-auto")}>
                <RefreshCcw className="h-4 w-4" /> {ragLoading ? "Cargando…" : ragLoaded ? "Recargar" : "Cargar desde GitHub"}
              </button>
            </div>
            {ragMsg && <p id="rag-msg" className="border border-acid/40 bg-acid/5 p-4 text-sm text-zinc-200">{ragMsg}</p>}
            {ragLoaded && (
              <>
                <div className="space-y-3">
                  {kbItems.map((k, i) => (
                    <div key={k._key} className="grid gap-3 border border-white/10 bg-panel p-4 lg:grid-cols-[220px_1fr_auto]">
                      <div className="space-y-2">
                        <Field label="ID único">
                          <input value={k.id} onChange={(e) => setKbItems((arr) => arr.map((x, j) => (j === i ? { ...x, id: e.target.value } : x)))} className={cn(inputCls, "font-mono text-xs")} />
                        </Field>
                        <Field label="Título (sale como fuente)">
                          <input value={k.title} onChange={(e) => setKbItems((arr) => arr.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} className={inputCls} />
                        </Field>
                        <button onClick={() => setKbItems((arr) => arr.filter((_, j) => j !== i))} className="inline-flex items-center gap-2 border border-red-400/50 px-3 py-1.5 font-mono text-xs text-red-300 hover:bg-red-400/10">
                          <Trash2 className="h-3.5 w-3.5" /> Borrar
                        </button>
                      </div>
                      <Field label={`Texto (${k.text.length} caracteres)`}>
                        <textarea value={k.text} onChange={(e) => setKbItems((arr) => arr.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} rows={5} className={inputCls} />
                      </Field>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      setKbItems((arr) => [...arr, { id: `nuevo-${Date.now().toString(36)}`, title: "Nuevo tema", text: "", _key: crypto.randomUUID() }])
                    }
                    className={btnGhost}
                  >
                    <Plus className="h-4 w-4" /> Añadir chunk
                  </button>
                  <button onClick={() => void saveKb()} disabled={savingKb} className={btnPrimary}>
                    <Save className="h-4 w-4" /> {savingKb ? "Guardando…" : "Guardar conocimiento en GitHub"}
                  </button>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="space-y-4 border border-acid/30 bg-panel p-6">
                    <h2 className="font-display text-xl font-bold text-white">Re-indexar ahora</h2>
                    <p className="text-sm text-zinc-400">Manda lo de arriba al índice Vectorize vía tu Worker (sin terminal ni redeploy). Requiere <code className="bg-white/10 px-1 font-mono text-xs text-acid">RAG_ADMIN_KEY</code> en el Worker.</p>
                    <Field label="URL del Worker">
                      <input
                        value={ragWorker}
                        onChange={(e) => {
                          setRagWorker(e.target.value);
                          try {
                            localStorage.setItem("mike-rag-worker", e.target.value);
                          } catch {
                            /* noop */
                          }
                        }}
                        className={cn(inputCls, "font-mono text-xs")}
                      />
                    </Field>
                    <Field label="RAG_ADMIN_KEY">
                      <input
                        type="password"
                        value={ragKey}
                        onChange={(e) => {
                          setRagKey(e.target.value);
                          try {
                            localStorage.setItem("mike-rag-key", e.target.value);
                          } catch {
                            /* noop */
                          }
                        }}
                        placeholder="La del secret del Worker"
                        autoComplete="off"
                        className={cn(inputCls, "font-mono text-xs")}
                      />
                    </Field>
                    <button onClick={() => void doReingest()} disabled={ingestState === "working"} className={cn(btnPrimary, "w-full justify-center")}>
                      <Upload className="h-4 w-4" /> {ingestState === "working" ? "Indexando…" : "Re-indexar ahora"}
                    </button>
                    {ingestMsg && (
                      <p className={cn("border p-4 text-sm", ingestState === "ok" ? "border-acid/50 bg-acid/10 text-acid" : "border-red-400/40 bg-red-400/10 text-red-200")}>
                        {ingestMsg}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4 border border-white/10 bg-panel p-6">
                    <h2 className="font-display text-xl font-bold text-white">Ajustes de la IA</h2>
                    <p className="text-sm text-zinc-400">Se guardan en <code className="bg-white/10 px-1 font-mono text-xs text-acid">worker/rag-config.json</code> y aplican con el deploy (~2 min).</p>
                    <Field label="Modelo de chat">
                      <select value={ragCfg.chatModel} onChange={(e) => setRagCfg((c) => ({ ...c, chatModel: e.target.value }))} className={cn(inputCls, "bg-coal font-mono text-xs")}>
                        <option value="@cf/meta/llama-3.1-8b-instruct">@cf/meta/llama-3.1-8b-instruct (equilibrado)</option>
                        <option value="@cf/meta/llama-3.2-3b-instruct">@cf/meta/llama-3.2-3b-instruct (rápido/barato)</option>
                        <option value="@cf/meta/llama-3.3-70b-instruct-fp8">@cf/meta/llama-3.3-70b-instruct-fp8 (mejor calidad)</option>
                      </select>
                    </Field>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label={`Temp ${ragCfg.temperature}`}>
                        <input type="range" min={0} max={1} step={0.05} value={ragCfg.temperature} onChange={(e) => setRagCfg((c) => ({ ...c, temperature: Number(e.target.value) }))} className="w-full" />
                      </Field>
                      <Field label="Max tokens">
                        <input type="number" min={50} max={2000} step={50} value={ragCfg.maxTokens} onChange={(e) => setRagCfg((c) => ({ ...c, maxTokens: Number(e.target.value) }))} className={inputCls} />
                      </Field>
                      <Field label="TopK">
                        <input type="number" min={1} max={10} value={ragCfg.topK} onChange={(e) => setRagCfg((c) => ({ ...c, topK: Math.max(1, Math.min(10, Number(e.target.value))) }))} className={inputCls} />
                      </Field>
                    </div>
                    <Field label={`Similitud mínima ${ragCfg.minScore}`}>
                      <input type="range" min={0} max={0.5} step={0.05} value={ragCfg.minScore} onChange={(e) => setRagCfg((c) => ({ ...c, minScore: Number(e.target.value) }))} className="w-full" />
                    </Field>
                    <Field label="Instrucciones del sistema">
                      <textarea value={ragCfg.systemPrompt} onChange={(e) => setRagCfg((c) => ({ ...c, systemPrompt: e.target.value }))} rows={7} className={cn(inputCls, "font-mono text-xs")} />
                    </Field>
                    <button onClick={() => void saveCfg()} disabled={savingCfg} className={btnPrimary}>
                      <Save className="h-4 w-4" /> {savingCfg ? "Guardando…" : "Guardar ajustes"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── GITHUB ── */}
        {tab === "github" && (
          <div className="max-w-2xl space-y-4 border border-white/10 bg-panel p-6">
            <h2 className="font-display text-xl font-bold text-white">GitHub en vivo</h2>
            <Field label="Usuario de GitHub" hint="Se carga automáticamente al abrir el sitio."><input value={content.github.username} onChange={(e) => patch({ github: { ...content.github, username: e.target.value } })} className={inputCls} /></Field>
            <Field label="Nº máximo de repos"><input type="number" min={2} max={24} value={content.github.maxRepos} onChange={(e) => patch({ github: { ...content.github, maxRepos: Math.max(2, Math.min(24, Number(e.target.value))) } })} className={inputCls} /></Field>
            <Field label="Texto de la sección"><textarea value={content.github.text} onChange={(e) => patch({ github: { ...content.github, text: e.target.value } })} rows={2} className={inputCls} /></Field>
            <a href={`https://github.com/${content.github.username}`} target="_blank" rel="noreferrer" className={btnGhost}>Probar perfil ↗</a>
          </div>
        )}

        {/* ── CONTACT ── */}
        {tab === "contact" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4 border border-white/10 bg-panel p-6">
              <h2 className="font-display text-xl font-bold text-white">Textos</h2>
              <Field label="Titular"><input value={content.contact.title} onChange={(e) => patch({ contact: { ...content.contact, title: e.target.value } })} className={inputCls} /></Field>
              <Field label="Texto"><textarea value={content.contact.text} onChange={(e) => patch({ contact: { ...content.contact, text: e.target.value } })} rows={2} className={inputCls} /></Field>
              <Field label="Redes (una por línea: Nombre | URL)">
                <textarea value={content.contact.socials.map((s) => `${s.label} | ${s.url}`).join("\n")} onChange={(e) => patch({ contact: { ...content.contact, socials: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const [label, ...rest] = l.split("|"); return { label: label.trim(), url: rest.join("|").trim() }; }) } })} rows={4} className={cn(inputCls, "font-mono text-xs")} />
              </Field>
            </div>
            <div className="space-y-4 border border-white/10 bg-panel p-6">
              <h2 className="font-display text-xl font-bold text-white">Formulario</h2>
              <Field label="Servicios (uno por línea)">
                <textarea value={content.contact.services.join("\n")} onChange={(e) => patch({ contact: { ...content.contact, services: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) } })} rows={5} className={inputCls} />
              </Field>
              <Field label="Presupuestos (uno por línea)">
                <textarea value={content.contact.budgets.join("\n")} onChange={(e) => patch({ contact: { ...content.contact, budgets: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) } })} rows={5} className={inputCls} />
              </Field>
              <Field label="Nota del pie"><input value={content.footer.note} onChange={(e) => patch({ footer: { ...content.footer, note: e.target.value } })} className={inputCls} /></Field>
              <Field label="Marca de agua gigante del pie" hint="Texto corto en mayúsculas (ej. MIKE). El nombre completo no cabe a ese tamaño.">
                <input value={content.footer.watermark} onChange={(e) => patch({ footer: { ...content.footer, watermark: e.target.value } })} className={inputCls} />
              </Field>
            </div>
          </div>
        )}

        {/* ── DESIGN ── */}
        {tab === "design" && (
          <div className="max-w-2xl space-y-4 border border-white/10 bg-panel p-6">
            <h2 className="font-display text-xl font-bold text-white">Apariencia</h2>
            <p className="text-sm text-zinc-400">Todo se aplica al instante en el sitio y viaja en el botón Publicar. Pruébalo aquí y luego mira con “Ver sitio”.</p>
            <Field label="Color de acento (botones, enlaces, detalles)">
              <div className="flex items-center gap-3">
                <input type="color" value={content.appearance.accent} onChange={(e) => patch({ appearance: { ...content.appearance, accent: e.target.value } })} className="h-11 w-20 cursor-pointer border border-white/15 bg-transparent" />
                <code className="font-mono text-sm text-acid">{content.appearance.accent}</code>
              </div>
            </Field>
            <Field label="Fondo base del sitio">
              <div className="flex items-center gap-3">
                <input type="color" value={content.appearance.ink} onChange={(e) => patch({ appearance: { ...content.appearance, ink: e.target.value } })} className="h-11 w-20 cursor-pointer border border-white/15 bg-transparent" />
                <code className="font-mono text-sm text-zinc-300">{content.appearance.ink}</code>
              </div>
            </Field>
            <Field label="Superficies (tarjetas, paneles, modales)">
              <div className="flex items-center gap-3">
                <input type="color" value={content.appearance.panel} onChange={(e) => patch({ appearance: { ...content.appearance, panel: e.target.value } })} className="h-11 w-20 cursor-pointer border border-white/15 bg-transparent" />
                <code className="font-mono text-sm text-zinc-300">{content.appearance.panel}</code>
              </div>
            </Field>
            {([
              ["showParticles", "Partículas del Hero"],
              ["showMarquee", "Cinta infinita"],
              ["showStats", "Estadísticas del Hero"],
              ["showCursor", "Cursor personalizado"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-3 border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200">
                <input type="checkbox" checked={content.appearance[key]} onChange={(e) => patch({ appearance: { ...content.appearance, [key]: e.target.checked } })} className="h-4 w-4 accent-[#a3e635]" />
                {label}
              </label>
            ))}
            <Field label="Categorías (Nombre | Color)" hint="La primera fila debe ser la categoría Todos. El color se usa en filtros Y en las tarjetas de proyecto.">
              <textarea
                value={content.categories.map((c) => `${c.label} | ${c.color}`).join("\n")}
                onChange={(e) => {
                  const ids: (CategoryId | "todos")[] = ["todos", "codigo", "diseno3d", "grafico", "personajes"];
                  const lines = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
                  patch({ categories: lines.map((l, i) => { const [label, ...rest] = l.split("|"); return { id: ids[i] ?? "todos", label: label.trim(), color: (rest.join("|").trim() || "#a3e635") }; }) });
                }}
                rows={5}
                className={cn(inputCls, "font-mono text-xs")}
              />
            </Field>
          </div>
        )}

        {/* ── DATA ── */}
        {tab === "data" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4 border border-white/10 bg-panel p-6">
              <h2 className="font-display text-xl font-bold text-white">Copia de seguridad</h2>
              <p className="text-sm text-zinc-400">Exporta tu contenido a JSON para guardarlo o versionarlo. Al importar, se reemplaza todo el contenido actual.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const blob = new Blob([exportJSON()], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `portafolio-mike-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className={btnPrimary}
                >
                  <Download className="h-4 w-4" /> Exportar JSON
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportJSON()).catch(() => {});
                    flashSaved();
                  }}
                  className={btnGhost}
                >
                  <FileJson className="h-4 w-4" /> Copiar JSON
                </button>
                <button onClick={() => { if (confirm("¿Restablecer todo al contenido original?")) reset(); }} className="inline-flex items-center gap-2 border border-red-400/50 px-4 py-2.5 font-display text-sm font-bold text-red-300 hover:bg-red-400/10">
                  <RefreshCcw className="h-4 w-4" /> Restablecer
                </button>
              </div>
              <Field label="Importar JSON">
                <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={6} placeholder='Pega aquí el JSON exportado…' className={cn(inputCls, "font-mono text-xs")} spellCheck={false} />
              </Field>
              <button
                onClick={() => {
                  if (!importText.trim()) { setImportMsg("Pega primero un JSON."); return; }
                  const ok = importJSON(importText);
                  setImportMsg(ok ? "✓ Contenido importado correctamente." : "✗ JSON no válido.");
                  if (ok) { setImportText(""); flashSaved(); }
                }}
                className={btnPrimary}
              >
                <Save className="h-4 w-4" /> Importar y aplicar
              </button>
              {importMsg && <p className="text-sm text-zinc-300">{importMsg}</p>}
              <div className="border-t border-white/10 pt-4">
                <Field label="Cambiar contraseña del panel">
                  <div className="flex gap-2">
                    <input value={content.adminPassword} onChange={(e) => update({ adminPassword: e.target.value })} className={inputCls} placeholder="Nueva contraseña" />
                    <button onClick={flashSaved} className={btnGhost}><Save className="h-4 w-4" /></button>
                  </div>
                </Field>
              </div>
            </div>
            <div className="h-fit border border-white/10 bg-panel p-6">
              <h2 className="font-display text-xl font-bold text-white">¿Cómo funciona?</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-zinc-400">
                <li>Todo lo que edites aquí se <strong className="text-white">guarda solo en este navegador</strong> al instante.</li>
                <li>Pulsa <strong className="text-white">“Ver sitio”</strong> para comprobar el resultado en vivo.</li>
                <li><strong className="text-white">Exporta el JSON</strong> cada vez que hagas cambios importantes y guárdalo junto al proyecto.</li>
                <li>Para publicar cambios definitivos usa la pestaña <strong className="text-white">Publicar</strong>: sube el contenido a GitHub y Cloudflare redespliega solo.</li>
                <li>El acceso al panel es <code className="bg-white/10 px-1 font-mono text-xs text-acid">#/admin</code> con tu contraseña (solo existe en local, nunca se publica).</li>
              </ol>
              <pre className="mt-4 max-h-64 overflow-auto border border-white/10 bg-black/50 p-3 font-mono text-[11px] leading-relaxed text-zinc-400">{exportJSON().slice(0, 1500)}…</pre>
            </div>
          </div>
        )}

        {/* ── PUBLICAR ── */}
        {tab === "publicar" && (
          <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4 border border-white/10 bg-panel p-6">
              <h2 className="font-display text-xl font-bold text-white">Subir contenido a GitHub</h2>
              <p className="text-sm leading-relaxed text-zinc-400">
                Este botón toma <strong className="text-white">todo lo que editaste en el panel</strong> y lo
                publica como commit en <code className="bg-white/10 px-1 font-mono text-xs text-acid">src/data/content.ts</code> de
                tu repo. Cloudflare detecta el push y <strong className="text-white">redespliega el sitio solo</strong> en 1–2 minutos.
              </p>
              <Field label="Token de GitHub" hint="Clásico con scope repo (o fino con Contents: lectura y escritura). Vive solo en este navegador, jamás se publica.">
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={pubCfg.token}
                    onChange={(e) => setPub({ token: e.target.value })}
                    placeholder="ghp_… o github_pat_…"
                    className={cn(inputCls, "font-mono text-xs")}
                    autoComplete="off"
                  />
                  {pubCfg.token && (
                    <button
                      onClick={() => { forgetPublishToken(); setPubCfgState((p) => ({ ...p, token: "" })); }}
                      className={btnGhost}
                      title="Olvidar token"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Repo"><input value={pubCfg.repo} onChange={(e) => setPub({ repo: e.target.value })} className={cn(inputCls, "font-mono text-xs")} placeholder="usuario/repo" /></Field>
                <Field label="Rama"><input value={pubCfg.branch} onChange={(e) => setPub({ branch: e.target.value })} className={inputCls} placeholder="main" /></Field>
              </div>
              <Field label="Mensaje del commit"><input value={pubCfg.message} onChange={(e) => setPub({ message: e.target.value })} className={inputCls} /></Field>
              <button onClick={doPublish} disabled={pubStatus === "pushing"} className={cn(btnPrimary, "w-full justify-center text-base")}>
                {pubStatus === "pushing" ? (
                  <>Publicando… espera al commit</>
                ) : (
                  <><Upload className="h-5 w-5" /> Publicar contenido en GitHub</>
                )}
              </button>
              {pubStatus === "ok" && pubResult && (
                <div className="border border-acid/50 bg-acid/10 p-4 text-sm">
                  <p className="font-display font-bold text-acid">✓ Publicado ({pubResult.commitSha})</p>
                  <p className="mt-1 text-zinc-300">
                    <a href={pubResult.commitUrl} target="_blank" rel="noreferrer" className="underline hover:text-acid">Ver commit</a>
                    {" · "}
                    <a href={pubResult.fileUrl} target="_blank" rel="noreferrer" className="underline hover:text-acid">Ver archivo</a>
                  </p>
                  <p className="mt-2 text-zinc-400">Cloudflare empezará el deploy solo. Compruébalo en el dashboard (Deployments) en ~1–2 min.</p>
                </div>
              )}
              {pubStatus === "error" && (
                <p className="border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-200">{pubMsg}</p>
              )}
            </div>
            <div className="h-fit space-y-4 border border-white/10 bg-panel p-6">
              <h2 className="font-display text-xl font-bold text-white">Primer push del proyecto</h2>
              <p className="text-sm text-zinc-400">
                Tu repo ya tiene el portafolio viejo: primero se respalda a una rama y luego se reemplaza
                con este proyecto. Ejecuta esto <strong className="text-white">una sola vez</strong> en la
                carpeta del proyecto (el commit inicial y el remote ya están listos en tu carpeta):
              </p>
              <pre className="overflow-x-auto border border-white/10 bg-black/50 p-4 font-mono text-xs leading-relaxed text-zinc-300">
{`git push origin origin/main:refs/heads/backup-portafolio-viejo
git push --force origin main`}
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText("git push origin origin/main:refs/heads/backup-portafolio-viejo && git push --force origin main").catch(() => {})}
                className={btnGhost}
              >
                <Copy className="h-4 w-4" /> Copiar comandos
              </button>
              <div className="border-t border-white/10 pt-4 text-sm leading-relaxed text-zinc-400">
                <p className="font-display font-bold text-white">Cómo crear el token (2 min)</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>GitHub → Settings → Developer settings → <strong className="text-white">Personal access tokens</strong>.</li>
                  <li>Clásico con scope <code className="bg-white/10 px-1 font-mono text-xs text-acid">repo</code>, o fino solo para este repo con <code className="bg-white/10 px-1 font-mono text-xs text-acid">Contents: Read and write</code>.</li>
                  <li>Pégalo arriba. Caduca cuando tú decidas; renuévalo y repite.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Publicar TODO el proyecto */}
          <div className="border border-acid/30 bg-panel p-6">
            <h2 className="font-display text-xl font-bold text-white">Publicar TODO el proyecto <span className="ml-2 border border-acid/50 bg-acid/10 px-2 py-0.5 align-middle font-mono text-[10px] uppercase tracking-wider text-acid">sin terminal</span></h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
              Sube <strong className="text-white">código + contenido</strong> en un solo commit: lee los archivos
              frescos de tu disco al momento de pulsar (imposible subir código viejo), reemplaza el contenido
              con lo que editaste aquí y solo sube los archivos que cambiaron. Los borrados en local se
              conservan en GitHub. Después, si usas la terminal, haz <code className="bg-white/10 px-1 font-mono text-xs text-acid">git pull</code> primero.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={doCompare} disabled={snapStatus === "comparing" || snapStatus === "pushing"} className={btnGhost}>
                <Eye className="h-4 w-4" /> {snapStatus === "comparing" ? "Comparando…" : preview ? "Volver a comparar" : "1 · Comparar con GitHub"}
              </button>
              {preview && preview.changes.length > 0 && (
                <button onClick={doPublishAll} disabled={snapStatus === "pushing"} className={btnPrimary}>
                  <Upload className="h-4 w-4" /> {snapStatus === "pushing" ? "Publicando todo…" : `2 · Publicar ${preview.changes.length} archivo${preview.changes.length === 1 ? "" : "s"}`}
                </button>
              )}
            </div>
            {preview && (
              <div className="mt-4 border border-white/10 bg-black/40 p-4">
                <p className="font-mono text-xs text-zinc-400">
                  Base <span className="text-acid">{preview.baseCommit}</span> · {preview.remoteFiles} archivos en GitHub ·{" "}
                  {preview.changes.length === 0 ? (
                    <span className="text-acid">todo al día, nada que subir ✓</span>
                  ) : (
                    <>{preview.changes.length} con cambios:</>
                  )}
                </p>
                {preview.changes.length > 0 && (
                  <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto font-mono text-xs">
                    {preview.changes.map((c) => (
                      <li key={c.path} className="flex gap-2">
                        <span className={c.status === "added" ? "text-acid" : "text-amber-300"}>{c.status === "added" ? "A" : "M"}</span>
                        <span className="truncate text-zinc-300">{c.path}</span>
                        <span className="ml-auto shrink-0 text-zinc-600">{(c.bytes / 1024).toFixed(1)} KB</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {snapStatus === "ok" && allResult && (
              <div className="mt-4 border border-acid/50 bg-acid/10 p-4 text-sm">
                <p className="font-display font-bold text-acid">✓ Proyecto publicado ({allResult.commitSha})</p>
                <p className="mt-1 text-zinc-300">
                  <a href={allResult.commitUrl} target="_blank" rel="noreferrer" className="underline hover:text-acid">Ver commit</a>
                </p>
                <p className="mt-2 text-zinc-400">Cloudflare empezará el deploy solo en ~1–2 min.</p>
              </div>
            )}
            {snapStatus === "error" && (
              <p className="mt-4 border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-200">{allMsg}</p>
            )}
          </div>
            {snapStatus === "error" && (
              <p className="mt-4 border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-200">{allMsg}</p>
            )}
          </div>
        )}

        {/* ── AYUDA ── */}
        {tab === "ayuda" && <HelpTab copyUrl={copyUrl} copiedUrl={copiedUrl} setTab={setTab} />}
      </div>
    </div>
  );
}

function HelpTab({
  copyUrl,
  copiedUrl,
  setTab,
}: {
  copyUrl: (url: string) => void;
  copiedUrl: string | null;
  setTab: (t: TabId) => void;
}) {
  const cmd = (label: string, text: string, hint?: string) => (
    <div>
      <p className="mb-1 font-mono text-[11px] text-zinc-500">{label}</p>
      <div className="flex items-center gap-2 border border-white/10 bg-black/40 px-3 py-2">
      <code className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-200" title={text}>
        <span className="mr-2 text-zinc-600">$</span>
        {text}
      </code>
      <button
        onClick={() => copyUrl(text)}
        className="shrink-0 border border-white/15 px-2.5 py-1 font-mono text-[11px] text-zinc-300 transition hover:border-acid hover:text-acid"
      >
        {copiedUrl === text ? "✓" : "Copiar"}
      </button>
        {hint && <span className="hidden shrink-0 font-mono text-[11px] text-zinc-500 sm:inline">{hint}</span>}
      </div>
    </div>
  );

  const section = (title: string, children: React.ReactNode) => (
    <details className="border border-white/10 bg-panel" open>
      <summary className="cursor-pointer list-none px-5 py-4 font-display text-base font-bold text-white transition-colors hover:text-acid [&::-webkit-details-marker]:hidden">
        <span className="mr-2 text-acid">▸</span>
        {title}
      </summary>
      <div className="space-y-3 border-t border-white/10 p-5 pt-4 text-sm leading-relaxed text-zinc-400">{children}</div>
    </details>
  );

  const kv = (k: string, v: React.ReactNode) => (
    <div className="grid gap-1 border-b border-white/5 pb-2 sm:grid-cols-[190px_1fr] sm:gap-3">
      <span className="font-display text-sm font-bold text-white">{k}</span>
      <span>{v}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      {section(
        "Rutina recomendada (90% de los días)",
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            Edita en las pestañas (todo se <strong className="text-white">autoguarda en este navegador</strong>).
          </li>
          <li>
            Comprueba con <strong className="text-white">Ver sitio</strong> (arriba a la derecha).
          </li>
          <li>
            <button onClick={() => setTab("publicar")} className="underline hover:text-acid">
              Publicar
            </button>
            : <strong className="text-white">contenido</strong> para textos/fotos/colores,{" "}
            <strong className="text-white">TODO</strong> si tocó código (o no estás seguro).
          </li>
          <li>
            Espera el deploy verde (~2 min) y abre el sitio con <code className="bg-white/10 px-1 font-mono text-xs text-acid">Ctrl+Shift+R</code>.
          </li>
        </ol>,
      )}

      {section(
        "Qué hace cada pestaña",
        <div className="space-y-2">
          {kv("General", "Nombre, rol, foto, email, teléfono, ubicación y texto del CV descargable.")}
          {kv("Hero", "Badge, roles del typewriter, descripción, botones, stats y cinta infinita.")}
          {kv("Sobre mí", "Historia, cita, idiomas, disciplinas y barras de habilidades.")}
          {kv("Proyectos", "Crear/duplicar/eliminar proyectos: textos, tags, specs, links, snippets y video. Botón Subir PC en la imagen.")}
          {kv("Sitios Web", "Tus sitios en producción: URL, descripción, tags y miniatura (+Subir PC).")}
          {kv("Medios", "Subir imágenes del PC, importar por URL, galería con borrado y videos por URL para asignar.")}
          {kv("Modelos 3D", "Piezas del visor: demos procedurales o tu .glb (+Subir PC al póster).")}
          {kv("RAG", "Conocimiento del chatbot (CRUD), re-indexado sin terminal y ajustes de la IA.")}
          {kv("GitHub", "Usuario por defecto y nº de repos de la sección en vivo.")}
          {kv("Contacto", "Textos, redes, servicios del formulario, presupuestos y nota del pie.")}
          {kv("Diseño", "Acento, fondo, superficies, categorías y visibilidad de secciones.")}
          {kv("Datos", "Copia de seguridad JSON, importar, restablecer y cambiar la contraseña.")}
          {kv("Publicar", "Subir contenido o TODO el proyecto a GitHub (Cloudflare redespliega solo).")}
        </div>,
      )}

      {section(
        "Comandos fuera del panel (PowerShell, en la carpeta del proyecto)",
        <div className="space-y-4">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">Servidor local</p>
            <div className="space-y-2">
              {cmd("Abrir el panel (o doble clic a Abrir-Panel-Admin.bat)", "npm run dev")}
              {cmd("Ver estado", "git status --short")}
            </div>
          </div>
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">Git (cuando el panel no basta)</p>
            <div className="space-y-2">
              {cmd("Sincronizar (si el push dice non-fast-forward)", "git pull --rebase origin main")}
              {cmd("Subir", "git push origin main")}
              {cmd("Forzar deploy sin cambios", 'git commit --allow-empty -m "trigger redeploy" && git push origin main')}
              {cmd("Ver historial", "git log --oneline -8")}
            </div>
          </div>
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">RAG / Cloudflare (con token en el entorno)</p>
            <div className="space-y-2">
              {cmd("Fijar credenciales (duran la sesión)", "$env:CLOUDFLARE_API_TOKEN='tu-token'")}
              {cmd("Fijar cuenta", "$env:CLOUDFLARE_ACCOUNT_ID='c393829619b11d1545a1dd69d4d48356'")}
              {cmd("Re-indexar por terminal", "npm run rag:ingest")}
              {cmd("Ver índices", "npx wrangler vectorize list")}
              {cmd("Ver mi usuario/cuentas", "npx wrangler whoami")}
            </div>
          </div>
        </div>,
      )}

      {section(
        "Claves: cuál va dónde (ninguna va al código)",
        <div className="space-y-2">
          {kv("Contraseña panel", <>Pestaña Datos. Solo abre el panel local.</>)}
          {kv("Token GitHub", <>Pestaña Publicar (se reutiliza en Medios y RAG). Vive en tu navegador.</>)}
          {kv("RAG_ADMIN_KEY", <>La inventas tú: igualita en el secret del Worker y en el campo RAG.</>)}
          {kv("GITHUB_TOKEN", "Secret del Worker. Sin ella, repos a ratos caídos.")}
          {kv("RESEND_API_KEY", "Secret del Worker. Sin ella, el formulario abre tu app de correo.")}
          {kv("TRANSLATE_API_KEY", "Secret del Worker. Sin ella, el EN dinámico depende del endpoint público.")}
          {kv("CF API token", "Solo tu PowerShell ($env). Jamás en archivos. Rota si circula por chats.")}
        </div>,
      )}

      {section(
        "Si algo falla (lee el síntoma)",
        <div className="space-y-2">
          {kv("Push rejected (non-fast-forward)", <>Tu panel publicó antes: <code className="bg-white/10 px-1 font-mono text-xs">git pull --rebase origin main</code> y luego push.</>)}
          {kv("Publicar dice markers-missing", "El repo no tiene el código nuevo: haz push del proyecto primero.")}
          {kv("401 GitHub / Cloudflare", "Token malo, caducado o sin permiso. Verifica, rota y reintenta.")}
          {kv("429 en repos o traducir", "Límite sin clave: añade GITHUB_TOKEN / TRANSLATE_API_KEY en el Worker.")}
          {kv("Color/cambio no se ve", "1) Espera el deploy verde. 2) Ctrl+Shift+R. 3) En prod se ignora localStorage viejo por diseño.")}
          {kv("Chat no responde", "Mira el código del error: stage-embed (modelo), stage-query (índice), stage-gen (LLM).")}
          {kv("Deploy rojo", "Abre el log: manda el timestamp, no un log viejo. Revisa que incluya tu último commit.")}
          {kv("Login wrangler raro", "Quita $env:CLOUDFLARE_API_TOKEN de la sesión y usa npx wrangler login limpio.")}
        </div>,
      )}

      {section(
        "Reglas de oro",
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Ningún secreto va a archivos versionados. Solo navegador, PowerShell o dashboard.</li>
          <li>Contenido → panel. Código → push. Imágenes → Medios. No mezcles las vías el mismo día sin hacer pull entre medias.</li>
          <li>Tras publicar del panel, tu clon queda atrás: <code className="bg-white/10 px-1 font-mono text-xs text-acid">git pull --rebase</code> antes del próximo push.</li>
          <li>Después de cada deploy: recarga dura (<code className="bg-white/10 px-1 font-mono text-xs text-acid">Ctrl+Shift+R</code>) antes de declarar que algo no se ve.</li>
          <li>Exporta el JSON (Datos) antes de cambios grandes: es tu deshacer universal.</li>
        </ol>,
      )}
    </div>
  );
}
