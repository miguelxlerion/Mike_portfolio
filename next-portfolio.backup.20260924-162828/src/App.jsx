import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import Projects from './components/Projects'
import Testimonials from './components/Testimonials'
import Footer from './components/Footer'

export default function App() {
  const [lang, setLang] = useState('en')
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header lang={lang} setLang={setLang} />
      <main>
        <Hero lang={lang} />
        <About lang={lang} />
        <Projects lang={lang} />
        <Testimonials lang={lang} />
      </main>
      <Footer lang={lang} />
    </div>
  )
}
