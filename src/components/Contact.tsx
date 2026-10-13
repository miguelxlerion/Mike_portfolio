import { useState } from "react";
import { Check, Copy, Mail, MapPin, Phone, Send } from "lucide-react";
import { useSite } from "../store/SiteContext";
import { Reveal, SectionHeader } from "./ui";
import { cn } from "../utils/cn";

export default function Contact() {
  const { content } = useSite();
  const { contact, profile } = content;
  const [form, setForm] = useState({ name: "", email: "", service: contact.services[0] ?? "", budget: contact.budgets[0] ?? "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [sentVia, setSentVia] = useState<"server" | "email">("email");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* portapapeles no disponible */ }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Cuéntame tu nombre (mín. 2 letras).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Ese email no parece válido.";
    if (form.message.trim().length < 12) errs.message = "Cuéntame un poco más (mín. 12 caracteres).";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setStatus("sending");
    // 1) Intentar envío serverless (/api/contact en Cloudflare Pages).
    // Si no está configurado (501) o falla, cae al flujo mailto. Nunca se rompe.
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (res.ok && data?.ok) {
        setSentVia("server");
        setStatus("sent");
        return;
      }
    } catch {
      /* sin backend disponible: fallback a email */
    }
    setSentVia("email");
    setTimeout(() => setStatus("sent"), 900);
  };

  if (status === "sent") {
    return (
      <section id="contacto" className="px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-3xl border border-acid/40 bg-acid/5 p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-acid text-ink"><Check className="h-7 w-7" /></span>
          <h2 className="mt-5 font-display text-3xl font-bold text-white">
            {sentVia === "server" ? `¡Mensaje enviado, ${form.name.split(" ")[0]}!` : `¡Mensaje listo, ${form.name.split(" ")[0]}!`}
          </h2>
          <p className="mt-3 text-zinc-400">
            {sentVia === "server" ? (
              <>Tu solicitud sobre <strong className="text-acid">{form.service}</strong> ya está en mi bandeja. Te respondo en menos de 24 horas.</>
            ) : (
              <>Tu solicitud sobre <strong className="text-acid">{form.service}</strong> está preparada.
              Pulsa el botón para enviarla por email o escríbeme directo a {profile.email}.</>
            )}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {sentVia === "email" && (
              <a
                href={`mailto:${profile.email}?subject=${encodeURIComponent(`Proyecto: ${form.service} — ${form.name}`)}&body=${encodeURIComponent(`${form.message}\n\nPresupuesto: ${form.budget}\nContacto: ${form.email}`)}`}
                className="bg-acid px-6 py-3 font-display text-sm font-bold text-ink hover:bg-acid-soft"
              >
                Abrir mi email y enviar
              </a>
            )}
            <button onClick={() => { setStatus("idle"); setForm({ name: "", email: "", service: contact.services[0] ?? "", budget: contact.budgets[0] ?? "", message: "" }); }} className="border border-white/20 px-6 py-3 font-display text-sm font-bold text-white hover:border-acid hover:text-acid">
              Escribir otro
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contacto" className="relative px-5 py-24 sm:px-8">
      <div className="glow-acid absolute bottom-0 left-1/2 h-[380px] w-[680px] -translate-x-1/2" aria-hidden />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeader index="06" eyebrow={contact.eyebrow} title={<>{contact.title}</>} text={contact.text} />

        <div className="mt-12 grid gap-6 lg:grid-cols-12 [&>*]:min-w-0">
          <Reveal className="space-y-4 lg:col-span-5">
            <div className="border border-white/10 bg-panel p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">Email directo</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <a href={`mailto:${profile.email}`} className="flex min-w-0 flex-1 items-center gap-2 font-display text-base font-bold text-white hover:text-acid sm:text-lg">
                  <Mail className="h-5 w-5 shrink-0 text-acid" /> <span className="truncate">{profile.email}</span>
                </a>
                <button onClick={copyEmail} className="grid h-9 w-9 shrink-0 place-items-center border border-white/15 text-zinc-300 hover:border-acid hover:text-acid" aria-label="Copiar email">
                  {copied ? <Check className="h-4 w-4 text-acid" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-5 space-y-2.5 text-sm text-zinc-400">
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-acid" /> {profile.phone}</p>
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-acid" /> {profile.location}</p>
                <p className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-acid animate-pulse-dot" /> {profile.availability} · {profile.availabilityDetail}</p>
              </div>
            </div>
            <div className="border border-white/10 bg-panel p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-zinc-500">Redes</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {contact.socials.map((s) => (
                  <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="border border-white/12 px-4 py-3 text-center font-display text-sm font-bold text-zinc-200 transition hover:border-acid hover:text-acid">
                    {s.label} ↗
                  </a>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7">
            <form onSubmit={submit} className="border border-white/10 bg-panel p-6 sm:p-8" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">Nombre *</span>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tu nombre" className={cn("mt-2 w-full border bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-acid", errors.name ? "border-red-400" : "border-white/12")} />
                  {errors.name && <span className="mt-1 block text-xs text-red-300">{errors.name}</span>}
                </label>
                <label className="block">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">Email *</span>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="tu@email.com" className={cn("mt-2 w-full border bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-acid", errors.email ? "border-red-400" : "border-white/12")} />
                  {errors.email && <span className="mt-1 block text-xs text-red-300">{errors.email}</span>}
                </label>
              </div>

              <div className="mt-5">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">¿Qué necesitas? *</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {contact.services.map((s) => (
                    <button type="button" key={s} onClick={() => setForm({ ...form, service: s })} aria-pressed={form.service === s} className={cn("border px-4 py-2.5 text-sm transition", form.service === s ? "border-acid bg-acid/10 font-bold text-acid" : "border-white/12 text-zinc-400 hover:text-white")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-5 block">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">Presupuesto</span>
                <select value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="mt-2 w-full border border-white/12 bg-coal px-4 py-3 text-sm text-white outline-none focus:border-acid">
                  {contact.budgets.map((b) => <option key={b}>{b}</option>)}
                </select>
              </label>

              <label className="mt-5 block">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">Mensaje * ({form.message.length}/500)</span>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value.slice(0, 500) })} rows={5} placeholder="Cuéntame tu idea, tiempos y referencias…" className={cn("mt-2 w-full resize-y border bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-acid", errors.message ? "border-red-400" : "border-white/12")} />
                {errors.message && <span className="mt-1 block text-xs text-red-300">{errors.message}</span>}
              </label>

              <button type="submit" disabled={status === "sending"} className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-acid px-6 py-4 font-display text-base font-bold text-ink transition hover:bg-acid-soft disabled:opacity-60 sm:w-auto">
                <Send className="h-4 w-4" /> {status === "sending" ? "Preparando…" : "Enviar mensaje"}
              </button>
              <p className="mt-3 font-mono text-[11px] text-zinc-600">Sin spam. Tus datos solo se usan para responderte.</p>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
