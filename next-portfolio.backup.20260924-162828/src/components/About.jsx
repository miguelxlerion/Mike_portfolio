import { motion } from 'framer-motion'

const GROUPS = [
  {
    title: '3D & Real-Time',
    items: ['Three.js', 'Unity 3D', 'Unreal Engine 5', 'WebSockets', 'MQTT'],
  },
  {
    title: 'AI & Data',
    items: ['LangChain', 'pgvector', 'Python', 'Django', 'RAG Systems'],
  },
  {
    title: 'Frontend & DevOps',
    items: ['React.js', 'Next.js', 'TypeScript', 'Node.js', 'Docker', 'Linux SysAdmin'],
  },
]

export default function About({ lang }) {
  const isEs = lang === 'es'
  return (
    <section id="about" className="max-w-[1280px] mx-auto px-6 py-16 md:py-24 border-t border-[#1a1a25]">
      <motion.div
        initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
      >
        <p className="text-xs tracking-[0.2em] text-[#4f8cff] font-semibold mb-3">ABOUT</p>
        <h2 className="text-[28px] md:text-[36px] font-bold tracking-tight text-white leading-tight">
          {isEs ? 'Bilingüe en Diseño & Ingeniería' : 'Bilingual in Design & Engineering'}
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-zinc-400 max-w-3xl">
          {isEs
            ? 'Empecé en 3D y arte digital, luego pivoté a construir las herramientas que usan los creativos. Hoy transformo requisitos de negocio complejos en plataformas web de alto rendimiento. Mi superpoder es ownership end-to-end: desde pipelines de assets 3D (Blender/MaxScript) hasta arquitecturas de datos resilientes (Postgres/pgvector, WebSockets/MQTT).'
            : 'Started in 3D & digital art, I pivoted to build the tools creatives use. Today, I specialize in turning complex business requirements into high-performance web platforms. My superpower is end-to-end ownership: from 3D asset pipelines (Blender/MaxScript) to resilient data architectures (Postgres/pgvector, WebSockets/MQTT).'}
        </p>
      </motion.div>

      <div id="skills" className="mt-10 grid md:grid-cols-3 gap-4">
        {GROUPS.map((g, i) => (
          <motion.div
            key={g.title}
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
            className="rounded-2xl bg-[#12121a] border border-[#2a2a3a] p-6"
          >
            <h3 className="text-sm font-semibold text-white mb-3">{g.title}</h3>
            <div className="flex flex-wrap gap-2">
              {g.items.map(tag => (
                <span key={tag} className="px-3 py-1.5 rounded-full bg-[#1a1a25] border border-[#2a2a3a] text-xs font-medium text-zinc-300">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
