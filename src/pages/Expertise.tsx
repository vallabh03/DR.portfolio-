import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import { doctor, isPlaceholder } from '../data/doctor'
import { BOOK_PATH } from '../data/navigation'
import { EASE, EASE_EXIT, EASE_IN_OUT, useDecorativeMotion, useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import MedicalImage from '../components/MedicalImage'
import DrawLine from '../components/DrawLine'
import { ArrowRight } from '../components/Button'
import BookingPrompt from '../components/BookingPrompt'

const pad = (n: number) => String(n).padStart(2, '0')
const areaId = (i: number) => `area-${i + 1}`

/**
 * Expertise: a clinical atlas. One entry per area of focus, each with its
 * conditions and procedures always visible. On desktop a sticky image plate
 * follows the entry being read: the plate wipes upward to the next image, its
 * number rolls, and a four-part indicator shows position in the sequence.
 */
export default function Expertise() {
  const items = doctor.expertise
  const active = useActiveArea(items.length)

  return (
    <>
      <Opening active={active} />
      <Atlas active={active} />
      <ClosingNote />
      <BookingPrompt />
    </>
  )
}

/** Index of the entry crossing the reading line; holds the last one between entries. */
function useActiveArea(count: number) {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const els = Array.from({ length: count }, (_, i) => document.getElementById(areaId(i))).filter((el): el is HTMLElement => !!el)
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(els.indexOf(e.target as HTMLElement))
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [count])
  return active
}

function useJumpTo() {
  const reduce = useReducedMotion()
  return (i: number) => {
    const el = document.getElementById(areaId(i))
    if (!el) return
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 112, behavior: reduce ? 'instant' : 'smooth' })
    el.focus({ preventScroll: true })
  }
}

/* ── 1. Opening: headline, introduction and a table of contents ──────────── */

function Opening({ active }: { active: number }) {
  const entrance = useEntrance()
  const jumpTo = useJumpTo()
  const items = doctor.expertise

  return (
    <section aria-labelledby="expertise-title" className="container-page pb-12 pt-10 md:pb-16 md:pt-16 lg:pt-24">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
        <RevealText as="h1" id="expertise-title" lines={['Areas of', 'clinical focus']} className="display-hero lg:col-span-8" delay={0.1} immediate />
        <motion.p className="lead measure lg:col-span-4 lg:pb-3" {...entrance(0.45)}>
          Each area of clinical focus, with the conditions and procedures it covers.
        </motion.p>
      </div>

      {/* Table of contents: the four areas as one set */}
      <nav aria-label="Areas of care" className="relative mt-12 md:mt-16">
        <DrawLine immediate delay={0.5} duration={1.2} className="absolute inset-x-0 top-0 bg-line-strong" />
        <ol className="grid lg:grid-cols-4 lg:gap-6">
          {items.map((item, i) => (
            <li key={i} className="relative border-b border-line lg:border-b-0">
              <button
                type="button"
                onClick={() => jumpTo(i)}
                aria-current={active === i ? 'true' : undefined}
                className="group flex min-h-11 w-full items-baseline gap-3 py-3 text-left lg:pb-5 lg:pt-4"
              >
                <span aria-hidden className="font-serif tabular-nums text-brass">
                  {pad(i + 1)}
                </span>
                <span
                  className={`transition-[transform,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 group-hover:text-fg ${
                    active === i ? 'text-fg' : 'text-muted'
                  }`}
                >
                  {item.title}
                </span>
              </button>
              {/* The active marker slides between entries (desktop) */}
              {active === i && (
                <motion.span
                  layoutId="atlas-toc-marker"
                  aria-hidden
                  className="absolute bottom-0 left-0 hidden h-px w-10 bg-accent lg:block"
                  transition={{ duration: 0.45, ease: EASE_IN_OUT }}
                />
              )}
            </li>
          ))}
        </ol>
      </nav>
    </section>
  )
}

/* ── 2. The atlas: sticky plate (desktop) beside the entries ─────────────── */

