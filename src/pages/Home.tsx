import { motion } from 'motion/react'
import { Link } from 'react-router'
import { doctor, hasValue, publishable, shortName } from '../data/doctor'
import { BOOK_PATH, showTestimonials } from '../data/navigation'
import { useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import MedicalImage from '../components/MedicalImage'
import CropMarks from '../components/CropMarks'
import GridLines from '../components/GridLines'
import DrawLine from '../components/DrawLine'
import Button, { ArrowRight } from '../components/Button'
import Testimonials from '../components/Testimonials'
import BookingPrompt from '../components/BookingPrompt'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Home: the page that sets the visual language for the whole site.
 *
 * Motion budget (MASTER.md §5): the name reveal and the portrait opening are
 * the only primary motion. Everything else is supporting: a faint grid, crop
 * marks, and rules that draw once as they arrive. Body content is never faded
 * in on scroll; it is simply there.
 */
export default function Home() {
  return (
    <>
      <Hero />
      {(approachQuote || approachStages.length > 0) && <ApproachSpread />}
      <FocusIndex />
      <RecordSpread />
      {showTestimonials && <Testimonials />}
      <BookingPrompt />
    </>
  )
}

/* ── 1. Hero: masthead name, portrait in an arch, and the practice at a glance ── */
function Hero() {
  const entrance = useEntrance()
  // Only facts with a confirmed value are shown; the grid adapts to how many there are.
  const facts = [
    { k: 'Specialty', v: doctor.specialty },
    { k: 'Practice', v: doctor.contact.clinic, link: { to: '/contact', label: 'Directions and hours' } },
    { k: 'Languages', v: publishable(doctor.about.languages).join(', ') },
  ].filter((f): f is typeof f & { v: string } => hasValue(f.v))
  const factCols = ['', 'sm:grid-cols-1', 'sm:grid-cols-2', 'sm:grid-cols-3'][facts.length]

  return (
    <section aria-labelledby="home-title" className="relative isolate">
      <GridLines delay={1.1} />
      <div className="container-page pb-16 pt-10 md:pb-20 md:pt-16 lg:pt-20">
        <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7 lg:pb-4">
            <RevealText as="h1" id="home-title" lines={[doctor.firstLine, doctor.lastLine]} className="display-hero" delay={0.1} immediate />

            {/* Supporting copy settles as one group once the name has landed */}
            <motion.div {...entrance(0.7)}>
              {hasValue(doctor.title) && <p className="mt-6 text-lg text-fg">{doctor.title}</p>}
              {hasValue(doctor.qualifications) && <p className="mt-1.5 text-sm text-muted">{doctor.qualifications}</p>}
              {hasValue(doctor.headline) && (
                <>
                  <span aria-hidden className="mt-8 block h-px w-24 bg-accent" />
                  <p className="mt-8 max-w-xl font-serif text-[clamp(1.375rem,1.15rem+1vw,2rem)] leading-[1.3] tracking-[-0.01em] text-fg/85">
                    {doctor.headline}
                  </p>
                  {hasValue(doctor.headlineSupport) && <p className="measure mt-4 text-fg/85">{doctor.headlineSupport}</p>}
                </>
              )}
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button to={BOOK_PATH}>
                  Book a consultation <ArrowRight />
                </Button>
                <Button to="/about" variant="secondary">
                  About {shortName}
                </Button>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-5">
            <figure className="mx-auto w-full max-w-[24rem] lg:mr-0 lg:max-w-none">
              <div className="relative">
                <MedicalImage
                  src="/images/doctor-hero.jpg"
                  sizes="(min-width: 1024px) 38vw, min(24rem, 100vw)"
                  alt={`Portrait of ${doctor.name}`}
                  placeholderLabel="Portrait"
                  priority
                  hoverZoom={false}
                  delay={0.2}
                  className="aspect-[4/5] w-full rounded-b-lg rounded-t-full"
                />
                <CropMarks delay={1.4} />
              </div>
              {/* Editorial caption, as a publication would credit a portrait */}
              <figcaption className="mt-5 flex items-baseline justify-between gap-4 text-sm text-muted">
                <span>{doctor.name}</span>
                {hasValue(doctor.contact.clinic) && <span className="text-right text-fg/80">{doctor.contact.clinic}</span>}
              </figcaption>
            </figure>
          </div>
        </div>

        {/* At a glance */}
        <div className="mt-16 md:mt-20">
          {/* The doctor's short biography, shown only once supplied */}
          {hasValue(doctor.bioShort) && <p className="measure text-fg/85">{doctor.bioShort}</p>}
          {facts.length > 0 && (
            <div className={`relative ${hasValue(doctor.bioShort) ? 'mt-6' : ''}`}>
              <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" duration={1.2} />
              <dl className={`grid ${factCols}`}>
                {facts.map((f, i) => (
                  <div key={f.k} className={`py-5 sm:py-7 ${i > 0 ? 'border-t border-line sm:border-l sm:border-t-0 sm:pl-6' : ''}`}>
                    <dt className="label">{f.k}</dt>
                    <dd className="mt-2">
                      <span>{f.v}</span>
                      {f.link && (
                        <Link to={f.link.to} className="group/btn mt-1 flex min-h-11 items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover">
                          <span className="link-underline">{f.link.label}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <DrawLine className="absolute inset-x-0 bottom-0 bg-line-strong" duration={1.2} delay={0.15} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/* ── 2. Approach: the philosophy as a pull quote, and the consultation stages as a drawn sequence ── */

// The doctor's approach statement when supplied, otherwise the philosophy text. Each part is hidden when absent,
// and the whole section when both are.
const approachQuote = [doctor.approachStatement, doctor.about.philosophy].find(hasValue)
const approachStages = doctor.approach.filter((s) => hasValue(s.title))

function ApproachSpread() {
  const quote = approachQuote
  const stages = approachStages

  return (
    <section aria-labelledby="approach-title" className="border-y border-line bg-surface">
      <div className="container-page section-y">
        <div className="grid gap-10 lg:grid-cols-12">
          <RevealText as="h2" id="approach-title" lines={['Approach to care']} className="heading-2 lg:col-span-4" />
          {quote && (
            <figure className="lg:col-span-8">
              <blockquote className="font-serif text-[clamp(1.625rem,1.3rem+1.4vw,2.5rem)] leading-[1.3] tracking-[-0.01em]">{quote}</blockquote>
              <figcaption className="mt-6 flex items-center gap-4 text-sm text-muted">
                <DrawLine className="w-10 bg-brass" duration={0.7} />
                Clinical philosophy, {doctor.name}
              </figcaption>
            </figure>
          )}
        </div>

        {/* The consultation sequence: a teal line draws through the stages */}
        {stages.length > 0 && (
        <div className="mt-16 md:mt-24">
          <h3 className="sr-only">How a consultation unfolds</h3>
          <ol className="relative grid gap-0 lg:grid-cols-5 lg:gap-6">
            {/* Desktop: horizontal line through the markers */}
            <div aria-hidden className="absolute inset-x-0 top-5 hidden lg:block">
              <span className="absolute inset-x-0 top-0 h-px bg-line" />
              <DrawLine className="absolute inset-x-0 top-0 bg-accent" duration={1.6} />
            </div>
            {/* Mobile: vertical line from the first marker to the last */}
            <div aria-hidden className="absolute bottom-8 left-5 top-8 lg:hidden">
              <span className="absolute inset-y-0 left-0 w-px bg-line" />
              <DrawLine axis="y" className="absolute inset-y-0 left-0 bg-accent" duration={1.6} />
            </div>

            {stages.map((s, i) => (
              <li key={s.title} className="relative grid grid-cols-[2.5rem_1fr] items-center gap-5 py-3 lg:flex lg:flex-col lg:items-start lg:gap-5 lg:py-0">
                <span
                  aria-hidden
                  className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-surface font-serif tabular-nums text-accent"
                >
                  {i + 1}
                </span>
                <span className="font-serif text-[clamp(1.25rem,1.15rem+0.4vw,1.5rem)] leading-tight">
                  <span className="sr-only">Stage {i + 1}: </span>
                  {s.title}
                </span>
              </li>
            ))}
          </ol>
          <Link to="/about" className="group/btn mt-10 inline-flex min-h-11 items-center gap-2 font-medium text-accent hover:text-accent-hover md:mt-12">
            <span className="link-underline">How a consultation unfolds</span>
            <ArrowRight />
          </Link>
        </div>
        )}
      </div>
    </section>
  )
}

/* ── 3. Areas of clinical focus: an editorial two-column index ── */
function FocusIndex() {
  const items = doctor.expertise.filter((e) => hasValue(e.title))
  if (items.length === 0) return null

  return (
    <section aria-labelledby="focus-title" className="container-page section-y">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <RevealText as="h2" id="focus-title" lines={['Areas of', 'clinical focus']} className="heading-2" />
        </div>

        <ol className="grid gap-x-10 sm:grid-cols-2 lg:col-span-8">
          {items.map((item, i) => (
            <li key={i} className="relative">
              <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" delay={(i % 2) * 0.08} />
              <Link to="/expertise" className="group block py-7 md:py-9">
                <span aria-hidden className="font-serif tabular-nums text-brass">
                  {pad(i + 1)}
                </span>
                <h3 className="heading-3 mt-3 transition-[transform,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5 group-hover:text-accent">
                  {item.title}
                </h3>
                {hasValue(item.description) && <p className="mt-3 text-fg/85">{item.description}</p>}
              </Link>
            </li>
          ))}
        </ol>
      </div>
      <div className="mt-6 lg:ml-[calc(33.333%+0.833rem)]">
        <Link to="/expertise" className="group/btn inline-flex min-h-11 items-center gap-2 font-medium text-accent hover:text-accent-hover">
          <span className="link-underline">All areas of care</span>
          <ArrowRight />
        </Link>
      </div>
    </section>
  )
}

/* ── 4. Record: recent roles as a short timeline, beside research interests ── */
function RecordSpread() {
  const roles = doctor.experience.filter((r) => hasValue(r.role)).slice(0, 3)
  const interests = publishable(doctor.researchInterests)
  if (roles.length === 0 && interests.length === 0) return null

  return (
    <section aria-label="Experience and research" className="border-t border-line">
      <div className="container-page section-y">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-10">
          {/* Experience */}
          {roles.length > 0 && (
          <div className="lg:col-span-7">
            <RevealText as="h2" lines={['Track record']} className="heading-2" />
            <ol className="relative mt-10 border-l border-line pl-7 sm:pl-10">
              <DrawLine axis="y" className="absolute -left-px bottom-0 top-0 bg-accent" duration={1.4} />
              {roles.map((r, i) => (
                <li key={i} className="relative pb-9 last:pb-0">
                  <span aria-hidden className="absolute -left-[calc(1.75rem+5px)] top-2 h-[9px] w-[9px] rounded-full border border-accent bg-bg sm:-left-[calc(2.5rem+5px)]" />
                  {hasValue(r.year) && <p className="font-serif tabular-nums text-brass">{r.year}</p>}
                  <h3 className="heading-3 mt-1">{r.role}</h3>
                  {[r.institution, r.location].some(hasValue) && <p className="mt-1 text-muted">{[r.institution, r.location].filter(hasValue).join(', ')}</p>}
                </li>
              ))}
            </ol>
            <Link to="/experience" className="group/btn mt-10 inline-flex min-h-11 items-center gap-2 font-medium text-accent hover:text-accent-hover">
              <span className="link-underline">Full timeline and credentials</span>
              <ArrowRight />
            </Link>
          </div>
          )}

          {/* Research */}
          {interests.length > 0 && (
          <div className={roles.length > 0 ? 'lg:col-span-4 lg:col-start-9' : 'lg:col-span-7'}>
            <RevealText as="h2" lines={['Research interests']} className="heading-2" />
            <ul className="mt-10">
              {interests.map((r, i) => (
                <li key={i} className="relative py-4">
                  <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" delay={i * 0.08} />
                  {r}
                </li>
              ))}
              <li aria-hidden className="relative">
                <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" delay={interests.length * 0.08} />
              </li>
            </ul>
            <Link to="/research" className="group/btn mt-8 inline-flex min-h-11 items-center gap-2 font-medium text-accent hover:text-accent-hover">
              <span className="link-underline">Research and publications</span>
              <ArrowRight />
            </Link>
          </div>
          )}
        </div>
      </div>
    </section>
  )
}
