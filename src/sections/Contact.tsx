import type { ReactNode } from 'react'
import PageSection from '../components/PageSection'
import SectionHeader from '../components/SectionHeader'
import MedicalImage from '../components/MedicalImage'
import Reveal from '../components/Reveal'
import Button, { ArrowRight } from '../components/Button'
import RevealText from '../components/RevealText'
import { doctor, isPlaceholder } from '../data/doctor'
import { BOOK_PATH } from '../data/navigation'

export default function Contact() {
  const { contact } = doctor

  const rows: { label: string; value: ReactNode; muted?: boolean }[] = [
    { label: 'Clinic / Hospital', value: contact.clinic, muted: isPlaceholder(contact.clinic) },
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
      label: 'Working hours',
      value: (
        <span className="block space-y-1">
          {contact.hours.map((h, i) => (
            <span key={i} className="flex justify-between gap-6">
              <span>{h.days}</span>
              <span className="tabular-nums">{h.time}</span>
            </span>
          ))}
        </span>
      ),
      muted: contact.hours.every((h) => isPlaceholder(h.days)),
    },
    {
      label: 'Professional links',
      value:
        contact.links.length > 0 ? (
          <span className="flex flex-wrap gap-x-5 gap-y-2">
            {contact.links.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="link-underline">
                {l.label} ↗
              </a>
            ))}
          </span>
        ) : (
          '[PROFESSIONAL PROFILES]'
        ),
      muted: contact.links.length === 0,
    },
  ]

  return (
    <PageSection id="contact">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <SectionHeader
          id="contact-title"
          label="Contact"
          title={['Visit &', <span className="em-serif">contact</span>]}
          intro="Where to find the practice and how to reach it. For appointment requests, use the consultation form."
          className="lg:col-span-5"
        >
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
        </SectionHeader>

        <div className="min-w-0 lg:col-span-7">
          <MedicalImage src="/images/clinic.jpg" alt="The clinic" placeholderLabel="Clinic" className="aspect-[16/10] w-full rounded-lg" hoverZoom={false} />

          <Reveal className="mt-8">
            <dl className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
              {rows.map((r) => (
                <div key={r.label} className="bg-surface p-6 sm:p-8">
                  <dt className="label">{r.label}</dt>
                  <dd className={`mt-3 leading-snug ${r.muted ? 'text-muted' : ''}`}>{r.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <p className="mt-6 text-sm text-muted">
            This website is not monitored for emergencies. If you need urgent medical help, contact your local emergency services.
          </p>
        </div>
      </div>

      {/* Closing call to action */}
      <Reveal className="mt-20 rounded-lg bg-fg px-6 py-12 text-bg sm:px-12 md:mt-28 md:py-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <RevealText as="p" lines={['Book a', <span className="em-serif">consultation</span>]} className="heading-2" />
            <p className="measure mt-4 text-bg/75">
              Share a few details and the practice will be in touch to arrange a suitable time.
            </p>
          </div>
          <Button to={BOOK_PATH} className="shrink-0 !bg-bg !text-fg hover:!bg-accent hover:!text-on-accent">
            Request a consultation <ArrowRight />
          </Button>
        </div>
      </Reveal>
    </PageSection>
  )
}
