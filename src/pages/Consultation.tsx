import { useEffect, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { doctor } from '../data/doctor'
import { EASE, EASE_EXIT, EASE_IN_OUT, useDecorativeMotion, useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import DrawLine from '../components/DrawLine'
import Button, { ArrowRight } from '../components/Button'

/**
 * Consultation: an intake document. Three numbered parts with a label column,
 * an error summary when a part needs attention, a review of the details before
 * sending, and a formal record of the request once it is received. Margin notes
 * say what happens next. The request is sent to the site's own endpoint
 * (doctor.booking.endpoint), which notifies the practice on WhatsApp. The record
 * is shown only after the endpoint confirms the request was sent; on failure the
 * entered details stay in place so the visitor can try again.
 */

type Values = {
  name: string
  phone: string
  email: string
  date: string
  time: string
  message: string
  consent: boolean
}

type Field = keyof Values
type Errors = Partial<Record<Field, string>>

const EMPTY: Values = { name: '', phone: '', email: '', date: '', time: '', message: '', consent: false }

const STEPS: { title: string; fields: Field[] }[] = [
  { title: 'Your details', fields: ['name', 'phone', 'email'] },
  { title: 'Preferred time', fields: ['date', 'time'] },
  { title: 'Message and consent', fields: ['message', 'consent'] },
]

const LABELS: Record<Field, string> = {
  name: 'Full name',
  phone: 'Phone',
  email: 'Email',
  date: 'Preferred date',
  time: 'Preferred time',
  message: 'Message',
  consent: 'Consent',
}

const TIME_OPTIONS = [
  { value: '', label: 'No preference' },
  { value: 'morning', label: 'Morning' },
  { value: 'midday', label: 'Midday' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
]

const fieldId = (f: Field) => `consult-${f}`
const pad = (n: number) => String(n).padStart(2, '0')

const today = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

function validate(v: Values): Errors {
  const e: Errors = {}
  if (v.name.trim().length < 2) e.name = 'Please enter your full name.'
  if (!/^[+()\d\s-]{7,20}$/.test(v.phone.trim()) || v.phone.replace(/\D/g, '').length < 7) e.phone = 'Please enter a valid phone number.'
  if (v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'Please enter a valid email address.'
  if (v.date && v.date < today()) e.date = 'Please choose a date from today onwards.'
  if (v.message.length > 1000) e.message = 'Please keep your message under 1000 characters.'
  if (!v.consent) e.consent = 'Please confirm so the practice can contact you.'
  return e
}

const validateStep = (step: number, v: Values): Errors => {
  const all = validate(v)
  return Object.fromEntries(STEPS[step].fields.filter((f) => all[f]).map((f) => [f, all[f]]))
}

/** Human-readable values for the review and the record. Nothing is inferred. */
const NOT_SPECIFIED = 'Not specified'
const formatDate = (iso: string) => {
  if (!iso) return NOT_SPECIFIED
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
}
const formatTime = (t: string) => TIME_OPTIONS.find((o) => o.value === t)?.label ?? NOT_SPECIFIED

const summaryRows = (v: Values): { field: Field; step: number; value: string }[] => [
  { field: 'name', step: 0, value: v.name.trim() },
  { field: 'phone', step: 0, value: v.phone.trim() },
  { field: 'email', step: 0, value: v.email.trim() || NOT_SPECIFIED },
  { field: 'date', step: 1, value: formatDate(v.date) },
  { field: 'time', step: 1, value: v.time ? formatTime(v.time) : formatTime('') },
]

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function Consultation() {
  return (
    <>
      <Opening />
      <BeforeYouBegin />
      <section aria-label="Consultation request" className="container-page pb-16 pt-10 md:pb-24 md:pt-12 lg:pb-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="min-w-0 lg:col-span-8">
            <IntakeDocument />
          </div>
          <aside className="lg:col-span-4">
            <MarginNotes />
          </aside>
        </div>
      </section>
    </>
  )
}

/* ── 1. Opening ──────────────────────────────────────────────────────────── */

function Opening() {
  const entrance = useEntrance()
  return (
    <section aria-labelledby="consultation-title" className="container-page pt-10 md:pt-16 lg:pt-24">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
        <RevealText as="h1" id="consultation-title" lines={['Book a', 'consultation']} className="heading-1 lg:col-span-7" delay={0.1} immediate />
        <motion.p className="lead measure lg:col-span-5 lg:pb-2" {...entrance(0.4)}>
          Share a few details and the practice will be in touch to arrange a suitable time. Submitting this form sends a request. It
          is not a confirmed appointment.
        </motion.p>
      </div>
    </section>
  )
}

/* ── 2. Before you begin: the existing urgent-concerns text, ahead of the form ── */

function BeforeYouBegin() {
  return (
    <section aria-labelledby="before-title" className="container-page pt-10 md:pt-12">
      <div className="relative grid gap-2 border-b border-line py-5 md:grid-cols-[13rem_1fr] md:gap-6">
        <DrawLine immediate delay={0.5} duration={1.1} className="absolute inset-x-0 top-0 bg-fg/60" />
        <h2 id="before-title" className="font-medium text-fg">
          Before you begin
        </h2>
        <p className="measure text-fg/85">
          This form is not monitored for emergencies. If you need urgent medical help, contact your local emergency services.
        </p>
      </div>
    </section>
  )
}

/* ── 3. Margin notes ─────────────────────────────────────────────────────── */

function MarginNotes() {
  const steps = [
    'Submitting this form sends a request. It is not a confirmed appointment.',
    'The practice will contact you to arrange a time.',
    'Your appointment is not confirmed until you hear back.',
  ]
  return (
    <div className="lg:sticky lg:top-28">
      <h2 className="heading-3">What happens next</h2>
      <ol className="mt-5 border-t border-line">
        {steps.map((s, i) => (
          <li key={i} className="grid grid-cols-[2rem_1fr] gap-3 border-b border-line py-4">
            <span aria-hidden className="font-serif tabular-nums text-brass">
              {i + 1}
            </span>
            <span className="text-fg/85">{s}</span>
          </li>
        ))}
      </ol>
      <h2 className="heading-3 mt-10">Other ways to reach the practice</h2>
      <Link to="/contact" className="group/btn mt-3 inline-flex min-h-11 items-center gap-2 font-medium text-accent hover:text-accent-hover">
        <span className="link-underline">Visit and contact</span>
        <ArrowRight />
      </Link>
    </div>
  )
}

/* ── 4. The intake document ──────────────────────────────────────────────── */

/** A random id per request, reused on retries so the server can ignore a repeat of one already sent. */
const newRequestId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`

type SendError = 'failed' | 'rate_limited'

async function sendRequest(values: Values, extra: { requestId: string; elapsedMs: number; website: string }) {
  if (!doctor.booking.endpoint) throw new Error('No endpoint configured')
  const res = await fetch(doctor.booking.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ ...values, ...extra }),
  })
  if (res.status === 429) throw new Error('rate_limited')
  // Success only when the endpoint itself says the request was sent.
  const data = (await res.json().catch(() => null)) as { ok?: unknown; error?: string; reason?: string } | null
  console.log('[consultation form] response:', res.status, data)
  if (!res.ok || data?.ok !== true) {
    console.error('[consultation form] failed with status', res.status, data)
    throw new Error('failed')
  }
}

function IntakeDocument() {
  const animated = useDecorativeMotion()
  const [values, setValues] = useState<Values>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [showSummary, setShowSummary] = useState(false)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [status, setStatus] = useState<'idle' | 'sending' | 'received' | 'error'>('idle')
  const [sendError, setSendError] = useState<SendError>('failed')
  const [record, setRecord] = useState<Values | null>(null)
  const docRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  // Which field should receive focus when the next part mounts ('' = its first field).
  const focusRequest = useRef<Field | '' | null>(null)
  // Spam signals for the server: when the form was opened, and a field only automated clients fill in.
  const startedAt = useRef(Date.now())
  const honeypot = useRef<HTMLInputElement>(null)
  const requestId = useRef<string | null>(null)

  // Clearing works from the latest errors, so the summary empties itself as each field is fixed.
  const set = <K extends Field>(k: K, val: Values[K]) => {
    setValues((v) => ({ ...v, [k]: val }))
    setErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev))
  }

  /** Bring the top of the document into view if it has scrolled above the screen. */
  const revealDocument = () => {
    const el = docRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top
    if (top < 80) window.scrollTo({ top: top + window.scrollY - 96, behavior: animated ? 'smooth' : 'instant' })
  }

  const goTo = (next: number, focusField: Field | '' = '') => {
    setDirection(next > step ? 1 : -1)
    setErrors({})
    setShowSummary(false)
    focusRequest.current = focusField
    setStep(next)
    requestAnimationFrame(revealDocument)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return
    const found = validateStep(step, values)
    setErrors(found)
    const firstInvalid = STEPS[step].fields.find((f) => found[f])
    if (firstInvalid) {
      setShowSummary(true)
      document.getElementById(fieldId(firstInvalid))?.focus()
      return
    }
    setShowSummary(false)
    if (step < STEPS.length - 1) {
      goTo(step + 1)
      return
    }

    setStatus('sending')
    requestId.current ??= newRequestId()
    try {
      await sendRequest(values, {
        requestId: requestId.current,
        elapsedMs: Math.max(0, Date.now() - startedAt.current),
        website: '',
      })
      requestId.current = null
      setRecord(values)
      setStatus('received')
      setValues(EMPTY)
      setStep(0)
      requestAnimationFrame(revealDocument)
    } catch (err) {
      // The entered details are kept so the visitor can try again.
      setSendError(err instanceof Error && err.message === 'rate_limited' ? 'rate_limited' : 'failed')
      setStatus('error')
    }
  }

  const reset = () => {
    setStatus('idle')
    setRecord(null)
    startedAt.current = Date.now()
    focusRequest.current = ''
  }

  const stepVariants = animated
    ? {
        enter: (dir: number) => ({ opacity: 0, x: dir * 32 }),
        center: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
        exit: (dir: number) => ({ opacity: 0, x: dir * -24, transition: { duration: 0.22, ease: EASE_EXIT } }),
      }
    : { enter: { opacity: 1, x: 0 }, center: { opacity: 1, x: 0 }, exit: { opacity: 0, transition: { duration: 0 } } }

  const swap = animated
    ? { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } }, exit: { opacity: 0, transition: { duration: 0.2, ease: EASE_EXIT } } }
    : { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0 } } }

  const stepErrors = STEPS[step].fields.filter((f) => errors[f])

  return (
    <div ref={docRef} className="relative scroll-mt-28 overflow-hidden rounded-lg border border-line bg-surface">
      <DrawLine immediate delay={0.3} duration={1.2} className="absolute inset-x-0 top-0 bg-accent" />
      <AnimatePresence mode="wait" initial={false}>
        {status === 'received' && record ? (
          <motion.div key="record" {...swap}>
            <RequestRecord record={record} onReset={reset} />
          </motion.div>
        ) : (
          <motion.form
            key="form"
            ref={formRef}
            noValidate
            onSubmit={onSubmit}
            aria-labelledby="request-title"
            aria-busy={status === 'sending'}
            className="p-5 sm:p-8 lg:p-10"
            {...swap}
          >
            <h2 id="request-title" className="sr-only">
              Consultation request
            </h2>
            {/* Hidden honeypot field for bot scrapers; completely hidden from browser autofill */}
            <div aria-hidden="true" style={{ display: 'none' }}>
              <input
                id="website-hp"
                ref={honeypot}
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                data-1p-ignore="true"
                data-lpignore="true"
                data-form-type="other"
                defaultValue=""
              />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <Progress step={step} />
              <p className="text-sm text-muted sm:pt-2">
                Fields marked <span className="text-accent">*</span> are required
              </p>
            </div>

            <div className="mt-10">
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.fieldset key={step} custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit" className="min-w-0">
                  <PartLegend step={step} direction={direction} />
                  <FocusOnMount request={focusRequest} />

                  <div className="clear-both" />
                  <ErrorSummary visible={showSummary && stepErrors.length > 0} fields={stepErrors} errors={errors} />

                  {step === 0 && (
                    <div className="mt-6">
                      <Row field="name" required error={errors.name} index={0}>
                        {(p) => <input {...p} type="text" autoComplete="name" maxLength={100} value={values.name} onChange={(e) => set('name', e.target.value)} />}
                      </Row>
                      <Row field="phone" required error={errors.phone} index={1}>
                        {(p) => <input {...p} type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)} />}
                      </Row>
                      <Row field="email" error={errors.email} hint="Optional." index={2}>
                        {(p) => <input {...p} type="email" autoComplete="email" maxLength={254} value={values.email} onChange={(e) => set('email', e.target.value)} />}
                      </Row>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="mt-6">
                      <Row field="date" error={errors.date} hint="Optional." index={0}>
                        {(p) => <input {...p} type="date" min={today()} value={values.date} onChange={(e) => set('date', e.target.value)} />}
                      </Row>
                      <Row field="time" error={errors.time} hint="Optional." index={1}>
                        {(p) => (
                          <select {...p} value={values.time} onChange={(e) => set('time', e.target.value)}>
                            {TIME_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </Row>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="mt-6">
                      <Review values={values} onEdit={(s, f) => goTo(s, f)} />
                      <Row field="message" error={errors.message} hint="Optional. Please don’t include detailed medical records." index={1}>
                        {(p) => <textarea {...p} rows={5} maxLength={1000} value={values.message} onChange={(e) => set('message', e.target.value)} />}
                      </Row>
                      <ConsentRow checked={values.consent} error={errors.consent} onChange={(c) => set('consent', c)} />
                    </div>
                  )}
                </motion.fieldset>
              </AnimatePresence>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row-reverse sm:items-center sm:justify-between">
              <Button type="submit" disabled={status === 'sending'} className="w-full sm:w-auto">
                {step < STEPS.length - 1 ? 'Continue' : status === 'sending' ? 'Sending…' : 'Request consultation'} <ArrowRight />
              </Button>
              {step > 0 && (
                <Button variant="secondary" onClick={() => goTo(step - 1)} className="w-full sm:w-auto">
                  Back
                </Button>
              )}
            </div>
            {status === 'error' && (
              <p role="alert" className="mt-4 text-sm text-danger">
                {sendError === 'rate_limited'
                  ? 'Your request has not been sent because several requests came from this connection in a short time. Please wait a few minutes and try again, or contact the practice directly.'
                  : 'Your request has not been sent. Your details are still here, so please try again, or contact the practice directly.'}
              </p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Moves focus once the new part has mounted: to a requested field, or the part's first field. */
function FocusOnMount({ request }: { request: { current: Field | '' | null } }) {
  useEffect(() => {
    const target = request.current
    if (target === null) return
    request.current = null
    const el = target ? document.getElementById(fieldId(target)) : document.querySelector<HTMLElement>('fieldset input, fieldset select, fieldset textarea')
    el?.focus({ preventScroll: true })
  }, [request])
  return null
}

/* ── Progress: three numbered parts joined by a hairline ─────────────────── */

function Progress({ step }: { step: number }) {
  return (
    <div className="min-w-0 sm:w-[24rem]">
      <p className="sr-only" aria-live="polite">
        Part {step + 1} of {STEPS.length}: {STEPS[step].title}
      </p>
      <ol aria-hidden className="relative grid grid-cols-3">
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
            <li key={s.title} className="relative flex flex-col items-start gap-2">
              {/* Shape as well as colour: filled when done, ringed when current, open ahead */}
              <span
                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border font-serif tabular-nums transition-colors duration-500 ${
                  done ? 'border-accent bg-accent text-on-accent' : current ? 'border-accent bg-surface text-accent ring-1 ring-accent ring-offset-2 ring-offset-surface' : 'border-line-strong bg-surface text-muted'
                }`}
              >
                {i + 1}
              </span>
              <span className={`hidden text-sm sm:block ${current ? 'font-medium text-fg' : 'text-muted'}`}>{s.title}</span>
            </li>
          )
        })}
      </ol>
      <p aria-hidden className="mt-3 text-sm text-muted sm:hidden">
        Part {step + 1} of {STEPS.length} · {STEPS[step].title}
      </p>
    </div>
  )
}

