import { BadgeCheck, Quote } from "lucide-react";
import { useSite } from "../store/SiteContext";
import { AnimatedCounter, Reveal, SectionHeader } from "./ui";

export default function About() {
  const { content } = useSite();
  const { about, skills, profile } = content;

  return (
    <section id="sobre-mi" className="relative px-5 py-24 sm:px-8">
      <div className="glow-violet absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2" aria-hidden />
      <div className="relative mx-auto max-w-7xl">
        <SectionHeader index="01" eyebrow={about.eyebrow} title={<>{about.title}</>} />

        <div className="mt-12 grid gap-10 lg:grid-cols-12 [&>*]:min-w-0">
          <Reveal className="lg:col-span-7">
            <div className="space-y-5 text-base leading-relaxed text-zinc-400 md:text-lg">
              {about.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <blockquote className="mt-8 flex gap-4 border-l-2 border-acid bg-white/[0.03] p-5">
              <Quote className="h-6 w-6 shrink-0 text-acid" />
              <p className="font-display text-lg font-medium text-white">{about.quote}</p>
            </blockquote>
            <div className="mt-6 flex flex-wrap gap-2">
              {about.languages.map((l) => (
                <span key={l} className="inline-flex items-center gap-1.5 border border-white/12 bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-zinc-300">
                  <BadgeCheck className="h-3.5 w-3.5 text-acid" /> {l}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 border border-acid/40 bg-acid/10 px-3 py-1.5 font-mono text-xs text-acid">
                {profile.availabilityDetail}
              </span>
            </div>

            <div className="mt-10">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">Habilidades</h3>
              <div className="mt-5 space-y-3">
                {skills.map((s) => (
                  <div key={s.name} className="flex items-center justify-between gap-4 px-3 py-2.5 border border-white/8 bg-white/[0.03] rounded-lg transition-colors hover:border-white/15">
                    <span className="font-medium text-zinc-200 text-sm">{s.name}</span>
                    <span className="flex-shrink-0 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] rounded-full border"
                          style={{
                            background: `${s.color}20`,
                            borderColor: `${s.color}60`,
                            color: s.color
                          }}>
                      {s.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <div className="lg:col-span-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {about.disciplines.map((d, i) => (
                <Reveal key={d.title} delay={i * 0.08} className="border border-white/10 bg-panel p-6 transition-transform hover:-translate-y-1.5">
                  <span className="font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: d.color }}>
                    0{i + 1}
                  </span>
                  <h3 className="mt-2 font-display text-xl font-bold text-white">{d.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{d.desc}</p>
                </Reveal>
              ))}
            </div>
            <Reveal delay={0.2} className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {about.counters.map((c) => (
                <div key={c.label} className="border border-white/10 bg-coal p-4 text-center">
                  <p className="font-display text-2xl font-bold text-white">
                    <AnimatedCounter value={c.value} suffix={c.suffix} />
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">{c.label}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