function Atlas({ active }: { active: number }) {
  const items = doctor.expertise

  return (
    <section aria-label="Areas of care in detail" className="border-t border-line">
      <div className="container-page pb-16 pt-12 md:pb-24 md:pt-16 lg:pb-32">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="hidden lg:col-span-5 lg:block">
            <Plate active={active} />
          </div>
          <div className="lg:col-span-7">
            {items.map((item, i) => (
              <Entry key={i} index={i} isActive={active === i} title={item.title} description={item.description} details={item.details} image={item.image} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/** The sticky image plate: wipes upward between images, with a rolling number and progress. */
function Plate({ active }: { active: number }) {
  const items = doctor.expertise
  const animated = useDecorativeMotion()
  const item = items[active]

  return (
    <figure className="sticky top-28">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-surface-2">
        <AnimatePresence initial={false}>
          <motion.div
            key={active}
            className="absolute inset-0"
            initial={animated ? { clipPath: 'inset(100% 0% 0% 0%)', zIndex: 1 } : false}
            animate={{ clipPath: 'inset(0% 0% 0% 0%)', zIndex: 1 }}
            // The previous plate stays beneath until the new one has covered it.
            exit={{ zIndex: 0, transition: { duration: 0, delay: animated ? 0.8 : 0 } }}
            transition={{ duration: 0.8, ease: EASE_IN_OUT }}
          >
            <motion.div
              className="absolute inset-0"
              initial={animated ? { scale: 1.04 } : false}
              animate={{ scale: 1 }}
              transition={{ duration: 1.2, ease: EASE }}
            >
              <MedicalImage
                src={item.image}
                sizes="(min-width: 1360px) 520px, 38vw"
                alt={`${item.title}, illustrative image`}
                placeholderLabel={`Expertise ${pad(active + 1)}`}
                priority
                reveal={false}
                hoverZoom={false}
                className="h-full w-full"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Caption: plate number, title and position in the sequence (visual; the entries carry the text) */}
      <figcaption aria-hidden className="mt-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="flex items-baseline gap-2 text-sm text-muted">
            Plate
            <span className="relative inline-block h-[1.4em] overflow-hidden font-serif text-base tabular-nums text-brass">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={active}
                  className="block leading-[1.4]"
                  initial={animated ? { y: '100%' } : false}
                  animate={{ y: '0%' }}
                  exit={animated ? { y: '-100%', transition: { duration: 0.25, ease: EASE_EXIT } } : { opacity: 0, transition: { duration: 0 } }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  {pad(active + 1)}
                </motion.span>
              </AnimatePresence>
            </span>
            / {pad(items.length)}
          </span>
          <span className={`truncate text-right text-sm ${isPlaceholder(item.title) ? 'text-muted' : 'text-fg'}`}>{item.title}</span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {items.map((_, i) => (
            <span
              key={i}
              className={`h-px transition-colors duration-500 ${i === active ? 'bg-accent' : i < active ? 'bg-fg/40' : 'bg-line-strong'}`}
            />
          ))}
        </div>
      </figcaption>
    </figure>
  )
}

/** One atlas entry: number, title, brass rule, description, and its conditions and procedures. */
function Entry({
  index,
  isActive,
  title,
  description,
  details,
  image,
}: {
  index: number
  isActive: boolean
  title: string
  description: string
  details: string[]
  image: string
}) {
  const animated = useDecorativeMotion()
  const n = pad(index + 1)

  return (
    <article
      id={areaId(index)}
      tabIndex={-1}
      aria-labelledby={`${areaId(index)}-title`}
      className="relative py-12 focus:outline-none md:py-16 lg:flex lg:min-h-[70vh] lg:flex-col lg:justify-center"
    >
      {index > 0 && <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" duration={1.1} />}

      {/* Phones and tablets: the image sits in the entry, opening once as it arrives */}
      <MedicalImage
        src={image}
        sizes="(min-width: 768px) 90vw, 100vw"
        alt={`${title}, illustrative image`}
        placeholderLabel={`Expertise ${n}`}
        hoverZoom={false}
        className="mb-8 aspect-[4/3] w-full rounded-lg lg:hidden"
      />

      <div className="flex items-baseline gap-4">
        <span aria-hidden className="font-serif text-xl tabular-nums text-brass">
          {n}
        </span>
        {/* Teal marker: ties the entry being read to the plate (desktop) */}
        <motion.span
          aria-hidden
          className="hidden h-px w-8 origin-left self-center bg-accent lg:block"
          initial={false}
          animate={{ scaleX: isActive ? 1 : 0 }}
          transition={{ duration: animated ? 0.5 : 0, ease: EASE_IN_OUT }}
        />
      </div>

      <h2
        id={`${areaId(index)}-title`}
        className={`mt-4 font-serif text-[clamp(2.25rem,1.7rem+2.4vw,3.5rem)] leading-[1.05] tracking-[-0.02em] ${
          isPlaceholder(title) ? 'text-fg/75' : ''
        }`}
      >
        {title}
      </h2>
      <DrawLine className="mt-6 w-16 bg-brass" duration={0.7} />
      <p className={`measure mt-6 text-lg leading-[1.7] ${isPlaceholder(description) ? 'text-muted' : 'text-fg/90'}`}>{description}</p>

      <h3 className="label mt-10">Conditions and procedures</h3>
      <ul className="measure mt-3 border-t border-line">
        {details.map((d, j) => (
          <li key={j} className={`border-b border-line py-3 ${isPlaceholder(d) ? 'text-muted' : ''}`}>
            {d}
          </li>
        ))}
      </ul>
    </article>
  )
}

/* ── 3. Closing note ─────────────────────────────────────────────────────── */

function ClosingNote() {
  return (
    <section aria-label="About these listings" className="container-page pb-16 md:pb-24">
      <div className="flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted">Only verified specialties are listed here.</p>
        <Link to={BOOK_PATH} className="group/btn inline-flex min-h-11 items-center gap-2 font-medium text-accent hover:text-accent-hover">
          <span className="link-underline">Book a consultation</span>
          <ArrowRight />
        </Link>
      </div>
    </section>
  )
}
