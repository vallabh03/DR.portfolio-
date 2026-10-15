import { doctor, hasValue } from '../data/doctor'
import RevealText from '../components/RevealText'
import DrawLine from '../components/DrawLine'
import { ArrowRight } from '../components/Button'
import { WhatsAppChatLink } from '../components/WhatsAppButton'

/**
 * Contact: the doctor's name, telephone and email as ruled rows, nothing else.
 * A telephone or email that is not yet confirmed is left out rather than shown
 * as a placeholder.
 */

const { contact } = doctor

type Row = { label: string; value: string; href?: string; serif?: boolean }

const rows: Row[] = [
  { label: 'Doctor', value: doctor.name, serif: true },
  ...(hasValue(contact.phone) ? [{ label: 'Telephone', value: contact.phone, href: `tel:${contact.phone.replace(/\s+/g, '')}` }] : []),
  ...(hasValue(contact.email) ? [{ label: 'Email', value: contact.email, href: `mailto:${contact.email}` }] : []),
]

export default function Contact() {
  return (
    <section aria-labelledby="contact-title" className="container-page section-y">
      <RevealText as="h1" id="contact-title" lines={['Contact']} className="display-hero" delay={0.1} immediate />
      <ul className="relative mt-12 border-b border-line md:mt-16">
        <DrawLine immediate delay={0.4} duration={1.2} className="absolute inset-x-0 top-0 bg-line-strong" />
        {rows.map((r, i) => (
          <DirectoryRow key={r.label} row={r} first={i === 0} />
        ))}
      </ul>
      <WhatsAppChatLink className="mt-8 w-full sm:w-auto" />
    </section>
  )
}

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
          <ArrowRight />
        </span>
      )}
    </>
  )
  const layout = 'grid items-baseline gap-x-6 gap-y-1 py-5 sm:grid-cols-[11rem_1fr_auto]'

  return (
    <li className="relative">
      {!first && <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" duration={0.9} />}
      {row.href ? (
        <a href={row.href} className={`group min-h-14 ${layout}`}>
          {inner}
        </a>
      ) : (
        <div className={layout}>{inner}</div>
      )}
    </li>
  )
}