/** The part's legend: a large brass numeral, rolling with the direction of travel, and the title. */
function PartLegend({ step, direction }: { step: number; direction: number }) {
  const animated = useDecorativeMotion()
  return (
    <legend className="float-left flex w-full items-baseline gap-4">
      <span aria-hidden className="relative inline-block h-[1.1em] overflow-hidden font-serif text-[clamp(2.75rem,2.2rem+2vw,3.75rem)] leading-[1.1] tabular-nums text-brass">
        <motion.span
          key={step}
          className="block"
          initial={animated ? { y: direction > 0 ? '100%' : '-100%' } : false}
          animate={{ y: '0%' }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          {pad(step + 1)}
        </motion.span>
      </span>
      <span className="heading-3">{STEPS[step].title}</span>
    </legend>
  )
}

/* ── Error summary ───────────────────────────────────────────────────────── */

function ErrorSummary({ visible, fields, errors }: { visible: boolean; fields: Field[]; errors: Errors }) {
  const animated = useDecorativeMotion()
  const focusField = (e: MouseEvent<HTMLAnchorElement>, f: Field) => {
    e.preventDefault()
    document.getElementById(fieldId(f))?.focus()
  }
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key="summary"
          className="overflow-hidden"
          initial={animated ? { height: 0 } : false}
          animate={{ height: 'auto', transition: { duration: animated ? 0.3 : 0, ease: EASE_IN_OUT } }}
          exit={{ height: 0, transition: { duration: animated ? 0.2 : 0, ease: EASE_EXIT } }}
        >
          <div role="alert" aria-labelledby="error-summary-title" className="mt-6 border-y border-danger/60 py-4">
            <p id="error-summary-title" className="font-medium text-danger">
              Please check these fields
            </p>
            <ul className="mt-2">
              {fields.map((f) => (
                <li key={f}>
                  <a href={`#${fieldId(f)}`} onClick={(e) => focusField(e, f)} className="inline-flex min-h-11 items-center text-danger underline underline-offset-4">
                    {LABELS[f]}: {errors[f]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Rows: label column beside the field (stacked on phones) ─────────────── */

type ControlProps = {
  id: string
  name: string
  required?: boolean
  'aria-invalid'?: boolean
  'aria-describedby'?: string
  className: string
}

function Row({
  field,
  required,
  error,
  hint,
  index,
  children,
}: {
  field: Field
  required?: boolean
  error?: string
  hint?: string
  index: number
  children: (p: ControlProps) => ReactNode
}) {
  const id = fieldId(field)
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined
  return (
    <div className="group/row relative grid gap-2 py-5 md:grid-cols-[10rem_1fr] md:gap-6 lg:grid-cols-[12rem_1fr]">
      <DrawLine immediate delay={0.1 + index * 0.06} duration={0.6} className="absolute inset-x-0 top-0 bg-line transition-colors" />
      {/* The row's rule turns teal while its field has focus */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-accent transition-transform duration-300 group-focus-within/row:scale-x-100" />
      <div className="md:pt-3">
        <label htmlFor={id} className="flex items-baseline gap-1 text-[0.9375rem] font-medium text-fg transition-colors duration-200 group-focus-within/row:text-accent">
          {LABELS[field]}
          {required && (
            <span aria-hidden className="text-accent">
              *
            </span>
          )}
        </label>
        {hint && (
          <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
            {hint}
          </p>
        )}
      </div>
      <div className="min-w-0">
        {children({
          id,
          name: field,
          required,
          'aria-invalid': !!error,
          'aria-describedby': describedBy,
          className:
            'block min-h-12 w-full rounded-sm border border-line-strong bg-bg px-4 py-3 text-base text-fg transition-colors duration-200 placeholder:text-muted hover:border-fg/60 focus:border-accent focus:outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent aria-[invalid=true]:border-danger [&>option]:bg-surface [&>option]:text-fg',
        })}
        {error && (
          <p id={`${id}-err`} className="mt-2 text-sm text-danger">
            <span className="sr-only">Error: </span>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

function ConsentRow({ checked, error, onChange }: { checked: boolean; error?: string; onChange: (c: boolean) => void }) {
  const id = fieldId('consent')
  return (
    <div className="relative py-5">
      <DrawLine immediate delay={0.22} duration={0.6} className="absolute inset-x-0 top-0 bg-line" />
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 leading-relaxed text-fg/85">
        <input
          id={id}
          type="checkbox"
          name="consent"
          required
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]"
        />
        <span>
          I understand this is a request, not a confirmed appointment, and agree that the practice may contact me about it.
          <span aria-hidden className="ml-1 text-accent">
            *
          </span>
        </span>
      </label>
      {error && (
        <p id={`${id}-err`} className="mt-2 text-sm text-danger">
          <span className="sr-only">Error: </span>
          {error}
        </p>
      )}
    </div>
  )
}

/* ── Review (part 3): the details entered so far, each editable ──────────── */

function Review({ values, onEdit }: { values: Values; onEdit: (step: number, field: Field) => void }) {
  return (
    <div className="relative py-5">
      <DrawLine immediate delay={0.1} duration={0.6} className="absolute inset-x-0 top-0 bg-line" />
      <h3 className="text-[0.9375rem] font-medium text-fg">Your details</h3>
      <dl className="mt-3">
        {summaryRows(values).map((r) => (
          <div key={r.field} className="grid grid-cols-[1fr_auto] items-center gap-x-4 border-b border-line py-1 last:border-b-0 sm:grid-cols-[10rem_1fr_auto] lg:grid-cols-[12rem_1fr_auto]">
            <dt className="text-sm text-muted">{LABELS[r.field]}</dt>
            <dd className={`col-start-1 row-start-2 min-w-0 break-words sm:col-start-auto sm:row-start-auto ${r.value === NOT_SPECIFIED ? 'text-muted' : 'text-fg'}`}>
              {r.value}
            </dd>
            <dd className="col-start-2 row-span-2 row-start-1 sm:col-start-auto sm:row-span-1 sm:row-start-auto">
              <button
                type="button"
                onClick={() => onEdit(r.step, r.field)}
                className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-accent hover:text-accent-hover"
              >
                <span className="link-underline">Edit</span>
                <span className="sr-only"> {LABELS[r.field].toLowerCase()}</span>
              </button>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/* ── The request record: shown once the request is received ──────────────── */

function RequestRecord({ record, onReset }: { record: Values; onReset: () => void }) {
  const animated = useDecorativeMotion()
  const ref = useRef<HTMLDivElement>(null)
  // Focus the record once it is on screen (it mounts after the form has left).
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])
  const rows: { label: string; value: string }[] = [
    ...summaryRows(record).map((r) => ({ label: LABELS[r.field], value: r.value })),
    { label: 'Message included', value: record.message.trim() ? 'Yes' : 'No' },
  ]

  return (
    <div ref={ref} tabIndex={-1} role="status" aria-labelledby="record-title" className="p-5 outline-none sm:p-8 lg:p-10">
      <svg viewBox="0 0 52 52" className="h-14 w-14 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <motion.circle cx="26" cy="26" r="24" initial={animated ? { pathLength: 0 } : false} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease: EASE_IN_OUT }} />
        <motion.path
          d="M16 27l7 7 14-15"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animated ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, ease: EASE_IN_OUT, delay: 0.5 }}
        />
      </svg>
      <h2 id="record-title" className="heading-2 mt-8">
        Your request has been received.
      </h2>
      <p className="lead measure mt-4">The practice will contact you to arrange a time. Your appointment is not confirmed until you hear back.</p>

      <h3 className="mt-10 text-[0.9375rem] font-medium text-fg">Request record</h3>
      <dl className="mt-3">
        {rows.map((r, i) => (
          <div key={r.label} className="relative grid gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-6">
            <DrawLine immediate delay={0.7 + i * 0.06} duration={0.6} className="absolute inset-x-0 top-0 bg-line-strong" />
            <dt className="text-sm text-muted">{r.label}</dt>
            <dd className={`min-w-0 break-words ${r.value === NOT_SPECIFIED ? 'text-muted' : 'text-fg'}`}>{r.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10">
        <Button variant="secondary" onClick={onReset}>
          Send another request
        </Button>
      </div>
    </div>
  )
}
