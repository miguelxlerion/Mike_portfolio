import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUpRight, Boxes, Code2, Download, MapPin, PenTool } from "lucide-react";
import { useSite } from "../store/SiteContext";
import ParticleCanvas from "./Background";
import { AnimatedCounter } from "./ui";

function useTypewriter(roles: { text: string; color: string }[]) {
  const [text, setText] = useState("");
  const [roleIdx, setRoleIdx] = useState(0);

  useEffect(() => {
    if (!roles.length) return;
    const current = roles[roleIdx % roles.length].text;
    let char = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (!deleting) {
        char++;
        setText(current.slice(0, char));
        if (char === current.length) {
          deleting = true;
          timer = setTimeout(tick, 1900);
          return;
        }
        timer = setTimeout(tick, 68);
      } else {
        char--;
        setText(current.slice(0, char));
        if (char === 0) {
          setRoleIdx((i) => (i + 1) % roles.length);
          return;
        }
        timer = setTimeout(tick, 32);
      }
    };
    timer = setTimeout(tick, 250);
    return () => clearTimeout(timer);
  }, [roleIdx, roles]);

  return { text, color: roles.length ? roles[roleIdx % roles.length].color : "#a3e635" };
}

function downloadCV(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const fadeUp = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } };

export default function Hero() {
  const { content } = useSite();
  const { profile, hero } = content;
  const { text, color } = useTypewriter(hero.roles);

  return (
    <section id="inicio" className="relative overflow-hidden pt-16 md:pt-[72px]">
      <div className="bg-dots absolute inset-0" aria-hidden />
      <div className="glow-acid absolute -top-40 right-[-10%] h-[560px] w-[560px]" aria-hidden />
      <div className="glow-cyan absolute bottom-[-20%] left-[-12%] h-[480px] w-[480px]" aria-hidden />
      <ParticleCanvas />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-14 md:pt-20 lg:grid-cols-12 lg:gap-8 lg:px-8">
        <div className="flex flex-col justify-center lg:col-span-7">
          <motion.div {...fadeUp} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-2.5 border border-white/12 bg-white/[0.04] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-acid animate-pulse-dot" />
              {hero.badge}
            </span>
          </motion.div>

          <motion.h1 {...fadeUp} transition={{ duration: 0.7, delay: 0.1 }} className="mt-7 font-display text-[17vw] font-bold leading-[0.9] tracking-tight text-white sm:text-7xl lg:text-[92px]">
            {profile.name.split(" ")[0]}
            <br />
            {(profile.name.split(" ")[1] ?? "")}
            <span className="text-acid">.</span>
          </motion.h1>

          <motion.div {...fadeUp} transition={{ duration: 0.7, delay: 0.2 }} className="mt-6">
            <p className="font-mono text-sm uppercase tracking-[0.25em] text-zinc-500">Especializado en</p>
            <p className="mt-2 min-h-[44px] font-display text-3xl font-bold sm:text-4xl" style={{ color }}>
              {text}
              <span className="animate-blink ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.12em] bg-white" />
            </p>
          </motion.div>

          <motion.p {...fadeUp} transition={{ duration: 0.7, delay: 0.3 }} className="mt-5 max-w-xl text-base leading-relaxed text-zinc-400 md:text-lg">
            {profile.tagline} {hero.description}
          </motion.p>

          <motion.div {...fadeUp} transition={{ duration: 0.7, delay: 0.4 }} className="mt-9 flex flex-wrap items-center gap-4">
            <a href="#proyectos" className="group inline-flex items-center gap-2 bg-acid px-6 py-3.5 font-display text-base font-bold text-ink transition-colors hover:bg-acid-soft">
              {hero.ctaPrimary}
              <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <button
              onClick={() => downloadCV(`CV-${profile.shortName}.txt`, profile.cvText)}
              className="inline-flex items-center gap-2 border border-white/20 px-6 py-3.5 font-display text-base font-bold text-white transition-colors hover:border-acid hover:text-acid"
            >
              <Download className="h-5 w-5" />
              {hero.ctaSecondary}
            </button>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-500">
              <MapPin className="h-3.5 w-3.5" /> {profile.location}
            </span>
          </motion.div>

          {content.appearance.showStats && (
            <motion.dl {...fadeUp} transition={{ duration: 0.7, delay: 0.5 }} className="mt-12 grid max-w-lg grid-cols-2 gap-4 border-t border-white/10 pt-7 sm:grid-cols-4">
              {hero.stats.map((stat) => (
                <div key={stat.label}>
                  <dd className="font-display text-2xl font-bold text-white md:text-3xl">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </dd>
                  <dt className="mt-1 block font-mono text-[10px] uppercase leading-tight tracking-wider text-zinc-500">{stat.label}</dt>
                </div>
              ))}
            </motion.dl>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.25 }}
          className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none"
        >
          <div className="absolute -inset-3 border border-acid/30 translate-x-5 translate-y-5" aria-hidden />
          <div className="relative overflow-hidden border border-white/15 bg-panel">
            <img src={profile.portrait} alt={`Retrato de ${profile.shortName}`} className="aspect-[4/5] w-full object-cover" loading="eager" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
              <div className="bg-ink/80 px-3.5 py-2.5 backdrop-blur-md">
                <p className="font-display text-sm font-bold text-white">{profile.shortName}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-acid">{profile.role}</p>
              </div>
              <span className="bg-acid px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink">Est. 2019</span>
            </div>
          </div>

          <div className="absolute -left-8 top-8 hidden animate-float items-center gap-2 border border-white/12 bg-ink/85 px-3.5 py-2.5 backdrop-blur-md sm:flex">
            <Code2 className="h-4 w-4 text-[#22d3ee]" />
            <span className="font-mono text-xs text-zinc-200">Código · TypeScript</span>
          </div>
          <div className="absolute -right-5 top-1/3 hidden animate-float-late items-center gap-2 border border-white/12 bg-ink/85 px-3.5 py-2.5 backdrop-blur-md sm:flex">
            <Boxes className="h-4 w-4 text-[#a78bfa]" />
            <span className="font-mono text-xs text-zinc-200">3D · Render</span>
          </div>
          <div className="absolute -left-4 bottom-24 hidden animate-float items-center gap-2 border border-white/12 bg-ink/85 px-3.5 py-2.5 backdrop-blur-md [animation-delay:-2s] sm:flex">
            <PenTool className="h-4 w-4 text-[#fbbf24]" />
            <span className="font-mono text-xs text-zinc-200">Diseño · Branding</span>
          </div>

          <div className="absolute -bottom-10 -right-4 hidden h-28 w-28 lg:block" aria-hidden>
            <svg viewBox="0 0 100 100" className="h-full w-full animate-spin-slower text-acid">
              <defs>
                <path id="circlePath" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
              </defs>
              <text className="fill-current font-mono text-[9.5px] uppercase tracking-[0.18em]">
                <textPath href="#circlePath">código · 3d · diseño · personajes ·</textPath>
              </text>
            </svg>
            <span className="absolute inset-0 grid place-items-center font-display text-lg font-bold text-white">✦</span>
          </div>
        </motion.div>
      </div>

      <div className="relative pb-8">
        <a href="#sobre-mi" className="mx-auto flex w-fit flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 transition-colors hover:text-acid">
          Desliza para explorar
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </a>
      </div>
    </section>
  );
}
