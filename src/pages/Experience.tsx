import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useScroll } from 'motion/react'
import { doctor, hasValue, publishable } from '../data/doctor'
import { EASE, EASE_EXIT, EASE_IN_OUT, useDecorativeMotion, useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import MedicalImage from '../components/MedicalImage'
import DrawLine from '../components/DrawLine'
import { ArrowUpRight } from '../components/Button'
import BookingPrompt from '../components/BookingPrompt'

const pad = (n: number) => String(n).padStart(2, '0')
const entryId = (i: number) => `record-${i + 1}`

/** Roles that can be published: those with a confirmed position. */
const roles = doctor.experience.filter((r) => hasValue(r.role))

/** Credential categories with at least one confirmed entry; empty categories are left out. */
const credentialGroups = doctor.credentials
  .map((g) => ({ category: g.category, items: g.items.filter((c) => hasValue(c.title)) }))
  .filter((g) => g.items.length > 0)

/**
 * Experience: a formal professional record. The dates drive the composition:
 * a chronology whose sticky year rolls to the entry being read, followed by a
 * typographic register of professional credentials.
 */
export default function Experience() {
  return (
    <>
      <Opening />
      {roles.length > 0 && <Chronology />}
      {credentialGroups.length > 0 && <Credentials />}
      <BookingPrompt />
    </>
  )
}

/* ── 1. Opening ──────────────────────────────────────────────────────────── */

function Opening() {
  const entrance = useEntrance()
  return (
    <section aria-labelledby="experience-title" className="container-page pt-10 md:pt-16 lg:pt-24">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <RevealText as="h1" id="experience-title" lines={['Track record']} className="display-hero" delay={0.1} immediate />
        </div>
        <motion.p className="lead measure lg:col-span-5 lg:self-end lg:pb-3" {...entrance(0.4)}>
          A timeline of clinical roles and training, followed by qualifications and memberships.
        </motion.p>
      </div>
      <DrawLine immediate delay={0.5} duration={1.2} className="mt-12 bg-line-strong md:mt-16" />
    </section>
  )
}

/* ── 2. Chronology ───────────────────────────────────────────────────────── */

/** Index of the entry crossing the reading line, plus the direction of travel. */
function useActiveEntry(count: number) {
  const [state, setState] = useState({ active: 0, direction: 1 })
  useEffect(() => {
    const els = Array.from({ length: count }, (_, i) => document.getElementById(entryId(i))).filter((el): el is HTMLElement => !!el)
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const next = els.indexOf(e.target as HTMLElement)
          setState((s) => (s.active === next ? s : { active: next, direction: next > s.active ? 1 : -1 }))
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [count])
  return state
}

function Chronology() {
  const items = roles
  const listRef = useRef<HTMLOListElement>(null)
  const { active, direction } = useActiveEntry(items.length)
  const animated = useDecorativeMotion()
  // The line fills as the reading line moves through the record.
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 50%', 'end 50%'] })

  return (
    <section aria-labelledby="chronology-title" className="container-page pb-12 pt-12 md:pb-16 md:pt-16 lg:pt-20">
      <h2 id="chronology-title" className="sr-only">
        Clinical roles and training
      </h2>
      <div className="grid gap-10 lg:grid-cols-12">
        {/* Sticky year (desktop only; each entry also carries its own year for all readers) */}
        <div aria-hidden className="hidden lg:col-span-4 lg:block">
          <StickyYear year={items[active].year} index={active} count={items.length} direction={direction} />
        </div>

        <div className="lg:col-span-8">
          <ol ref={listRef} className="relative">
            {/* Track and progress, through the centre of the markers. Under reduced motion the
              line is shown complete and the markers alone carry the reader's position. */}
            <span aria-hidden className="absolute bottom-2 left-[0.5625rem] top-2 w-px bg-line" />
            <motion.span aria-hidden className="absolute bottom-2 left-[0.5625rem] top-2 w-px origin-top bg-accent" style={{ scaleY: animated ? scrollYProgress : 1 }} />

            {items.map((item, i) => (
              <Entry key={i} index={i} state={i < active ? 'passed' : i === active ? 'current' : 'upcoming'} {...item} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/** The year of the entry being read, set as display type. Rolls with the direction of travel. */
function StickyYear({ year, index, count, direction }: { year: string; index: number; count: number; direction: number }) {
  const animated = useDecorativeMotion()
  const roll = {
    enter: (d: number) => (animated ? { y: d > 0 ? '100%' : '-100%' } : { y: '0%' }),
    center: { y: '0%', transition: { duration: animated ? 0.55 : 0, ease: EASE } },
    exit: (d: number) => (animated ? { y: d > 0 ? '-100%' : '100%', transition: { duration: 0.3, ease: EASE_EXIT } } : { opacity: 0, transition: { duration: 0 } }),
  }

  // A single year is set as display type; a longer period steps down in size and may wrap.
  const period = year.length > 4

  return (
    <div className="sticky top-32">
      <div
        className={`relative overflow-hidden font-serif leading-[1.1] tracking-[-0.02em] text-brass ${
          period ? 'text-[clamp(2rem,1.2rem+1.6vw,3rem)]' : 'h-[1.1em] text-[clamp(3.5rem,2rem+3.4vw,6rem)]'
        }`}
      >
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.span key={index} className={`block ${period ? '' : 'whitespace-nowrap'}`} custom={direction} variants={roll} initial="enter" animate="center" exit="exit">
            {year}
          </motion.span>
        </AnimatePresence>
      </div>
      <p className="mt-4 flex items-baseline gap-2 text-sm text-muted">
        Entry
        <span className="relative inline-block h-[1.4em] overflow-hidden font-serif text-base tabular-nums text-fg">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.span key={index} className="block leading-[1.4]" custom={direction} variants={roll} initial="enter" animate="center" exit="exit">
              {pad(index + 1)}
            </motion.span>
          </AnimatePresence>
        </span>
        / {pad(count)}
      </p>
    </div>
  )
}

type EntryState = 'passed' | 'current' | 'upcoming'

/** Marker shapes differ by state as well as colour: filled, ringed, or open. */
function Marker({ state }: { state: EntryState }) {
  return (
    <span aria-hidden className="relative z-10 mt-2 flex h-[19px] w-[19px] items-center justify-center rounded-full bg-bg">
      <span
        className={`flex h-[11px] w-[11px] items-center justify-center rounded-full border transition-colors duration-500 ${
          state === 'passed' ? 'border-accent bg-accent' : state === 'current' ? 'border-accent bg-bg' : 'border-line-strong bg-bg'
        }`}
      />
      {/* Restrained ring around the current entry */}
      <span
        className={`absolute inset-0 rounded-full border border-accent transition-[opacity,transform] duration-500 ${
          state === 'current' ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}
      />
    </span>
  )
}

function Entry({ index, state, year, role, institution, location, description, highlights }: { index: number; state: EntryState } & (typeof doctor.experience)[number]) {
  const place = [institution, location].filter(hasValue).join(', ')
  const points = publishable(highlights)
  return (
    <li id={entryId(index)} className="relative grid grid-cols-[1.25rem_1fr] gap-x-6 pb-14 last:pb-0 sm:gap-x-10 md:pb-20 lg:min-h-[55vh]">
      <Marker state={state} />
      <article aria-labelledby={`${entryId(index)}-title`} className="min-w-0">
        {/* Year: inline below desktop; on desktop it is carried by the sticky indicator and kept for screen readers */}
        {hasValue(year) && <p className="font-serif text-[clamp(2rem,1.6rem+1.6vw,2.5rem)] leading-[1.1] tabular-nums text-brass lg:sr-only">{year}</p>}
        <h3 id={`${entryId(index)}-title`} className="mt-3 font-serif text-[clamp(1.75rem,1.45rem+1.2vw,2.5rem)] leading-[1.1] tracking-[-0.015em] lg:mt-0">
          {role}
        </h3>
        {place && <p className="mt-2 text-muted">{place}</p>}
        {hasValue(description) && <p className="measure mt-5 text-lg leading-[1.7] text-fg/90">{description}</p>}
        {points.length > 0 && (
          <ul className="measure mt-6 border-t border-line">
            {points.map((h, j) => (
              <li key={j} className="flex gap-3 border-b border-line py-3">
                <span aria-hidden className="mt-[0.8em] h-px w-3 shrink-0 bg-brass" />
                {h}
              </li>
            ))}
          </ul>
        )}
      </article>
    </li>
  )
}

/* ── 3. Professional credentials: a typographic register ─────────────────── */

function Credentials() {
  const animated = useDecorativeMotion()
  const [filter, setFilter] = useState<string>('All')
  const groups = credentialGroups

  // Number every credential once, so identity stays stable while filtering.
  const all = useMemo(
    () => groups.flatMap((g) => g.items.map((item) => ({ ...item, category: g.category }))).map((c, i) => ({ ...c, n: i + 1 })),
    [groups],
  )
  const visible = filter === 'All' ? all : all.filter((c) => c.category === filter)
  const filters = ['All', ...groups.map((g) => g.category)]

  return (
    <section aria-labelledby="credentials-title" className="border-y border-line bg-surface">
      <div className="container-page section-y">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Heading, introduction and the credential image */}
          <div className="lg:col-span-4">
            <RevealText as="h2" id="credentials-title" lines={['Professional credentials']} className="heading-2" />
            <p className="lead measure mt-6">
              Qualifications, specialised training and professional memberships.
            </p>
            <MedicalImage
              src="/images/credential-01.jpg"
              sizes="(min-width: 1024px) 30vw, 100vw"
              alt="Credential document"
              placeholderLabel="Credential"
              hoverZoom={false}
              className="mt-10 hidden aspect-[4/5] w-full max-w-sm rounded-lg lg:block"
            />
          </div>

          {/* Filters and register */}
          <div className="min-w-0 lg:col-span-8">
            <LayoutGroup>
              <div role="group" aria-label="Filter credentials by category" className="flex flex-wrap gap-x-6 border-b border-line">
                {filters.map((f) => {
                  const on = f === filter
                  return (
                    <button
                      key={f}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setFilter(f)}
                      className={`relative min-h-11 py-3 text-sm transition-colors duration-200 ${on ? 'font-medium text-fg' : 'text-muted hover:text-fg'}`}
                    >
                      {f}
                      {on && (
                        <motion.span
                          layoutId="credential-filter-indicator"
                          aria-hidden
                          className="absolute inset-x-0 -bottom-px h-px bg-accent"
                          transition={{ duration: animated ? 0.4 : 0, ease: EASE_IN_OUT }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              <p className="sr-only" aria-live="polite">
                Showing {filter === 'All' ? 'all categories' : filter}
              </p>

              <ul className="mt-2">
                <AnimatePresence mode="popLayout" initial={false}>
                  {visible.map((c) => (
                    <motion.li
                      key={c.n}
                      layout={animated ? 'position' : false}
                      initial={animated ? { opacity: 0, y: 8 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: animated ? 0.15 : 0, ease: EASE_EXIT } }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="group grid gap-x-8 gap-y-2 border-b border-line py-6 sm:grid-cols-[9rem_1fr] lg:grid-cols-[9rem_1fr_13rem]"
                    >
                      {/* The year column keeps its place for alignment, empty when no year is given */}
                      <span className="font-serif text-lg leading-snug tabular-nums text-brass">{hasValue(c.year) ? c.year : null}</span>
                      <div className="min-w-0">
                        <h3 className="font-serif text-[1.375rem] leading-snug transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">
                          {c.title}
                        </h3>
                        {hasValue(c.description) && <p className="mt-1 text-sm leading-relaxed text-fg/80">{c.description}</p>}
                        <p className="mt-2 text-xs text-muted">{c.category}</p>
                        {hasValue(c.link) && (
                          <a
                            href={c.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
                          >
                            <span className="link-underline">View source</span>
                            <ArrowUpRight />
                            <span className="sr-only">(opens in a new tab)</span>
                          </a>
                        )}
                      </div>
                      {hasValue(c.institution) && <p className="text-sm text-fg/85 sm:col-start-2 lg:col-start-auto lg:text-right">{c.institution}</p>}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </LayoutGroup>
          </div>
        </div>
      </div>
    </section>
  )
}
