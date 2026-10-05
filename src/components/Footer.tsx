import { useState } from 'react'
import { Link } from 'react-router'
import { chapters } from '../data/chapters'
import { doctor, isPlaceholder } from '../data/doctor'
import { useChapters } from '../context/ChapterContext'
import LegalDialog, { type LegalDoc } from './LegalDialog'

const footerNav = ['about', 'experience', 'credentials', 'expertise', 'approach', 'research', 'contact']

/** Editorial footer rendered at the end of every chapter. */
export default function Footer() {
  const { go, scrollToTop } = useChapters()
  const [legal, setLegal] = useState<LegalDoc | null>(null)
  const year = new Date().getFullYear()
  const { contact } = doctor

  const toChapter = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    go(
      chapters.findIndex((c) => c.id === id),
      { focus: true },
    )
  }

  return (
    <footer className="border-t border-line">
      <div className="mx-auto w-full max-w-[1680px] px-5 pb-32 pt-16 sm:px-8 md:pb-36 lg:px-14 xl:px-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="font-display text-[clamp(2rem,4vw,3.5rem)] font-light uppercase leading-[0.95] tracking-[-0.045em]">
              Dr. Abhinav
              <br />
              Thaduri
            </p>
            <p className="mt-4 text-sm text-muted">{doctor.title}</p>
            <Link
              to="/consultation"
              onClick={toChapter('consultation')}
              className="group mt-8 inline-flex items-center gap-3 text-sm font-medium"
              data-cursor="OPEN"
            >
              <span className="link-underline">Book a consultation</span>
              <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M4 12h16M14 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <nav aria-label="Footer" className="md:col-span-3">
            <h2 className="eyebrow mb-5">Navigation</h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-1">
              {footerNav.map((id) => {
                const c = chapters.find((ch) => ch.id === id)!
                return (
                  <li key={id}>
                    <Link to={c.path} onClick={toChapter(id)} className="link-underline text-fg/80 hover:text-fg">
                      {c.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="md:col-span-4">
            <h2 className="eyebrow mb-5">Practice</h2>
            <address className="space-y-1.5 text-sm not-italic text-fg/80">
              <p>{contact.clinic}</p>
              <p className={isPlaceholder(contact.address) ? 'text-muted' : ''}>{contact.address}</p>
              <p className={isPlaceholder(contact.city) ? 'text-muted' : ''}>{contact.city}</p>
              <p className="pt-2">
                {contact.phone ? (
                  <a className="link-underline" href={`tel:${contact.phone.replace(/\s+/g, '')}`}>
                    {contact.phone}
                  </a>
                ) : (
                  <span className="text-muted">[PHONE]</span>
                )}
              </p>
              <p>
                {contact.email ? (
                  <a className="link-underline" href={`mailto:${contact.email}`}>
                    {contact.email}
                  </a>
                ) : (
                  <span className="text-muted">[EMAIL]</span>
                )}
              </p>
            </address>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {doctor.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <button type="button" className="link-underline hover:text-fg" onClick={() => setLegal('privacy')}>
              Privacy
            </button>
            <button type="button" className="link-underline hover:text-fg" onClick={() => setLegal('terms')}>
              Terms
            </button>
            <button type="button" className="link-underline hover:text-fg" onClick={scrollToTop}>
              Back to top ↑
            </button>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-[0.6875rem] leading-relaxed text-subtle">
          Information on this website is general in nature and is not a substitute for individual medical advice. In an
          emergency, contact your local emergency services.
        </p>
      </div>

      <LegalDialog doc={legal} onClose={() => setLegal(null)} />
    </footer>
  )
}
