import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { doctor, isPlaceholder } from '../data/doctor'
import { EASE, EASE_EXIT, EASE_IN_OUT, ONCE, useDecorativeMotion, useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import MedicalImage from '../components/MedicalImage'
import DrawLine from '../components/DrawLine'
import Counter from '../components/Counter'
import { ArrowUpRight } from '../components/Button'
import BookingPrompt from '../components/BookingPrompt'

export default function Research() {
  const entrance = useEntrance()
  return (
    <>
      {/* ── Hero: headline, interests, and a wide image that opens beneath ── */}
      <section aria-labelledby="research-title" className="container-page pb-12 pt-10 md:pb-16 md:pt-16 lg:pt-24">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <RevealText as="h1" id="research-title" lines={['Research and', 'academic work']} className="heading-1" delay={0.1} immediate />
            <motion.p
              className="lead measure mt-8"
              {...entrance(0.4)}
            >
              Research interests, publications, clinical studies, conferences and presentations. Entries are listed only once they
              have been verified, with links to the original sources.
            </motion.p>
          </div>
          <motion.div
            className="lg:col-span-4 lg:col-start-9 lg:self-end"
            {...entrance(0.55)}
          >
            <h2 className="heading-3">Research interests</h2>
            <ul className="mt-4">
              {doctor.researchInterests.map((r, i) => (
                <li key={i} className={`relative py-3 ${isPlaceholder(r) ? 'text-muted' : ''}`}>
                  <DrawLine immediate className="absolute inset-x-0 top-0 bg-line" delay={0.6 + i * 0.08} />
                  {r}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
        <MedicalImage
          src="/images/research.jpg"
          sizes="(min-width: 1360px) 1248px, 100vw"
          alt="Research and academic work"
          placeholderLabel="Research"
          priority
          delay={0.3}
          hoverZoom={false}
          className="mt-12 aspect-[16/9] w-full rounded-lg md:mt-16 md:aspect-[21/9]"
        />
      </section>

      <VerifiedChart />
      <Entries />
      <BookingPrompt />
    </>
  )
}

/** Verified entries per category, drawn as hairline bars. Counts only verified work. */
function VerifiedChart() {
  const animated = useDecorativeMotion()
  const rows = doctor.research.map((g) => ({
    category: g.category,
    verified: g.items.filter((i) => !isPlaceholder(i.title)).length,
  }))
  const max = Math.max(1, ...rows.map((r) => r.verified))
  const total = rows.reduce((sum, r) => sum + r.verified, 0)

  return (
    <section aria-labelledby="chart-title" className="border-y border-line bg-surface">
      <div className="container-page section-y">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <RevealText as="h2" id="chart-title" lines={['Verified entries']} className="heading-2" />
            <p className="mt-6 font-serif text-[clamp(3rem,2.4rem+2.6vw,4.5rem)] leading-none text-brass">
              <Counter value={total} />
            </p>
            <p className="measure mt-4 text-muted">
              {total === 0
                ? 'No entries have been verified yet. This chart updates as each entry is confirmed.'
                : 'Verified entries across all categories.'}
            </p>
          </div>

          <figure className="lg:col-span-7 lg:col-start-6">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Verified research entries by category</caption>
              <thead className="sr-only">
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Verified entries</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.category} className="relative block py-5 sm:grid sm:grid-cols-[12rem_1fr_3rem] sm:items-center sm:gap-6">
                    <th scope="row" className="block font-normal">
                      {r.category}
                    </th>
                    <td className="relative mt-3 block h-2 sm:mt-0" aria-hidden>
                      {/* Track */}
                      <DrawLine className="absolute inset-x-0 top-1/2 bg-line-strong" delay={i * 0.08} duration={1} />
                      {/* Bar */}
                      <motion.span
                        className="absolute inset-y-0 left-0 origin-left rounded-sm bg-accent"
                        style={{ width: `${(r.verified / max) * 100}%` }}
                        initial={animated ? { scaleX: 0 } : false}
                        whileInView={{ scaleX: 1 }}
                        viewport={ONCE}
                        transition={{ duration: 1.1, ease: EASE_IN_OUT, delay: 0.3 + i * 0.08 }}
                      />
                    </td>
                    <td className="absolute right-0 top-5 block text-right font-serif text-lg sm:static">
                      <Counter value={r.verified} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </figure>
        </div>
      </div>
    </section>
  )
}

/** Entries by category; each opens to reveal its details. */
function Entries() {
  const [open, setOpen] = useState<string | null>('0-0')
  let counter = 0

  return (
    <section aria-labelledby="entries-title" className="container-page section-y">
      <RevealText as="h2" id="entries-title" lines={['Publications and work']} className="heading-2" />
      <div className="mt-12 space-y-14 md:mt-16">
        {doctor.research.map((group, gi) => (
          <section key={group.category} aria-labelledby={`rg-${gi}`} className="grid gap-4 lg:grid-cols-12 lg:gap-10">
            <h3 id={`rg-${gi}`} className="heading-3 lg:col-span-4">
              {group.category}
            </h3>
            <ul className="lg:col-span-8">
              {group.items.map((item, ii) => {
                counter += 1
                const n = counter
                const key = `${gi}-${ii}`
                const isOpen = open === key
                const panel = `research-panel-${key}`
                return (
                  <li key={key} className="relative">
                    <DrawLine className="absolute inset-x-0 top-0 bg-line" delay={ii * 0.06} />
                    <h4>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panel}
                        onClick={() => setOpen(isOpen ? null : key)}
                        className="group grid min-h-16 w-full grid-cols-[2.5rem_1fr_auto] items-center gap-4 py-5 text-left sm:grid-cols-[2.5rem_1fr_4rem_auto]"
                      >
                        <span aria-hidden className="font-serif tabular-nums text-brass">
                          {String(n).padStart(2, '0')}
                        </span>
                        <span
                          className={`font-serif text-xl leading-snug transition-[transform,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 group-hover:text-accent sm:text-[1.375rem] ${
                            isPlaceholder(item.title) ? 'text-fg/75' : ''
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="hidden text-sm tabular-nums text-muted sm:block">
                          <span className="sr-only">, </span>
                          {item.year}
                        </span>
                        <span
                          aria-hidden
                          className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-300 ${
                            isOpen ? 'border-accent text-accent' : 'border-line-strong group-hover:border-accent group-hover:text-accent'
                          }`}
                        >
                          <span className="absolute h-px w-3 bg-current" />
                          <motion.span
                            className="absolute h-3 w-px bg-current"
                            animate={{ rotate: isOpen ? 90 : 0, opacity: isOpen ? 0 : 1 }}
                            transition={{ duration: 0.35, ease: EASE_IN_OUT }}
                          />
                        </span>
                      </button>
                    </h4>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={panel}
                          role="region"
                          aria-label={item.title}
                          className="overflow-hidden"
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0, transition: { duration: 0.27, ease: EASE_EXIT } }}
                          transition={{ duration: 0.45, ease: EASE_IN_OUT }}
                        >
                          <motion.div
                            className="pb-6 pl-[3.5rem]"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: EASE, delay: 0.12 }}
                          >
                            <p className="text-sm tabular-nums text-muted sm:hidden">{item.year}</p>
                            <p className={`measure leading-relaxed ${isPlaceholder(item.description) ? 'text-muted' : 'text-fg/85'}`}>{item.description}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                              {item.venue && <span className="text-muted">{item.venue}</span>}
                              {item.link ? (
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex min-h-11 items-center gap-1.5 font-medium text-accent hover:text-accent-hover"
                                >
                                  <span className="link-underline">Read publication</span>
                                  <ArrowUpRight />
                                </a>
                              ) : (
                                <span className="text-muted">[PUBLICATION LINK]</span>
                              )}
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                )
              })}
              <li aria-hidden className="relative">
                <DrawLine className="absolute inset-x-0 top-0 bg-line" delay={group.items.length * 0.06} />
              </li>
            </ul>
          </section>
        ))}
      </div>
    </section>
  )
}
