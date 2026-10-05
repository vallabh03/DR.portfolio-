import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { Link } from 'react-router'
import { useAppReady, useChapters, useScroller } from '../context/ChapterContext'
import { chapters, pad } from '../data/chapters'
import { doctor, isPlaceholder } from '../data/doctor'
import RevealText from '../components/RevealText'
import MedicalImage from '../components/MedicalImage'
import MagneticButton, { ArrowRight } from '../components/MagneticButton'
import Footer from '../components/Footer'

const EASE = [0.16, 1, 0.3, 1] as const

const chapterBlurbs: Record<string, string> = {
  about: 'Background, philosophy and a patient-centred way of working.',
  experience: 'A timeline of clinical roles and training.',
  credentials: 'Qualifications, certifications and memberships.',
  expertise: 'Areas of clinical focus.',
  approach: 'How a consultation unfolds, step by step.',
  research: 'Publications, studies and academic work.',
  testimonials: 'Words from patients, shared with consent.',
  contact: 'Where to find the practice and how to get in touch.',
  consultation: 'Request an appointment online.',
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const on = () => setDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return desktop
}

export default function Home() {
  const ready = useAppReady()
  const isDesktop = useIsDesktop()
  const { go } = useChapters()
  const scroller = useScroller()
  const heroRef = useRef<HTMLElement>(null)

  // Scroll parallax (inside this chapter's own scroll container)
  const { scrollYProgress } = useScroll({ container: scroller ?? undefined, target: heroRef, offset: ['start start', 'end start'] })
  const portraitY = useTransform(scrollYProgress, [0, 1], ['0%', '14%'])
  const nameY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, 0.2])

  // Pointer parallax (desktop)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const px = useSpring(useTransform(mx, [-1, 1], [-14, 14]), { stiffness: 60, damping: 20 })
  const py = useSpring(useTransform(my, [-1, 1], [-10, 10]), { stiffness: 60, damping: 20 })
  const onPointer = (e: ReactMouseEvent) => {
    mx.set((e.clientX / window.innerWidth) * 2 - 1)
    my.set((e.clientY / window.innerHeight) * 2 - 1)
  }

  const show = ready ? 'show' : 'hidden'

  return (
    <div className="flex min-h-full flex-col">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        onMouseMove={onPointer}
        aria-labelledby="hero-title"
        className="relative isolate flex min-h-[100svh] flex-col overflow-hidden"
      >
        {/* Atmosphere */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-[20vw] -top-[30vh] h-[90vh] w-[90vh] rounded-full bg-[radial-gradient(circle,var(--glow),transparent_62%)]" />
          <div className="absolute -bottom-[40vh] -left-[20vw] h-[80vh] w-[80vh] rounded-full bg-[radial-gradient(circle,var(--accent-soft),transparent_65%)]" />
          <div className="mx-auto grid h-full max-w-[1680px] grid-cols-4 px-5 sm:px-8 lg:grid-cols-12 lg:px-14 xl:px-20">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.span
                key={i}
                className={`border-l border-line/60 ${i >= 4 ? 'hidden lg:block' : ''}`}
                initial={{ scaleY: 0 }}
                animate={ready ? { scaleY: 1 } : undefined}
                style={{ originY: 0 }}
                transition={{ duration: 1.6, ease: EASE, delay: 0.1 + i * 0.04 }}
              />
            ))}
          </div>
        </div>

        <motion.div
          style={{ opacity: isDesktop ? heroFade : 1 }}
          className="mx-auto grid w-full max-w-[1680px] flex-1 grid-cols-1 items-end gap-10 px-5 pb-28 pt-28 sm:px-8 md:pb-32 md:pt-32 lg:grid-cols-12 lg:gap-8 lg:px-14 xl:px-20"
        >
          {/* Text column */}
          <motion.div style={{ y: isDesktop ? nameY : 0 }} className="relative z-10 lg:col-span-7 lg:self-center">
            <motion.div
              className="flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={ready ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 1, ease: EASE, delay: 0.2 }}
            >
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-2 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-2" />
              </span>
              <span className="eyebrow">Digital medical portfolio</span>
            </motion.div>

            <h1 id="hero-title" className="display-hero mt-6 sm:mt-8">
              {[doctor.firstLine, doctor.lastLine].map((line, i) => (
                <span key={line} className="block overflow-hidden pb-[0.06em] -mb-[0.06em]">
                  <motion.span
                    className={`block will-change-transform ${i === 1 ? 'lg:pl-[0.9em]' : ''}`}
                    initial={{ y: '105%' }}
                    animate={show === 'show' ? { y: '0%' } : undefined}
                    transition={{ duration: 1.3, ease: EASE, delay: 0.25 + i * 0.12 }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              className={`mt-6 flex items-center gap-4 text-sm sm:text-base ${isPlaceholder(doctor.title) ? 'text-muted' : 'text-fg'}`}
              initial={{ opacity: 0 }}
              animate={ready ? { opacity: 1 } : undefined}
              transition={{ duration: 1, delay: 0.7 }}
            >
              <motion.span
                aria-hidden
                className="h-px w-12 origin-left bg-accent"
                initial={{ scaleX: 0 }}
                animate={ready ? { scaleX: 1 } : undefined}
                transition={{ duration: 1, ease: EASE, delay: 0.75 }}
              />
              <span className="uppercase tracking-[0.18em]">{doctor.title}</span>
            </motion.p>

            <RevealText
              as="p"
              lines={doctor.statement.map((s, i) => (
                <span key={i} className={i === 1 ? 'serif-accent text-accent' : ''}>
                  {s}
                </span>
              ))}
              className="mt-8 font-display text-[clamp(1.35rem,2.4vw,2.25rem)] font-light leading-[1.15] tracking-[-0.03em] sm:mt-10"
              delay={0.85}
              stagger={0.1}
            />

            <motion.div
              className="mt-10 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={ready ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 1, ease: EASE, delay: 1.15 }}
            >
              <MagneticButton onClick={() => go(1)} cursor="EXPLORE">
                Explore <ArrowRight />
              </MagneticButton>
              <MagneticButton
                to="/consultation"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  go(chapters.length - 1, { focus: true })
                }}
              >
                Book a consultation
              </MagneticButton>
            </motion.div>
          </motion.div>

          {/* Portrait */}
          <motion.div style={{ y: isDesktop ? portraitY : 0 }} className="relative lg:col-span-5 lg:self-stretch">
            <motion.div style={{ x: px, y: py }} className="relative mx-auto h-full w-full max-w-[34rem] lg:ml-auto lg:mr-0">
              <div className="relative aspect-[4/5] w-full lg:aspect-auto lg:h-full lg:max-h-[74vh] lg:min-h-[28rem]">
                <MedicalImage
                  src="/images/doctor-hero.jpg"
                  alt={`Portrait of ${doctor.name}`}
                  placeholderLabel="Portrait"
                  priority
                  hoverZoom={false}
                  delay={0.35}
                  className="h-full w-full rounded-t-[999px] rounded-b-[2rem]"
                />
                {/* soft overlay gradient into the page */}
                <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-b-[2rem] bg-gradient-to-t from-bg/60 to-transparent" />
                <motion.div
                  className="absolute -left-3 top-[58%] hidden rounded-full border border-line bg-surface/80 px-4 py-2 backdrop-blur-md sm:block lg:-left-10"
                  initial={{ opacity: 0, x: -12 }}
                  animate={ready ? { opacity: 1, x: 0 } : undefined}
                  transition={{ duration: 1, ease: EASE, delay: 1.4 }}
                >
                  <span className="eyebrow !text-fg/80">{doctor.contact.clinic}</span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-24 mx-auto hidden max-w-[1680px] items-center gap-3 px-5 sm:px-8 md:flex lg:px-14 xl:px-20"
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : undefined}
          transition={{ delay: 1.6, duration: 1 }}
        >
          <span className="relative block h-10 w-px overflow-hidden bg-line">
            <motion.span
              className="absolute inset-x-0 top-0 h-1/2 bg-fg"
              animate={{ y: ['-100%', '200%'] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </span>
          <span className="eyebrow">Scroll · or use ← →</span>
        </motion.div>
      </section>

      {/* ── INTRO STATEMENT ──────────────────────────────────────────────── */}
      <section aria-label="Introduction" className="mx-auto w-full max-w-[1680px] px-5 py-24 sm:px-8 md:py-36 lg:px-14 xl:px-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <p className="eyebrow lg:col-span-3">Introduction</p>
          <div className="lg:col-span-9">
            <RevealText
              text="A digital portfolio of clinical practice — experience, credentials and approach to care, presented as a series of chapters. Move sideways to change chapter; scroll to read."
              className="font-display text-[clamp(1.6rem,3.4vw,3.4rem)] font-light leading-[1.12] tracking-[-0.035em] text-fg"
            />
            <dl className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
              {[
                { k: 'Specialty', v: doctor.title },
                { k: 'Practice', v: doctor.contact.clinic },
                { k: 'Languages', v: doctor.about.languages.join(', ') },
              ].map((f) => (
                <div key={f.k} className="bg-bg p-6 sm:p-7">
                  <dt className="eyebrow">{f.k}</dt>
                  <dd className={`mt-3 text-base ${isPlaceholder(f.v) ? 'text-muted' : ''}`}>{f.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── CHAPTER INDEX ────────────────────────────────────────────────── */}
      <section aria-labelledby="index-title" className="mx-auto w-full max-w-[1680px] px-5 pb-24 sm:px-8 md:pb-36 lg:px-14 xl:px-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <h2 id="index-title" className="eyebrow">
              Chapters
            </h2>
          </div>
          <ol className="border-t border-line lg:col-span-9">
            {chapters.slice(1).map((c, n) => {
              const i = n + 1
              return (
                <motion.li
                  key={c.id}
                  className="border-b border-line"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '0px 0px -5% 0px' }}
                  transition={{ duration: 0.9, ease: EASE, delay: n * 0.04 }}
                >
                  <Link
                    to={c.path}
                    onClick={(e) => {
                      e.preventDefault()
                      go(i, { focus: true })
                    }}
                    data-cursor="OPEN"
                    className="group relative grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 py-5 sm:grid-cols-[4rem_1fr_1fr_auto] sm:py-7"
                  >
                    <span className="font-display text-xs tabular-nums text-subtle transition-colors group-hover:text-accent">{pad(i + 1)}</span>
                    <span className="font-display text-[clamp(1.5rem,3.2vw,2.75rem)] font-light leading-none tracking-[-0.04em] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2">
                      {c.title}
                    </span>
                    <span className="hidden text-sm text-muted sm:block">{chapterBlurbs[c.id]}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line transition-all duration-500 group-hover:border-fg group-hover:bg-fg group-hover:text-bg">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-45" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </Link>
                </motion.li>
              )
            })}
          </ol>
        </div>
      </section>

      <Footer />
    </div>
  )
}
