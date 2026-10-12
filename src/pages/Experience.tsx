import { useEffect, useRef, useState } from 'react'
import { motion, useScroll } from 'motion/react'
import { doctor, hasValue, publishable } from '../data/doctor'
import { useDecorativeMotion, useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import CareerPath from '../components/CareerPath'

const entryId = (i: number) => `record-${i + 1}`

/** Roles that can be published, earliest first (the data lists the most recent first). */
const roles = doctor.experience.filter((r) => hasValue(r.role)).reverse()

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

/* ── 1. Opening: a soft blue hero with the record at a glance ─────────── */

const pad = (n: number) => String(n).padStart(2, '0')

function Opening() {
  const entrance = useEntrance()
  const animated = useDecorativeMotion()
  const current = roles.at(-1)
  const since = roles[0]?.year.match(/\d{4}/)?.[0]
  const facts = [
    { value: pad(roles.length), label: roles.length === 1 ? 'Hospital' : 'Hospitals' },
    ...(since ? [{ value: since, label: 'Clinical roles since' }] : []),
    ...(current && /present/i.test(current.year) && hasValue(current.institution) ? [{ value: 'Now', label: `At ${current.institution}` }] : []),
  ]
  const logos = roles.filter((r) => hasValue(r.logo))

  return (
    <section aria-labelledby="experience-title" className="relative overflow-hidden border-b border-line bg-surface">
      {/* Faint contour lines in the corner, drawn once */}
      <svg aria-hidden viewBox="0 0 600 600" className="pointer-events-none absolute -right-32 -top-24 hidden h-[36rem] w-[36rem] md:block">
        {Array.from({ length: 9 }, (_, k) => (
          <motion.ellipse
            key={k}
            cx={320 - k * 4}
            cy={280 + k * 3}
            rx={40 + k * 28}
            ry={30 + k * 23}
            transform="rotate(-16 300 300)"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1"
            initial={animated ? { pathLength: 0, opacity: 0 } : false}
            animate={{ pathLength: 1, opacity: 0.18 - k * 0.015 }}
            transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.3 + k * 0.06 }}
          />
        ))}
      </svg>

      <div className="container-page relative pb-14 pt-12 md:pb-16 md:pt-16 lg:pb-20 lg:pt-24">
        <motion.p {...entrance(0.05)} className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-accent">
          <span aria-hidden className="h-px w-10 bg-accent" />
          Professional experience
        </motion.p>

        <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-10">
          <RevealText
            as="h1"
            id="experience-title"
            lines={[<>Track <span className="text-accent">record</span></>]}
            className="display-hero lg:col-span-7"
            delay={0.15}
            immediate
          />

          {/* The record at a glance */}
          <motion.dl {...entrance(0.45)} className="grid grid-cols-3 gap-3 lg:col-span-5">
            {facts.map((f) => (
              <div key={f.label} className="rounded-2xl border border-line bg-bg p-4 sm:p-5">
                <dt className="sr-only">{f.label}</dt>
                <dd>
                  <span className="block font-serif text-[clamp(1.75rem,1.4rem+1.2vw,2.5rem)] leading-none tabular-nums text-accent">{f.value}</span>
                  <span aria-hidden className="mt-2 block text-xs leading-snug text-muted sm:text-sm">
                    {f.label}
                  </span>
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* The hospitals, as a row of logos */}
        {logos.length > 0 && (
          <motion.ul {...entrance(0.65)} aria-label="Hospitals" className="mt-10 flex flex-wrap items-center gap-3 md:mt-12">
            {logos.map((r) => (
              <li key={r.institution} className="flex h-16 items-center rounded-xl border border-line bg-white px-4 py-2">
                <img src={r.logo} alt={r.institution} className="h-full w-auto max-w-[14rem] object-contain" />
              </li>
            ))}
          </motion.ul>
        )}
      </div>
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
              topLabel={items[0].year.match(/\d{4}/)?.[0]}
              bottomLabel={/present/i.test(items.at(-1)!.year) ? 'Now' : items.at(-1)!.year.match(/\d{4}/g)?.at(-1)}
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

function Entry({ index, state, year, role, institution, location, description, highlights, logo }: { index: number; state: EntryState } & (typeof doctor.experience)[number]) {
  const points = publishable(highlights)
  return (
    <li id={entryId(index)} className="relative grid grid-cols-[1.25rem_1fr] gap-x-6 pb-14 last:pb-0 sm:gap-x-10 md:pb-20 lg:min-h-[55vh]">
      <Marker state={state} />
      <article aria-labelledby={`${entryId(index)}-title`} className="min-w-0">
        {/* The hospital's logo, on a white tile so it reads in both themes */}
        {hasValue(logo) && (
          <span className="mb-5 inline-flex h-16 items-center rounded-xl border border-line bg-white px-3 py-2">
            <img src={logo} alt={`${institution} logo`} className="h-full w-auto max-w-[15rem] object-contain" loading="lazy" />
          </span>
        )}
        {hasValue(year) && <p className="font-serif text-[clamp(1.5rem,1.3rem+0.8vw,2rem)] leading-[1.1] tabular-nums text-brass">{year}</p>}
        <h3 id={`${entryId(index)}-title`} className="mt-3 font-serif text-[clamp(1.75rem,1.45rem+1.2vw,2.5rem)] leading-[1.1] tracking-[-0.015em]">
          {role}
        </h3>
        {/* The hospital, highlighted, with its city in a lighter tone */}
        {(hasValue(institution) || hasValue(location)) && (
          <p className="mt-3 text-lg leading-snug">
            {hasValue(institution) && <span className="font-semibold text-accent">{institution}</span>}
            {hasValue(institution) && hasValue(location) && <span className="text-muted">, </span>}
            {hasValue(location) && <span className="text-muted">{location}</span>}
          </p>
        )}
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
