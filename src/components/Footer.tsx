import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import { doctor, hasValue } from '../data/doctor'
import { BOOK_PATH, BOOK_TITLE, navRoutes } from '../data/navigation'
import LegalDialog, { LEGAL_TITLES, publishedLegalDocs, type LegalDoc } from './LegalDialog'
import { ArrowRight, ArrowUp } from './Button'

/** Editorial footer shared by every page. */
export default function Footer() {
  const [legal, setLegal] = useState<LegalDoc | null>(null)
  const year = new Date().getFullYear()
  const { contact } = doctor
  const links = [...navRoutes, { path: BOOK_PATH, label: BOOK_TITLE }]
  // Only confirmed details are listed; the column is left out if there are none.
  const address = [contact.clinic, contact.addressLine, contact.locality, contact.postcode].filter(hasValue)
  const hasPractice = address.length > 0 || hasValue(contact.phone) || hasValue(contact.email)

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page pb-28 pt-16 md:pb-12 md:pt-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="font-serif text-[clamp(2rem,1.6rem+1.6vw,2.75rem)] leading-[1.05] tracking-[-0.02em]">{doctor.name}</p>
            {hasValue(doctor.title) && <p className="mt-3">{doctor.title}</p>}
            <Link to={BOOK_PATH} className="group/btn mt-8 inline-flex min-h-11 items-center gap-2 font-medium text-accent hover:text-accent-hover">
              <span className="link-underline">{BOOK_TITLE}</span>
              <ArrowRight />
            </Link>
          </div>

          <nav aria-label="Footer" className="md:col-span-3">
            <h2 className="label mb-4">Pages</h2>
            <ul className="grid grid-cols-2 gap-x-6 md:grid-cols-1">
              {links.map((l) => (
                <li key={l.path}>
                  <NavLink
                    to={l.path}
                    end={l.path === '/'}
                    className={({ isActive }) => `flex min-h-11 items-center ${isActive ? 'text-accent' : 'text-fg/85 hover:text-fg'}`}
                  >
                    <span className="link-underline">{l.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {hasPractice && (
            <div className="md:col-span-4">
              <h2 className="label mb-4">Practice</h2>
              <address className="space-y-1.5 not-italic text-fg/85">
                {address.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
                {hasValue(contact.phone) && (
                  <p className={address.length > 0 ? 'pt-3' : ''}>
                    <a className="link-underline" href={`tel:${contact.phone.replace(/\s+/g, '')}`}>
                      {contact.phone}
                    </a>
                  </p>
                )}
                {hasValue(contact.email) && (
                  <p className={address.length > 0 && !hasValue(contact.phone) ? 'pt-3' : ''}>
                    <a className="link-underline break-all" href={`mailto:${contact.email}`}>
                      {contact.email}
                    </a>
                  </p>
                )}
              </address>
            </div>
          )}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {doctor.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-6">
            {/* Legal documents appear once their approved text is published */}
            {publishedLegalDocs.map((d) => (
              <button key={d} type="button" className="min-h-11 hover:text-fg" onClick={() => setLegal(d)}>
                <span className="link-underline">{LEGAL_TITLES[d]}</span>
              </button>
            ))}
            <button type="button" className="inline-flex min-h-11 items-center gap-1.5 hover:text-fg" onClick={() => window.scrollTo({ top: 0 })}>
              <span className="link-underline">Back to top</span>
              <ArrowUp />
            </button>
          </div>
        </div>
        <p className="measure mt-4 text-sm leading-relaxed text-muted">
          Information on this website is general in nature and is not a substitute for individual medical advice. In an
          emergency, contact your local emergency services.
        </p>
      </div>

      <LegalDialog doc={legal} onClose={() => setLegal(null)} />
    </footer>
  )
}
