import { motion } from 'motion/react'
import { doctor, hasValue } from '../data/doctor'
import { useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import MedicalImage from '../components/MedicalImage'
import { ArrowUpRight } from '../components/Button'
import CredentialsRegister from '../components/CredentialsRegister'

const pad = (n: number) => String(n).padStart(2, '0')
const scholarSearch = (title: string) => `https://scholar.google.com/scholar?q=${encodeURIComponent(`"${title}"`)}`

/** Research categories with at least one confirmed entry; empty categories are left out. */
const groups = doctor.research
  .map((g) => ({ category: g.category, items: g.items.filter((i) => hasValue(i.title)) }))
  .filter((g) => g.items.length > 0)

/**
 * Research: a journal and its bibliography. The opening sets the heading and
 * introduction beside a photograph from the podium; then every entry is set as
 * a numbered reference.
 */
export default function Research() {
  return (
    <>
      <Opening />
      <Bibliography />
      <CredentialsRegister />
    </>
  )
}

/* ── 1. Opening: heading and introduction beside a photograph from the podium ── */

function Opening() {
  const entrance = useEntrance()

  return (
    <section aria-labelledby="research-title" className="container-page pb-14 pt-10 md:pb-20 md:pt-16 lg:pt-20">
      <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
        <div className="lg:col-span-6">
          <motion.p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-accent" {...entrance(0)}>
            <span aria-hidden className="h-px w-10 bg-accent" />
            Research
          </motion.p>
          <RevealText
            as="h1"
            id="research-title"
            lines={['Research and', 'academic work']}
            className="mt-6 font-serif text-[clamp(2.5rem,1.7rem+3vw,4.5rem)] leading-[1.02] tracking-[-0.025em]"
            delay={0.1}
            immediate
          />
          {hasValue(doctor.researchIntro) && (
            <motion.p className="mt-8 border-l-2 border-accent pl-6 text-[1.0625rem] leading-[1.8] text-fg/75" {...entrance(0.35)}>
              {doctor.researchIntro}
            </motion.p>
          )}
        </div>

        {/* A photograph from the podium, framed with a soft blue offset behind it */}
        <motion.figure className="relative lg:col-span-6" {...entrance(0.45)}>
          <div aria-hidden className="absolute -bottom-4 -right-4 top-6 left-6 rounded-[1.75rem] bg-accent-soft sm:-bottom-5 sm:-right-5" />
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-surface-2 shadow-[0_32px_64px_-40px_rgba(12,34,54,0.6)]">
            <MedicalImage
              src="/images/gallery-fhno-global-2025.jpg"
              alt={`${doctor.name} presenting at FHNO Global 2025, the 25th Annual Conference of the Foundation for Head and Neck Oncology`}
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
              reveal={false}
              hoverZoom={false}
              imgClassName="object-[50%_35%]"
              className="h-full w-full"
            />
          </div>
          <figcaption className="relative mt-8 text-sm text-muted">Presenting at FHNO Global 2025</figcaption>
        </motion.figure>
      </div>
    </section>
  )
}

/* ── 2. Bibliography: numbered references under running heads ────────────── */

function Bibliography() {
  if (groups.length === 0) return null
  // Reference numbers run continuously through the whole bibliography.
  let ref = 0

  return (
    <section aria-labelledby="bibliography-title" className="container-page pb-20 md:pb-28">
      <RevealText as="h2" id="bibliography-title" lines={['Publications']} className="heading-2" />
      <div className="mt-10 border-t border-line md:mt-12">
        {groups.map((group) => (
          <ol key={group.category} aria-label={group.category}>
              {group.items.map((item, ii) => {
                ref += 1
                const n = ref
                const citation = [item.venue, item.year].filter(hasValue).join(', ')
                // Every entry opens its publication: the supplied link, or a Google Scholar search for the exact title.
                const href = hasValue(item.link) ? item.link : scholarSearch(item.title)
                return (
                  <li key={ii} className="border-b border-line">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group -mx-3 grid grid-cols-[3rem_1fr] gap-x-4 rounded-xl px-3 py-7 transition-colors duration-300 hover:bg-surface focus-visible:bg-surface sm:-mx-4 sm:grid-cols-[4rem_1fr] sm:px-4 md:py-8"
                    >
                      <span aria-hidden className="pt-1 font-serif tabular-nums text-brass">
                        [{pad(n)}]
                      </span>
                      <span className="block min-w-0">
                        <span className="block font-serif text-[clamp(1.375rem,1.25rem+0.5vw,1.625rem)] leading-snug tracking-[-0.01em] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">
                          <span className="sr-only">Reference {n}: </span>
                          {item.title}
                        </span>
                        {citation && <span className="mt-2 block text-sm text-muted">{citation}</span>}
                        {hasValue(item.description) && <span className="measure mt-4 block leading-relaxed text-fg/85">{item.description}</span>}
                        <span className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent group-hover:text-accent-hover">
                          <span className="link-underline">{hasValue(item.link) ? 'Read publication' : 'Find on Google Scholar'}</span>
                          <ArrowUpRight />
                        </span>
                        <span className="sr-only">(opens in a new tab)</span>
                      </span>
                    </a>
                  </li>
                )
              })}
          </ol>
        ))}
      </div>
    </section>
  )
}
