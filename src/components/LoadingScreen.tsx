import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { preloadChapters } from '../data/chapters'
import { doctor } from '../data/doctor'

const MESSAGES = [
  'Preparing your experience…',
  'Loading medical knowledge…',
  'Preparing the consultation room…',
  'Calibrating the experience…',
  'Almost ready…',
]

const SESSION_KEY = 'at-visited'

const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = img.onerror = () => resolve()
    img.src = src
  })

/**
 * Opening loader. Progress reflects real work (fonts, page chunks, hero image)
 * blended with a minimum duration so the reveal never feels abrupt.
 */
export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  const done = useRef(false)
  const [firstVisit] = useState(() => {
    try {
      return !sessionStorage.getItem(SESSION_KEY)
    } catch {
      return true
    }
  })

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      /* ignore */
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const minDuration = reduce ? 500 : firstVisit ? 2600 : 1100

    let tasksDone = 0
    const tasks = [
      document.fonts?.ready ?? Promise.resolve(),
      preloadChapters(),
      preloadImage('/images/doctor-hero.jpg'),
    ]
    tasks.forEach((t) => Promise.resolve(t).catch(() => {}).finally(() => tasksDone++))

    // Never block the site for long on a slow network.
    const hardLimit = 6000
    const start = performance.now()
    let raf = 0
    let shown = 0
    let last = start

    const tick = () => {
      const now = performance.now()
      const dt = now - last
      last = now
      const elapsed = now - start
      const timeP = Math.min(1, elapsed / minDuration)
      const taskP = tasksDone / tasks.length
      const cap = elapsed > hardLimit ? 1 : taskP >= 1 ? 1 : 0.35 + taskP * 0.55
      const target = Math.min(timeP, cap)
      // Time-based smoothing so throttled frames don't slow the loader down.
      shown += (target - shown) * (1 - Math.exp(-dt / 110))
      if (target >= 1 && shown > 0.995) shown = 1
      setProgress(shown)
      if (shown >= 1) {
        if (!done.current) {
          done.current = true
          window.setTimeout(onDone, 250)
        }
        return
      }
      schedule()
    }
    // rAF for smoothness; a timer fallback keeps progressing in hidden/background tabs.
    let timer = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
      raf = requestAnimationFrame(tick)
      timer = window.setTimeout(tick, 120)
    }
    schedule()
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
    }
  }, [onDone, firstVisit])

  const pct = Math.round(progress * 100)
  const msgIndex = Math.min(MESSAGES.length - 1, Math.floor(progress * MESSAGES.length))

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-label={`Loading ${pct}%`}
      className="fixed inset-0 z-[100] flex flex-col bg-bg text-fg"
      initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-1/2 h-[80vmax] w-[80vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--glow),transparent_60%)]" />
      </div>

      <div className="relative flex items-center justify-between px-5 pt-6 sm:px-10 sm:pt-8">
        <span className="eyebrow">{doctor.name}</span>
        <span className="eyebrow hidden sm:inline">Digital portfolio</span>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="flex gap-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block h-2 w-2 rounded-full bg-accent"
              animate={{ y: [0, -14, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: [0.82, 0, 0.26, 1] }}
            />
          ))}
        </div>

        <p className="font-display text-[clamp(1.75rem,5vw,4rem)] font-light leading-[1.05] tracking-[-0.04em]">
          Great care is <span className="serif-accent text-accent">worth</span> the wait.
        </p>

        <div className="relative h-6 w-full overflow-hidden text-sm text-muted sm:text-base">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={msgIndex}
              className="absolute inset-x-0"
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -18, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {MESSAGES[msgIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="relative px-5 pb-8 sm:px-10 sm:pb-10">
        <div className="flex items-end justify-between gap-4">
          <span className="eyebrow">Loading</span>
          <span className="font-display text-[clamp(3rem,10vw,8rem)] font-extralight leading-none tracking-[-0.06em] tabular-nums">
            {pct}
            <span className="text-[0.35em] text-muted">%</span>
          </span>
        </div>
        <div className="mt-4 h-px w-full bg-line">
          <div className="h-px origin-left bg-fg" style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>
    </motion.div>
  )
}
