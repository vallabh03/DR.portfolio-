import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { doctor, isPlaceholder } from '../data/doctor'
import { EASE, EASE_EXIT, EASE_IN_OUT, useEntrance } from '../lib/motion'
import { useScrollTrack } from '../hooks/useScrollTrack'
import RevealText from '../components/RevealText'
import MedicalImage from '../components/MedicalImage'
import BookingPrompt from '../components/BookingPrompt'

export default function Experience() {
  const entrance = useEntrance()
  return (
    <>
      {/* ── Hero ── */}
      <section aria-labelledby="experience-title" className="container-page pb-12 pt-10 md:pb-16 md:pt-16 lg:pt-24">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <RevealText as="h1" id="experience-title" lines={['Track record']} className="display-hero" delay={0.1} immediate />
          </div>
          <motion.p
            className="lead measure lg:col-span-5 lg:self-end"
            {...entrance(0.4)}
          >
            A timeline of clinical roles and training, followed by verified qualifications, certifications and memberships.
          </motion.p>
        </div>
      </section>

      <Timeline />
      <Credentials />
      <BookingPrompt />
    </>
  )
}

/** Career timeline: the line fills with scroll and each point fills as it is passed. */
function Timeline() {
  const items = doctor.experience
  const listRef = useRef<HTMLOListElement>(null)
  const { progress, reached } = useScrollTrack(listRef, items.length)

  return (
    <section aria-labelledby="timeline-title" className="container-page pb-16 md:pb-24 lg:pb-32">
      <h2 id="timeline-title" className="sr-only">
        Clinical roles and training
      </h2>
      <ol ref={listRef} className="relative">
        {/* Track and progress, aligned to the node column */}
        <span aria-hidden className="absolute bottom-2 left-[0.4375rem] top-2 w-px bg-line md:left-[calc(25%+0.4375rem)]" />
        <motion.span
          aria-hidden
          className="absolute bottom-2 left-[0.4375rem] top-2 w-px origin-top bg-accent md:left-[calc(25%+0.4375rem)]"
          style={{ scaleY: progress }}
        />

        {items.map((item, i) => {
          const passed = i < reached
          return (
            <li key={i} className="relative grid grid-cols-[1rem_1fr] gap-x-6 pb-12 last:pb-0 md:grid-cols-[25%_1rem_1fr] md:gap-x-0 md:pb-16">
              {/* Year (desktop column) */}
              <p
                className={`hidden pr-10 text-right font-serif text-[clamp(1.5rem,1.2rem+1vw,2.25rem)] leading-none tabular-nums transition-colors duration-500 md:block ${
                  passed ? 'text-brass' : 'text-muted'
                }`}
              >
                {item.year}
              </p>
              {/* Node */}
              <span aria-hidden className="relative flex justify-center pt-1.5">
                <span
                  className={`relative z-10 block h-[15px] w-[15px] rounded-full border transition-colors duration-500 ${
                    passed ? 'border-accent bg-accent' : 'border-line-strong bg-bg'
                  }`}
                />
              </span>
              {/* Entry */}
              <div className="min-w-0 md:pl-10">
                <p className="font-serif text-lg tabular-nums text-brass md:hidden">{item.year}</p>
                <h3 className={`heading-3 !text-[clamp(1.5rem,1.3rem+0.8vw,2rem)] ${isPlaceholder(item.role) ? 'text-fg/75' : ''}`}>{item.role}</h3>
                <p className="mt-1 text-muted">
                  {item.institution}
                  {item.location ? `, ${item.location}` : ''}
                </p>
                <p className={`measure mt-4 ${isPlaceholder(item.description) ? 'text-muted' : 'text-fg/85'}`}>{item.description}</p>
                {item.highlights && item.highlights.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {item.highlights.map((h, j) => (
                      <li key={j} className="flex gap-3 text-muted">
                        <span aria-hidden className="mt-[0.8em] h-px w-3 shrink-0 bg-brass" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      <p className="mt-10 text-sm text-muted md:pl-[calc(25%+3.5rem)]">Dates, positions and institutions will be added once verified.</p>
    </section>
  )
}

/** Verified credentials with category filters; cards rearrange smoothly. */
function Credentials() {
  const [filter, setFilter] = useState<string>('All')
  const groups = doctor.credentials

  // Number every credential once, so numbers stay stable while filtering.
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
          <div className="lg:col-span-4 lg:sticky lg:top-32 lg:self-start">
            <RevealText as="h2" id="credentials-title" lines={['Verified credentials']} className="heading-2" />
            <p className="lead measure mt-6">
              Qualifications, specialised training, certifications and professional memberships. Each entry is published only
              after it has been verified.
            </p>
            <MedicalImage
              src="/images/credential-01.jpg"
              sizes="30vw"
              alt="Credential document"
              placeholderLabel="Credential"
              className="mt-10 hidden aspect-[16/10] w-full rounded-lg lg:block"
              hoverZoom={false}
            />
          </div>

          <div className="min-w-0 lg:col-span-8">
            <LayoutGroup>
              <div role="group" aria-label="Filter credentials by category" className="flex flex-wrap gap-2">
                {filters.map((f) => {
                  const on = f === filter
                  return (
                    <button
                      key={f}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setFilter(f)}
                      className={`relative min-h-11 rounded-md border px-4 text-sm font-medium transition-colors duration-300 ${
                        on ? 'border-fg text-bg' : 'border-line-strong text-muted hover:border-fg hover:text-fg'
                      }`}
                    >
                      {on && (
                        <motion.span
                          layoutId="credential-filter"
                          className="absolute -inset-px -z-0 rounded-md bg-fg"
                          transition={{ duration: 0.4, ease: EASE_IN_OUT }}
                        />
                      )}
                      <span className="relative">{f}</span>
                    </button>
                  )
                })}
              </div>

              <motion.ul layout className="mt-8 grid gap-4 sm:grid-cols-2" aria-live="polite">
                <AnimatePresence mode="popLayout" initial={false}>
                  {visible.map((c) => (
                    <motion.li
                      key={c.n}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.15, ease: EASE_EXIT } }}
                      transition={{ duration: 0.45, ease: EASE }}
                      className="group flex flex-col rounded-lg border border-line bg-bg p-6 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-accent sm:p-8"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-sm text-muted">{c.category}</span>
                        <span aria-hidden className="font-serif tabular-nums text-brass">
                          {String(c.n).padStart(2, '0')}
                        </span>
                      </div>
                      <h3 className={`heading-3 mt-8 ${isPlaceholder(c.title) ? 'text-fg/75' : ''}`}>{c.title}</h3>
                      <span aria-hidden className="mt-4 block h-px w-8 bg-brass transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-14" />
                      <p className="mt-4 flex flex-wrap gap-x-2 text-muted">
                        <span>{c.institution}</span>
                        <span aria-hidden>·</span>
                        <span className="tabular-nums">{c.year}</span>
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-muted">{c.description}</p>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            </LayoutGroup>
          </div>
        </div>
      </div>
    </section>
  )
}
