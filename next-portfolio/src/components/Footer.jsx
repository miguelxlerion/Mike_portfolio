import { Mail, Link2, GitBranch, Phone } from 'lucide-react'

const LINKS_FALLBACK = [
  { label: 'miguelxlerion@gmail.com', href: 'mailto:miguelxlerion@gmail.com', icon: Mail },
  { label: 'linkedin.com/in/miguelrodriguez-dataviz', href: 'https://linkedin.com/in/miguelrodriguez-dataviz', icon: Link2 },
  { label: 'github.com/miguelxlerion', href: 'https://github.com/miguelxlerion', icon: GitBranch },
  { label: '+57 313 226 3265', href: 'tel:+573132263265', icon: Phone },
]

export default function Footer({ lang, contact, site }) {
  // Unified: use CMS contact.links if present, else fallback
  const links = contact?.links?.length ? contact.links.map(l => {
    const iconMap = { mail: Mail, linkedin: Link2, github: GitBranch, phone: Phone, globe: Link2 }
    return { label: l.value || l.label, href: l.href, icon: iconMap[l.icon] || Mail }
  }) : LINKS_FALLBACK
  const title = contact?.title ? contact.title.replace(/<[^>]*>/g, '') : null
  const isEs = lang === 'es'
  return (
    <footer id="contact" className="border-t border-[#1a1a25] bg-[#0a0a0f]">
      <div className="max-w-[1280px] mx-auto px-6 py-14">
        <h2 className="text-[28px] md:text-[40px] font-bold tracking-tight text-white leading-tight">
          {title || (isEs ? 'Construyamos algo con impacto.' : "Let's build something impactful.")}
        </h2>
        <p className="mt-3 text-zinc-400 max-w-xl">
          {contact?.subtitle ? <span dangerouslySetInnerHTML={{ __html: contact.subtitle }} /> : (isEs
            ? 'Disponible para roles remotos Senior Full-Stack, Creative Technologist o Tech Lead.'
            : 'Available for remote Senior Full-Stack, Creative Technologist, or Tech Lead roles.')}
        </p>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {links.map(l => (
            <a key={l.href} href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
              className="group flex items-center gap-3 rounded-2xl bg-[#12121a] border border-[#2a2a3a] px-4 py-4 hover:border-[#3a3a4f] transition-colors">
              <span className="w-9 h-9 rounded-xl bg-[#1a1a25] border border-[#2a2a3a] grid place-items-center text-zinc-400 group-hover:text-white transition-colors">
                <l.icon size={16} />
              </span>
              <span className="text-sm font-medium text-zinc-300 break-all">{l.label}</span>
            </a>
          ))}
        </div>

        <p className="mt-10 text-xs text-zinc-600">© {new Date().getFullYear()} Miguel E. Rodriguez — Built with React + Tailwind · WCAG AA · Lighthouse 90+</p>
      </div>
    </footer>
  )
}
