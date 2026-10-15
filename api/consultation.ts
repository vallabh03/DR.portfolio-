/**
 * POST /api/consultation  (Vercel Function, server-side only)
 *
 * Receives a booking from the website form, validates it again on the server,
 * saves it in the database as Pending, and then notifies the doctor on WhatsApp
 * through the Meta WhatsApp Cloud API (approved template).
 *
 * Order matters: the booking is saved first and the visitor gets a booking
 * reference even if WhatsApp is down. A failed notification stays in the
 * database as "failed" and is retried later (a retry of the same request, or
 * the daily retry job in api/cron/retry-notifications.ts) without ever sending
 * twice or creating a second booking.
 *
 * Secrets (Supabase service-role key, Meta token) come from server environment
 * variables only. Responses never include them, Meta's replies or internal
 * details, and logs never include the visitor's details.
 */

import { isOfferedType, isSlot, OFFERED_TYPES, type BookingInput } from './_lib/booking.ts'
import { MAX_DAYS_AHEAD } from '../src/data/booking.ts'
import { createRateLimiter, clientIp, fail, rateLimited, readJson, reply, safeLogger, sha256Hex, type Logger, type RateLimiter } from './_lib/http.ts'
import { dbFromEnv, deliverNotification, type ServerEnv } from './_lib/notify.ts'
import { DbError, type BookingDb, type CreateResult } from './_lib/db.ts'

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60_000
/** At most this many bookings per phone number per day (enforced in the database). */
const MAX_PER_PHONE_PER_DAY = 3
const MIN_FILL_MS = 2500
const LIMITS = { name: 100, email: 254, message: 1000 } as const

/** The only keys the form sends. Anything else is rejected. */
const ALLOWED_KEYS = new Set(['name', 'phone', 'email', 'date', 'slot', 'type', 'message', 'consent', 'requestId', 'elapsedMs', 'website'])
const TEXT_FIELDS = ['name', 'phone', 'email', 'date', 'slot', 'message'] as const

export type Env = ServerEnv

export type Options = {
  env: Env
  /** The database; defaults to Supabase from the environment. */
  db?: BookingDb | null
  limiter?: RateLimiter
  fetch?: typeof fetch
  now?: () => number
  /** Used where the platform does not set x-real-ip / x-forwarded-for (local development). */
  clientIp?: string
  log?: Logger
}

const defaultLimiter = createRateLimiter(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)
export const createLimiter = () => createRateLimiter(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)

/* ── Input handling ──────────────────────────────────────────────────────── */

// Control characters (except tab/newline) and bidirectional overrides.
const UNSAFE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/g
const clean = (s: string) => s.replace(/\r\n?/g, '\n').replace(UNSAFE_CHARS, '')
const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim()

