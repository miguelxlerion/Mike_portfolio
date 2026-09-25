import { motion } from 'framer-motion'
import { ExternalLink, GitBranch, Play, Database, Box, Radio } from 'lucide-react'

const PROJECTS = [
  {
    n: '01',
    icon: Box,
    title: 'SmartFactory 3D — Industrial Digital Twin',
    tags: ['React 18', 'Three.js', 'FastAPI', 'WebSockets', 'Docker'],
    problem: 'Factory floor opacity.',
    solution: 'Live telemetry with buffered ingestion and LOD for stable 60 FPS (>100 msg/s).',
    links: [
      { label: 'Live Demo', href: '#', icon: Play, primary: true },
      { label: 'Source Code', href: 'https://GitBranch.com/miguelxlerion/smartfactory-3d', icon: GitBranch },
    ],
    // TODO: Reemplazar con GIF/Diagrama real — video demo órbita 3D + overlay telemetría
    mediaType: 'video',
    mediaPlaceholder: '[INSERTAR GIF/VIDEO: Demostración de órbita 3D y overlay de telemetría]',
  },
  {
    n: '02',
    icon: Database,
    title: 'Rag_X — Enterprise RAG Assistant',
    tags: ['Python', 'Django/DRF', 'LangChain', 'pgvector', 'Celery', 'Redis'],
    problem: 'Corporate knowledge trapped in messy PDFs.',
    solution: 'Async PDF pipeline, semantic chunking, hybrid search & LLM re-ranking to reduce hallucinations.',
    links: [
      { label: 'Source Code', href: 'https://GitBranch.com/miguelxlerion/Rag_X', icon: GitBranch, primary: true },
    ],
    mediaType: 'diagram',
    mediaPlaceholder: '[INSERTAR DIAGRAMA DE ARQUITECTURA: PDF → Celery/Redis → pgvector → LangChain → LLM]',
  },
  {
    n: '03',
    icon: Radio,
    title: 'Ingest Pipeline — Resilient IoT Backend',
    tags: ['Python (Asyncio)', 'Node.js', 'MQTT', 'PostgreSQL', 'Docker'],
    problem: 'Sensor data ingestion in intermittent connectivity environments.',
    solution: 'Resilient design with local persistence (buffering), guaranteeing 99% uptime under concurrent load (Locust-tested).',
    links: [
      { label: 'Source Code', href: 'https://GitBranch.com/miguelxlerion/Ingest_Pipeline', icon: GitBranch, primary: true },
    ],
    mediaType: 'none',
  },
]

function Tag({ children }) {
  return <span className="px-2.5 py-1 rounded-full bg-[#1e1e2e] border border-[#2a2a3a] text-[11px] font-medium text-zinc-300">{children}</span>
}

export default function Projects({ lang }) {
  const isEs = lang === 'es'
  return (
    <section id="projects" className="max-w-[1280px] mx-auto px-6 py-16 md:py-24 border-t border-[#1a1a25]">
      <div className="flex items-baseline justify-between gap-4 mb-8">
        <div>
          <p className="text-xs tracking-[0.2em] text-[#4f8cff] font-semibold">FEATURED PROJECTS</p>
          <h2 className="mt-2 text-[28px] md:text-[36px] font-bold tracking-tight text-white">
            {isEs ? 'Trabajo seleccionado' : 'Selected work'} <span className="text-zinc-600 font-normal">— 3 destacados</span>
          </h2>
        </div>
        <span className="hidden md:inline text-xs text-zinc-500">Problem → Solution → Visual → Links</span>
      </div>

      <div className="grid gap-6">
        {PROJECTS.map((p, idx) => (
          <motion.article
            key={p.title}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: idx * 0.06 }}
            className="group rounded-[20px] bg-[#12121a] border border-[#2a2a3a] overflow-hidden hover:border-[#3a3a4f] transition-colors"
          >
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1a1a25] border border-[#2a2a3a] grid place-items-center text-[#4f8cff]">
                    <p.icon size={16} />
                  </div>
                  <span className="text-xs font-mono text-zinc-500">{p.n}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end max-w-[60%]">
                  {p.tags.map(t => <Tag key={t}>{t}</Tag>)}
                </div>
              </div>

              <h3 className="mt-4 text-xl md:text-2xl font-bold text-white leading-tight">{p.title}</h3>

              <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-[#0a0a0f] border border-[#1a1a25] p-4">
                  <p className="text-xs font-semibold tracking-wide text-amber-400 mb-1">PROBLEM</p>
                  <p className="text-zinc-400">{p.problem}</p>
                </div>
                <div className="rounded-xl bg-[#0a0a0f] border border-[#1a1a25] p-4">
                  <p className="text-xs font-semibold tracking-wide text-emerald-400 mb-1">SOLUTION</p>
                  <p className="text-zinc-400">{p.solution}</p>
                </div>
              </div>

              {/* Visual placeholder — TODO comentarios visibles para reemplazo */}
              {p.mediaType !== 'none' && (
                <div className="mt-4 rounded-xl border border-dashed border-[#2a2a3a] bg-[#0a0a0f] p-4">
                  {/* TODO: Reemplazar con GIF/Diagrama real */}
                  {p.mediaType === 'video' ? (
                    <div className="aspect-video rounded-lg bg-[#16161f] border border-[#1a1a25] grid place-items-center text-center p-6">
                      {/* TODO: Reemplazar con GIF/Diagrama real — <video autoPlay loop muted playsInline poster="/assets/smartfactory-poster.webp"><source src="/assets/smartfactory-demo.webm" type="video/webm" /></video> */}
                      <p className="text-xs font-mono text-zinc-500 max-w-md">
                        {/* eslint-disable-next-line */}
                        {p.mediaPlaceholder}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-[#16161f] border border-[#1a1a25] p-6 grid place-items-center text-center">
                      {/* TODO: Reemplazar con GIF/Diagrama real — <img src="/assets/rag-architecture.webp" alt="RAG architecture: PDF → Celery/Redis → pgvector → LangChain → LLM" loading="lazy" width="1200" height="675" /> */}
                      <p className="text-xs font-mono text-zinc-500 max-w-lg">
                        {p.mediaPlaceholder}
                      </p>
                      <p className="mt-2 text-[11px] text-zinc-600">Placeholder Excalidraw / Mermaid — exportar a WebP</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                {p.links.map(l => (
                  <a key={l.label} href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                    className={l.primary
                      ? 'inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors'
                      : 'inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-[#2a2a3a] text-white hover:bg-[#1a1a25] transition-colors'
                    }>
                    <l.icon size={16} /> {l.label} {!l.primary && <ExternalLink size={14} className="opacity-60" />}
                  </a>
                ))}
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
