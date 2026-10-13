import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router'
import { doctor, hasValue, publishable, QUALIFICATIONS, shortName, TRAINING } from '../data/doctor'
import { BOOK_PATH, showTestimonials } from '../data/navigation'
import { EASE, EASE_EXIT, ONCE, useDecorativeMotion, useEntrance } from '../lib/motion'
import MedicalImage from '../components/MedicalImage'
import { ArrowRight } from '../components/Button'
import Testimonials from '../components/Testimonials'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Props for a section reveal: a short rise and fade, played once as the element
 * scrolls into view. Under reduced motion it returns nothing, so content is simply there.
 */
function useReveal() {
  const animated = useDecorativeMotion()
  return (delay = 0, y = 24) =>
    animated
      ? { initial: { opacity: 0, y }, whileInView: { opacity: 1, y: 0 }, viewport: ONCE, transition: { duration: 0.8, ease: EASE, delay } }
      : {}
}

/** Lists whose items arrive one after another as the list scrolls into view (items use ITEM). */
const STAGGER = { hidden: {}, shown: { transition: { staggerChildren: 0.08 } } }
const ITEM = { hidden: { opacity: 0, y: 20 }, shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }

function useStagger() {
  const animated = useDecorativeMotion()
  return animated ? { variants: STAGGER, initial: 'hidden', whileInView: 'shown', viewport: ONCE } : {}
}

/** Cards lift slightly on hover; the shadow transition is CSS so it also works without JavaScript motion. */
const LIFT = 'transition-[translate,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_28px_50px_-26px_rgba(27,95,140,0.55)]'

/**
 * Home: soft clinical blue. A bold name set around the doctor's portrait, then
 * an introduction, a tabbed record of clinical work, the approach statement,
 * professional memberships and a booking invitation. Every value comes from
 * doctor.ts; sections without confirmed content are left out. Colours are
 * scoped to .home-blue in globals.css, so no other page changes.
 *
 * Motion: the name rises in, the portrait opens and its background shapes settle,
 * then each section rises once as it scrolls into view, with list items arriving
 * in sequence. The tab highlight slides between tabs and cards lift on hover.
 * Nothing moves continuously. Reduced motion shows everything in place, with no
 * movement.
 */
export default function Home() {
  return (
    <div className="home-blue">
      <Hero />
      <Introduction />
      <section aria-label="Clinical work and memberships">
        {/* The pale band, with a rounded upper corner where it meets the white page */}
        <div className="bg-[var(--b-band)] pb-16 pt-14 md:pb-24 md:pt-20 lg:rounded-tl-[4rem]">
          <ClinicalWork />
          <Approach />
          <Memberships />
        </div>
      </section>
      {showTestimonials && <Testimonials />}
    </div>
  )
}

/* ── Building blocks ─────────────────────────────────────────────────────── */

const H2 = 'font-sans font-extrabold text-[clamp(2rem,1.5rem+2vw,3rem)] leading-[1.08] tracking-[-0.02em] text-[var(--b-blue)]'
const CROSS = 'M16 6h8v10h10v8H24v10h-8V24H6v-8h10z'

/** Pill button: solid blue for the primary action, outlined for the secondary one. */
function PillButton({ to, solid, children }: { to: string; solid?: boolean; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={`group/btn inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full border-2 px-6 text-[0.9375rem] font-semibold transition-colors duration-300 ${
        solid
          ? 'border-[var(--b-blue)] bg-[var(--b-blue)] text-[var(--b-on-blue)] hover:border-[var(--b-blue-hover)] hover:bg-[var(--b-blue-hover)]'
          : 'border-[var(--b-blue)] text-[var(--b-blue)] hover:bg-[var(--b-blue)] hover:text-[var(--b-on-blue)]'
      }`}
    >
      {children}
    </Link>
  )
}

function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="group/btn inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--b-blue)] hover:text-[var(--b-blue-hover)]">
      <span className="link-underline">{children}</span>
      <ArrowRight />
    </Link>
  )
}

/* ── 1. Hero: the name set around the portrait ───────────────────────────── */

