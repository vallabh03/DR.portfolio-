import { useRef, useState, type ReactNode } from 'react'
import { motion, useInView } from 'motion/react'
import { doctor, hasValue } from '../data/doctor'
import { BOOK_PATH } from '../data/navigation'
import { EASE, EASE_IN_OUT, ONCE, useDecorativeMotion, useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import MedicalImage from '../components/MedicalImage'
import DrawLine from '../components/DrawLine'
import Button, { ArrowRight, ArrowUpRight } from '../components/Button'

/**
 * Contact: a letterhead and a directory. The practice address is set large,
 * line by line, beside the clinic photograph mounted in a drawn frame; the ways
 * to get in touch follow as ruled rows, then working hours and the urgent note.
 * Anything not yet confirmed is left out rather than shown as a placeholder.
 */

const { contact } = doctor
/** The address, in reading order, with missing lines left out. */
const addressLines = [contact.clinic, contact.addressLine, contact.locality, contact.postcode].filter(hasValue)
const hours = contact.hours.filter((h) => hasValue(h.days) && hasValue(h.time))

type Row = { label: string; value: ReactNode; href?: string; external?: boolean; serif?: boolean }

/** Ways to get in touch that have a confirmed value. */
const contactRows: Row[] = [
  ...(hasValue(contact.phone) ? [{ label: 'Telephone', value: contact.phone, href: `tel:${contact.phone.replace(/\s+/g, '')}` }] : []),
  ...(hasValue(contact.email) ? [{ label: 'Email', value: contact.email, href: `mailto:${contact.email}` }] : []),
  ...contact.links
    .filter((l) => hasValue(l.label) && hasValue(l.href))
    .map((l, i) => ({ label: i === 0 ? 'Professional profiles' : '', value: l.label, href: l.href, external: true, serif: true })),
]

export default function Contact() {
  return (
    <>
      <Opening />
      {addressLines.length > 0 && <Letterhead />}
      {addressLines.length > 0 && <LocationMap />}
      {(contactRows.length > 0 || hours.length > 0) && <Directory />}
      <UrgentNote />
    </>
  )
}

/* ── 1. Opening: heading, introduction and the main actions ──────────────── */

function Opening() {
  const entrance = useEntrance()
  const { mapUrl } = contact

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
            {hasValue(mapUrl) && (
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
            alt="Continental Hospitals, Hyderabad"
            placeholderLabel="Clinic"
            reveal={false}
            hoverZoom={false}
            className="h-full w-full"
            imgClassName="object-[64%_center]"
          />
        </motion.div>
      </motion.div>
    </figure>
  )
}

function Letterhead() {
  return (
    <section aria-labelledby="address-title" className="container-page py-12 md:py-16 lg:py-20">
      <h2 id="address-title" className="sr-only">
        Practice address
      </h2>
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="lg:col-span-7">
          {/* The address reads in order: clinic, street, locality, postcode */}
          <RevealText
            as="address"
            lines={addressLines}
            className="not-italic font-serif text-[clamp(1.75rem,1.3rem+1.9vw,3rem)] leading-[1.15] tracking-[-0.015em]"
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

/* ── 2b. Location map: Google Maps, loaded only when the visitor asks ───── */

/** The address as one line, for the map search. */
const mapQuery = addressLines.join(', ')

/**
 * The site promises no tracking cookies, and Google Maps can set them. So the
 * map is not loaded until the visitor chooses to see it: until then a drawn,
 * map-like card shows the pin and address, with a link to open Google Maps.
 */
function LocationMap() {
  const [show, setShow] = useState(false)
  const directions = hasValue(contact.mapUrl) ? contact.mapUrl : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`

  return (
    <section aria-labelledby="map-title" className="container-page pb-12 md:pb-16 lg:pb-20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="map-title" className="heading-3">
          Location
        </h2>
        <a href={directions} target="_blank" rel="noopener noreferrer" className="group/btn inline-flex min-h-11 items-center gap-2 font-semibold text-accent hover:text-accent-hover">
          <span className="link-underline">Open in Google Maps</span>
          <ArrowUpRight />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>

      <div className="relative mt-6 aspect-[4/5] overflow-hidden rounded-[1.75rem] border border-line bg-surface-2 sm:aspect-[16/9] lg:aspect-[21/9]">
        {show ? (
          <iframe
            title={`Map showing ${mapQuery}`}
            src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <>
            <MapIllustration />
            <div className="absolute inset-0 flex items-center justify-center p-4 sm:items-end sm:justify-start sm:p-6 lg:p-8">
              <div className="w-full max-w-md rounded-2xl border border-line bg-bg/95 p-6 text-center sm:text-left shadow-[0_24px_48px_-28px_rgba(27,95,140,0.5)] backdrop-blur-sm">
                <p className="font-semibold">{contact.clinic}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{addressLines.slice(1).join(', ')}</p>
                <button
                  type="button"
                  onClick={() => setShow(true)}
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 text-[0.9375rem] font-semibold text-on-accent transition-colors duration-300 hover:bg-accent-hover"
                >
                  Show map
                </button>
                <p className="mt-3 text-xs leading-relaxed text-muted">The map is provided by Google Maps, which receives your IP address and may set cookies.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

/** A quiet, drawn street plan with a pin: decoration shown until the real map is loaded. */
function MapIllustration() {
  return (
    <svg aria-hidden viewBox="0 0 800 340" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <rect width="800" height="340" fill="var(--surface-2)" />
      {/* Green space and water */}
      <path d="M560 0h240v120c-60 10-110-20-160 10s-70 40-80 20z" fill="var(--accent-soft)" />
      <path d="M0 250c90-30 160 20 250-5s150-50 230-10 170 30 320 0v105H0z" fill="var(--accent-soft)" />
      {/* Main roads */}
      <g fill="none" stroke="var(--background)" strokeLinecap="round">
        <path d="M-20 120C200 100 380 170 820 140" strokeWidth="18" />
        <path d="M300 -20c20 120-10 230 30 380" strokeWidth="14" />
        <path d="M640 -20c-30 140 20 240-10 380" strokeWidth="12" />
      </g>
      {/* Side streets */}
      <g fill="none" stroke="var(--background)" strokeWidth="6" strokeLinecap="round" opacity="0.9">
        <path d="M0 40h820M0 210c200-10 400 20 820-5M120 -10v360M470 -10c10 120-10 240 0 360M760 -10v360" />
      </g>
      <g fill="none" stroke="var(--border-strong)" strokeWidth="1" opacity="0.6">
        <path d="M-20 120C200 100 380 170 820 140M300 -20c20 120-10 230 30 380M640 -20c-30 140 20 240-10 380" />
      </g>
      {/* The pin */}
      <g transform="translate(600 150)">
        <circle r="26" fill="var(--accent)" opacity="0.15" />
        <path d="M0 6s-16-14-16-27a16 16 0 0 1 32 0C16-8 0 6 0 6z" fill="var(--accent)" />
        <circle cy="-21" r="6" fill="var(--background)" />
      </g>
    </svg>
  )
}

/* ── 3. Directory: contact methods as ruled rows, beside working hours ───── */

function DirectoryRow({ row, first }: { row: Row; first?: boolean }) {
  const inner = (
    <>
      <span className="text-sm text-muted">{row.label}</span>
      <span
        className={`min-w-0 break-words transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          row.href ? 'group-hover:translate-x-1 group-focus-visible:translate-x-1' : ''
        } ${row.serif ? 'font-serif text-[1.375rem] leading-snug' : 'text-xl tabular-nums'} text-fg`}
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
  const rows = contactRows

  return (
    <section aria-label="Contact details and working hours" className="border-t border-line bg-surface">
      <div className="container-page section-y">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-10">
          {/* Contact methods */}
          {rows.length > 0 && (
          <div className="lg:col-span-7">
            <RevealText as="h2" id="details-title" lines={['Contact details']} className="heading-2" />
            <ul className="relative mt-8 border-b border-line">
              <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" duration={1} />
              {rows.map((r, i) => (
                <DirectoryRow key={`${r.label}-${i}`} row={r} first={i === 0} />
              ))}
            </ul>
          </div>
          )}

          {/* Working hours */}
          {hours.length > 0 && (
          <div className={rows.length > 0 ? 'lg:col-span-4 lg:col-start-9' : 'lg:col-span-5'}>
            <RevealText as="h2" id="hours-title" lines={['Working hours']} className="heading-2" />
            <div className="relative mt-8">
              <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" duration={1} delay={0.1} />
              <table className="w-full border-collapse text-left" aria-labelledby="hours-title">
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
          )}
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
