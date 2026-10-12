import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { doctor, hasValue } from '../data/doctor'
import { useDecorativeMotion } from '../lib/motion'
import RevealText from './RevealText'
import MedicalImage from './MedicalImage'
import CredentialIcon, { type CredentialIconName } from './CredentialIcon'
import { ArrowUpRight } from './Button'

const pad = (n: number) => String(n).padStart(2, '0')

/** Credential categories with at least one confirmed entry; empty categories are left out. */
const groups = doctor.credentials
  .map((g) => ({ category: g.category, items: g.items.filter((c) => hasValue(c.title)) }))
  .filter((g) => g.items.length > 0)

type Credential = (typeof groups)[number]['items'][number]

/** The icon for a category, from the words in its name. */
const iconFor = (category: string): CredentialIconName => {
  const c = category.toLowerCase()
  if (c.includes('member')) return 'memberships'
  if (c.includes('train')) return 'training'
  return 'education'
}

// "American Society of Clinical Oncology (ASCO)" -> the abbreviation large, the full name beneath.
const splitAbbr = (title: string) => {
  const m = /^(.*)\s+\(([^)]+)\)$/.exec(title)
  return m ? { name: m[1], abbr: m[2] } : { name: title, abbr: '' }
}

/**
 * Professional credentials as a stack of cards, one per category. On wide
 * screens each card sticks just below the header and the next slides up over
 * it, while the cards beneath ease back slightly; the heading and photograph
 * stay beside the stack. On phones the cards simply follow one another.
 */
export default function CredentialsRegister() {
  const stackRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: stackRef, offset: ['start start', 'end end'] })
  if (groups.length === 0) return null

  return (
    <section aria-labelledby="credentials-title" className="border-y border-line bg-surface">
      <div className="container-page section-y">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Heading and the convocation photograph, held in view beside the stack (wide screens) */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <RevealText as="h2" id="credentials-title" lines={['Professional credentials']} className="heading-2" />
              <MedicalImage
                src="/images/gallery-aiims-convocation-2023-closeup.jpg"
                sizes="(min-width: 1024px) 30vw, 100vw"
                alt="Receiving his degree at the Third Convocation of AIIMS Rishikesh, 13 July 2023"
                placeholderLabel="Credential"
                hoverZoom={false}
                className="mt-8 hidden aspect-[3/2] w-full rounded-2xl lg:block"
              />
            </div>
          </div>

          <div ref={stackRef} className="space-y-6 lg:col-span-8 lg:space-y-10">
            {groups.map((g, i) => (
              <StackCard key={g.category} index={i} total={groups.length} progress={scrollYProgress} category={g.category} items={g.items} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function StackCard({
  index,
  total,
  progress,
  category,
  items,
}: {
  index: number
  total: number
  progress: MotionValue<number>
  category: string
  items: Credential[]
}) {
  const animated = useDecorativeMotion()
  // Cards beneath the newest ease back a little as the stack grows; the last card stays full size.
  const scale = useTransform(progress, [index / total, 1], [1, animated ? 1 - (total - 1 - index) * 0.04 : 1])
  const dated = items.some((c) => hasValue(c.year))
  const headingId = `credentials-${index + 1}`

  return (
    <motion.article
      aria-labelledby={headingId}
      style={{ scale, top: `calc(7rem + ${index * 1.5}rem)` }}
      className="origin-top rounded-[1.75rem] border border-line bg-bg p-6 shadow-[0_24px_48px_-32px_rgba(27,95,140,0.45)] sm:p-8 lg:sticky"
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {pad(index + 1)} / {pad(total)}
          </p>
          <h3 id={headingId} className="mt-2 font-serif text-[clamp(1.5rem,1.3rem+0.8vw,2rem)] leading-tight">
            {category}
          </h3>
          <p className="mt-1 text-sm text-muted">
            {items.length} {items.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent sm:h-20 sm:w-20">
          <CredentialIcon name={iconFor(category)} className="h-8 w-8 sm:h-10 sm:w-10" />
        </span>
      </div>

      {dated ? (
        <ul className="mt-6 border-t border-line">
          {items.map((c) => (
            <li key={c.title} className="grid gap-x-6 gap-y-1 border-b border-line py-4 last:border-b-0 last:pb-0 sm:grid-cols-[8.5rem_1fr]">
              <span className="font-serif tabular-nums text-brass">{hasValue(c.year) ? c.year : null}</span>
              <div className="min-w-0">
                <p className="font-serif text-lg leading-snug">{c.title}</p>
                {hasValue(c.institution) && <p className="mt-1 text-sm text-muted">{c.institution}</p>}
                {hasValue(c.description) && <p className="mt-2 text-sm leading-relaxed text-fg/80">{c.description}</p>}
                {hasValue(c.link) && (
                  <a href={c.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover">
                    <span className="link-underline">View source</span>
                    <ArrowUpRight />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-6 grid gap-3 border-t border-line pt-6 sm:grid-cols-2">
          {items.map((c) => {
            const { name, abbr } = splitAbbr(c.title)
            return (
              <li key={c.title} className="rounded-2xl bg-surface p-4">
                {abbr && (
                  <p aria-hidden className="font-sans text-xl font-black leading-none tracking-[-0.02em] text-accent">
                    {abbr}
                  </p>
                )}
                <p className={`leading-snug ${abbr ? 'mt-2 text-sm' : 'font-serif text-lg text-accent'}`}>
                  {name}
                  {abbr && <span className="sr-only"> ({abbr})</span>}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </motion.article>
  )
}
