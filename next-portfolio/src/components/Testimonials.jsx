import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'

const DATA = [
  {
    quote: 'Miguel transformed our management data into actionable insights, reducing our decision-making time by 60%. His reusable UI component library was a game-changer for our municipal platform.',
    author: '[Nombre]',
    role: 'Director de Tecnología, Alcaldía de Caucasia (FOVIS)',
  },
  {
    quote: 'His ability to translate massive, complex neuroscientific datasets into gamified, navigable 3D environments reduced our analysis time by 40% for non-technical users.',
    author: '[Nombre]',
    role: 'Lead Researcher, AONC Neuroscientific Strategies',
  },
]

export default function Testimonials({ lang, testimonials }) {
  const isEs = lang === 'es'
  const list = testimonials?.length ? testimonials : DATA
  return (
    <section className="max-w-[1280px] mx-auto px-6 py-16 md:py-20 border-t border-[#1a1a25]">
      <p className="text-xs tracking-[0.2em] text-[#4f8cff] font-semibold">SOCIAL PROOF</p>
      <h2 className="mt-2 text-[28px] md:text-[36px] font-bold tracking-tight text-white">
        {isEs ? 'Confían equipos e instituciones' : 'Trusted by Teams & Institutions'}
      </h2>
      <p className="mt-2 text-sm text-zinc-500">Placeholders — validar con cliente antes de publicar.</p>

      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {list.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
            className="rounded-2xl bg-[#12121a] border border-[#2a2a3a] p-6 md:p-7"
          >
            <Quote size={20} className="text-[#4f8cff]/60 mb-3" />
            <p className="text-[15px] leading-relaxed text-zinc-300">“{t.quote}”</p>
            <p className="mt-4 text-sm font-semibold text-white">— {t.author}</p>
            <p className="text-xs text-zinc-500">{t.role}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