function Hero() {
  const animated = useDecorativeMotion()
  const entrance = useEntrance()
  const rise = (delay: number) =>
    animated ? { initial: { y: '0.35em', opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.8, ease: EASE, delay } } : {}
  // Background pills glide in from the right edge; the shapes behind the portrait settle from slightly larger.
  const glide = (delay: number, opacity = 1) =>
    animated ? { initial: { x: 120, opacity: 0 }, animate: { x: 0, opacity }, transition: { duration: 1.4, ease: EASE, delay } } : {}
  const settle = (delay: number, opacity = 1) =>
    animated ? { initial: { scale: 0.85, opacity: 0 }, animate: { scale: 1, opacity }, transition: { duration: 1.2, ease: EASE, delay } } : {}
  const NAME = 'font-sans font-extrabold leading-[0.98] tracking-[-0.03em] text-[var(--b-blue)] text-[clamp(2.5rem,1.5rem+3.6vw,4.75rem)]'

  return (
    <section aria-labelledby="home-title" className="relative overflow-hidden">
      {/* Soft background pills, decoration only */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.span {...glide(0.2)} className="absolute -right-24 top-16 hidden h-28 w-[26rem] rounded-full bg-[var(--b-shape)] md:block" />
        <motion.span {...glide(0.35, 0.7)} className="absolute -right-10 top-56 hidden h-28 w-[30rem] rounded-full bg-[var(--b-shape)] opacity-70 lg:block" />
      </div>

      <div className="container-page relative pb-14 pt-10 md:pb-20 md:pt-14 lg:pb-24">
        {/* One heading for assistive technology; the two visual lines below are its presentation */}
        <h1 id="home-title" tabIndex={-1} className="sr-only">
          {doctor.name}
        </h1>

        <div className="grid items-center gap-y-8 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-2">
          {/* Line one: first name */}
          <motion.p aria-hidden {...rise(0.1)} className={`${NAME} lg:col-span-8 lg:col-start-1 lg:row-start-1 lg:self-end lg:whitespace-nowrap`}>
            {doctor.firstLine}
          </motion.p>

          {/* The portrait, beside both lines on wide screens */}
          <div className="relative mx-auto w-full max-w-[22rem] sm:max-w-[26rem] lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1 lg:mr-4 lg:max-w-none">
            <motion.span {...settle(0.5, 0.8)} aria-hidden className="absolute -bottom-6 -left-6 h-24 w-[70%] origin-left rounded-full bg-[var(--b-shape-2)] opacity-80" />
            <motion.span {...settle(0.35)} aria-hidden className="absolute -right-5 top-10 h-[70%] w-[80%] origin-top-right rounded-[2.5rem] bg-[var(--b-shape)]" />
            <MedicalImage
              src="/images/doctor-hero.jpg"
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 26rem, 90vw"
              alt={`Portrait of ${doctor.name}`}
              placeholderLabel="Portrait"
              priority
              hoverZoom={false}
              delay={0.15}
              className="relative aspect-[1104/1250] w-full rounded-[2rem] shadow-[var(--b-shadow)]"
              imgClassName="object-top"
            />
          </div>

          {/* Line two: family name, then the title, practice and actions */}
          <div className="lg:col-span-8 lg:col-start-1 lg:row-start-2 lg:self-start">
            <motion.p aria-hidden {...rise(0.25)} className={NAME}>
              {doctor.lastLine}
            </motion.p>
            <motion.div {...entrance(0.6)} className="mt-6">
              {hasValue(doctor.title) && <p className="text-[clamp(1.25rem,1.1rem+0.5vw,1.5rem)] font-bold leading-snug">{doctor.title}</p>}
              {hasValue(doctor.contact.clinic) && <p className="mt-1 text-lg text-[var(--b-muted)]">{doctor.contact.clinic}</p>}
              {hasValue(doctor.qualifications) && <p className="mt-3 text-sm font-medium text-[var(--b-muted)]">{doctor.qualifications}</p>}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <PillButton to={BOOK_PATH} solid>
                  Book a consultation <ArrowRight />
                </PillButton>
                <PillButton to="/about">About {shortName}</PillButton>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── 2. Introduction ─────────────────────────────────────────────────────── */

function Introduction() {
  const facts = [
    { k: 'Specialty', v: doctor.specialty },
    { k: 'Practice', v: doctor.contact.clinic },
    { k: 'Languages', v: publishable(doctor.about.languages).join(', ') },
  ].filter((f) => hasValue(f.v))
  const reveal = useReveal()
  const stagger = useStagger()
  if (!hasValue(doctor.headline) && !hasValue(doctor.bioShort)) return null

  return (
    <section aria-labelledby="intro-title" className="container-page pb-14 md:pb-20">
      <div className="max-w-4xl">
        <motion.h2 {...reveal()} id="intro-title" className={H2}>
          About {shortName}
        </motion.h2>
        <motion.div {...reveal(0.1)}>
          {hasValue(doctor.headline) && <p className="mt-6 text-[clamp(1.375rem,1.2rem+0.7vw,1.75rem)] font-semibold leading-snug">{doctor.headline}</p>}
          {hasValue(doctor.headlineSupport) && <p className="mt-3 text-lg leading-relaxed text-[var(--b-muted)]">{doctor.headlineSupport}</p>}
          {hasValue(doctor.bioShort) && <p className="mt-6 text-lg leading-relaxed">{doctor.bioShort}</p>}
        </motion.div>

        {facts.length > 0 && (
          <motion.dl {...stagger} className="mt-8 flex flex-wrap gap-3">
            {facts.map((f) => (
              <motion.div variants={ITEM} key={f.k} className="flex items-baseline gap-2 rounded-full bg-[var(--b-band)] px-5 py-2.5">
                <dt className="text-sm font-semibold text-[var(--b-blue)]">{f.k}</dt>
                <dd className="text-sm">{f.v}</dd>
              </motion.div>
            ))}
          </motion.dl>
        )}
        <motion.div {...reveal(0.2, 12)} className="mt-6">
          <TextLink to="/about">Full profile</TextLink>
        </motion.div>
      </div>
    </section>
  )
}

/* ── 3. Clinical work: a tabbed record ───────────────────────────────────── */

type Entry = { key: string; title: string; meta?: string; text?: string }
type Tab = { id: string; label: string; entries: Entry[]; more: { to: string; label: string } }

const joinValues = (values: (string | undefined)[], sep: string) => values.filter(hasValue).join(sep)

const credentialEntries = (category: string): Entry[] =>
  (doctor.credentials.find((g) => g.category === category)?.items ?? [])
    .filter((c) => hasValue(c.title))
    .map((c) => ({ key: c.title, title: c.title, meta: joinValues([c.institution, c.year], ', '), text: c.description }))

/** Only tabs with confirmed entries are offered. */
const TABS: Tab[] = (
  [
    {
      id: 'focus',
      label: 'Areas of focus',
      entries: doctor.expertise.filter((e) => hasValue(e.title)).map((e) => ({ key: e.title, title: e.title, text: e.description })),
      more: { to: '/expertise', label: 'All areas of care' },
    },
    {
      id: 'experience',
      label: 'Experience',
      entries: doctor.experience
        .filter((r) => hasValue(r.role))
        .map((r, i) => ({
          key: `${r.role}-${i}`,
          title: r.role,
          meta: joinValues([r.year, joinValues([r.institution, r.location], ', ')], ' · '),
          text: r.description,
        })),
      more: { to: '/about', label: 'Full background' },
    },
    {
      id: 'education',
      label: 'Education and training',
      entries: [...credentialEntries(QUALIFICATIONS), ...credentialEntries(TRAINING)],
      more: { to: '/research', label: 'All credentials' },
    },
  ] satisfies Tab[]
).filter((t) => t.entries.length > 0)

function ClinicalWork() {
  const [active, setActive] = useState(0)
  // Entries cascade in only after the visitor changes tab; on first view the whole card rises together.
  const [switched, setSwitched] = useState(false)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const animated = useDecorativeMotion()
  const reveal = useReveal()
  if (TABS.length === 0) return null
  const tab = TABS[active]
  const select = (i: number) => {
    setActive(i)
    setSwitched(true)
  }

  // Arrow keys move between tabs (either orientation, as the list is vertical on wide screens
  // and horizontal on small ones); Home and End jump to the ends.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowDown: active + 1, ArrowRight: active + 1, ArrowUp: active - 1, ArrowLeft: active - 1, Home: 0, End: TABS.length - 1 }
    if (!(e.key in moves)) return
    e.preventDefault()
    const i = (moves[e.key] + TABS.length) % TABS.length
    select(i)
    tabRefs.current[i]?.focus()
  }

  return (
    <div className="container-page">
      <motion.h2 {...reveal()} id="work-title" className={H2}>
        Clinical work
      </motion.h2>

      <div className="mt-8 grid gap-6 md:mt-10 lg:grid-cols-12 lg:items-start lg:gap-8">
        {/* Tab list: a blue panel; a white highlight slides to the selected tab */}
        <motion.div
          {...reveal(0.1, 16)}
          role="tablist"
          aria-labelledby="work-title"
          onKeyDown={onKeyDown}
          className="flex gap-1 overflow-x-auto rounded-3xl bg-[var(--b-blue)] p-2 shadow-[var(--b-shadow)] lg:col-span-3 lg:flex-col"
        >
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={i === active}
              aria-controls={`panel-${t.id}`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => select(i)}
              className={`relative min-h-11 shrink-0 rounded-2xl px-5 py-2.5 text-left text-[0.9375rem] font-semibold transition-colors duration-300 ${
                i === active ? 'text-[var(--b-blue)]' : 'text-[var(--b-on-blue)] hover:bg-white/10'
              }`}
            >
              {i === active && (
                <motion.span
                  layoutId="home-tab-highlight"
                  aria-hidden
                  className="absolute inset-0 rounded-2xl bg-[var(--b-card)]"
                  transition={{ duration: animated ? 0.45 : 0, ease: EASE }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </motion.div>

        {/* The selected tab's entries in a white card */}
        <motion.div {...reveal(0.2)} className="rounded-[2rem] bg-[var(--b-card)] p-6 shadow-[var(--b-shadow)] sm:p-8 lg:col-span-9 lg:p-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab.id}
              role="tabpanel"
              id={`panel-${tab.id}`}
              aria-labelledby={`tab-${tab.id}`}
              tabIndex={0}
              initial={animated ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } }}
              exit={{ opacity: 0, transition: { duration: animated ? 0.15 : 0, ease: EASE_EXIT } }}
              className="rounded-lg"
            >
              <ul className="divide-y divide-[var(--b-line)]">
                {tab.entries.map((e, i) => (
                  <motion.li
                    key={e.key}
                    initial={animated && switched ? { opacity: 0, y: 10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: EASE, delay: 0.05 * i }}
                    className="grid gap-x-5 py-5 first:pt-0 last:pb-0 sm:grid-cols-[2.5rem_1fr]">
                    <span aria-hidden className="hidden pt-0.5 font-bold tabular-nums text-[var(--b-blue)] sm:block">
                      {pad(i + 1)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[1.125rem] font-bold leading-snug text-[var(--b-blue)]">{e.title}</h3>
                      {hasValue(e.meta) && <p className="mt-1 text-sm font-medium text-[var(--b-muted)]">{e.meta}</p>}
                      {hasValue(e.text) && <p className="mt-2 leading-relaxed">{e.text}</p>}
                    </div>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-6 border-t border-[var(--b-line)] pt-4">
                <TextLink to={tab.more.to}>{tab.more.label}</TextLink>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

/* ── 4. Approach: the doctor's own statement ─────────────────────────────── */

const approachQuote = [doctor.approachStatement, doctor.about.philosophy].find(hasValue)

function Approach() {
  const reveal = useReveal()
  const animated = useDecorativeMotion()
  if (!approachQuote) return null
  return (
    <div className="container-page mt-16 md:mt-24">
      <motion.figure {...reveal()} className="relative overflow-hidden rounded-[2rem] bg-[var(--b-card)] p-8 shadow-[var(--b-shadow)] sm:p-10 lg:p-14">
        <motion.span
          aria-hidden
          className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--b-shape)] opacity-60"
          initial={animated ? { scale: 0.4 } : false}
          whileInView={{ scale: 1 }}
          viewport={ONCE}
          transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
        />
        <h2 className={`${H2} relative`}>Approach to care</h2>
        <motion.blockquote {...reveal(0.2, 12)} className="relative mt-6 max-w-4xl text-[clamp(1.25rem,1.1rem+0.6vw,1.5rem)] leading-[1.55]">{approachQuote}</motion.blockquote>
        <figcaption className="relative mt-6 text-sm font-semibold text-[var(--b-muted)]">{doctor.name}</figcaption>
      </motion.figure>
    </div>
  )
}

/* ── 5. Professional memberships: cards in a grid ────────────────────────── */

// "American Society of Clinical Oncology (ASCO)" -> the abbreviation large, the full name beneath.
const splitAbbr = (title: string) => {
  const m = /^(.*)\s+\(([^)]+)\)$/.exec(title)
  return m ? { name: m[1], abbr: m[2] } : { name: title, abbr: '' }
}

function Memberships() {
  const items = (doctor.credentials.find((g) => g.category === 'Professional Memberships')?.items ?? []).filter((c) => hasValue(c.title))
  const reveal = useReveal()
  const stagger = useStagger()
  if (items.length === 0) return null

  return (
    <div className="container-page mt-16 md:mt-24">
      <motion.h2 {...reveal()} className={`${H2} text-center`}>
        Professional memberships
      </motion.h2>
      <motion.ul {...stagger} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => {
          const { name, abbr } = splitAbbr(m.title)
          return (
            <motion.li variants={ITEM} key={m.title} className={`relative overflow-hidden rounded-3xl bg-[var(--b-card)] p-7 shadow-[var(--b-shadow)] ${LIFT}`}>
              <svg aria-hidden viewBox="0 0 40 40" className="absolute -right-3 -top-3 h-20 w-20 opacity-[0.08]">
                <path d={CROSS} fill="var(--b-blue)" />
              </svg>
              {abbr && <p aria-hidden className="text-[1.75rem] font-black leading-none tracking-[-0.02em] text-[var(--b-blue)]">{abbr}</p>}
              <h3 className={`relative font-bold leading-snug ${abbr ? 'mt-3 text-base' : 'text-[1.125rem] text-[var(--b-blue)]'}`}>
                {name}
                {abbr && <span className="sr-only"> ({abbr})</span>}
              </h3>
            </motion.li>
          )
        })}
      </motion.ul>
    </div>
  )
}
