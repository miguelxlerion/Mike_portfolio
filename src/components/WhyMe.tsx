import { Gauge, Layers, ShieldCheck } from "lucide-react";
import { useSite } from "../store/SiteContext";
import { Reveal, SectionHeader } from "./ui";

const ICONS = [Gauge, Layers, ShieldCheck];

/**
 * El "bonus invisible" del perfil Senior: valor agregado que un maquetador
 * promedio no ofrece. Se edita desde el panel → Sobre mí → Bonus.
 */
export default function WhyMe() {
  const { content } = useSite();
  const { whyMe } = content;
  return (
    <section id="por-que" className="relative px-5 py-24 sm:px-8">
      <div className="glow-cyan absolute right-0 top-10 h-[380px] w-[380px]" aria-hidden />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeader index="06" eyebrow={whyMe.eyebrow} title={whyMe.title} text={whyMe.text} />

        <div className="mt-12 grid gap-5 md:grid-cols-3 [&>*]:min-w-0">
          {whyMe.cards.map((c, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <Reveal key={c.title} delay={i * 0.08} className="group border border-white/10 bg-panel p-7 transition-all hover:-translate-y-1.5 hover:border-white/25">
                <span
                  className="grid h-12 w-12 place-items-center border"
                  style={{ borderColor: `${c.color}55`, background: `${c.color}14` }}
                >
                  <Icon className="h-6 w-6" style={{ color: c.color }} />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-white">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{c.desc}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
