import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, useScroll } from 'motion/react'
import { Link } from 'react-router'
import { doctor, isPlaceholder } from '../data/doctor'
import { EASE, EASE_EXIT, EASE_IN_OUT, ONCE, useDecorativeMotion, useEntrance } from '../lib/motion'
import { useScrollTrack } from '../hooks/useScrollTrack'
import RevealText from '../components/RevealText'
import MedicalImage from '../components/MedicalImage'
import DrawLine from '../components/DrawLine'
import { ArrowRight } from '../components/Button'
import BookingPrompt from '../components/BookingPrompt'

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
      <Profile />
      <FactFile />
      <Practice />
      <ApproachToCare />
      <BookingPrompt />
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
      className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-surface-2"
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
  const byline = [doctor.title, doctor.contact.clinic, doctor.about.languages.join(', ')]

  return (
    <section aria-labelledby="about-title" className="container-page pb-16 pt-10 md:pb-24 md:pt-16 lg:pt-20">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-0">
        {/* On phones the heading leads; on desktop the portrait sits on the left */}
        <div className="order-2 mx-auto w-full max-w-[26rem] lg:order-1 lg:col-span-5 lg:max-w-none">
          <CentreReveal />
        </div>

        {/* Column rule between portrait and text */}
        <div aria-hidden className="relative hidden lg:order-2 lg:col-span-1 lg:block">
          <DrawLine axis="y" immediate delay={0.9} duration={1.2} className="absolute inset-y-0 left-1/2 bg-line" />
        </div>

        <div className="order-1 lg:order-3 lg:col-span-6 lg:self-center">
          <RevealText as="h1" id="about-title" lines={['About Dr.', 'Abhinav Thaduri']} className="heading-1" delay={0.1} immediate />
          <motion.div {...entrance(0.55)}>
            <ul className="mt-8 flex flex-col gap-1.5 text-sm text-muted sm:flex-row sm:flex-wrap sm:gap-y-2" aria-label="At a glance">
              {byline.map((b, i) => (
                <li key={i} className={`flex items-center ${isPlaceholder(b) ? '' : 'text-fg/85'}`}>
                  {i > 0 && (
                    <span aria-hidden className="mx-3 hidden text-line-strong sm:inline">
                      ·
                    </span>
                  )}
                  {b}
                </li>
              ))}
            </ul>
            <span aria-hidden className="mt-8 block h-px w-16 bg-accent" />
            <p className={`lead measure mt-8 ${isPlaceholder(doctor.biography) ? '' : 'text-fg/85'}`}>{doctor.biography}</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ── 2. The profile: three chapters with a quiet reading guide ───────────── */

function Profile() {
  const { about } = doctor
  const chapters = [
    { id: 'chapter-journey', title: 'Professional journey', body: about.journey },
    { id: 'chapter-philosophy', title: 'Clinical philosophy', body: about.philosophy },
    { id: 'chapter-patient', title: 'Patient-centred approach', body: about.patientCentered },
  ]
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
            {/* 01: Professional journey, opening with a drop cap once real text exists */}
            <article id={chapters[0].id} aria-labelledby="journey-title" tabIndex={-1} className="focus:outline-none">
              <ChapterHead n={1} id="journey-title" title={chapters[0].title} />
              <p
                className={`measure mt-6 text-lg leading-[1.7] ${
                  isPlaceholder(about.journey)
                    ? 'text-muted'
                    : 'text-fg/90 first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-serif first-letter:text-[4.25rem] first-letter:leading-[0.8] first-letter:text-fg'
                }`}
              >
                {about.journey}
              </p>
            </article>

            {/* 02: Clinical philosophy, set as a quotation within the article */}
            <article id={chapters[1].id} aria-labelledby="philosophy-title" tabIndex={-1} className="focus:outline-none">
              <ChapterHead n={2} id="philosophy-title" title={chapters[1].title} />
              <figure className="relative mt-8 py-10 md:py-12">
                <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" duration={1.1} />
                <blockquote
                  className={`font-serif text-[clamp(1.625rem,1.3rem+1.4vw,2.375rem)] leading-[1.3] tracking-[-0.01em] ${
                    isPlaceholder(about.philosophy) ? 'text-muted' : ''
                  }`}
                >
                  {about.philosophy}
                </blockquote>
                <DrawLine className="absolute inset-x-0 bottom-0 bg-line-strong" duration={1.1} delay={0.15} />
              </figure>
            </article>

            {/* 03: Patient-centred approach */}
            <article id={chapters[2].id} aria-labelledby="patient-title" tabIndex={-1} className="focus:outline-none">
              <ChapterHead n={3} id="patient-title" title={chapters[2].title} />
              <p className={`measure mt-6 text-lg leading-[1.7] ${isPlaceholder(about.patientCentered) ? 'text-muted' : 'text-fg/90'}`}>
                {about.patientCentered}
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
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
  const rows = [
    { title: 'Education', items: about.education },
    { title: 'Training', items: about.training },
    { title: 'Experience', items: about.experience },
    { title: 'Languages', items: about.languages },
  ]

  return (
    <section aria-labelledby="facts-title" className="border-t border-line bg-surface">
      <div className="container-page section-y">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <RevealText as="h2" id="facts-title" lines={['Education and', 'training']} className="heading-2" />
            <Link to="/experience" className="group/btn mt-8 inline-flex min-h-11 items-center gap-2 font-medium text-accent hover:text-accent-hover">
              <span className="link-underline">Full timeline and credentials</span>
              <ArrowRight />
            </Link>
          </div>

          <dl className="lg:col-span-8">
            {rows.map((r, i) => (
              <div key={r.title} className="relative grid gap-2 py-6 sm:grid-cols-[12rem_1fr] sm:gap-6 md:py-7">
                <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" delay={i * 0.1} duration={1} />
                <dt className="text-muted">{r.title}</dt>
                <dd>
                  <ul className="space-y-1.5">
                    {r.items.map((item, j) => (
                      <li key={j} className={`text-lg ${isPlaceholder(item) ? 'text-muted' : ''}`}>
                        {item}
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

/* ── 4. The practice: a wide photograph that wipes open and settles ──────── */

function Practice() {
  const animated = useDecorativeMotion()
  const clinic = doctor.contact.clinic

  return (
    <section aria-labelledby="practice-title" className="container-page section-y">
      <RevealText as="h2" id="practice-title" lines={['The practice']} className="heading-2" />
      <figure className="mt-10 md:mt-12">
        <motion.div
          className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-2 md:aspect-[21/9]"
          initial={animated ? { clipPath: 'inset(0% 100% 0% 0%)' } : false}
          whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          viewport={ONCE}
          transition={{ duration: 1.2, ease: EASE_IN_OUT }}
        >
          <motion.div
            className="absolute inset-0"
            initial={animated ? { scale: 1.06 } : false}
            whileInView={{ scale: 1 }}
            viewport={ONCE}
            transition={{ duration: 1.8, ease: EASE }}
          >
            <MedicalImage
              src="/images/clinic.jpg"
              sizes="(min-width: 1360px) 1248px, 100vw"
              alt="The clinic"
              placeholderLabel="Clinic"
              reveal={false}
              hoverZoom={false}
              className="h-full w-full"
            />
          </motion.div>
        </motion.div>
        <figcaption className="mt-5 flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className={isPlaceholder(clinic) ? '' : 'text-fg/85'}>{clinic}</span>
          <Link to="/contact" className="group/btn inline-flex min-h-11 items-center gap-2 font-medium text-accent hover:text-accent-hover">
            <span className="link-underline">Visit and contact</span>
            <ArrowRight />
          </Link>
        </figcaption>
      </figure>
    </section>
  )
}

/* ── 5. Approach to care: a line that fills as you read ──────────────────── */

function ApproachToCare() {
  const stages = doctor.approach
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
            <p className="lead measure mt-6">
              What to expect, from the first conversation to follow-up. Every patient is different. This describes the general
              process, not a promise of any particular outcome.
            </p>
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

        <p className="measure mt-16 rounded-lg border border-line bg-bg p-6 leading-relaxed text-muted sm:p-8">
          <span className="mb-2 block font-medium text-fg">Please note</span>
          Treatment decisions depend on each person’s circumstances and are made together after a full clinical assessment. No
          specific result can be guaranteed.
        </p>
      </div>
    </section>
  )
}
