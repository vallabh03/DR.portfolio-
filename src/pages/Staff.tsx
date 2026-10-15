import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { SLOT_LABELS, TYPE_LABELS, type ConsultationType, type Slot } from '../data/booking'
import Button from '../components/Button'

/**
 * Staff dashboard (/staff): not linked from the site and kept out of search.
 * Staff sign in with their own Supabase account; only accounts on the staff
 * list can see bookings (Row Level Security). Bookings are read directly from
 * Supabase; confirming, rescheduling, rejecting and retrying a WhatsApp message
 * go through the site's server functions, which check the staff sign-in again
 * and send the patient's message.
 */

type Status = 'pending' | 'confirmed' | 'rescheduled' | 'rejected'

type Notification = {
  id: string
  kind: 'doctor_new' | 'patient_confirmed' | 'patient_rescheduled' | 'patient_rejected'
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'skipped'
  attempts: number
  last_error: string | null
  delivery_status: string | null
  created_at: string
}

type Appointment = {
  id: string
  booking_ref: string
  patient_name: string
  patient_phone: string
  patient_email: string | null
  requested_date: string
  requested_slot: Slot
  consultation_type: ConsultationType
  message: string | null
  status: Status
  scheduled_date: string | null
  scheduled_slot: Slot | null
  status_version: number
  created_at: string
  notifications: Notification[]
}

const STATUS_LABEL: Record<Status, string> = { pending: 'Pending', confirmed: 'Confirmed', rescheduled: 'Rescheduled', rejected: 'Rejected' }
const STATUS_STYLE: Record<Status, string> = {
  pending: 'bg-[#fff4d6] text-[#7a5600] dark:bg-[#3b2f10] dark:text-[#f3d27a]',
  confirmed: 'bg-[#dcf3e4] text-[#1d6b3a] dark:bg-[#123824] dark:text-[#8fe0aa]',
  rescheduled: 'bg-accent-soft text-accent',
  rejected: 'bg-[#f9dedb] text-danger dark:bg-[#3a1a17]',
}
const KIND_LABEL: Record<Notification['kind'], string> = {
  doctor_new: 'Doctor notified',
  patient_confirmed: 'Patient: confirmation',
  patient_rescheduled: 'Patient: new time',
  patient_rejected: 'Patient: declined',
}
const FILTERS: (Status | 'all')[] = ['pending', 'confirmed', 'rescheduled', 'rejected', 'all']

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const day = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}
const when = (date: string, slot: Slot) => `${day(date)}, ${SLOT_LABELS[slot]}`
const newActionId = () => crypto.randomUUID()

export default function Staff() {
  if (!supabase) {
    return (
      <Shell>
        <p className="lead measure mt-6">Staff sign-in is not set up yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see docs/BOOKINGS.md) and redeploy.</p>
      </Shell>
    )
  }
  return <StaffApp />
}

function Shell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section aria-labelledby="staff-title" className="container-page pb-20 pt-10 md:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Staff</p>
          <h1 id="staff-title" className="heading-2 mt-2">
            Consultation bookings
          </h1>
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function StaffApp() {
  const sb = supabase!
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = sb.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [sb])

  if (!ready) return <Shell>{null}</Shell>
  if (!session) return <SignIn />
  return <Dashboard session={session} />
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setError('Sign-in failed. Check the email and password.')
  }

  const field = 'mt-2 block min-h-12 w-full rounded-sm border border-line-strong bg-bg px-4 py-3 text-base text-fg focus:border-accent focus:outline-none'
  return (
    <Shell>
      <form onSubmit={submit} className="mt-8 max-w-md rounded-2xl border border-line bg-surface p-6 sm:p-8" aria-labelledby="signin-title">
        <h2 id="signin-title" className="heading-3">
          Sign in
        </h2>
        <label className="mt-6 block text-sm font-medium">
          Email
          <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
        </label>
        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy} className="mt-6 w-full">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </Shell>
  )
}

