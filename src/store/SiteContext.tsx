import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { defaultContent, type SiteContent } from "../data/content";

const STORAGE_KEY = "mike-portfolio-v2";

function loadInitial(): SiteContent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultContent;
    const parsed = JSON.parse(raw) as SiteContent;
    if (!parsed || parsed.version !== 1) return defaultContent;
    // Merge superficial para tolerar campos nuevos del código
    return { ...defaultContent, ...parsed, profile: { ...defaultContent.profile, ...parsed.profile }, hero: { ...defaultContent.hero, ...parsed.hero }, about: { ...defaultContent.about, ...parsed.about }, github: { ...defaultContent.github, ...parsed.github }, contact: { ...defaultContent.contact, ...parsed.contact }, footer: { ...defaultContent.footer, ...parsed.footer }, appearance: { ...defaultContent.appearance, ...parsed.appearance } };
  } catch {
    return defaultContent;
  }
}

interface SiteContextValue {
  content: SiteContent;
  update: (patch: Partial<SiteContent>) => void;
  setContent: (c: SiteContent) => void;
  reset: () => void;
  exportJSON: () => string;
  importJSON: (json: string) => boolean;
}

const SiteContext = createContext<SiteContextValue | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [content, setContentState] = useState<SiteContent>(() => loadInitial());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
    } catch {
      /* almacenamiento lleno o bloqueado */
    }
  }, [content]);

  // Aplica el color de acento como variable CSS global
  useEffect(() => {
    document.documentElement.style.setProperty("--color-acid", content.appearance.accent);
  }, [content.appearance.accent]);

  const update = useCallback((patch: Partial<SiteContent>) => {
    setContentState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setContent = useCallback((c: SiteContent) => setContentState(c), []);

  const reset = useCallback(() => {
    setContentState(defaultContent);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* noop */ }
  }, []);

  const exportJSON = useCallback(() => JSON.stringify(content, null, 2), [content]);

  const importJSON = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as SiteContent;
      if (!parsed || parsed.version !== 1 || !parsed.profile || !Array.isArray(parsed.projects)) return false;
      setContentState({ ...defaultContent, ...parsed });
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({ content, update, setContent, reset, exportJSON, importJSON }),
    [content, update, setContent, reset, exportJSON, importJSON],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite debe usarse dentro de <SiteProvider>");
  return ctx;
}
