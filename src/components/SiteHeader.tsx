import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useLocation } from 'react-router'
import { doctor } from '../data/doctor'
import { BOOK_PATH, primaryNav, sections, type SectionId } from '../data/navigation'
import { useScrollSpy } from '../hooks/useScrollSpy'
import { useScrolledPast } from '../hooks/useScrolledPast'
import ThemeToggle from './ThemeToggle'
import Button from './Button'
import MobileMenu from './MobileMenu'

const sectionIds = sections.map((s) => s.id)

/** Sections without their own nav link highlight the nearest related one. */
const navParent: Partial<Record<SectionId, SectionId>> = {
  approach: 'expertise',
  credentials: 'experience',
}

export default function SiteHeader() {
  const { pathname } = useLocation()
  const onHome = pathname === '/'
  const scrolled = useScrolledPast(8)
  const spied = useScrollSpy(sectionIds, onHome) as SectionId | null
  const active = spied ? (navParent[spied] ?? spied) : null
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b transition-colors duration-200 ${
          scrolled ? 'border-line bg-bg' : 'border-transparent bg-bg'
        }`}
      >
        <div className="container-page flex h-16 items-center justify-between gap-4 md:h-[4.5rem]">
          {/* Wordmark */}
          <Link to="/" className="group flex min-h-11 min-w-0 items-center gap-3" aria-label={`${doctor.name} — home`}>
            <span className="em-serif flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-lg transition-colors duration-200 group-hover:border-accent group-hover:text-accent">
              {doctor.initials}
            </span>
            <span className="truncate font-serif text-lg leading-none tracking-[-0.01em] sm:text-xl lg:text-lg xl:text-xl">{doctor.name}</span>
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center xl:gap-1">
              {primaryNav.map((item) => {
                const isActive = active === item.id
                return (
                  <li key={item.id}>
                    <Link
                      to={`/#${item.id}`}
                      aria-current={isActive ? 'location' : undefined}
                      className={`relative flex min-h-11 items-center px-2.5 text-[0.9375rem] xl:px-3 transition-colors duration-200 ${
                        isActive ? 'text-fg' : 'text-muted hover:text-fg'
                      }`}
                    >
                      {item.label}
                      {isActive && (
                        <motion.span
                          layoutId="nav-underline"
                          className="absolute inset-x-2.5 bottom-2 h-px bg-accent xl:inset-x-3"
                          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                        />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Right cluster */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-1 xl:gap-2">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <div className="hidden md:block">
              <Button to={BOOK_PATH} ariaLabel="Book a consultation">
                Book consultation
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md transition-colors duration-200 hover:bg-accent-soft hover:text-accent lg:hidden"
            >
              <span className="flex w-5 flex-col gap-[5px]" aria-hidden>
                <span className="block h-px w-full bg-current" />
                <span className="block h-px w-full bg-current" />
                <span className="block h-px w-3/5 bg-current" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>{menuOpen && <MobileMenu active={active} onClose={() => setMenuOpen(false)} />}</AnimatePresence>
    </>
  )
}