function Dashboard({ session }: { session: Session }) {
  const sb = supabase!
  const [staffName, setStaffName] = useState<string | null | undefined>(undefined)
  const [rows, setRows] = useState<Appointment[]>([])
  const [filter, setFilter] = useState<Status | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const me = await sb.from('staff').select('name').eq('user_id', session.user.id).maybeSingle()
    setStaffName(me.data?.name ?? null)
    if (!me.data) {
      setLoading(false)
      return
    }
    let q = sb
      .from('appointments')
      .select(
        'id, booking_ref, patient_name, patient_phone, patient_email, requested_date, requested_slot, consultation_type, message, status, scheduled_date, scheduled_slot, status_version, created_at, notifications(id, kind, status, attempts, last_error, delivery_status, created_at)',
      )
      .order('created_at', { ascending: false })
      .limit(200)
    if (filter !== 'all') q = q.eq('status', filter)
    const { data, error } = await q
    setLoading(false)
    if (error) setNotice({ kind: 'error', text: 'Bookings could not be loaded. Please refresh.' })
    else setRows((data ?? []) as Appointment[])
  }, [sb, session.user.id, filter])

  useEffect(() => {
    load()
    const t = window.setInterval(load, 60_000)
    return () => window.clearInterval(t)
  }, [load])

  /** Calls a staff server function with this staff member's sign-in. */
  const call = async (path: string, body: Record<string, unknown>) => {
    const { data } = await sb.auth.getSession()
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token ?? ''}` },
      body: JSON.stringify(body),
    })
    return { status: res.status, json: ((await res.json().catch(() => null)) ?? {}) as { ok?: boolean; error?: string; notification?: string } }
  }

  const act = async (a: Appointment, action: 'confirm' | 'reschedule' | 'reject', extra: { date?: string; slot?: Slot } = {}) => {
    setNotice(null)
    const { status, json } = await call('/api/appointments/status', { appointmentId: a.id, action, version: a.status_version, actionId: newActionId(), ...extra })
    if (status === 409) setNotice({ kind: 'error', text: `${a.booking_ref} was changed by someone else. The list has been refreshed; please check it and try again.` })
    else if (!json.ok) setNotice({ kind: 'error', text: `${a.booking_ref} could not be updated (${json.error ?? status}).` })
    else
      setNotice({
        kind: json.notification === 'failed' ? 'error' : 'ok',
        text:
          json.notification === 'failed'
            ? `${a.booking_ref} updated, but the patient's WhatsApp message failed. Use Retry below.`
            : `${a.booking_ref} updated and the patient was messaged.`,
      })
    await load()
  }

  const retry = async (a: Appointment, n: Notification) => {
    setNotice(null)
    const { json } = await call('/api/notifications/retry', { notificationId: n.id })
    setNotice(json.ok ? { kind: 'ok', text: `${a.booking_ref}: message sent.` } : { kind: 'error', text: `${a.booking_ref}: the message failed again (${json.error ?? 'error'}).` })
    await load()
  }

  const signOut = () => sb.auth.signOut()
  const right = (
    <div className="flex items-center gap-3 text-sm">
      {staffName && <span className="text-muted">Signed in as {staffName}</span>}
      <Button variant="secondary" onClick={signOut}>
        Sign out
      </Button>
    </div>
  )

  if (staffName === null) {
    return (
      <Shell right={right}>
        <p className="lead measure mt-6">This account is not on the staff list. Ask the practice to add it (docs/BOOKINGS.md).</p>
      </Shell>
    )
  }

  return (
    <Shell right={right}>
      <div className="mt-8 flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold transition-colors ${filter === f ? 'bg-accent text-on-accent' : 'border border-line text-fg hover:border-accent'}`}
          >
            {f === 'all' ? 'All' : STATUS_LABEL[f]}
          </button>
        ))}
        <button type="button" onClick={load} className="ml-auto min-h-11 px-3 text-sm font-medium text-accent hover:text-accent-hover">
          Refresh
        </button>
      </div>

      {notice && (
        <p role={notice.kind === 'error' ? 'alert' : 'status'} className={`mt-6 rounded-xl border px-4 py-3 text-sm ${notice.kind === 'error' ? 'border-danger/50 text-danger' : 'border-accent/40 text-accent'}`}>
          {notice.text}
        </p>
      )}

      <div className="mt-6 space-y-4" aria-busy={loading}>
        {!loading && rows.length === 0 && <p className="rounded-2xl border border-line bg-surface p-8 text-center text-muted">No bookings here.</p>}
        {rows.map((a) => (
          <BookingCard key={a.id} a={a} onAct={act} onRetry={retry} />
        ))}
      </div>
    </Shell>
  )
}

