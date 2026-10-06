import { useRef, type ReactNode } from 'react'
import { motion, useInView } from 'motion/react'
import { doctor, isPlaceholder } from '../data/doctor'
import { BOOK_PATH } from '../data/navigation'
import { EASE, EASE_IN_OUT, ONCE, useDecorativeMotion, useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import MedicalImage from '../components/MedicalImage'
import DrawLine from '../components/DrawLine'
import Button, { ArrowRight, ArrowUpRight } from '../components/Button'
import BookingPrompt from '../components/BookingPrompt'

/**
 * Contact: a letterhead and a directory. The practice address is set large,
 * line by line, beside the clinic photograph mounted in a drawn frame; the ways
 * to get in touch follow as ruled rows, then working hours and the urgent note.
 */
export default function Contact() {
  return (
    <>
      <Opening />
      <Letterhead />
      <Directory />
      <UrgentNote />
      <BookingPrompt />
    </>
  )
}

/* ── 1. Opening: heading, introduction and the main actions ──────────────── */

function Opening() {
  const entrance = useEntrance()
  const { mapUrl } = doctor.contact

  return (
    <section aria-labelledby="contact-title" className="container-page pt-10 md:pt-16 lg:pt-24">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
        <RevealText as="h1" id="contact-title" lines={['Visit and', 'contact']} className="display-hero lg:col-span-7" delay={0.1} immediate />
        <motion.div className="lg:col-span-5 lg:pb-3" {...entrance(0.4)}>
          <p className="lead measure">Where to find the practice and how to reach it. For appointment requests, use the consultation form.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button to={BOOK_PATH}>
              Book a consultation <ArrowRight />
            </Button>
            {mapUrl && (
              <Button href={mapUrl} variant="secondary" external>
                Get directions
                <span className="sr-only"> (opens in a new tab)</span>
              </Button>
            )}
          </div>
        </motion.div>
      </div>
      <DrawLine immediate delay={0.5} duration={1.2} className="mt-12 bg-line-strong md:mt-16" />
    </section>
  )
}

/* ── 2. Letterhead: the address, line by line, beside a framed photograph ── */

/** A 1px frame draws around the image area, then the photograph settles into it. */
function FramedPhotograph() {
  const animated = useDecorativeMotion()
  const ref = useRef<HTMLElement>(null)
  // One trigger for the whole figure, so the frame always completes before the photograph settles.
  const inView = useInView(ref, ONCE)
  const play = inView || !animated
  const edges = [
    { cls: 'inset-x-0 top-0 h-px origin-left', axis: 'x' },
    { cls: 'inset-y-0 right-0 w-px origin-top', axis: 'y' },
    { cls: 'inset-x-0 bottom-0 h-px origin-right', axis: 'x' },
    { cls: 'inset-y-0 left-0 w-px origin-bottom', axis: 'y' },
  ] as const

  return (
    <figure ref={ref} className="relative p-3 md:p-4">
      {/* The frame: four rules drawing in sequence around the image */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {edges.map((e, i) => (
          <motion.span
            key={i}
            className={`absolute block bg-line-strong ${e.cls}`}
            initial={animated ? (e.axis === 'x' ? { scaleX: 0 } : { scaleY: 0 }) : false}
            animate={play ? (e.axis === 'x' ? { scaleX: 1 } : { scaleY: 1 }) : undefined}
            transition={{ duration: 0.45, ease: EASE_IN_OUT, delay: 0.1 + i * 0.15 }}
          />
        ))}
      </div>
      <motion.div
        className="relative aspect-[4/3] overflow-hidden rounded-sm bg-surface-2 md:aspect-[16/10] lg:aspect-[4/5]"
        initial={animated ? { clipPath: 'inset(4% 4% 4% 4%)' } : false}
        animate={play ? { clipPath: 'inset(0% 0% 0% 0%)' } : undefined}
        transition={{ duration: 1, ease: EASE, delay: 0.75 }}
      >
        <motion.div
          className="absolute inset-0"
          initial={animated ? { scale: 1.04 } : false}
          animate={play ? { scale: 1 } : undefined}
          transition={{ duration: 1.4, ease: EASE, delay: 0.75 }}
        >
          <MedicalImage
            src="/images/clinic.jpg"
            sizes="(min-width: 1024px) 38vw, 100vw"
            alt="The clinic"
            placeholderLabel="Clinic"
            reveal={false}
            hoverZoom={false}
            className="h-full w-full"
          />
        </motion.div>
      </motion.div>
    </figure>
  )
}

function Letterhead() {
  const { clinic, address, city } = doctor.contact
  const muted = [clinic, address, city].every(isPlaceholder)

  return (
    <section aria-labelledby="address-title" className="container-page py-12 md:py-16 lg:py-20">
      <h2 id="address-title" className="sr-only">
        Practice address
      </h2>
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-7">
          {/* The address reads in order: clinic, street, city */}
          <RevealText
            as="address"
            lines={[clinic, address, city]}
            className={`not-italic font-serif text-[clamp(2rem,1.4rem+2.6vw,3.75rem)] leading-[1.12] tracking-[-0.015em] ${muted ? 'text-fg/75' : ''}`}
            delay={0.1}
          />
        </div>
        <div className="lg:col-span-5">
          <FramedPhotograph />
        </div>
      </div>
    </section>
  )
}

/* ── 3. Directory: contact methods as ruled rows, beside working hours ───── */

type Row = { label: string; value: ReactNode; href?: string; external?: boolean; muted?: boolean; serif?: boolean }

function DirectoryRow({ row, first }: { row: Row; first?: boolean }) {
  const inner = (
    <>
      <span className="text-sm text-muted">{row.label}</span>
      <span
        className={`min-w-0 break-words transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          row.href ? 'group-hover:translate-x-1 group-focus-visible:translate-x-1' : ''
        } ${row.serif ? 'font-serif text-[1.375rem] leading-snug' : 'text-xl tabular-nums'} ${row.muted ? 'text-muted' : 'text-fg'}`}
      >
        {row.value}
      </span>
      {row.href && (
        <span aria-hidden className="hidden text-accent transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1 sm:block">
          {row.external ? <ArrowUpRight className="h-4 w-4" /> : <ArrowRight />}
        </span>
      )}
    </>
  )
  const layout = 'grid items-baseline gap-x-6 gap-y-1 py-5 sm:grid-cols-[11rem_1fr_auto]'

  return (
    <li className="relative">
      {!first && <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" duration={0.9} />}
      {row.href ? (
        <a
          href={row.href}
          className={`group min-h-14 ${layout}`}
          {...(row.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {inner}
          {row.external && <span className="sr-only">(opens in a new tab)</span>}
        </a>
      ) : (
        <div className={layout}>{inner}</div>
      )}
    </li>
  )
}

function Directory() {
  const { phone, email, links, hours } = doctor.contact
  const hoursMuted = hours.every((h) => isPlaceholder(h.days))

  // Placeholder text is shown when a value is missing, and is never a link.
  const rows: Row[] = [
    phone ? { label: 'Telephone', value: phone, href: `tel:${phone.replace(/\s+/g, '')}` } : { label: 'Telephone', value: '[PHONE]', muted: true },
    email ? { label: 'Email', value: email, href: `mailto:${email}` } : { label: 'Email', value: '[EMAIL]', muted: true },
    ...(links.length > 0
      ? links.map((l, i) => ({ label: i === 0 ? 'Professional profiles' : '', value: l.label, href: l.href, external: true, serif: true }))
      : [{ label: 'Professional profiles', value: '[PROFESSIONAL PROFILES]', muted: true }]),
  ]

  return (
    <section aria-label="Contact details and working hours" className="border-t border-line bg-surface">
      <div className="container-page section-y">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-10">
          {/* Contact methods */}
          <div className="lg:col-span-7">
            <RevealText as="h2" id="details-title" lines={['Contact details']} className="heading-2" />
            <ul className="relative mt-8 border-b border-line">
              <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" duration={1} />
              {rows.map((r, i) => (
                <DirectoryRow key={`${r.label}-${i}`} row={r} first={i === 0} />
              ))}
            </ul>
          </div>

          {/* Working hours */}
          <div className="lg:col-span-4 lg:col-start-9">
            <RevealText as="h2" id="hours-title" lines={['Working hours']} className="heading-2" />
            <div className="relative mt-8">
              <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" duration={1} delay={0.1} />
              <table className={`w-full border-collapse text-left ${hoursMuted ? 'text-muted' : ''}`} aria-labelledby="hours-title">
                <tbody>
                  {hours.map((h, i) => (
                    <tr key={i} className="border-b border-line">
                      <th scope="row" className="py-4 pr-6 font-serif text-lg font-normal text-brass">
                        {h.days}
                      </th>
                      <td className="py-4 text-right tabular-nums">{h.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── 4. Urgent concerns: the existing safety note, set as a statement ────── */

function UrgentNote() {
  return (
    <section aria-labelledby="urgent-title" className="container-page section-y">
      <div className="relative grid gap-6 pt-8 lg:grid-cols-12 lg:gap-10">
        <DrawLine className="absolute inset-x-0 top-0 bg-fg/60" duration={1.1} />
        <h2 id="urgent-title" className="text-sm font-medium text-fg lg:col-span-3">
          Urgent concerns
        </h2>
        <div className="lg:col-span-9">
          <p className="font-serif text-[clamp(1.625rem,1.3rem+1.4vw,2.5rem)] leading-[1.2] tracking-[-0.01em]">
            This website is not monitored for emergencies.
          </p>
          <p className="lead mt-4">If you need urgent medical help, contact your local emergency services.</p>
        </div>
      </div>
    </section>
  )
}
