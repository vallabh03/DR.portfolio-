import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useSpring } from 'framer-motion'
import { chapters, pad } from '../data/chapters'
import { useAppReady, useChapters } from '../context/ChapterContext'

const HINT_KEY = 'at-nav-hint-seen'
const EASE = [0.16, 1, 0.3, 1] as const

function Arrow({ dir }: { dir: 'left' | 'right' | 'up' | 'down' }) {
  const rot = { left: 180, right: 0, up: -90, down: 90 }[dir]
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" style={{ transform: `rotate(${rot}deg)` }} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const btn =
  'group relative flex items-center justify-center rounded-full text-fg transition-[background-color,color,opacity,transform] duration-300 hover:bg-fg hover:text-bg active:scale-95 disabled:pointer-events-none disabled:opacity-30'

/**
 * Persistent bottom controls: ← prev · chapter dots · ↑ ↓ · next →
 * Compact variant on small screens. A hairline shows scroll progress.
 */
export default function NavigationControls() {
  const { index, count, next, prev, go, scrollStep, scrollProgress, menuOpen } = useChapters()
  const ready = useAppReady()
  const progress = useSpring(scrollProgress, { stiffness: 200, damping: 30, mass: 0.3 })
  const [edge, setEdge] = useState({ top: true, bottom: false })
  const [hint, setHint] = useState(false)

  useMotionValueEvent(scrollProgress, 'change', (v) => {
    const top = v <= 0.001
    const bottom = v >= 0.999
    setEdge((e) => (e.top === top && e.bottom === bottom ? e : { top, bottom }))
  })

  useEffect(() => {
    setEdge({ top: true, bottom: false })
  }, [index])

  // One-time onboarding hint, like the reference's "use the ← → keys" tip.
  useEffect(() => {
    if (!ready) return
    let seen = false
    try {
      seen = !!localStorage.getItem(HINT_KEY)
    } catch {
      /* ignore */
    }
    if (seen) return
    const show = window.setTimeout(() => setHint(true), 1400)
    const hide = window.setTimeout(() => {
      setHint(false)
      try {
        localStorage.setItem(HINT_KEY, '1')
      } catch {
        /* ignore */
      }
    }, 8500)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
    }
  }, [ready])

  useEffect(() => {
    if (index !== 0 && hint) {
      setHint(false)
      try {
        localStorage.setItem(HINT_KEY, '1')
      } catch {
        /* ignore */
      }
    }
  }, [index, hint])

  const first = index === 0
  const last = index === count - 1

  return (
    <motion.nav
      aria-label="Chapter controls"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-5"
      initial={{ y: 40, opacity: 0 }}
      animate={ready && !menuOpen ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
      transition={{ duration: 0.9, ease: EASE, delay: ready ? 0.6 : 0 }}
    >
      <AnimatePresence>
        {hint && (
          <motion.p
            className="mb-3 rounded-full border border-line bg-surface/80 px-4 py-2 text-center text-xs text-muted backdrop-blur-md"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            role="note"
          >
            <span className="hidden md:inline">
              Navigate chapters with <kbd className="font-sans text-fg">←</kbd> <kbd className="font-sans text-fg">→</kbd> · scroll with{' '}
              <kbd className="font-sans text-fg">↑</kbd> <kbd className="font-sans text-fg">↓</kbd>
            </span>
            <span className="md:hidden">Swipe left or right to change chapters</span>
          </motion.p>
        )}
      </AnimatePresence>

      <div className="pointer-events-auto relative flex items-center gap-1 rounded-full border border-line bg-surface/75 p-1 shadow-[var(--shadow)] backdrop-blur-xl">
        {/* scroll progress hairline */}
        <motion.span
          aria-hidden
          className="absolute inset-x-5 top-0 h-px origin-left bg-accent"
          style={{ scaleX: progress }}
        />

        <button type="button" onClick={prev} disabled={first} aria-label="Previous chapter" className={`${btn} h-10 gap-2 px-3 sm:h-11 sm:px-4`}>
          <span className="transition-transform duration-300 group-hover:-translate-x-0.5">
            <Arrow dir="left" />
          </span>
          <span className="hidden text-[0.6875rem] font-medium uppercase tracking-[0.16em] lg:inline">Prev</span>
        </button>

        {/* Compact counter (mobile) */}
        <div className="flex min-w-[4.75rem] items-center justify-center overflow-hidden px-1 md:hidden" aria-live="polite">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={index}
              className="flex flex-col items-center leading-tight"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <span className="text-[0.625rem] tabular-nums text-muted">
                {pad(index + 1)} / {pad(count)}
              </span>
              <span className="text-[0.6875rem] font-medium uppercase tracking-[0.12em]">{chapters[index].label}</span>
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Dots (tablet / desktop) */}
        <ul className="hidden items-center px-2 md:flex" aria-label="Chapters">
          {chapters.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => go(i, { focus: true })}
                aria-label={`${pad(i + 1)} ${c.title}`}
                aria-current={i === index ? 'step' : undefined}
                className="group/dot relative flex h-11 w-6 items-center justify-center"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    i === index ? 'w-5 bg-fg' : 'w-1.5 bg-fg/30 group-hover/dot:bg-fg/70'
                  }`}
                />
                <span className="pointer-events-none absolute bottom-full mb-3 whitespace-nowrap rounded-full bg-fg px-3 py-1 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-bg opacity-0 transition-all duration-300 group-hover/dot:-translate-y-0.5 group-hover/dot:opacity-100 group-focus-visible/dot:opacity-100">
                  {c.label}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <span className="mx-1 hidden h-5 w-px bg-line md:block" aria-hidden />

        <div className="hidden items-center md:flex">
          <button type="button" onClick={() => scrollStep(-1)} disabled={edge.top} aria-label="Scroll up" className={`${btn} h-11 w-10`}>
            <span className="transition-transform duration-300 group-hover:-translate-y-0.5">
              <Arrow dir="up" />
            </span>
          </button>
          <button type="button" onClick={() => scrollStep(1)} disabled={edge.bottom} aria-label="Scroll down" className={`${btn} h-11 w-10`}>
            <span className="transition-transform duration-300 group-hover:translate-y-0.5">
              <Arrow dir="down" />
            </span>
          </button>
        </div>

        <span className="mx-1 hidden h-5 w-px bg-line md:block" aria-hidden />

        <button type="button" onClick={next} disabled={last} aria-label="Next chapter" className={`${btn} h-10 gap-2 px-3 sm:h-11 sm:px-4`}>
          <span className="hidden text-[0.6875rem] font-medium uppercase tracking-[0.16em] lg:inline">Next</span>
          <span className="transition-transform duration-300 group-hover:translate-x-0.5">
            <Arrow dir="right" />
          </span>
        </button>
      </div>
    </motion.nav>
  )
}
