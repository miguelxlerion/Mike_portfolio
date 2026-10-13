import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { useSite } from "../store/SiteContext";
import { useLang } from "../i18n/LangContext";
import { cn } from "../utils/cn";

interface Msg {
  role: "user" | "assistant";
  text: string;
  sources?: string[];
}

const STR = {
  es: {
    title: "Pregúntame",
    subtitle: "RAG en vivo · Workers AI + Vectorize",
    online: "en línea",
    placeholder: "Ej. ¿Qué experiencia tienes con RAG?",
    send: "Enviar mensaje",
    thinking: "Pensando…",
    greeting:
      "Hola, soy el asistente de Miguel. Pregúntame por su experiencia, stack, proyectos o cómo contratarlo. Respondo con datos de su perfil.",
    suggestions: ["¿Qué experiencia tienes con RAG?", "¿En qué stack trabajas?", "Muéstrame tus proyectos 3D", "¿Cómo te contacto?"],
    offline: "El asistente aún no está activado en este entorno. Escríbele directo a",
    rate: "Demasiadas preguntas seguidas: espera un minuto e intenta de nuevo.",
    fail: "No pude responder ahora mismo. Escríbele directo a",
  },
  en: {
    title: "Ask me",
    subtitle: "Live RAG · Workers AI + Vectorize",
    online: "online",
    placeholder: "E.g. What's your RAG experience?",
    send: "Send message",
    thinking: "Thinking…",
    greeting:
      "Hi, I'm Miguel's assistant. Ask me about his experience, stack, projects or how to hire him. I answer from his profile data.",
    suggestions: ["What's your RAG experience?", "What's your stack?", "Show me your 3D projects", "How do I contact you?"],
    offline: "The assistant isn't enabled in this environment yet. Email him directly at",
    rate: "Too many questions in a row: wait a minute and try again.",
    fail: "I couldn't answer right now. Email him directly at",
  },
} as const;

export default function ChatWidget() {
  const { content } = useSite();
  const { lang } = useLang();
  const t = STR[lang];
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, loading, open]);

  const greet = () => {
    setMsgs((m) => (m.length === 0 ? [{ role: "assistant", text: t.greeting }] : m));
  };

  const send = async (raw?: string) => {
    const question = (raw ?? input).trim();
    if (!question || loading) return;
    setInput("");
    const history = [...msgs.slice(-4).map((m) => ({ role: m.role, content: m.text })), { role: "user", content: question }];
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history: history.slice(0, -1) }),
      });
      const data = (await res.json().catch(() => null)) as { answer?: unknown; sources?: unknown; error?: unknown } | null;
      if (res.ok && data && typeof data.answer === "string" && data.answer) {
        const sources = Array.isArray(data.sources) ? data.sources.filter((s): s is string => typeof s === "string") : [];
        setMsgs((m) => [...m, { role: "assistant", text: data.answer as string, sources }]);
      } else if (data?.error === "rag-not-configured") {
        setMsgs((m) => [...m, { role: "assistant", text: `${t.offline} ${content.profile.email}.` }]);
      } else if (data?.error === "too-many" || res.status === 429) {
        setMsgs((m) => [...m, { role: "assistant", text: t.rate }]);
      } else {
        setMsgs((m) => [...m, { role: "assistant", text: `${t.fail} ${content.profile.email}.` }]);
      }
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: `${t.fail} ${content.profile.email}.` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => {
            setOpen(true);
            greet();
          }}
          aria-label={t.title}
          className="group fixed bottom-6 left-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-acid text-ink shadow-[0_0_30px_-6px] shadow-acid/60 transition hover:bg-acid-soft"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-ink bg-acid animate-pulse-dot" />
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            aria-label={t.title}
            className="fixed bottom-6 left-6 right-6 z-50 flex max-h-[70vh] flex-col overflow-hidden border border-white/12 bg-coal shadow-2xl sm:right-auto sm:w-[380px]"
          >
            <header className="flex items-center gap-3 border-b border-white/10 bg-panel px-4 py-3">
              <span className="grid h-9 w-9 place-items-center bg-acid font-display text-xs font-bold text-ink">
                {content.profile.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-bold text-white">{t.title}</p>
                <p className="truncate font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t.subtitle}</p>
              </div>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-acid">
                <span className="h-1.5 w-1.5 rounded-full bg-acid animate-pulse-dot" />
                {t.online}
              </span>
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="grid h-8 w-8 place-items-center text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {msgs.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed",
                      m.role === "user" ? "bg-acid font-medium text-ink" : "border border-white/10 bg-panel text-zinc-200",
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    {m.sources && m.sources.length > 0 && (
                      <p className="mt-2 border-t border-white/10 pt-1.5 font-mono text-[10px] text-zinc-500">
                        Fuentes: {m.sources.join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="border border-white/10 bg-panel px-3.5 py-2.5 font-mono text-xs text-zinc-400">
                    {t.thinking}
                    <span className="animate-blink">_</span>
                  </div>
                </div>
              )}
              {msgs.length <= 1 && !loading && (
                <div className="flex flex-wrap gap-2">
                  {t.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => void send(s)}
                      className="border border-white/12 px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:border-acid hover:text-acid"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
              className="flex gap-2 border-t border-white/10 bg-panel p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 500))}
                placeholder={t.placeholder}
                aria-label={t.send}
                className="min-w-0 flex-1 border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-acid"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label={t.send}
                className="grid w-11 shrink-0 place-items-center bg-acid text-ink transition hover:bg-acid-soft disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
