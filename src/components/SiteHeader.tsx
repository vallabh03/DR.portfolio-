import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link, NavLink, useLocation } from 'react-router'
import { doctor } from '../data/doctor'
import { BOOK_PATH, navRoutes } from '../data/navigation'
import { useScrolledPast } from '../hooks/useScrolledPast'
import { EASE_IN_OUT, useDecorativeMotion } from '../lib/motion'
import ThemeToggle from './ThemeToggle'
import Button from './Button'
import MobileMenu from './MobileMenu'

/** A hairline that runs across the bottom of the header on every page change. */
function RouteProgress() {
  const { key } = useLocation()
  const firstKey = useRef(key)
  const animated = useDecorativeMotion()
  if (key === firstKey.current || !animated) return null
  return (
    <motion.span
      key={key}
      aria-hidden
      className="absolute inset-x-0 -bottom-px h-px origin-left bg-accent"
      initial={{ scaleX: 0, opacity: 1 }}
      animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0] }}
      transition={{ duration: 0.9, ease: EASE_IN_OUT, times: [0, 0.7, 1] }}
    />
  )
}

export default function SiteHeader() {
  const scrolled = useScrolledPast(8)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <header className={`sticky top-0 z-50 border-b bg-bg transition-colors duration-200 ${scrolled ? 'border-line' : 'border-transparent'}`}>
        <div className="container-page flex h-16 items-center justify-between gap-4 md:h-[4.5rem]">
          {/* Wordmark */}
          <Link to="/" className="group flex min-h-11 min-w-0 items-center gap-3" aria-label={`${doctor.name}, home`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-strong font-serif text-base transition-colors duration-300 group-hover:border-accent group-hover:text-accent">
              {doctor.initials}
            </span>
            <span className="truncate font-serif text-lg leading-none tracking-[-0.01em] sm:text-xl lg:hidden xl:inline">{doctor.name}</span>
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center">
              {navRoutes.map((r) => (
                <li key={r.path}>
                  <NavLink
                    to={r.path}
                    end={r.path === '/'}
                    className={({ isActive }) =>
                      `relative flex min-h-11 items-center px-3 text-[0.9375rem] transition-colors duration-200 ${
                        isActive ? 'text-fg' : 'text-muted hover:text-fg'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {r.label}
                        {isActive && (
                          <motion.span
                            layoutId="nav-underline"
                            className="absolute inset-x-3 bottom-2 h-px bg-accent"
                            transition={{ duration: 0.45, ease: EASE_IN_OUT }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right cluster */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <div className="hidden md:block">
              <Button to={BOOK_PATH}>Book a consultation</Button>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="group -mr-2 flex h-11 w-11 items-center justify-center rounded-md transition-colors duration-200 hover:text-accent lg:hidden"
            >
              <span className="flex w-5 flex-col items-end gap-[5px]" aria-hidden>
                <span className="block h-px w-full bg-current" />
                <span className="block h-px w-full bg-current" />
                <span className="block h-px w-3/5 bg-current transition-[width] duration-300 group-hover:w-full" />
              </span>
            </button>
          </div>
        </div>
        <RouteProgress />
      </header>

      <AnimatePresence>{menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}</AnimatePresence>
    </>
  )
}
