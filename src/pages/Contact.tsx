import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { doctor, isPlaceholder } from '../data/doctor'
import { BOOK_PATH } from '../data/navigation'
import { useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import MedicalImage from '../components/MedicalImage'
import CropMarks from '../components/CropMarks'
import DrawLine from '../components/DrawLine'
import Button, { ArrowRight, ArrowUpRight } from '../components/Button'

export default function Contact() {
  const entrance = useEntrance()
  const { contact } = doctor

  const rows: { label: string; value: ReactNode; muted?: boolean }[] = [
    { label: 'Clinic or hospital', value: contact.clinic, muted: isPlaceholder(contact.clinic) },
    {
      label: 'Location',
      value: (
        <>
          {contact.address}
          <br />
          {contact.city}
        </>
      ),
      muted: isPlaceholder(contact.address),
    },
    {
      label: 'Phone',
      value: contact.phone ? (
        <a className="link-underline" href={`tel:${contact.phone.replace(/\s+/g, '')}`}>
          {contact.phone}
        </a>
      ) : (
        '[PHONE]'
      ),
      muted: !contact.phone,
    },
    {
      label: 'Email',
      value: contact.email ? (
        <a className="link-underline break-all" href={`mailto:${contact.email}`}>
          {contact.email}
        </a>
      ) : (
        '[EMAIL]'
      ),
      muted: !contact.email,
    },
    {
      label: 'Professional links',
      value:
        contact.links.length > 0 ? (
          <span className="flex flex-wrap gap-x-5 gap-y-2">
            {contact.links.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5">
                <span className="link-underline">{l.label}</span>
                <ArrowUpRight />
              </a>
            ))}
          </span>
        ) : (
          '[PROFESSIONAL PROFILES]'
        ),
      muted: contact.links.length === 0,
    },
  ]

  const hoursMuted = contact.hours.every((h) => isPlaceholder(h.days))

  return (
    <>
      {/* ── Hero: headline and actions beside a framed clinic photograph ── */}
      <section aria-labelledby="contact-title" className="container-page pb-16 pt-10 md:pb-24 md:pt-16 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-10">
          <div className="lg:col-span-5">
            <RevealText as="h1" id="contact-title" lines={['Visit and', 'contact']} className="heading-1" delay={0.1} immediate />
            <motion.div {...entrance(0.4)}>
              <p className="lead measure mt-8">Where to find the practice and how to reach it. For appointment requests, use the consultation form.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button to={BOOK_PATH}>
                  Book a consultation <ArrowRight />
                </Button>
                {contact.mapUrl && (
                  <Button href={contact.mapUrl} variant="secondary" external>
                    Get directions
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
          <div className="relative lg:col-span-6 lg:col-start-7">
            <MedicalImage src="/images/clinic.jpg" sizes="(min-width: 1024px) 46vw, 100vw" alt="The clinic" placeholderLabel="Clinic" priority delay={0.25} hoverZoom={false} className="aspect-[4/3] w-full rounded-lg" />
            <CropMarks delay={1} />
          </div>
        </div>
      </section>

      {/* ── Details: an editorial table with rules that draw between rows ── */}
      <section aria-labelledby="details-title" className="border-t border-line bg-surface">
        <div className="container-page section-y">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <RevealText as="h2" id="details-title" lines={['Practice details']} className="heading-2 lg:col-span-4" />

            <div className="lg:col-span-8">
              <dl>
                {rows.map((r, i) => (
                  <div key={r.label} className="relative grid gap-2 py-6 sm:grid-cols-[12rem_1fr] sm:gap-6">
                    <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" delay={i * 0.07} />
                    <dt className="text-muted">{r.label}</dt>
                    <dd className={`text-lg leading-snug ${r.muted ? 'text-muted' : ''}`}>{r.value}</dd>
                  </div>
                ))}
                <div className="relative grid gap-2 py-6 sm:grid-cols-[12rem_1fr] sm:gap-6">
                  <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" delay={rows.length * 0.07} />
                  <dt className="text-muted">Working hours</dt>
                  <dd className={hoursMuted ? 'text-muted' : ''}>
                    <table className="w-full max-w-md text-lg">
                      <caption className="sr-only">Working hours</caption>
                      <tbody>
                        {contact.hours.map((h, i) => (
                          <tr key={i} className={i > 0 ? 'border-t border-line' : ''}>
                            <th scope="row" className="py-2 pr-6 text-left font-normal">
                              {h.days}
                            </th>
                            <td className="py-2 text-right tabular-nums">{h.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </dd>
                  <DrawLine className="absolute inset-x-0 bottom-0 bg-line-strong" delay={(rows.length + 1) * 0.07} />
                </div>
              </dl>

              <p className="mt-8 rounded-lg border border-line bg-bg p-6 leading-relaxed text-muted">
                <span className="mb-1 block font-medium text-fg">Urgent concerns</span>
                This website is not monitored for emergencies. If you need urgent medical help, contact your local emergency services.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
