import { useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { doctor, hasValue } from '../data/doctor'
import { BOOK_PATH, BOOK_TITLE, navRoutes } from '../data/navigation'
import LegalDialog, { LEGAL_TITLES, publishedLegalDocs, type LegalDoc } from './LegalDialog'
import CookieBanner from './CookieBanner'
import { ArrowRight, ArrowUp } from './Button'

/* Small line icons for the footer, drawn to match the site's other icons. */
const ICONS = {
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8 10.5V16M8 7.8v.2M11.5 16v-5.5M11.5 13c0-1.6 1-2.5 2.3-2.5S16 11.4 16 13v3" />
    </>
  ),
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <path d="M16.8 7.2v.1" />
    </>
  ),
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
} satisfies Record<string, ReactNode>

type IconName = keyof typeof ICONS

function Icon({ name, className = 'h-[18px] w-[18px]' }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {ICONS[name]}
    </svg>
  )
}

/** The icon for a profile link, from its label or address. */
const iconForLink = (label: string, href: string): IconName => {
  const s = `${label} ${href}`.toLowerCase()
  if (s.includes('linkedin')) return 'linkedin'
  if (s.includes('instagram')) return 'instagram'
  return 'link'
}

const ROUND = 'flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--f-line)] bg-[var(--f-tile)] text-[var(--f-text)] transition-colors duration-300 hover:border-[var(--f-accent)] hover:text-[var(--f-accent)]'
const HEADING = 'mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--f-muted)]'
const LINK = 'inline-flex min-h-10 items-center text-[var(--f-text)]/85 transition-colors duration-200 hover:text-[var(--f-text)]'

/** Site footer: a deep blue band shared by every page. */
export default function Footer() {
  const [legal, setLegal] = useState<LegalDoc | null>(null)
  const year = new Date().getFullYear()
  const { contact } = doctor
  const address = [contact.clinic, contact.addressLine, contact.locality, contact.postcode].filter(hasValue)
  const hours = contact.hours.filter((h) => hasValue(h.days) && hasValue(h.time))
  // Profile links (LinkedIn, Instagram…) appear here once they are added to the contact details.
  const profiles = contact.links.filter((l) => hasValue(l.label) && hasValue(l.href))

  return (
    <footer>
      <div className="site-footer bg-[var(--f-bg)] text-[var(--f-text)]">
        <div className="container-page pb-28 pt-16 md:pb-12 md:pt-20">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
            {/* Brand */}
            <div className="lg:col-span-4">
              <Link to="/" className="inline-flex items-center gap-3" aria-label={`${doctor.name}, home`}>
                <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--f-accent)] font-serif text-lg text-[var(--f-bg)]">
                  {doctor.initials}
                </span>
                <span className="font-serif text-2xl leading-tight tracking-[-0.01em]">{doctor.name}</span>
              </Link>
              {hasValue(doctor.title) && <p className="mt-5 max-w-xs leading-relaxed text-[var(--f-muted)]">{doctor.title}</p>}
              <ul className="mt-6 flex flex-wrap gap-3">
                <li>
                  <Link to={BOOK_PATH} className={ROUND} aria-label={BOOK_TITLE} title={BOOK_TITLE}>
                    <Icon name="calendar" />
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className={ROUND} aria-label="Visit and contact" title="Visit and contact">
                    <Icon name="pin" />
                  </Link>
                </li>
                {profiles.map((p) => (
                  <li key={p.href}>
                    <a href={p.href} target="_blank" rel="noopener noreferrer" className={ROUND} aria-label={`${p.label} (opens in a new tab)`} title={p.label}>
                      <Icon name={iconForLink(p.label, p.href)} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pages, in two short columns */}
            <nav aria-label="Footer" className="lg:col-span-3">
              <h2 className={HEADING}>Pages</h2>
              <ul className="grid grid-flow-col grid-cols-2 grid-rows-4 gap-x-6">
                {navRoutes.map((l) => (
                  <li key={l.path}>
                    <NavLink to={l.path} end={l.path === '/'} className={({ isActive }) => `${LINK} ${isActive ? '!text-[var(--f-accent)]' : ''}`}>
                      <span className="link-underline">{l.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Legal documents appear once their approved text is published */}
            {publishedLegalDocs.length > 0 && (
              <div className="lg:col-span-2">
                <h2 className={HEADING}>Legal</h2>
                <ul>
                  {publishedLegalDocs.map((d) => (
                    <li key={d}>
                      <button type="button" className={`${LINK} text-left`} onClick={() => setLegal(d)}>
                        <span className="link-underline">{LEGAL_TITLES[d]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Practice: where and when, with the booking link */}
            <div className="lg:col-span-3">
              <h2 className={HEADING}>Practice</h2>
              <ul className="space-y-5">
                {address.length > 0 && (
                  <li className="flex gap-3">
                    <span className="mt-0.5 text-[var(--f-accent)]">
                      <Icon name="pin" />
                    </span>
                    <address className="not-italic leading-snug">
                      {address.map((line, i) => (
                        <span key={i} className={i === 0 ? 'block' : 'mt-1 block text-sm text-[var(--f-muted)]'}>
                          {line}
                        </span>
                      ))}
                    </address>
                  </li>
                )}
                {hours.map((h) => (
                  <li key={h.days} className="flex gap-3">
                    <span className="mt-0.5 text-[var(--f-accent)]">
                      <Icon name="clock" />
                    </span>
                    <span className="leading-snug">
                      {h.days}
                      <span className="mt-1 block text-sm text-[var(--f-muted)]">{h.time}</span>
                    </span>
                  </li>
                ))}
                {hasValue(contact.phone) && (
                  <li>
                    <a className={LINK} href={`tel:${contact.phone.replace(/\s+/g, '')}`}>
                      <span className="link-underline">{contact.phone}</span>
                    </a>
                  </li>
                )}
                {hasValue(contact.email) && (
                  <li>
                    <a className={`${LINK} break-all`} href={`mailto:${contact.email}`}>
                      <span className="link-underline">{contact.email}</span>
                    </a>
                  </li>
                )}
                <li>
                  <Link to={BOOK_PATH} className="group/btn inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--f-accent)] hover:text-[var(--f-text)]">
                    <span className="link-underline">{BOOK_TITLE}</span>
                    <ArrowRight />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-[var(--f-line)] pt-6 text-sm text-[var(--f-muted)] md:flex-row md:items-start md:justify-between md:gap-10">
            <div>
              <p>
                © {year} {doctor.name}. All rights reserved.
              </p>
              <p className="measure mt-2 leading-relaxed">
                Information on this website is general in nature and is not a substitute for individual medical advice. In an emergency, contact your local emergency
                services.
              </p>
            </div>
            <button type="button" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 self-start hover:text-[var(--f-text)]" onClick={() => window.scrollTo({ top: 0 })}>
              <span className="link-underline">Back to top</span>
              <ArrowUp />
            </button>
          </div>
        </div>
      </div>

      {/* Kept outside the dark band, so they use the page's own colours */}
      <LegalDialog doc={legal} onClose={() => setLegal(null)} />
      <CookieBanner onOpenPrivacy={() => setLegal('privacy')} />
    </footer>
  )
}
