import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router'
import { chapters, pad } from '../data/chapters'
import { doctor } from '../data/doctor'
import { useChapters } from '../context/ChapterContext'
import ThemeToggle from './ThemeToggle'

const EASE = [0.16, 1, 0.3, 1] as const

/** Chapters shown in the persistent top navigation (Book lives in its own CTA). */
const navItems = chapters.filter((c) => c.id !== 'consultation')

export default function Navbar() {
  const { index, go, menuOpen, setMenuOpen } = useChapters()
  const current = chapters[index]

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-bg from-45% via-bg/85 to-transparent sm:h-32" aria-hidden />
        <div className="relative mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-4 sm:px-8 sm:py-5 lg:px-14 xl:px-20">
          {/* Brand */}
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault()
              go(0, { focus: true })
            }}
            className="pointer-events-auto group flex min-w-0 items-center gap-3"
            aria-label={`${doctor.name} — home`}
          >
            <span className="serif-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-lg transition-colors duration-500 group-hover:border-accent group-hover:text-accent">
              {doctor.initials}
            </span>
            <span className="hidden min-w-0 flex-col leading-tight xs:flex">
              <span className="truncate font-display text-sm font-medium tracking-[-0.01em]">{doctor.name}</span>
              <span className="truncate text-[0.6875rem] text-muted">{doctor.title}</span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav aria-label="Chapters" className="pointer-events-auto hidden xl:block">
            <ul className="flex items-center gap-1">
              {navItems.map((c) => {
                const i = chapters.indexOf(c)
                const active = i === index
                return (
                  <li key={c.id}>
                    <Link
                      to={c.path}
                      onClick={(e) => {
                        e.preventDefault()
                        go(i, { focus: true })
                      }}
                      aria-current={active ? 'page' : undefined}
                      className={`relative block px-2.5 py-2 text-[0.6875rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300 2xl:px-3.5 ${
                        active ? 'text-fg' : 'text-muted hover:text-fg'
                      }`}
                    >
                      {c.label}
                      {active && (
                        <motion.span
                          layoutId="nav-indicator"
                          className="absolute inset-x-2.5 -bottom-0.5 h-px bg-accent 2xl:inset-x-3.5"
                          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                        />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Right cluster */}
          <div className="pointer-events-auto flex items-center gap-1 sm:gap-2">
            <div className="mr-1 hidden h-5 overflow-hidden sm:block xl:hidden" aria-hidden>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={current.id}
                  className="eyebrow block whitespace-nowrap"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <span className="text-accent">{pad(index + 1)}</span> — {current.label}
                </motion.span>
              </AnimatePresence>
            </div>
            <ThemeToggle />
            <Link
              to="/consultation"
              onClick={(e) => {
                e.preventDefault()
                go(chapters.length - 1, { focus: true })
              }}
              className="hidden h-11 items-center rounded-full border border-line-strong px-5 text-[0.6875rem] font-medium uppercase tracking-[0.16em] transition-colors duration-300 hover:border-fg hover:bg-fg hover:text-bg md:flex"
              aria-current={current.id === 'consultation' ? 'page' : undefined}
            >
              Book
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open chapter index"
              aria-expanded={menuOpen}
              aria-controls="chapter-menu"
              className="group flex h-11 items-center gap-3 rounded-full pl-3 pr-2 text-[0.6875rem] font-medium uppercase tracking-[0.16em] transition-colors hover:text-accent xl:hidden"
            >
              <span className="hidden sm:inline">Index</span>
              <span className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-full border border-line-strong transition-colors group-hover:border-accent">
                <span className="block h-px w-4 bg-current" />
                <span className="block h-px w-2.5 translate-x-[3px] bg-current transition-transform duration-500 group-hover:translate-x-0 group-hover:w-4" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>{menuOpen && <MenuOverlay onClose={() => setMenuOpen(false)} />}</AnimatePresence>
    </>
  )
}

function MenuOverlay({ onClose }: { onClose: () => void }) {
  const { index, go } = useChapters()
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)
  // When a chapter is chosen, focus belongs to the new chapter, not the menu button.
  const skipRestore = useRef(false)

  useEffect(() => {
    restoreFocus.current = document.activeElement as HTMLElement
    const first = panelRef.current?.querySelector<HTMLElement>('a[aria-current="page"], a')
    first?.focus({ preventScroll: true })

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      // Keep focus inside the dialog.
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>('a, button')
        const firstEl = focusables[0]
        const lastEl = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (!skipRestore.current) restoreFocus.current?.focus?.({ preventScroll: true })
    }
  }, [onClose])

  return (
    <motion.div
      id="chapter-menu"
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Chapter index"
      data-modal-open
      className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-bg"
      initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="mx-auto flex w-full max-w-[1680px] items-center justify-between px-4 py-4 sm:px-8 sm:py-5 lg:px-14">
        <span className="eyebrow">Index</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chapter index"
            className="group flex h-11 items-center gap-3 rounded-full pl-3 pr-2 text-[0.6875rem] font-medium uppercase tracking-[0.16em] hover:text-accent"
          >
            <span className="hidden sm:inline">Close</span>
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line-strong transition-transform duration-500 group-hover:rotate-90">
              <span className="absolute h-px w-4 rotate-45 bg-current" />
              <span className="absolute h-px w-4 -rotate-45 bg-current" />
            </span>
          </button>
        </div>
      </div>

      <nav aria-label="All chapters" className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col justify-center px-4 pb-10 sm:px-8 lg:px-14">
        <ul className="border-t border-line">
          {chapters.map((c, i) => (
            <li key={c.id} className="overflow-hidden border-b border-line">
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.25 + i * 0.04 }}
              >
                <Link
                  to={c.path}
                  onClick={(e) => {
                    e.preventDefault()
                    skipRestore.current = true
                    onClose()
                    go(i, { focus: true })
                  }}
                  aria-current={i === index ? 'page' : undefined}
                  className="group flex items-baseline gap-4 py-2.5 sm:gap-8 sm:py-3"
                >
                  <span className={`w-7 font-display text-xs tabular-nums ${i === index ? 'text-accent' : 'text-subtle'}`}>
                    {pad(i + 1)}
                  </span>
                  <span
                    className={`font-display text-[clamp(1.5rem,min(5.2vh,8.5vw),3.5rem)] font-light leading-[1.05] tracking-[-0.04em] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-3 group-hover:text-accent ${
                      i === index ? 'text-fg' : 'text-fg/70'
                    }`}
                  >
                    {c.title}
                  </span>
                  {i === index && (
                    <span className="ml-auto hidden self-center text-[0.6875rem] uppercase tracking-[0.16em] text-muted sm:inline">
                      You are here
                    </span>
                  )}
                </Link>
              </motion.div>
            </li>
          ))}
        </ul>
      </nav>
    </motion.div>
  )
}
