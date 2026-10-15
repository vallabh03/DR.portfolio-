import { isSlot, type NotificationKind, type Status } from './booking.ts'
import type { BookingDb, StaffMember } from './db.ts'
import { bearerToken, clientIp, createRateLimiter, fail, rateLimited, readJson, reply, safeLogger, type Logger, type RateLimiter } from './http.ts'
import { dbFromEnv, deliverNotification, type ServerEnv } from './notify.ts'

/**
 * Staff actions, used by the staff dashboard (/staff):
 *   POST /api/appointments/status    confirm, reschedule or reject a booking
 *   POST /api/notifications/retry    send a failed WhatsApp notification again
 *
 * Every call carries the staff member's Supabase access token
 * (Authorization: Bearer …). The server checks it with Supabase and only
 * accepts accounts listed in the staff table. Patient messages are sent from
 * here, never from the browser.
 */

export type StaffOptions = {
  env: ServerEnv
  db?: BookingDb | null
  limiter?: RateLimiter
  fetch?: typeof fetch
  now?: () => number
  clientIp?: string
  log?: Logger
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ACTION_ID_RE = /^[A-Za-z0-9-]{8,64}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const realDate = (d: string) => DATE_RE.test(d) && isoDay(Date.parse(`${d}T00:00:00Z`)) === d

const ACTIONS = { confirm: 'confirmed', reschedule: 'rescheduled', reject: 'rejected' } as const satisfies Record<string, Exclude<Status, 'pending'>>
type Action = keyof typeof ACTIONS
const KIND: Record<Exclude<Status, 'pending'>, NotificationKind> = {
  confirmed: 'patient_confirmed',
  rescheduled: 'patient_rescheduled',
  rejected: 'patient_rejected',
}

const defaultLimiter = createRateLimiter(60, 10 * 60_000)

/** Runs the shared checks (method, origin, size, rate limit, database, staff sign-in) before an action. */
type StaffContext = { response: Response } | { body: Record<string, unknown> | null; db: BookingDb; staff: StaffMember }

async function staffRequest(request: Request, opts: StaffOptions, log: Logger): Promise<StaffContext> {
  const read = await readJson(request, opts.env.ALLOWED_ORIGINS)
  if ('response' in read) return { response: read.response }
  if (rateLimited(opts.limiter ?? defaultLimiter, `staff:${clientIp(request, opts.clientIp)}`, (opts.now ?? Date.now)())) {
    return { response: fail(429, 'rate_limited') }
  }
  const db = opts.db === undefined ? dbFromEnv(opts.env, opts.fetch ?? fetch) : opts.db
  if (!db) {
    log.error('staff: database is not configured')
    return { response: fail(503, 'unavailable') }
  }
  const token = bearerToken(request)
  const staff = token ? await db.staffForToken(token) : null
  if (!staff) {
    log.warn('staff: request without a valid staff sign-in')
    return { response: fail(401, 'unauthorized') }
  }
  return { body: read.body as Record<string, unknown> | null, db, staff }
}

const guard = (name: string, run: (log: Logger) => Promise<Response>) => async (opts: StaffOptions) => {
  const log = safeLogger(opts.log ?? console)
  try {
    return await run(log)
  } catch (err) {
    log.error(`${name}: unexpected error (${err instanceof Error ? err.name : typeof err})`)
    return fail(500, 'internal_error')
  }
}

/* ── Confirm, reschedule or reject ───────────────────────────────────────── */

export const handleStatusChange = (request: Request, opts: StaffOptions) =>
  guard('status', async (log) => {
    const ctx = await staffRequest(request, opts, log)
    if ('response' in ctx) return ctx.response
    const { body, db, staff } = ctx
    if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(422, 'invalid')

    const { appointmentId, action, version, actionId, date, slot } = body
    const now = (opts.now ?? Date.now)()
    if (
      typeof appointmentId !== 'string' ||
      !UUID_RE.test(appointmentId) ||
      typeof action !== 'string' ||
      !Object.hasOwn(ACTIONS, action) ||
      typeof version !== 'number' ||
      !Number.isInteger(version) ||
      version < 0 ||
      typeof actionId !== 'string' ||
      !ACTION_ID_RE.test(actionId)
    ) {
      return fail(422, 'invalid')
    }

    const appointment = await db.getAppointment(appointmentId)
    if (!appointment) return fail(404, 'not_found')

    const status = ACTIONS[action as Action]
    let when: { date: string | null; slot: string | null } = { date: null, slot: null }
    if (status === 'rescheduled') {
      // A new date and slot are required, from today onwards.
      if (typeof date !== 'string' || !realDate(date) || date < isoDay(now - 86_400_000) || !isSlot(slot)) return fail(422, 'invalid')
      when = { date, slot }
    } else if (status === 'confirmed') {
      // Confirmed for the requested time unless staff give another.
      const d = typeof date === 'string' && date ? date : appointment.requested_date
      const s = slot ?? appointment.requested_slot
      if (!realDate(d) || !isSlot(s)) return fail(422, 'invalid')
      when = { date: d, slot: s }
    }

    const result = await db.setStatus(appointmentId, version, actionId, status, when.date, isSlot(when.slot) ? when.slot : null, staff.userId)
    if (result.result === 'not_found') return fail(404, 'not_found')
    if (result.result === 'stale') {
      // Someone else changed it first; the dashboard reloads and the staff member decides again.
      return reply(409, { ok: false, error: 'stale', status: result.appointment.status, version: result.appointment.status_version })
    }

    const updated = result.appointment
    log.info(`status: booking ${result.result === 'updated' ? 'set' : 'already set'} to ${updated.status}`)

    // One patient message per status change; a repeat of the same action finds the same notification.
    const kind = KIND[status]
    const notification = await db.ensureNotification(updated.id, kind, `${updated.id}:${kind}:v${updated.status_version}`)
    const outcome = await deliverNotification(db, notification.id, updated, { env: opts.env, fetch: opts.fetch ?? fetch, log })

    return reply(200, { ok: true, status: updated.status, version: updated.status_version, notification: outcome })
  })(opts)

/* ── Retry a notification ────────────────────────────────────────────────── */

export const handleRetry = (request: Request, opts: StaffOptions) =>
  guard('retry', async (log) => {
    const ctx = await staffRequest(request, opts, log)
    if ('response' in ctx) return ctx.response
    const { body, db } = ctx
    const notificationId = body && typeof body === 'object' ? body.notificationId : undefined
    if (typeof notificationId !== 'string' || !UUID_RE.test(notificationId)) return fail(422, 'invalid')

    const notification = await db.getNotification(notificationId)
    if (!notification) return fail(404, 'not_found')
    const appointment = await db.getAppointment(notification.appointment_id)
    if (!appointment) return fail(404, 'not_found')

    const outcome = await deliverNotification(db, notification.id, appointment, { env: opts.env, fetch: opts.fetch ?? fetch, log })
    if (outcome === 'failed') return reply(502, { ok: false, error: 'delivery_failed', notification: outcome })
    return reply(200, { ok: true, notification: outcome })
  })(opts)
