import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Section from '../components/Section'
import MagneticButton, { ArrowRight } from '../components/MagneticButton'
import { doctor } from '../data/doctor'

const EASE = [0.16, 1, 0.3, 1] as const

type Values = {
  name: string
  phone: string
  email: string
  date: string
  time: string
  message: string
  consent: boolean
}

type Errors = Partial<Record<keyof Values, string>>

const EMPTY: Values = { name: '', phone: '', email: '', date: '', time: '', message: '', consent: false }

const today = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

function validate(v: Values): Errors {
  const e: Errors = {}
  if (v.name.trim().length < 2) e.name = 'Please enter your full name.'
  if (!/^[+()\d\s-]{7,20}$/.test(v.phone.trim())) e.phone = 'Please enter a valid phone number.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'Please enter a valid email address.'
  if (v.date && v.date < today()) e.date = 'Please choose a date from today onwards.'
  if (v.message.length > 1000) e.message = 'Please keep your message under 1000 characters.'
  if (!v.consent) e.consent = 'Please confirm so the practice can contact you.'
  return e
}

export default function Consultation() {
  const [values, setValues] = useState<Values>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'received' | 'error'>('idle')
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    setValues((v) => ({ ...v, [k]: val }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    const firstInvalid = Object.keys(found)[0]
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }
    setStatus('sending')
    try {
      if (doctor.booking.endpoint) {
        const res = await fetch(doctor.booking.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(values),
        })
        if (!res.ok) throw new Error(String(res.status))
      } else {
        // No backend configured yet: acknowledge locally without sending data.
        await new Promise((r) => setTimeout(r, 900))
      }
      setStatus('received')
      setValues(EMPTY)
      requestAnimationFrame(() => successRef.current?.focus())
    } catch {
      setStatus('error')
    }
  }

  return (
    <Section
      number={10}
      label="Book"
      title={['Book a', <span className="serif-accent">consultation</span>]}
      intro="Share a few details and the practice will be in touch to arrange a suitable time. Submitting this form sends a request — it is not a confirmed appointment."
      headerExtra={
        <div className="mt-10 max-w-md rounded-3xl border border-line p-6 text-sm leading-relaxed text-muted">
          <span className="eyebrow mb-2 block !text-fg">Urgent concerns</span>
          This form is not monitored for emergencies. If you need urgent medical help, contact your local emergency services.
        </div>
      }
    >
      <div className="rounded-[2rem] border border-line bg-surface p-6 sm:p-10">
        <AnimatePresence mode="wait" initial={false}>
          {status === 'received' ? (
            <motion.div
              key="ok"
              ref={successRef}
              tabIndex={-1}
              role="status"
              className="flex min-h-[28rem] flex-col justify-center outline-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <motion.svg viewBox="0 0 52 52" className="h-14 w-14 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <motion.circle cx="26" cy="26" r="24" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: EASE }} />
                <motion.path
                  d="M16 27l7 7 14-15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, ease: EASE, delay: 0.6 }}
                />
              </motion.svg>
              <h2 className="display-md mt-8">Your request has been received.</h2>
              <p className="lead mt-4 max-w-lg">
                The practice will contact you to arrange a time. Your appointment is not confirmed until you hear back.
              </p>
              {import.meta.env.DEV && !doctor.booking.endpoint && (
                <p className="mt-4 text-xs text-subtle">
                  Development note: no form endpoint is configured in <code>src/data/doctor.ts</code>, so nothing was sent.
                </p>
              )}
              <div className="mt-10">
                <MagneticButton variant="outline" onClick={() => setStatus('idle')}>
                  Send another request
                </MagneticButton>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              ref={formRef}
              noValidate
              onSubmit={onSubmit}
              aria-label="Consultation request"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-x-6 gap-y-8 sm:grid-cols-2"
            >
              <Field label="Full name" name="name" required error={errors.name} className="sm:col-span-2">
                {(p) => (
                  <input {...p} type="text" autoComplete="name" value={values.name} onChange={(e) => set('name', e.target.value)} />
                )}
              </Field>
              <Field label="Phone" name="phone" required error={errors.phone}>
                {(p) => (
                  <input {...p} type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)} />
                )}
              </Field>
              <Field label="Email" name="email" required error={errors.email}>
                {(p) => (
                  <input {...p} type="email" autoComplete="email" value={values.email} onChange={(e) => set('email', e.target.value)} />
                )}
              </Field>
              <Field label="Preferred date" name="date" error={errors.date}>
                {(p) => <input {...p} type="date" min={today()} value={values.date} onChange={(e) => set('date', e.target.value)} />}
              </Field>
              <Field label="Preferred time" name="time" error={errors.time}>
                {(p) => (
                  <select {...p} value={values.time} onChange={(e) => set('time', e.target.value)}>
                    <option value="">No preference</option>
                    <option value="morning">Morning</option>
                    <option value="midday">Midday</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                  </select>
                )}
              </Field>
              <Field label="Message" name="message" error={errors.message} className="sm:col-span-2" hint="Optional — please don’t include detailed medical records.">
                {(p) => (
                  <textarea {...p} rows={4} maxLength={1000} value={values.message} onChange={(e) => set('message', e.target.value)} />
                )}
              </Field>

              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted">
                  <input
                    type="checkbox"
                    name="consent"
                    checked={values.consent}
                    onChange={(e) => set('consent', e.target.checked)}
                    aria-invalid={!!errors.consent}
                    aria-describedby={errors.consent ? 'consent-error' : undefined}
                    className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]"
                  />
                  <span>I understand this is a request, not a confirmed appointment, and agree that the practice may contact me about it.</span>
                </label>
                {errors.consent && (
                  <p id="consent-error" className="mt-2 text-sm text-danger">
                    {errors.consent}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <MagneticButton type="submit" disabled={status === 'sending'} cursor="SEND">
                  {status === 'sending' ? 'Sending…' : 'Request consultation'} <ArrowRight />
                </MagneticButton>
                <AnimatePresence>
                  {status === 'error' && (
                    <motion.p role="alert" className="text-sm text-danger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      Something went wrong. Please try again, or contact the practice directly.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </Section>
  )
}

type FieldProps = {
  id: string
  name: string
  required?: boolean
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  className: string
}

function Field({
  label,
  name,
  required,
  error,
  hint,
  className = '',
  children,
}: {
  label: string
  name: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: (p: FieldProps) => ReactNode
}) {
  const id = useId()
  const describedBy = [error ? `${id}-err` : '', hint ? `${id}-hint` : ''].filter(Boolean).join(' ') || undefined
  return (
    <div className={`group relative ${className}`}>
      <label htmlFor={id} className="eyebrow flex items-center gap-1 transition-colors group-focus-within:!text-accent">
        {label}
        {required && (
          <span aria-hidden className="text-accent">
            *
          </span>
        )}
      </label>
      <div className="relative mt-2">
        {children({
          id,
          name,
          required,
          'aria-invalid': !!error,
          'aria-describedby': describedBy,
          className:
            'peer w-full appearance-none rounded-none border-0 border-b border-line-strong bg-transparent px-0 py-3 text-lg text-fg placeholder:text-subtle focus:outline-none focus-visible:outline-none aria-[invalid=true]:border-danger [&>option]:bg-surface [&>option]:text-fg',
        })}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] peer-focus:scale-x-100" />
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-2 text-xs text-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
