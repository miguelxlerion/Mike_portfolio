import { useState, useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import Projects from './components/Projects'
import Testimonials from './components/Testimonials'
import Footer from './components/Footer'

export default function App() {
  const [lang, setLang] = useState('en')
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/data/portfolio.json', { cache: 'no-store' })
        if (!res.ok) throw new Error('fetch failed')
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch {
        // fallback to hardcoded content in each component
        if (!cancelled) setData(null)
      }
    }
    load()
    // live update from admin preview iframe postMessage (when embedded) + localStorage polling fallback
    const onMsg = (e) => {
      if (e.data?.type === 'portfolio-update' && e.data.data) setData(e.data.data)
    }
    window.addEventListener('message', onMsg)
    const iv = setInterval(async () => {
      try {
        const r = await fetch('/data/portfolio.json', { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          // shallow compare via hero.subtitle
          setData(prev => (JSON.stringify(prev?.hero) !== JSON.stringify(j.hero) ? j : prev))
        }
      } catch {}
    }, 3000)
    return () => { cancelled = true; window.removeEventListener('message', onMsg); clearInterval(iv) }
  }, [])

  const sc = data?.settings?.showSections || {}
  const show = (k) => sc[k] !== false
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header lang={lang} setLang={setLang} site={data?.site} showSections={sc} />
      <main>
        {show('hero') && <Hero lang={lang} hero={data?.hero} />}
        {show('about') && <About lang={lang} about={data?.about} />}
        {show('projects') && <Projects lang={lang} projects={data?.projects} />}
        {show('portfolio') && <Testimonials lang={lang} testimonials={data?.testimonials} />}
        {/* keep Vite hardcoded content as fallback — data null = original spec preserved */}
      </main>
      {show('contact') && <Footer lang={lang} contact={data?.contact} site={data?.site} />}
    </div>
  )
}