/** "+91 98765 43210" -> "919876543210": a + then 8 to 15 digits, country code first. */
const PHONE_RE = /^\+[\d\s()-]{8,22}$/
export function normalisePhone(phone: string) {
  if (!PHONE_RE.test(phone)) return null
  const digits = phone.replace(/\D/g, '')
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const REQUEST_ID_RE = /^[A-Za-z0-9-]{8,64}$/
const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** A real calendar date from yesterday (UTC, as visitors' time zones differ) up to MAX_DAYS_AHEAD days ahead. */
function validDate(date: string, now: number) {
  const m = DATE_RE.exec(date)
  if (!m) return false
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (isoDay(t) !== date) return false
  return date >= isoDay(now - 86_400_000) && date <= isoDay(now + (MAX_DAYS_AHEAD + 1) * 86_400_000)
}

type Parsed = { kind: 'ok'; data: BookingInput; requestId: string } | { kind: 'bot' } | { kind: 'invalid'; fields: string[] }

export function parseSubmission(body: unknown, now: number): Parsed {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { kind: 'invalid', fields: ['body'] }
  const b = body as Record<string, unknown>

  // Spam signals: the hidden field is filled in (or is not text), or the form was completed implausibly fast.
  if (Object.hasOwn(b, 'website') && (typeof b.website !== 'string' || clean(b.website).trim() !== '')) return { kind: 'bot' }
  if (typeof b.elapsedMs !== 'number' || !Number.isFinite(b.elapsedMs) || b.elapsedMs < MIN_FILL_MS) return { kind: 'bot' }

  const bad: string[] = []
  if (Object.keys(b).some((k) => !ALLOWED_KEYS.has(k))) bad.push('body')
  for (const k of TEXT_FIELDS) if (typeof b[k] !== 'string') bad.push(k)
  if (b.type !== undefined && typeof b.type !== 'string') bad.push('type')
  if (bad.length) return { kind: 'invalid', fields: bad }

  const str = (k: (typeof TEXT_FIELDS)[number]) => clean(b[k] as string)
  const name = oneLine(str('name'))
  const phone = normalisePhone(oneLine(str('phone')))
  const email = oneLine(str('email'))
  const date = str('date').trim()
  const slot = str('slot').trim()
  // With one type on offer the form does not ask; it is that type.
  const type = b.type === undefined && OFFERED_TYPES.length === 1 ? OFFERED_TYPES[0] : b.type
  const message = str('message').trim()
  const requestId = typeof b.requestId === 'string' ? b.requestId : ''

  if (name.length < 2 || name.length > LIMITS.name) bad.push('name')
  if (!phone) bad.push('phone')
  if (email && (email.length > LIMITS.email || !EMAIL_RE.test(email))) bad.push('email')
  if (!validDate(date, now)) bad.push('date')
  if (!isSlot(slot)) bad.push('slot')
  if (!isOfferedType(type)) bad.push('type')
  if (message.length > LIMITS.message) bad.push('message')
  if (b.consent !== true) bad.push('consent')
  if (!REQUEST_ID_RE.test(requestId)) bad.push('requestId')
  if (bad.length || !phone || !isSlot(slot) || !isOfferedType(type)) return { kind: 'invalid', fields: bad }

  return { kind: 'ok', data: { name, phone, email, date, slot, type, message, consent: true }, requestId }
}

/** The same details always give the same fingerprint, whatever the request id. */
export const fingerprintOf = (d: BookingInput) =>
  sha256Hex([d.phone, d.name.toLowerCase(), d.email.toLowerCase(), d.date, d.slot, d.type, oneLine(d.message)].join('|'))

/* ── Handler ─────────────────────────────────────────────────────────────── */

export async function handleConsultation(request: Request, opts: Options): Promise<Response> {
  const log = safeLogger(opts.log ?? console)
  try {
    return await handle(request, opts, log)
  } catch (err) {
    // Unexpected failure: log the error's name only. Its message or stack could contain request content.
    log.error(`consultation: unexpected error (${err instanceof Error ? err.name : typeof err})`)
    return fail(500, 'internal_error')
  }
}

async function handle(request: Request, opts: Options, log: Logger): Promise<Response> {
  const { env } = opts
  const now = (opts.now ?? Date.now)()
  const fetchImpl = opts.fetch ?? fetch

  // Every request counts towards the limit, including malformed ones.
  if (rateLimited(opts.limiter ?? defaultLimiter, `ip:${clientIp(request, opts.clientIp)}`, now)) {
    log.warn('consultation: rate limit reached')
    return fail(429, 'rate_limited', { 'Retry-After': String(RATE_LIMIT_WINDOW_MS / 1000) })
  }

  const read = await readJson(request, env.ALLOWED_ORIGINS)
  if ('response' in read) return read.response

  const parsed = parseSubmission(read.body, now)
  if (parsed.kind === 'bot') {
    log.warn('consultation: rejected as automated')
    return fail(400, 'bad_request')
  }
  if (parsed.kind === 'invalid') {
    log.warn(`consultation: invalid fields (${parsed.fields.join(', ')})`)
    return fail(422, 'invalid')
  }

  const db = opts.db === undefined ? dbFromEnv(env, fetchImpl) : opts.db
  if (!db) {
    log.error('consultation: database is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
    return fail(503, 'unavailable')
  }

  // 1. Save the booking. Nothing is sent unless this succeeds.
  let created: CreateResult
  try {
    created = await db.createBooking(parsed.requestId, await fingerprintOf(parsed.data), parsed.data, MAX_PER_PHONE_PER_DAY)
  } catch (err) {
    // Only our own database errors carry a status code worth logging; anything else could hold request content.
    log.error(`consultation: booking could not be saved (${err instanceof DbError ? err.message : err instanceof Error ? err.name : 'unknown'})`)
    return fail(502, 'save_failed')
  }
  if (created.result === 'conflict') {
    log.warn('consultation: request id reused with different details')
    return fail(409, 'conflict')
  }
  if (created.result === 'limited') {
    log.warn('consultation: daily booking limit reached for a phone number')
    return fail(429, 'too_many_bookings')
  }

  const appointment = created.appointment
  log.info(`consultation: booking ${created.result === 'created' ? 'saved' : 'already saved (repeat)'}`)

  // 2. Notify the doctor, once. A repeat request only retries a notification that has not been sent.
  let notified = false
  try {
    const notification = await db.ensureNotification(appointment.id, 'doctor_new', `${appointment.id}:doctor_new`)
    const outcome = await deliverNotification(db, notification.id, appointment, { env, fetch: fetchImpl, log })
    notified = outcome === 'sent' || outcome === 'already_sent'
  } catch (err) {
    // The booking is saved; the daily retry job will try the notification again.
    log.error(`consultation: doctor notification error (${err instanceof Error ? err.name : 'unknown'})`)
  }

  log.info(`consultation: doctor notification ${notified ? 'sent' : 'not sent; saved for retry'}`)
  return reply(created.result === 'created' ? 201 : 200, { ok: true, bookingRef: appointment.booking_ref, status: 'pending' })
}

/** Vercel entry point. Other common methods get a 405 from the handler. */
export function POST(request: Request) {
  return handleConsultation(request, { env: process.env as Env })
}
export { POST as GET, POST as PUT, POST as PATCH, POST as DELETE }
