import { motion } from 'motion/react'
import { doctor, hasValue, publishable } from '../data/doctor'
import { EASE, EASE_IN_OUT, ONCE, useDecorativeMotion, useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import MedicalImage from '../components/MedicalImage'
import DrawLine from '../components/DrawLine'
import Counter from '../components/Counter'
import { ArrowUpRight } from '../components/Button'
import BookingPrompt from '../components/BookingPrompt'

const pad = (n: number) => String(n).padStart(2, '0')

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
const roman = (n: number) => ROMAN[n - 1] ?? String(n)

/** Research categories with at least one confirmed entry; empty categories are left out. */
const groups = doctor.research
  .map((g) => ({ category: g.category, items: g.items.filter((i) => hasValue(i.title)) }))
  .filter((g) => g.items.length > 0)

/**
 * Research: a journal and its bibliography. The opening sets the research
 * interests as a numbered index; a frontispiece follows; then every entry is
 * set as a numbered reference under a running head for its category.
 */
export default function Research() {
  return (
    <>
      <Opening />
      <Frontispiece />
      {groups.length > 0 && <VerificationStatus />}
      <Bibliography />
      <BookingPrompt />
    </>
  )
}

/* ── 1. Opening: heading and introduction beside the interests index ─────── */

function Opening() {
  const entrance = useEntrance()
  const animated = useDecorativeMotion()
  const interests = publishable(doctor.researchInterests)

  return (
    <section aria-labelledby="research-title" className="container-page pb-12 pt-10 md:pb-16 md:pt-16 lg:pt-24">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <RevealText as="h1" id="research-title" lines={['Research and', 'academic work']} className="heading-1" delay={0.1} immediate />
          {hasValue(doctor.researchIntro) && (
            <motion.p className="lead measure mt-8" {...entrance(0.4)}>
              {doctor.researchIntro}
            </motion.p>
          )}
        </div>

        {/* The interests as a numbered index; each line rises in order, once */}
        {interests.length > 0 && (
        <div className="lg:col-span-7 lg:pt-2">
          <h2 className="heading-3">Research interests</h2>
          <ol className="relative mt-5">
            <DrawLine immediate delay={0.3} duration={1.1} className="absolute inset-x-0 top-0 bg-line-strong" />
            {interests.map((interest, i) => (
              <li key={i} className="grid grid-cols-[3rem_1fr] items-baseline gap-4 border-b border-line py-5 sm:grid-cols-[4rem_1fr] md:py-6">
                <span aria-hidden className="font-serif text-[1.375rem] leading-none text-brass">
                  {roman(i + 1)}
                </span>
                <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
                  <motion.span
                    className="block font-serif text-[clamp(1.75rem,1.35rem+1.6vw,2.75rem)] leading-[1.15] tracking-[-0.015em]"
                    initial={animated ? { y: '108%' } : false}
                    animate={{ y: '0%' }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.35 + i * 0.12 }}
                  >
                    {interest}
                  </motion.span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        )}
      </div>
    </section>
  )
}

/* ── 2. Frontispiece: the image unfolds from the top, like a page ───────── */

function Frontispiece() {
  const animated = useDecorativeMotion()
  return (
    <section aria-label="Frontispiece" className="container-page pb-12 md:pb-16">
      <motion.div
        className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-2 md:aspect-[21/9]"
        initial={animated ? { clipPath: 'inset(0% 0% 100% 0%)' } : false}
        whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
        viewport={ONCE}
        transition={{ duration: 1.2, ease: EASE_IN_OUT }}
      >
        <motion.div
          className="absolute inset-0"
          initial={animated ? { scale: 1.04 } : false}
          whileInView={{ scale: 1 }}
          viewport={ONCE}
          transition={{ duration: 1.6, ease: EASE }}
        >
          <MedicalImage
            src="/images/research.jpg"
            sizes="(min-width: 1360px) 1248px, 100vw"
            alt="Research and academic work"
            placeholderLabel="Research"
            reveal={false}
            hoverZoom={false}
            className="h-full w-full"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ── 3. Verification status: a count of entries by category, once any exist ── */

function VerificationStatus() {
  const animated = useDecorativeMotion()
  const rows = groups.map((g) => ({ category: g.category, verified: g.items.length }))
  const total = rows.reduce((sum, r) => sum + r.verified, 0)
  const max = Math.max(1, ...rows.map((r) => r.verified))

  return (
    <section aria-label="Verification status" className="container-page pb-4">
      <div className="border-y border-line py-5">
        <>
            <p className="text-muted">
              <Counter value={total} className="font-serif text-lg text-brass" /> verified {total === 1 ? 'entry' : 'entries'}
            </p>
            <table className="mt-4 w-full border-collapse text-left">
              <caption className="sr-only">Verified research entries by category</caption>
              <thead className="sr-only">
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Verified entries</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.category} className="grid grid-cols-[1fr_3rem] items-center gap-4 py-2 sm:grid-cols-[12rem_1fr_3rem]">
                    <th scope="row" className="font-normal">
                      {r.category}
                    </th>
                    <td aria-hidden className="relative hidden h-2 sm:block">
                      <span className="absolute inset-x-0 top-1/2 h-px bg-line-strong" />
                      <motion.span
                        className="absolute inset-y-0 left-0 origin-left rounded-sm bg-accent"
                        style={{ width: `${(r.verified / max) * 100}%` }}
                        initial={animated ? { scaleX: 0 } : false}
                        whileInView={{ scaleX: 1 }}
                        viewport={ONCE}
                        transition={{ duration: 1, ease: EASE_IN_OUT, delay: i * 0.08 }}
                      />
                    </td>
                    <td className="text-right font-serif text-lg text-brass">
                      <Counter value={r.verified} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </>
      </div>
    </section>
  )
}

/* ── 4. Bibliography: numbered references under running heads ────────────── */

function Bibliography() {
  if (groups.length === 0) return null
  // Reference numbers run continuously through the whole bibliography.
  let ref = 0

  return (
    <section aria-labelledby="bibliography-title" className="container-page section-y">
      <RevealText as="h2" id="bibliography-title" lines={['Publications and work']} className="heading-2" />

      <div className="mt-12 space-y-16 md:mt-16 md:space-y-24">
        {groups.map((group, gi) => (
          <section key={group.category} aria-labelledby={`group-${gi}`} className="grid gap-6 lg:grid-cols-12 lg:gap-10">
            {/* Running head: stays in view while its group is read (desktop) */}
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <h3 id={`group-${gi}`} className="heading-3">
                  {group.category}
                </h3>
                <DrawLine className="mt-4 bg-line-strong" duration={0.9} />
              </div>
            </div>

            <ol className="lg:col-span-8">
              {group.items.map((item, ii) => {
                ref += 1
                const n = ref
                const citation = [item.venue, item.year].filter(hasValue).join(', ')
                return (
                  <li key={ii} className="group grid grid-cols-[3rem_1fr] gap-x-4 border-b border-line py-7 first:pt-0 sm:grid-cols-[4rem_1fr] md:py-8 md:first:pt-0">
                    <span aria-hidden className="pt-1 font-serif tabular-nums text-brass">
                      [{pad(n)}]
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-serif text-[clamp(1.375rem,1.25rem+0.5vw,1.625rem)] leading-snug tracking-[-0.01em] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">
                        <span className="sr-only">Reference {n}: </span>
                        {item.title}
                      </h4>
                      {citation && <p className="mt-2 text-sm text-muted">{citation}</p>}
                      {hasValue(item.description) && <p className="measure mt-4 leading-relaxed text-fg/85">{item.description}</p>}
                      {hasValue(item.link) && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
                        >
                          <span className="link-underline">Read publication</span>
                          <ArrowUpRight />
                          <span className="sr-only">(opens in a new tab)</span>
                        </a>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
      </div>
    </section>
  )
}
