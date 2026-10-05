import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router'
import { doctor } from '../data/doctor'
import { BOOK_PATH, primaryNav } from '../data/navigation'
import ThemeToggle from './ThemeToggle'
import Button, { ArrowRight } from './Button'
import { EASE } from './Reveal'

/** Full-screen navigation for phones and tablets. */
export default function MobileMenu({ active, onClose }: { active: string | null; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)

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
      const back = restore && restore !== document.body ? restore : opener
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      transition={{ duration: 0.25 }}
    >
      <div className="container-page flex h-16 shrink-0 items-center justify-between md:h-[4.5rem]">
        <span className="font-serif text-lg sm:text-xl">{doctor.name}</span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md transition-colors duration-200 hover:bg-accent-soft hover:text-accent"
          >
            <span className="relative block h-5 w-5" aria-hidden>
              <span className="absolute left-0 top-1/2 h-px w-5 rotate-45 bg-current" />
              <span className="absolute left-0 top-1/2 h-px w-5 -rotate-45 bg-current" />
            </span>
          </button>
        </div>
      </div>

      <nav aria-label="Primary" className="container-page flex flex-1 flex-col justify-center py-8">
        <ul className="border-t border-line">
          {primaryNav.map((item, i) => (
            <motion.li
              key={item.id}
              className="border-b border-line"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.05 + i * 0.04 }}
            >
              <Link
                to={`/#${item.id}`}
                onClick={onClose}
                aria-current={active === item.id ? 'location' : undefined}
                className={`group flex min-h-16 items-center justify-between gap-4 py-3 font-serif text-[clamp(1.75rem,7vw,2.5rem)] leading-tight transition-colors duration-200 hover:text-accent ${
                  active === item.id ? 'text-accent' : ''
                }`}
              >
                {item.label}
                <ArrowRight className="h-5 w-5 text-muted group-hover:text-accent" />
              </Link>
            </motion.li>
          ))}
        </ul>
      </nav>

      <div className="container-page shrink-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Button to={BOOK_PATH} onClick={onClose} className="w-full">
          Book a consultation <ArrowRight />
        </Button>
      </div>
    </motion.div>
  )
}
