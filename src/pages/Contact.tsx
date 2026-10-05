import { motion } from 'framer-motion'
import Section from '../components/Section'
import MedicalImage from '../components/MedicalImage'
import MagneticButton, { ArrowRight } from '../components/MagneticButton'
import { doctor, isPlaceholder } from '../data/doctor'
import { useChapters } from '../context/ChapterContext'
import { chapters } from '../data/chapters'

const EASE = [0.16, 1, 0.3, 1] as const

export default function Contact() {
  const { contact } = doctor
  const { go } = useChapters()

  const rows: { label: string; value: React.ReactNode; muted?: boolean }[] = [
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
    <Section
      number={9}
      label="Contact"
      title={['Visit &', <span className="serif-accent">contact</span>]}
      intro="Where to find the practice and how to reach it. For appointment requests, use the consultation form."
      headerExtra={
        <div className="mt-10 flex flex-wrap gap-3">
          <MagneticButton
            to="/consultation"
            onClick={(e) => {
              e.preventDefault()
              go(chapters.length - 1, { focus: true })
            }}
          >
            Book a consultation <ArrowRight />
          </MagneticButton>
          {contact.mapUrl && (
            <MagneticButton href={contact.mapUrl} variant="outline" external>
              Get directions
            </MagneticButton>
          )}
        </div>
      }
    >
      <div className="group">
        <MedicalImage src="/images/clinic.jpg" alt="The clinic" placeholderLabel="Clinic" className="aspect-[16/10] w-full rounded-[2rem]" />
      </div>

      <dl className="mt-12 grid gap-px overflow-hidden rounded-[2rem] border border-line bg-line sm:grid-cols-2">
        {rows.map((r, i) => (
          <motion.div
            key={r.label}
            className="group bg-bg p-7 transition-colors duration-500 hover:bg-surface sm:p-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE, delay: i * 0.06 }}
          >
            <dt className="eyebrow flex items-center gap-3">
              <span className="h-px w-5 bg-accent transition-all duration-500 group-hover:w-8" aria-hidden />
              {r.label}
            </dt>
            <dd className={`mt-4 text-lg leading-snug ${r.muted ? 'text-muted' : ''}`}>{r.value}</dd>
          </motion.div>
        ))}
      </dl>

      <p className="mt-8 text-sm text-subtle">
        This website is not monitored for emergencies. If you need urgent medical help, contact your local emergency services.
      </p>
    </Section>
  )
}
