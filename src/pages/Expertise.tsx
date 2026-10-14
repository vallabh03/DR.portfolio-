import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import { Link } from 'react-router'
import { doctor, hasValue, publishable } from '../data/doctor'
import { BOOK_PATH } from '../data/navigation'
import { EASE_IN_OUT, useDecorativeMotion, useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import { REGION_LABEL, regionFor } from '../data/regions'
import MedicalImage from '../components/MedicalImage'
import imageManifest from '../data/image-manifest.json'
import { ArrowRight } from '../components/Button'

const pad = (n: number) => String(n).padStart(2, '0')
const areaId = (i: number) => `area-${i + 1}`
/** Intrinsic sizes of the optimised images, keyed by path. */
const manifest = imageManifest as Record<string, { width: number; height: number }>

/** The areas that can be published: those with a confirmed title. */
const areas = doctor.expertise.filter((e) => hasValue(e.title))

/**
 * Expertise: a showcase of the areas of care. On a deep blue band, a sticky
 * panel (desktop) shows the area being read and swaps to the next with a bar
 * wipe, while beside it each area's image drifts gently upward. On phones each
 * area is a simple block: text, then its image.
 */
export default function Expertise() {
  const active = useActiveArea(areas.length)

  return (
    <>
      <Opening />
      {areas.length > 0 && <Showcase active={active} />}
      <ClosingNote />
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

/* ── 1. Opening: a deep blue hero that runs into the showcase ─────────────── */

function Opening() {
  const animated = useDecorativeMotion()
  const entrance = useEntrance()

  // Scrolls to the first area (no route or hash change) and moves keyboard focus there.
  const toFirstArea = () => {
    const el = document.getElementById(areaId(0))
    if (!el) return
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: animated ? 'smooth' : 'instant' })
    el.focus({ preventScroll: true })
  }
  return (
    <section aria-labelledby="expertise-title" className="showcase relative overflow-hidden bg-[var(--s-bg)] text-[var(--s-text)]">
      {/* Decoration: soft light from the upper right and faint contour lines */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgba(124,192,236,0.16),transparent)]" />
        <svg viewBox="0 0 600 600" className="absolute -right-24 top-1/2 hidden h-[34rem] w-[34rem] -translate-y-1/2 md:block">
          {Array.from({ length: 10 }, (_, k) => (
            <motion.ellipse
              key={k}
              cx={330 - k * 4}
              cy={300 + k * 3}
              rx={40 + k * 26}
              ry={30 + k * 22}
              transform="rotate(-18 300 300)"
              fill="none"
              stroke="var(--s-accent)"
              strokeWidth="1"
              initial={animated ? { pathLength: 0, opacity: 0 } : false}
              animate={{ pathLength: 1, opacity: 0.22 - k * 0.018 }}
              transition={{ duration: 1.6, ease: EASE_IN_OUT, delay: 0.3 + k * 0.06 }}
            />
          ))}
        </svg>
      </div>

      <div className="container-page relative pb-14 pt-16 md:pb-20 md:pt-24 lg:pb-24 lg:pt-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            {hasValue(doctor.specialty) && (
              <motion.p {...entrance(0.05)} className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--s-accent)]">
                <span aria-hidden className="h-px w-10 bg-[var(--s-accent)]" />
                {doctor.specialty}
              </motion.p>
            )}
            <RevealText
              as="h1"
              id="expertise-title"
              lines={['Areas of', <span key="accent" className="text-[var(--s-accent)]">clinical focus</span>]}
              className="display-hero mt-6"
              delay={0.15}
              immediate
            />
          </div>

          {/* A cue to scroll into the areas */}
          <motion.div {...entrance(0.5)} className="flex items-end justify-between gap-8 lg:col-span-4 lg:flex-col lg:items-end lg:justify-end">
            <button type="button" onClick={toFirstArea} className="group inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-[var(--s-text)]">
              Scroll to explore
              <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--s-accent)] text-[var(--s-accent)] transition-colors duration-300 group-hover:bg-[var(--s-accent)] group-hover:text-[var(--s-bg)]">
                <motion.svg
                  viewBox="0 0 16 16"
                  className="h-4 w-4"
                  animate={animated ? { y: [0, 3, 0] } : undefined}
                  transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity, delay: 1.5 }}
                >
                  <path d="M8 2v11M3 8.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              </span>
            </button>
          </motion.div>
        </div>
        <div aria-hidden className="mt-14 h-px bg-[rgba(238,245,250,0.14)] md:mt-20" />
      </div>
    </section>
  )
}

/* ── 2. Showcase: sticky wiping text (desktop) beside each area's image ─── */

