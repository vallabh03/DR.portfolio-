import { useEffect, useRef, useState } from 'react'
import { motion, useScroll } from 'motion/react'
import { doctor, hasValue, publishable } from '../data/doctor'
import { useDecorativeMotion, useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import DrawLine from '../components/DrawLine'
import CareerPath from '../components/CareerPath'

const entryId = (i: number) => `record-${i + 1}`

/** Roles that can be published: those with a confirmed position. */
const roles = doctor.experience.filter((r) => hasValue(r.role))

/**
 * Experience: a formal professional record. The dates drive the composition:
 * a chronology of clinical roles beside a career path that follows the entry
 * being read. Professional credentials are on the Research page.
 */
export default function Experience() {
  return (
    <>
      <Opening />
      {roles.length > 0 && <Chronology />}
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
          A timeline of clinical roles.
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
  const { active } = useActiveEntry(items.length)
  const animated = useDecorativeMotion()
  // The line fills as the reading line moves through the record.
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 50%', 'end 50%'] })

  return (
    <section aria-labelledby="chronology-title" className="container-page pb-12 pt-12 md:pb-16 md:pt-16 lg:pt-20">
      <h2 id="chronology-title" className="sr-only">
        Clinical roles and training
      </h2>
      <div className="grid gap-10 lg:grid-cols-12">
        {/* Sticky career path (desktop only; each entry also carries its own year for all readers) */}
        <nav aria-label="Career timeline" className="hidden lg:col-span-4 lg:block">
          <div className="sticky top-28">
            <CareerPath
              stops={items.map((r) => ({ label: hasValue(r.institution) ? r.institution : r.role, period: r.year }))}
              active={active}
              onSelect={(i) => document.getElementById(entryId(i))?.scrollIntoView({ behavior: animated ? 'smooth' : 'auto', block: 'center' })}
              avatarSrc="/images/doctor-hero.jpg"
              topLabel={/present/i.test(items[0].year) ? 'Now' : items[0].year.match(/\d{4}/)?.[0]}
              bottomLabel={items.at(-1)!.year.match(/\d{4}/)?.[0]}
            />
          </div>
        </nav>

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
        {hasValue(year) && <p className="font-serif text-[clamp(1.5rem,1.3rem+0.8vw,2rem)] leading-[1.1] tabular-nums text-brass">{year}</p>}
        <h3 id={`${entryId(index)}-title`} className="mt-3 font-serif text-[clamp(1.75rem,1.45rem+1.2vw,2.5rem)] leading-[1.1] tracking-[-0.015em]">
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
