import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, useScroll } from 'motion/react'
import { Link } from 'react-router'
import { aboutHeading, doctor, hasValue, publishable, QUALIFICATIONS, TRAINING } from '../data/doctor'
import { EASE, EASE_EXIT, EASE_IN_OUT, ONCE, useDecorativeMotion, useEntrance } from '../lib/motion'
import { useScrollTrack } from '../hooks/useScrollTrack'
import RevealText from '../components/RevealText'
import CredentialIcon from '../components/CredentialIcon'
import MedicalImage from '../components/MedicalImage'
import DrawLine from '../components/DrawLine'
import { ArrowRight } from '../components/Button'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * About: a long-form magazine profile.
 *
 * Primary motion: the headline reveal and the portrait opening from its centre.
 * Content-specific motion: a 1px reading guide through the profile chapters,
 * the clinic photograph's wipe, and the Approach timeline. Body copy is never
 * faded in on scroll.
 */
export default function About() {
  return (
    <>
      <Opener />
      {chapters.length > 0 && <Profile />}
      <FactFile />
      {/* Shown only once the doctor has supplied and approved the stages */}
      {doctor.approach.some((s) => hasValue(s.title)) && <ApproachToCare />}
    </>
  )
}

/* ── 1. Opening spread ───────────────────────────────────────────────────── */

/**
 * The portrait opens from a small aperture at its centre, keeping the frame's
 * proportions, then the photograph settles to scale 1. No sliding panels.
 */
function CentreReveal() {
  const animated = useDecorativeMotion()
  return (
    <motion.div
      className="relative aspect-[941/1300] w-full overflow-hidden rounded-lg bg-surface-2"
      initial={animated ? { clipPath: 'inset(42% 42% 42% 42% round 12px)' } : false}
      animate={{ clipPath: 'inset(0% 0% 0% 0% round 12px)' }}
      transition={{ duration: 1.3, ease: EASE, delay: 0.25 }}
    >
      <motion.div
        className="absolute inset-0"
        initial={animated ? { scale: 1.12 } : false}
        animate={{ scale: 1 }}
        transition={{ duration: 2, ease: EASE, delay: 0.25 }}
      >
        <MedicalImage
          src="/images/doctor-about.jpg"
          sizes="(min-width: 1024px) 38vw, 100vw"
          alt={`Portrait of ${doctor.name}`}
          placeholderLabel="About portrait"
          priority
          reveal={false}
          hoverZoom={false}
          className="h-full w-full"
        />
      </motion.div>
    </motion.div>
  )
}