function BookingCard({
  a,
  onAct,
  onRetry,
}: {
  a: Appointment
  onAct: (a: Appointment, action: 'confirm' | 'reschedule' | 'reject', extra?: { date?: string; slot?: Slot }) => Promise<void>
  onRetry: (a: Appointment, n: Notification) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [date, setDate] = useState(a.requested_date)
  const [slot, setSlot] = useState<Slot>(a.requested_slot)
  const notifications = useMemo(() => [...(a.notifications ?? [])].sort((x, y) => x.created_at.localeCompare(y.created_at)), [a.notifications])

  const run = async (fn: () => Promise<void>) => {
    if (busy) return
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
      setRescheduling(false)
    }
  }
  const phone = `+${a.patient_phone}`

  return (
    <article className="rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-labelledby={`b-${a.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold tracking-[0.06em] text-accent">{a.booking_ref}</p>
          <h2 id={`b-${a.id}`} className="mt-1 text-lg font-semibold">
            {a.patient_name}
          </h2>
          <p className="mt-1 text-sm">
            <a href={`tel:${phone}`} className="text-accent hover:text-accent-hover">
              {phone}
            </a>
            {a.patient_email && <span className="text-muted"> · {a.patient_email}</span>}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLE[a.status]}`}>{STATUS_LABEL[a.status]}</span>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-muted">Requested</dt>
          <dd>{when(a.requested_date, a.requested_slot)}</dd>
        </div>
        {a.scheduled_date && a.scheduled_slot && (
          <div>
            <dt className="text-muted">Scheduled</dt>
            <dd>{when(a.scheduled_date, a.scheduled_slot)}</dd>
          </div>
        )}
        <div>
          <dt className="text-muted">Type</dt>
          <dd>{TYPE_LABELS[a.consultation_type]}</dd>
        </div>
        <div>
          <dt className="text-muted">Received</dt>
          <dd>{new Date(a.created_at).toLocaleString()}</dd>
        </div>
      </dl>
      {a.message && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-bg p-4 text-sm leading-relaxed">{a.message}</p>}

      {notifications.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          {notifications.map((n) => (
            <li key={n.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-muted">{KIND_LABEL[n.kind]}:</span>
              <span className={n.status === 'failed' ? 'font-semibold text-danger' : n.status === 'sent' ? 'font-semibold text-accent' : ''}>
                {n.status === 'sent' ? `Sent${n.delivery_status && n.delivery_status !== 'sent' ? ` (${n.delivery_status})` : ''}` : n.status}
              </span>
              {n.status === 'failed' && (
                <>
                  <span className="text-muted">
                    {n.attempts} attempt{n.attempts === 1 ? '' : 's'}
                    {n.last_error ? ` · ${n.last_error}` : ''}
                  </span>
                  <button type="button" disabled={busy} onClick={() => run(() => onRetry(a, n))} className="min-h-11 font-semibold text-accent hover:text-accent-hover disabled:opacity-50">
                    Retry
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {a.status !== 'rejected' && (
        <div className="mt-5 border-t border-line pt-4">
          {rescheduling ? (
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                run(() => onAct(a, 'reschedule', { date, slot }))
              }}
            >
              <label className="text-sm">
                New date
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block min-h-11 rounded-sm border border-line-strong bg-bg px-3" />
              </label>
              <label className="text-sm">
                Slot
                <select value={slot} onChange={(e) => setSlot(e.target.value as Slot)} className="mt-1 block min-h-11 rounded-sm border border-line-strong bg-bg px-3">
                  {Object.entries(SLOT_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
              <Button type="submit" disabled={busy}>
                Reschedule and notify
              </Button>
              <Button variant="secondary" onClick={() => setRescheduling(false)}>
                Cancel
              </Button>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              {a.status !== 'confirmed' && (
                <Button disabled={busy} onClick={() => run(() => onAct(a, 'confirm'))}>
                  Confirm
                </Button>
              )}
              <Button variant="secondary" disabled={busy} onClick={() => setRescheduling(true)}>
                Reschedule
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Reject ${a.booking_ref}? The patient will be told on WhatsApp.`)) run(() => onAct(a, 'reject'))
                }}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
