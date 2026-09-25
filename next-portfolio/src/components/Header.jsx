import { useState } from 'react'
import { motion } from 'framer-motion'
import { Menu, X, Download, Globe } from 'lucide-react'

const NAV = [
  { label: 'About', href: '#about', labelEs: 'Sobre mí' },
  { label: 'Projects', href: '#projects', labelEs: 'Proyectos' },
  { label: 'Skills', href: '#skills', labelEs: 'Habilidades' },
  { label: 'Contact', href: '#contact', labelEs: 'Contacto' },
]

export default function Header({ lang, setLang, site, showSections }) {
  const [open, setOpen] = useState(false)
  const t = (en, es) => lang === 'es' ? es : en
  const brand = site?.brand || 'Miguel E. Rodriguez'
  const sc = showSections || {}
  const isVisible = (href) => {
    if(href.includes('#about') && sc.about===false) return false
    if(href.includes('#projects') && sc.projects===false) return false
    if(href.includes('#skills') && sc.about===false) return false
    if(href.includes('#contact') && sc.contact===false) return false
    return true
  }
  // site.nav from CMS if present, else fallback — filtered by showSections
  const baseNav = site?.nav?.length ? site.nav.filter(n => ['#about','#projects','#skills','#contact'].some(k=>n.href.includes(k))).map(n=>({label:n.label, href:n.href, labelEs:n.label})) : NAV
  const nav = baseNav.filter(n => isVisible(n.href))

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0f]/80 border-b border-[#2a2a3a]/50">
      <div className="max-w-[1280px] mx-auto px-6 h-[64px] flex items-center justify-between gap-4">
        <a href="#" className="font-bold tracking-tight text-[15px] text-white shrink-0">
          {brand.includes(' ') ? <><span>{brand.split(' ')[0]} </span><span className="text-[#4f8cff]">{brand.split(' ').slice(1).join(' ')}</span></> : brand}
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary">
          {(nav.length ? nav : NAV).map(l => (
            <a key={l.href} href={l.href}
              className="text-[13px] font-medium tracking-wide text-zinc-400 hover:text-white transition-colors">
              {t(l.label, l.labelEs)}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#2a2a3a] text-xs font-medium text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            aria-label="Toggle language"
          >
            <Globe size={14} /> {lang === 'en' ? 'EN' : 'ES'} <span className="opacity-40">/</span> {lang === 'en' ? 'ES' : 'EN'}
          </button>
          <a href="/assets/Miguel_Rodriguez_CV.pdf" download
            className="inline-flex items-center gap-2 bg-white text-black px-5 py-2 rounded-full text-[13px] font-semibold hover:bg-zinc-200 transition-colors">
            <Download size={14} /> {t('Download Resume', 'Descargar CV')}
          </a>
        </div>

        {/* Mobile */}
        <button className="md:hidden p-2 text-zinc-400" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-[#2a2a3a] bg-[#0a0a0f] px-6 py-5 flex flex-col gap-4">
          {(nav.length ? nav : NAV).map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm text-zinc-300">{t(l.label, l.labelEs)}</a>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="flex-1 py-2 rounded-full border border-[#2a2a3a] text-xs text-zinc-400">
              <Globe size={14} className="inline mr-1" /> {lang.toUpperCase()}
            </button>
            <a href="/assets/Miguel_Rodriguez_CV.pdf" download className="flex-1 text-center py-2 rounded-full bg-white text-black text-xs font-semibold">
              {t('Download Resume', 'Descargar CV')}
            </a>
          </div>
        </motion.div>
      )}
    </header>
  )
}