function Opener() {
  const entrance = useEntrance()
  const bio = publishable(doctor.bioFull)
  // The title and practice line is shown only when there is no full biography (whose first paragraph says the same).
  const byline = bio.length > 0 ? [] : [doctor.title, doctor.contact.clinic, publishable(doctor.about.languages).join(', ')].filter(hasValue)

  return (
    <section aria-labelledby="about-title" className="container-page pb-16 pt-10 md:pb-24 md:pt-16 lg:pt-20">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-0">
        {/* On phones the heading leads; on desktop the portrait sits on the left */}
        {/* The portrait, cropped at wrist level; on desktop it stays in view while the biography scrolls beside it */}
        <div className="order-2 mx-auto w-full max-w-[26rem] lg:sticky lg:top-28 lg:order-1 lg:col-span-5 lg:max-w-none lg:self-start">
          <CentreReveal />
        </div>

        {/* Column rule between portrait and text */}
        <div aria-hidden className="relative hidden lg:order-2 lg:col-span-1 lg:block">
          <DrawLine axis="y" immediate delay={0.9} duration={1.2} className="absolute inset-y-0 left-1/2 bg-line" />
        </div>

        <div className="order-1 lg:order-3 lg:col-span-6">
          <RevealText as="h1" id="about-title" lines={aboutHeading} className="heading-1" delay={0.1} immediate />
          <motion.div {...entrance(0.55)}>
            {byline.length > 0 && (
              <ul className="mt-8 flex flex-col gap-1.5 text-sm text-muted sm:flex-row sm:flex-wrap sm:gap-y-2" aria-label="At a glance">
                {byline.map((b, i) => (
                  <li key={i} className="flex items-center text-fg/85">
                    {i > 0 && (
                      <span aria-hidden className="mx-3 hidden text-line-strong sm:inline">
                        ·
                      </span>
                    )}
                    {b}
                  </li>
                ))}
              </ul>
            )}
            {/* The biography, one paragraph per entry: the first as a lead, the rest at reading size */}
            {bio.length > 0 && (
              <>
                <span aria-hidden className="mt-8 block h-0.5 w-16 bg-accent" />
                {bio.map((paragraph, i) =>
                  i === 0 ? (
                    <p key={i} className="lead measure mt-8 text-fg/90">
                      {paragraph}
                    </p>
                  ) : (
                    <p key={i} className="measure mt-5 text-[1.0625rem] leading-[1.75] text-fg/80">
                      {paragraph}
                    </p>
                  ),
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ── 2. The profile: up to three chapters with a quiet reading guide ─────── */

type ChapterKind = 'journey' | 'philosophy' | 'patient'

/** Only chapters with text are shown; numbering, navigation and spacing follow the ones present. */
const chapters = (
  [
    { id: 'chapter-journey', kind: 'journey', title: 'Professional journey', body: doctor.about.journey },
    // The doctor's approach statement when supplied, otherwise the philosophy text.
    { id: 'chapter-philosophy', kind: 'philosophy', title: 'Clinical philosophy', body: [doctor.approachStatement, doctor.about.philosophy].find(hasValue) },
    { id: 'chapter-patient', kind: 'patient', title: 'Patient-centred approach', body: doctor.about.patientCentered },
  ] satisfies { id: string; kind: ChapterKind; title: string; body?: string }[]
).filter((c): c is typeof c & { body: string } => hasValue(c.body))

function Profile() {
  const articleRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  // Reading progress through the article, for the 1px guide line.
  const { scrollYProgress } = useScroll({ target: articleRef, offset: ['start 40%', 'end 60%'] })

  // The chapter crossing the reading line (just above the middle of the viewport).
  const [active, setActive] = useState(0)
  useEffect(() => {
    const els = chapters.map((c) => document.getElementById(c.id)).filter((el): el is HTMLElement => !!el)
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(els.indexOf(e.target as HTMLElement))
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const goTo = (i: number) => {
    const el = document.getElementById(chapters[i].id)
    if (!el) return
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 112, behavior: reduce ? 'instant' : 'smooth' })
    el.focus({ preventScroll: true })
  }

  // With a single chapter there is nothing to navigate: heading beside the text, no index.
  if (chapters.length === 1) {
    const animated = !reduce
    const [c] = chapters
    return (
      <section aria-label="Profile" className="border-t border-line">
        <div className="container-page section-y">
          {/* Both columns scroll with the page and rise in together, once */}
          <motion.article
            id={c.id}
            aria-labelledby={`${c.id}-title`}
            tabIndex={-1}
            initial={animated ? { opacity: 0, y: 24 } : false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={ONCE}
            transition={{ duration: 0.8, ease: EASE }}
            className="grid gap-10 focus:outline-none lg:grid-cols-12 lg:items-start lg:gap-12"
          >
            <div className="lg:col-span-4">
              <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <StethoscopeIcon className="h-7 w-7" />
              </span>
              <h2 id={`${c.id}-title`} className="heading-2 mt-6">
                {c.title}
              </h2>
              <span aria-hidden className="mt-6 block h-0.5 w-16 bg-accent" />
              {c.kind === 'philosophy' && (
                <p className="mt-6">
                  <span className="block font-semibold">{doctor.name}</span>
                  {hasValue(doctor.title) && <span className="mt-1 block text-sm text-muted">{doctor.title}</span>}
                </p>
              )}
            </div>
            <div className="lg:col-span-8">{c.kind === 'philosophy' ? <PhilosophyQuote body={c.body} /> : <p className="measure text-lg leading-[1.75] text-fg/90">{c.body}</p>}</div>
          </motion.article>
        </div>
      </section>
    )
  }

  return (
    <section aria-label="Profile" className="border-t border-line">
      <div className="container-page section-y">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Chapter index with the reading guide (desktop) */}
          <nav aria-label="Profile chapters" className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-32">
              <div className="relative pl-6">
                {/* 1px track and its teal fill: an editorial reading guide */}
                <span aria-hidden className="absolute inset-y-0 left-0 w-px bg-line" />
                <motion.span aria-hidden className="absolute inset-y-0 left-0 w-px origin-top bg-accent" style={{ scaleY: scrollYProgress }} />
                <ol className="space-y-1">
                  {chapters.map((c, i) => (
                    <li key={c.id} className="relative">
                      {active === i && (
                        <motion.span
                          layoutId="chapter-marker"
                          aria-hidden
                          className="absolute -left-6 top-1/2 h-px w-3 bg-accent"
                          transition={{ duration: 0.45, ease: EASE_IN_OUT }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        aria-current={active === i ? 'true' : undefined}
                        className={`flex min-h-11 items-baseline gap-3 text-left transition-colors duration-300 ${
                          active === i ? 'text-fg' : 'text-muted hover:text-fg'
                        }`}
                      >
                        <span aria-hidden className="font-serif text-sm tabular-nums text-brass">
                          {pad(i + 1)}
                        </span>
                        <span>{c.title}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </nav>

          {/* The article */}
          <div ref={articleRef} className="space-y-16 md:space-y-24 lg:col-span-8 lg:col-start-5">
            {chapters.map((c, i) => (
              <article key={c.id} id={c.id} aria-labelledby={`${c.id}-title`} tabIndex={-1} className="focus:outline-none">
                <ChapterHead n={i + 1} id={`${c.id}-title`} title={c.title} />
                {c.kind === 'philosophy' ? (
                  <div className="mt-8">
                    <PhilosophyQuote body={c.body} />
                  </div>
                ) : (
                  <p
                    className={`measure mt-6 text-lg leading-[1.7] text-fg/90 ${
                      // The professional journey opens with a drop cap
                      c.kind === 'journey'
                        ? 'first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-serif first-letter:text-[4.25rem] first-letter:leading-[0.8] first-letter:text-fg'
                        : ''
                    }`}
                  >
                    {c.body}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * The clinical philosophy as a quotation card: a large quotation mark, the
 * opening sentence as a serif lead, and the rest in the body face at a
 * comfortable reading size and measure.
 */
function PhilosophyQuote({ body }: { body: string }) {
  // Split after the first sentence; a single sentence is shown entirely as the lead.
  const match = /^(.+?[.!?])\s+(.+)$/s.exec(body.trim())
  const [lead, rest] = match ? [match[1], match[2]] : [body.trim(), '']

  return (
    <figure className="relative rounded-[2rem] bg-surface px-7 py-10 sm:px-10 md:px-14 md:py-14">
      <span aria-hidden className="block font-serif text-6xl leading-none text-accent">
        &ldquo;
      </span>
      <blockquote className="relative mt-2">
        <p className="font-serif text-[clamp(1.5rem,1.25rem+1vw,2rem)] leading-[1.3] tracking-[-0.01em] text-fg">{lead}</p>
        {rest && <p className="measure mt-6 text-[1.0625rem] leading-[1.8] text-fg/85 md:text-lg">{rest}</p>}
      </blockquote>
      {/* The closing mark, answering the opening one */}
      <span aria-hidden className="mt-4 block text-right font-serif text-6xl leading-none text-accent">
        &rdquo;
      </span>
    </figure>
  )
}

/** A line-drawn stethoscope, the icon for the clinical philosophy. */
function StethoscopeIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4.5 3h3M14.5 3h3" />
      <path d="M6 3v5a5 5 0 0 0 10 0V3" />
      <path d="M11 13v2.5a4.5 4.5 0 0 0 9 0V15" />
      <circle cx="20" cy="12.5" r="2.5" />
    </svg>
  )
}

function ChapterHead({ n, id, title }: { n: number; id: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span aria-hidden className="font-serif tabular-nums text-brass">
        {pad(n)}
      </span>
      <RevealText as="h2" id={id} lines={[title]} className="heading-2" />
    </div>
  )
}

/* ── 3. Education and training: a CV-style fact file ─────────────────────── */

function FactFile() {
  const { about } = doctor
  // Education and training come from the same entries as the credentials on the Experience page.
  const fromCredentials = (category: string) =>
    (doctor.credentials.find((g) => g.category === category)?.items ?? [])
      .filter((c) => hasValue(c.title))
      .map((c) => ({ title: c.title, detail: [c.institution, c.year].filter(hasValue).join(', ') }))
  const plain = (values: string[]) => publishable(values).map((title) => ({ title, detail: '' }))
  // Rows with no confirmed entries are left out; the section is hidden if none remain.
  const rows = [
    { title: 'Education', icon: 'education' as const, noun: ['qualification', 'qualifications'], items: fromCredentials(QUALIFICATIONS) },
    { title: 'Training', icon: 'training' as const, noun: ['programme', 'programmes'], items: fromCredentials(TRAINING) },
    { title: 'Experience', icon: 'experience' as const, noun: ['role', 'roles'], items: plain(about.experience) },
    { title: 'Languages', icon: 'languages' as const, noun: ['language', 'languages'], items: plain(about.languages) },
  ].filter((r) => r.items.length > 0)
  if (rows.length === 0) return null

  return (
    <section aria-labelledby="facts-title" className="border-t border-line bg-surface">
      <div className="container-page section-y">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <RevealText as="h2" id="facts-title" lines={['Education and', 'training']} className="heading-2" />
            <Link to="/research" className="group/btn mt-8 inline-flex min-h-11 items-center gap-2 font-medium text-accent hover:text-accent-hover">
              <span className="link-underline">All credentials</span>
              <ArrowRight />
            </Link>
          </div>

          <dl className="lg:col-span-8">
            {rows.map((r, i) => (
              <div key={r.title} className="relative grid gap-2 py-6 sm:grid-cols-[12rem_1fr] sm:gap-6 md:py-7">
                <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" delay={i * 0.1} duration={1} />
                <dt className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-3">
                  <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <CredentialIcon name={r.icon} className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block font-semibold text-fg">{r.title}</span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {r.items.length} {r.noun[r.items.length === 1 ? 0 : 1]}
                    </span>
                  </span>
                </dt>
                <dd>
                  <ul className="space-y-3">
                    {r.items.map((item, j) => (
                      <li key={j}>
                        <span className="block text-lg">{item.title}</span>
                        {item.detail && <span className="mt-0.5 block text-sm text-muted">{item.detail}</span>}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
            <div aria-hidden className="relative">
              <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" delay={rows.length * 0.1} duration={1} />
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}

/* ── 5. Approach to care: a line that fills as you read ──────────────────── */

function ApproachToCare() {
  const stages = doctor.approach.filter((s) => hasValue(s.title))
  const listRef = useRef<HTMLOListElement>(null)
  const { progress, reached } = useScrollTrack(listRef, stages.length)
  const animated = useDecorativeMotion()
  const current = Math.max(reached, 1)

  return (
    <section aria-labelledby="approach-title" className="border-y border-line bg-surface">
      <div className="container-page section-y">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start">
            <RevealText as="h2" id="approach-title" lines={['Approach to care']} className="heading-2" />
            {/* Stage counter: the number rolls to the next stage */}
            <p className="mt-10 hidden items-baseline font-serif text-2xl tabular-nums lg:flex" aria-hidden>
              <span className="relative inline-block h-[1.2em] overflow-hidden text-brass">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={current}
                    className="block leading-[1.2]"
                    initial={animated ? { y: '100%' } : false}
                    animate={{ y: '0%' }}
                    exit={animated ? { y: '-100%', transition: { duration: 0.25, ease: EASE_EXIT } } : { opacity: 0, transition: { duration: 0 } }}
                    transition={{ duration: 0.45, ease: EASE }}
                  >
                    {pad(current)}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="ml-2 text-muted">/ {pad(stages.length)}</span>
            </p>
          </div>

          <ol ref={listRef} className="relative lg:col-span-7">
            {/* Track and progress */}
            <span aria-hidden className="absolute bottom-6 left-[1.1875rem] top-6 w-px bg-line" />
            <motion.span aria-hidden className="absolute bottom-6 left-[1.1875rem] top-6 w-px origin-top bg-accent" style={{ scaleY: progress }} />

            {stages.map((s, i) => {
              const passed = i < reached
              return (
                <li key={s.title} className="relative grid grid-cols-[2.5rem_1fr] gap-5 pb-12 last:pb-0 sm:gap-8">
                  <span
                    aria-hidden
                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border font-serif text-base tabular-nums transition-colors duration-500 ${
                      passed ? 'border-accent bg-accent text-on-accent' : 'border-line-strong bg-surface text-muted'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="pt-1.5">
                    <h3 className="font-serif text-[clamp(1.5rem,1.3rem+0.9vw,2.125rem)] leading-[1.15] tracking-[-0.015em]">
                      <span className="sr-only">Stage {i + 1}: </span>
                      {s.title}
                    </h3>
                    <p className="measure mt-3 text-fg/85">{s.description}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
