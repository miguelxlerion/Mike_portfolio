import { motion } from 'framer-motion'
import { ArrowRight, Mail, GitBranch, TrendingDown, Cpu, Zap } from 'lucide-react'

const METRICS = [
  { value: '-40%', label: 'data analysis time', icon: TrendingDown },
  { value: '-60%', label: 'decision-making time', icon: Cpu },
  { value: '-80%', label: '3D pipeline export time', icon: Zap },
]

export default function Hero({ lang }) {
  const isEs = lang === 'es'
  return (
    <section className="relative overflow-hidden">
      {/* subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a25_1px,transparent_1px),linear-gradient(to_bottom,#1a1a25_1px,transparent_1px)] bg-[size:48px_48px] opacity-[0.15] pointer-events-none" />

      <div className="relative max-w-[1280px] mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4f8cff]/10 border border-[#4f8cff]/20 text-xs font-medium text-[#8ab4ff] mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {isEs ? 'Disponible remoto — GMT-5 · overlap EU/US' : 'Available for remote — GMT-5 · EU/US overlap'}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[32px] md:text-[52px] font-bold tracking-tight leading-[1.05] text-white max-w-3xl"
        >
          Senior Full-Stack Engineer
          <br />
          <span className="bg-gradient-to-r from-[#4f8cff] via-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent">
            Real-Time 3D & AI Data Platforms
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-5 text-[16px] md:text-[18px] leading-relaxed text-zinc-400 max-w-2xl"
        >
          {isEs
            ? <>Uno la brecha entre visualización 3D de alto impacto y software escalable. Construyo <strong className="text-zinc-200 font-semibold">Digital Twins</strong>, plataformas <strong className="text-zinc-200 font-semibold">RAG</strong> y sistemas de <strong className="text-zinc-200 font-semibold">telemetría IoT</strong> que convierten datos masivos en experiencias interactivas y estables a 60 FPS.</>
            : <>I bridge the gap between high-impact 3D visualization and scalable software. I build <strong className="text-zinc-200 font-semibold">Digital Twins</strong>, <strong className="text-zinc-200 font-semibold">RAG platforms</strong>, and <strong className="text-zinc-200 font-semibold">IoT telemetry</strong> systems that turn massive data into interactive, stable 60 FPS experiences.</>
          }
        </motion.p>

        {/* Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.26 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          {METRICS.map(m => (
            <div key={m.label} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#16161f] border border-[#2a2a3a] text-sm">
              <m.icon size={14} className="text-emerald-400" />
              <span className="font-bold text-white">{m.value}</span>
              <span className="text-zinc-500">{m.label}</span>
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.34 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <a href="#projects"
            className="inline-flex items-center gap-2 bg-white text-black px-7 py-3 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors">
            {isEs ? 'Ver proyectos destacados' : 'View Featured Projects'} <ArrowRight size={16} />
          </a>
          <a href="mailto:miguelxlerion@gmail.com"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold border border-[#2a2a3a] text-white hover:bg-[#16161f] transition-colors">
            <Mail size={16} /> {isEs ? 'Hablemos' : "Let's Talk"}
          </a>
          <a href="https://GitBranch.com/miguelxlerion" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            <GitBranch size={16} /> GitBranch
          </a>
        </motion.div>

        {/* hero-subtitle fix: bold via <strong> now renders via innerHTML equivalent in React */}
        <p className="sr-only">React · Next.js · Django · Three.js · LangChain · pgvector · FastAPI</p>
      </div>
    </section>
  )
}
