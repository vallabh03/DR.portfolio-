import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { NavLink } from 'react-router'
import { doctor } from '../data/doctor'
import { BOOK_PATH, navRoutes } from '../data/navigation'
import { EASE, EASE_EXIT, EASE_IN_OUT, useDecorativeMotion } from '../lib/motion'
import ThemeToggle from './ThemeToggle'
import Button, { ArrowRight } from './Button'
import DrawLine from './DrawLine'

/** Full-screen navigation for phones and tablets, using the same routes as the header. */
export default function MobileMenu({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const animated = useDecorativeMotion()

  useEffect(() => {
    const restore = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>('nav a')?.focus({ preventScroll: true })
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      // Keep focus inside the dialog.
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>('a, button')
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      // Safari doesn't focus buttons on click, so fall back to the menu button.
      const opener = document.querySelector<HTMLElement>('[aria-controls="mobile-menu"]')
      const back = restore && restore !== document.body && restore.isConnected ? restore : opener
      if (!document.activeElement || document.activeElement === document.body) back?.focus({ preventScroll: true })
    }
  }, [onClose])

  return (
    <motion.div
      id="mobile-menu"
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-bg lg:hidden"
      initial={animated ? { clipPath: 'inset(0% 0% 100% 0%)' } : { opacity: 0 }}
      animate={{ clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }}
      exit={
        animated
          ? { clipPath: 'inset(0% 0% 100% 0%)', transition: { duration: 0.35, ease: EASE_EXIT } }
          : { opacity: 0, transition: { duration: 0.15, ease: EASE_EXIT } }
      }
      transition={{ duration: animated ? 0.55 : 0.2, ease: EASE_IN_OUT }}
    >
      <div className="container-page flex h-16 shrink-0 items-center justify-between md:h-[4.5rem]">
        <span className="font-serif text-lg sm:text-xl">{doctor.name}</span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md transition-colors duration-200 hover:text-accent"
          >
            <span className="relative block h-5 w-5" aria-hidden>
              <span className="absolute left-0 top-1/2 h-px w-5 rotate-45 bg-current" />
              <span className="absolute left-0 top-1/2 h-px w-5 -rotate-45 bg-current" />
            </span>
          </button>
        </div>
      </div>

      <nav aria-label="Primary" className="container-page flex flex-1 flex-col justify-center py-8">
        <ul>
          {navRoutes.map((r, i) => (
            <li key={r.path} className="relative">
              <DrawLine immediate delay={0.2 + i * 0.05} duration={0.7} className="absolute inset-x-0 bottom-0 bg-line" />
              <div className="overflow-hidden">
                <motion.div initial={animated ? { y: '100%' } : false} animate={{ y: '0%' }} transition={{ duration: 0.7, ease: EASE, delay: 0.18 + i * 0.05 }}>
                  <NavLink
                    to={r.path}
                    end={r.path === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex min-h-16 items-center justify-between gap-4 py-3 font-serif text-[clamp(1.75rem,7vw,2.5rem)] leading-tight transition-colors duration-200 hover:text-accent ${
                        isActive ? 'text-accent' : ''
                      }`
                    }
                  >
                    <span className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2">{r.label}</span>
                    <ArrowRight className="h-5 w-5 text-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent" />
                  </NavLink>
                </motion.div>
              </div>
            </li>
          ))}
        </ul>
      </nav>

      <motion.div
        className="container-page shrink-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        initial={animated ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.5 }}
      >
        <Button to={BOOK_PATH} onClick={onClose} className="w-full">
          Book a consultation <ArrowRight />
        </Button>
      </motion.div>
    </motion.div>
  )
}
