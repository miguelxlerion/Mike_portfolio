import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../utils/cn";

export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeader({ index, eyebrow, title, text, align = "left" }: { index: string; eyebrow: string; title: React.ReactNode; text?: string; align?: "left" | "center" }) {
  return (
    <Reveal className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-acid">
        {index} · {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h2>
      {text && <p className="mt-4 leading-relaxed text-zinc-400">{text}</p>}
    </Reveal>
  );
}

export function AnimatedCounter({ value, suffix = "", duration = 1.4 }: { value: number; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - t0) / (duration * 1000));
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(eased * value));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref}>
      {display.toLocaleString("es")}
      {suffix}
    </span>
  );
}

/** Resaltado simple de código (sin dependencias) */
export function highlightCode(code: string): React.ReactNode[] {
  const pattern = /(\/\/.*$|#.*$|--.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(const|let|var|function|return|if|else|for|while|class|export|import|from|pub|fn|struct|impl|void|float|vec\d|int|def|scene|choice)\b|\b(\d+(?:\.\d+)?)\b/gm;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  // biome-ignore lint: bucle regex controlado
  while ((m = pattern.exec(code)) !== null) {
    if (m.index > last) out.push(<span key={k++}>{code.slice(last, m.index)}</span>);
    const [full, comment, str, kw, num] = m;
    if (comment) out.push(<span key={k++} className="text-zinc-500 italic">{full}</span>);
    else if (str) out.push(<span key={k++} className="text-acid-soft">{full}</span>);
    else if (kw) out.push(<span key={k++} className="text-cyan-300">{full}</span>);
    else if (num) out.push(<span key={k++} className="text-amber-300">{full}</span>);
    else out.push(<span key={k++}>{full}</span>);
    last = m.index + full.length;
  }
  if (last < code.length) out.push(<span key={k++}>{code.slice(last)}</span>);
  return out;
}