function Showcase({ active }: { active: number }) {
  const item = areas[active]
  return (
    <section aria-label="Areas of care in detail" className="showcase bg-[var(--s-bg)] text-[var(--s-text)]">
      <div className="container-page">
        <div className="grid gap-x-12 lg:grid-cols-12">
          {/* Desktop: the area being read, swapped with a bar wipe. Visual only; each block below carries the text. */}
          <div className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-[22vh] py-10">
              <WipePanel index={active} title={item.title} description={item.description} details={publishable(item.details)} detailsLabel={item.detailsLabel} />
              <Link
                to={BOOK_PATH}
                className="group/btn mt-10 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--s-accent)] hover:text-[var(--s-text)]"
              >
                <span className="link-underline">Discuss this in a consultation</span>
                <ArrowRight />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            {areas.map((a, i) => (
              <AreaBlock key={i} index={i} title={a.title} description={a.description} details={publishable(a.details)} detailsLabel={a.detailsLabel} image={a.image} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Bars sweep across each line from the left to cover the outgoing area, then
 * pull away to the right to uncover the next one. Under reduced motion the
 * text simply changes.
 */
const BAR = {
  covered: { scaleX: 1, originX: 1 },
  shown: (i: number) => ({ scaleX: 0, originX: 1, transition: { duration: 0.38, ease: EASE_IN_OUT, delay: 0.06 * i } }),
  out: (i: number) => ({ scaleX: [0, 1], originX: 0, transition: { duration: 0.26, ease: EASE_IN_OUT, delay: 0.04 * i } }),
}

function WipeLine({ i, children, className = '' }: { i: number; children: ReactNode; className?: string }) {
  const animated = useDecorativeMotion()
  return (
    <span className={`relative inline-block max-w-full ${className}`}>
      {children}
      {animated && <motion.span aria-hidden custom={i} variants={BAR} className="absolute -inset-x-1 inset-y-0 bg-[var(--s-bar)]" />}
    </span>
  )
}

function WipePanel({ index, title, description, details, detailsLabel }: { index: number; title: string; description: string; details: string[]; detailsLabel?: string }) {
  const region = regionFor(title)
  return (
    <div aria-hidden className="min-h-[22rem]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={index} initial="covered" animate="shown" exit="out">
          <div>
            <WipeLine i={1} className="font-serif text-[clamp(2.25rem,1.6rem+1.8vw,3.25rem)] leading-[1.06] tracking-[-0.02em]">
              {title}
            </WipeLine>
          </div>
          <div className="mt-4">
            <WipeLine i={2} className="text-sm font-semibold tracking-[0.02em] text-[var(--s-accent)]">
              {REGION_LABEL[region]}
            </WipeLine>
          </div>
          {hasValue(description) && (
            <div className="mt-6">
              <WipeLine i={3} className="text-lg leading-[1.65]">
                {description}
              </WipeLine>
            </div>
          )}
          {details.length > 0 && (
            <div className="mt-6">
              <WipeLine i={4} className="text-[var(--s-muted)]">
                <span className="font-semibold text-[var(--s-text)]">{hasValue(detailsLabel) ? detailsLabel : 'Conditions and procedures'}:</span>{' '}
                {details.join('; ')}
              </WipeLine>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/** One area: its text (shown on phones and tablets, read by screen readers everywhere) and its image. */
function AreaBlock({ index, title, description, details, detailsLabel, image }: { index: number; title: string; description: string; details: string[]; detailsLabel?: string; image?: string }) {
  const region = regionFor(title)
  return (
    <article
      id={areaId(index)}
      tabIndex={-1}
      aria-labelledby={`${areaId(index)}-title`}
      className="relative py-14 focus:outline-none md:py-20 lg:flex lg:min-h-[105vh] lg:items-center lg:py-24"
    >
      <div className="w-full">
        <div className="lg:sr-only">
          <h2 id={`${areaId(index)}-title`} className="font-serif text-[clamp(2rem,1.6rem+1.8vw,2.75rem)] leading-[1.08] tracking-[-0.02em]">
            {title}
          </h2>
          <p className="mt-3 text-sm font-semibold text-[var(--s-accent)]">{REGION_LABEL[region]}</p>
          {hasValue(description) && <p className="measure mt-5 text-lg leading-[1.65]">{description}</p>}
          {details.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold">{hasValue(detailsLabel) ? detailsLabel : 'Conditions and procedures'}</h3>
              <ul className="measure mt-2 list-disc pl-5 text-[var(--s-muted)]">
                {details.map((d) => (
                  <li key={d} className="py-1">
                    {d}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <AreaImage index={index} title={title} image={hasValue(image) ? image : undefined} />
        <Link to={BOOK_PATH} className="group/btn mt-8 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--s-accent)] lg:hidden">
          <span className="link-underline">Discuss this in a consultation</span>
          <ArrowRight />
        </Link>
      </div>
    </article>
  )
}

/**
 * The area's image in a card that drifts gently upward as the area scrolls
 * past. The card takes the image's own proportions, so labels at the edges are
 * never cropped, and is never wider than the image itself, so a small image
 * stays sharp. Until an image is supplied a 3:2 placeholder holds its place.
 */
function AreaImage({ index, title, image }: { index: number; title: string; image?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const size = image ? manifest[image] : undefined
  const aspectRatio = size ? `${size.width} / ${size.height}` : '3 / 2'
  const animated = useDecorativeMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], animated ? [60, -60] : [0, 0])

  return (
    <div ref={ref} className="mt-10 lg:mt-0">
      <motion.figure style={{ y, maxWidth: size?.width }} className="mx-auto overflow-hidden rounded-2xl bg-[var(--s-card)] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
        <div style={{ aspectRatio }}>
          <MedicalImage
            src={image}
            sizes="(min-width: 1024px) 50vw, 100vw"
            alt={`${title}, illustrative image`}
            placeholderLabel={`Expertise ${pad(index + 1)}`}
            hoverZoom={false}
            className="h-full w-full"
          />
        </div>
      </motion.figure>
    </div>
  )
}

/* ── 3. Closing note ─────────────────────────────────────────────────────── */

function ClosingNote() {
  return (
    <section aria-label="About these listings" className="container-page pb-16 md:pb-24">
      <div className="flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <Link to={BOOK_PATH} className="group/btn inline-flex min-h-11 items-center gap-2 font-medium text-accent hover:text-accent-hover">
          <span className="link-underline">Book a consultation</span>
          <ArrowRight />
        </Link>
      </div>
    </section>
  )
}
