import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { restoreSpanish, translatePageToEnglish, watchDynamic, type Lang } from "./auto";

const LANG_KEY = "mike-lang";

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "es") return saved;
    const url = new URLSearchParams(window.location.search).get("lang");
    if (url === "en" || url === "es") return url;
  } catch {
    /* noop */
  }
  return "es";
}

interface LangValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  translating: boolean;
}

const LangContext = createContext<LangValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => initialLang());
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : "es";
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* noop */
    }
    if (lang === "en") {
      let alive = true;
      setTranslating(true);
      watchDynamic("en");
      translatePageToEnglish()
        .catch(() => {})
        .finally(() => {
          if (alive) setTranslating(false);
        });
      return () => {
        alive = false;
      };
    }
    watchDynamic("es");
    restoreSpanish();
    setTranslating(false);
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const value = useMemo(() => ({ lang, setLang, translating }), [lang, setLang, translating]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang debe usarse dentro de <LangProvider>");
  return ctx;
}

export function LangToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, translating } = useLang();
  return (
    <div data-notranslate className="inline-flex items-center border border-white/15" role="group" aria-label="Idioma / Language">
      {(["es", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-3 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition ${
            lang === l ? "bg-acid text-ink" : "text-zinc-400 hover:text-white"
          } ${compact ? "!px-2.5" : ""}`}
        >
          {l}
        </button>
      ))}
      {translating && (
        <span className="px-2 font-mono text-[10px] text-zinc-500" title="Traduciendo…">
          …
        </span>
      )}
    </div>
  );
}
