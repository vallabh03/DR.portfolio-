import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { doctor } from '../data/doctor'
import { EASE, EASE_EXIT, EASE_IN_OUT, useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import DrawLine from '../components/DrawLine'
import Button, { ArrowRight } from '../components/Button'

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

const STEPS: { title: string; fields: (keyof Values)[] }[] = [
  { title: 'Your details', fields: ['name', 'phone', 'email'] },
  { title: 'Preferred time', fields: ['date', 'time'] },
  { title: 'Message and consent', fields: ['message', 'consent'] },
]

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

const validateStep = (step: number, v: Values): Errors => {
  const all = validate(v)
  return Object.fromEntries(STEPS[step].fields.filter((f) => all[f]).map((f) => [f, all[f]]))
}

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 32 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24, transition: { duration: 0.22, ease: EASE_EXIT } }),
}

export default function Consultation() {
  const entrance = useEntrance()
  const [values, setValues] = useState<Values>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [status, setStatus] = useState<'idle' | 'sending' | 'received' | 'error'>('idle')
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLDivElement>(null)
  const focusOnStep = useRef(false)

  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    setValues((v) => ({ ...v, [k]: val }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const focusFirstInvalid = (found: Errors) => {
    const first = Object.keys(found)[0]
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
  }

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1)
    focusOnStep.current = true
    setStep(next)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validateStep(step, values)
    setErrors(found)
    if (Object.keys(found).length) {
      focusFirstInvalid(found)
      return
    }
    if (step < STEPS.length - 1) {
      goTo(step + 1)
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
      setStep(0)
      requestAnimationFrame(() => successRef.current?.focus())
    } catch {
      setStatus('error')
    }
  }

  return (
    <section aria-labelledby="consultation-title" className="container-page pb-16 pt-10 md:pb-24 md:pt-16 lg:pb-32 lg:pt-24">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start">
          <RevealText as="h1" id="consultation-title" lines={['Book a', 'consultation']} className="heading-1" delay={0.1} immediate />
          <motion.div {...entrance(0.4)}>
            <p className="lead measure mt-8">
              Share a few details and the practice will be in touch to arrange a suitable time. Submitting this form sends a request.
              It is not a confirmed appointment.
            </p>
            <div role="note" className="mt-8 max-w-md rounded-lg border border-line bg-surface p-6 leading-relaxed text-muted">
              <span className="mb-1 block font-medium text-fg">Urgent concerns</span>
              This form is not monitored for emergencies. If you need urgent medical help, contact your local emergency services.
            </div>
          </motion.div>
        </div>

        <div className="relative min-w-0 overflow-hidden rounded-lg border border-line bg-surface p-5 sm:p-10 lg:col-span-7">
          <DrawLine immediate delay={0.3} duration={1.2} className="absolute inset-x-0 top-0 bg-accent" />
          <AnimatePresence mode="wait" initial={false}>
            {status === 'received' ? (
              <motion.div
                key="ok"
                ref={successRef}
                tabIndex={-1}
                role="status"
                className="flex min-h-[28rem] flex-col justify-center outline-none"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE_EXIT } }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <svg viewBox="0 0 52 52" className="h-14 w-14 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <motion.circle cx="26" cy="26" r="24" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: EASE_IN_OUT }} />
                  <motion.path
                    d="M16 27l7 7 14-15"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, ease: EASE_IN_OUT, delay: 0.6 }}
                  />
                </svg>
                <h2 className="heading-2 mt-8">Your request has been received.</h2>
                <p className="lead mt-4 max-w-lg">The practice will contact you to arrange a time. Your appointment is not confirmed until you hear back.</p>
                {import.meta.env.DEV && !doctor.booking.endpoint && (
                  <p className="mt-4 text-sm text-muted">
                    Development note: no form endpoint is configured in <code>src/data/doctor.ts</code>, so nothing was sent.
                  </p>
                )}
                <div className="mt-10">
                  <Button variant="secondary" onClick={() => setStatus('idle')}>
                    Send another request
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                ref={formRef}
                noValidate
                onSubmit={onSubmit}
                aria-labelledby="consultation-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE_EXIT } }}
              >
                <StepIndicator step={step} />

                <div className="mt-10 min-h-[22rem]">
                  <AnimatePresence mode="wait" initial={false} custom={direction}>
                    <motion.fieldset
                      key={step}
                      custom={direction}
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="min-w-0"
                      onAnimationStart={(def) => {
                        // Once the new step is on screen, move focus to its first field.
                        if (def !== 'center' || !focusOnStep.current) return
                        focusOnStep.current = false
                        formRef.current?.querySelector<HTMLElement>('fieldset input, fieldset select, fieldset textarea')?.focus()
                      }}
                    >
                      <legend className="heading-3 mb-6">{STEPS[step].title}</legend>

                      {step === 0 && (
                        <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
                          <Field label="Full name" name="name" required error={errors.name} className="sm:col-span-2">
                            {(p) => <input {...p} type="text" autoComplete="name" value={values.name} onChange={(e) => set('name', e.target.value)} />}
                          </Field>
                          <Field label="Phone" name="phone" required error={errors.phone}>
                            {(p) => <input {...p} type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)} />}
                          </Field>
                          <Field label="Email" name="email" required error={errors.email}>
                            {(p) => <input {...p} type="email" autoComplete="email" value={values.email} onChange={(e) => set('email', e.target.value)} />}
                          </Field>
                        </div>
                      )}

                      {step === 1 && (
                        <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
                          <Field label="Preferred date" name="date" error={errors.date} hint="Optional.">
                            {(p) => <input {...p} type="date" min={today()} value={values.date} onChange={(e) => set('date', e.target.value)} />}
                          </Field>
                          <Field label="Preferred time" name="time" error={errors.time} hint="Optional.">
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
                        </div>
                      )}

                      {step === 2 && (
                        <div className="grid gap-y-6">
                          <Field label="Message" name="message" error={errors.message} hint="Optional. Please don’t include detailed medical records.">
                            {(p) => <textarea {...p} rows={5} maxLength={1000} value={values.message} onChange={(e) => set('message', e.target.value)} />}
                          </Field>
                          <div>
                            <label className="flex min-h-11 cursor-pointer items-start gap-3 leading-relaxed text-muted">
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
                        </div>
                      )}
                    </motion.fieldset>
                  </AnimatePresence>
                </div>

                <div className="mt-10 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                  {step > 0 ? (
                    <Button variant="secondary" onClick={() => goTo(step - 1)}>
                      Back
                    </Button>
                  ) : (
                    <span className="hidden sm:block" />
                  )}
                  <Button type="submit" disabled={status === 'sending'} className="w-full sm:w-auto">
                    {step < STEPS.length - 1 ? 'Continue' : status === 'sending' ? 'Sending…' : 'Request consultation'} <ArrowRight />
                  </Button>
                </div>
                <AnimatePresence>
                  {status === 'error' && (
                    <motion.p role="alert" className="mt-4 text-sm text-danger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15, ease: EASE_EXIT } }}>
                      Something went wrong. Please try again, or contact the practice directly.
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

/** Three numbered steps joined by a rule that fills as you progress. */
function StepIndicator({ step }: { step: number }) {
  return (
    <div>
      <p className="sr-only" aria-live="polite">
        Step {step + 1} of {STEPS.length}: {STEPS[step].title}
      </p>
      <ol aria-hidden className="relative grid grid-cols-3">
        {/* Track between the first and last markers, and its fill */}
        <span className="absolute left-[1.125rem] right-[calc(33.333%-1.125rem)] top-[1.0625rem] h-px bg-line-strong" />
        <motion.span
          className="absolute left-[1.125rem] right-[calc(33.333%-1.125rem)] top-[1.0625rem] h-px origin-left bg-accent"
          initial={false}
          animate={{ scaleX: step / (STEPS.length - 1) }}
          transition={{ duration: 0.6, ease: EASE_IN_OUT }}
        />
        {STEPS.map((s, i) => {
          const done = i < step
          const current = i === step
          return (
            <li key={s.title} className="relative flex flex-col items-start gap-3">
              <span
                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border font-serif tabular-nums transition-colors duration-500 ${
                  done ? 'border-accent bg-accent text-on-accent' : current ? 'border-accent bg-surface text-accent' : 'border-line-strong bg-surface text-muted'
                }`}
              >
                {i + 1}
              </span>
              <span className={`hidden text-sm sm:block ${current ? 'text-fg' : 'text-muted'}`}>{s.title}</span>
            </li>
          )
        })}
      </ol>
      <p className="mt-4 text-sm text-muted sm:hidden" aria-hidden>
        Step {step + 1} of {STEPS.length}
      </p>
    </div>
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
    <div className={className}>
      <label htmlFor={id} className="flex items-center gap-1 text-[0.9375rem] font-medium text-fg">
        {label}
        {required && (
          <span aria-hidden className="text-accent">
            *
          </span>
        )}
      </label>
      <div className="mt-2">
        {children({
          id,
          name,
          required,
          'aria-invalid': !!error,
          'aria-describedby': describedBy,
          className:
            'block min-h-12 w-full rounded-sm border border-line-strong bg-bg px-4 py-3 text-base text-fg transition-colors duration-200 placeholder:text-muted hover:border-fg/60 focus:border-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent aria-[invalid=true]:border-danger [&>option]:bg-surface [&>option]:text-fg',
        })}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-2 text-sm text-muted">
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
