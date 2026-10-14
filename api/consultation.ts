/**
 * POST /api/consultation  (Vercel Function, server-side only)
 *
 * Receives a consultation request from the website form, validates it again on
 * the server, and sends one notification to the practice's WhatsApp number
 * through the Meta WhatsApp Cloud API, using an approved message template.
 *
 * Secrets are read from server environment variables only (see .env.example).
 * Nothing here is bundled into the browser. Responses never include Meta
 * responses, credentials or internal details, and logs never include the
 * visitor's details.
 *
 * Success means Meta accepted the message for delivery. Delivery receipts would
 * need a webhook, which is not part of this endpoint.
 */

const MAX_BODY_BYTES = 8 * 1024
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60_000
const DUPLICATE_WINDOW_MS = 10 * 60_000
const MIN_FILL_MS = 2500
const META_TIMEOUT_MS = 10_000
const DEFAULT_API_VERSION = 'v23.0'
/** Meta rejects template messages whose filled-in body is too long; this keeps the parameters well inside it. */
const TEMPLATE_PARAMS_BUDGET = 840

const LIMITS = { name: 100, phone: 20, email: 254, message: 1000 } as const

export const TIME_LABELS = {
  morning: 'Morning',
  midday: 'Midday',
  afternoon: 'Afternoon',
  evening: 'Evening',
} as const

type TimeKey = keyof typeof TIME_LABELS

/** Own keys only: inherited names such as "toString" or "__proto__" are never valid. */
const isTimeKey = (value: string): value is TimeKey => Object.hasOwn(TIME_LABELS, value)

/** The only keys the form sends. Anything else is rejected. */
const ALLOWED_KEYS = new Set(['name', 'phone', 'email', 'date', 'time', 'message', 'consent', 'requestId', 'elapsedMs', 'website'])
const TEXT_FIELDS = ['name', 'phone', 'email', 'date', 'time', 'message'] as const

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export type Consultation = {
  name: string
  phone: string
  email: string
  /** YYYY-MM-DD or empty. */
  date: string
  /** A key of TIME_LABELS or empty. */
  time: TimeKey | ''
  message: string
}

import { createSupabaseServerClient } from './lib/supabase.ts'

export type Env = Partial<
  Record<
    | 'WHATSAPP_ACCESS_TOKEN'
    | 'WHATSAPP_PHONE_NUMBER_ID'
    | 'WHATSAPP_RECIPIENT_NUMBER'
    | 'WHATSAPP_TEMPLATE_NAME'
    | 'WHATSAPP_TEMPLATE_LANGUAGE'
    | 'WHATSAPP_API_VERSION'
    | 'WHATSAPP_DEV_MOCK'
    | 'ALLOWED_ORIGINS'
    | 'SUPABASE_URL'
    | 'SUPABASE_SECRET_KEY',
    string | undefined
  >
>

type Logger = Pick<Console, 'info' | 'warn' | 'error'>

/**
 * Per-instance memory for rate limiting and duplicate suppression. It is lost
 * when the instance stops and is not shared between instances, so it is a
 * best-effort guard, not a durable one.
 *
 * Maps are kept in order of last activity (oldest first), so when a map is
 * full the least recently used entries are dropped first.
 */
export type Store = {
  /** Request times per client address. */
  hits: Map<string, number[]>
  /** Sent requests, by request id and by content fingerprint. */
  sent: Map<string, { at: number; fingerprint: string }>
  /** Request ids and fingerprints currently being sent. */
  inFlight: Set<string>
  /** Upper bound on entries in `hits` and in `sent`. */
  maxKeys: number
}

export const createStore = (maxKeys = 5000): Store => ({ hits: new Map(), sent: new Map(), inFlight: new Set(), maxKeys })

export type Options = {
  env: Env
  store?: Store
  fetch?: typeof fetch
  now?: () => number
  /** Used where the platform does not set x-real-ip / x-forwarded-for (local development). */
  clientIp?: string
  log?: Logger
  /** Test-only: inject a mock Supabase client. */
  supabaseClient?: {
    from(table: string): {
      insert(data: unknown): Promise<{ error: { code: string } | null; data: unknown }>
      select(columns: string): {
        eq(key: string, value: string): {
          single(): Promise<{ data: { notification_status: string; whatsapp_message_id: string | null } | null; error: null }>
        }
      }
      update(data: unknown): {
        eq(key: string, value: string): Promise<{ error: { code: string } | null }>
      }
      raw(sql: string): { raw: string }
    }
  }
}

const defaultStore = createStore()

/* ── Responses ───────────────────────────────────────────────────────────── */

const reply = (status: number, body: { ok: boolean; error?: string; [key: string]: unknown }, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  })

const fail = (status: number, error: string, headers?: Record<string, string>) => reply(status, { ok: false, error }, headers)

/* ── Input handling ──────────────────────────────────────────────────────── */

// Control characters (except tab/newline) and bidirectional overrides.
const UNSAFE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F‪-‮⁦-⁩]/g

const clean = (s: string) => s.replace(/\r\n?/g, '\n').replace(UNSAFE_CHARS, '')
const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim()

const PHONE_RE = /^[+()\d\s-]{7,20}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const REQUEST_ID_RE = /^[A-Za-z0-9-]{8,64}$/

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** A real calendar date, no earlier than yesterday in UTC (visitors' time zones differ). */
function validDate(date: string, now: number) {
  const m = DATE_RE.exec(date)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const t = Date.UTC(y, mo - 1, d)
  if (isoDay(t) !== date) return false
  return date >= isoDay(now - 86_400_000)
}

export type BotReason = 'honeypot_filled' | 'timing_too_fast' | 'timing_invalid'

export type Parsed =
  | { kind: 'ok'; data: Consultation; requestId: string }
  | { kind: 'bot'; reason: BotReason; elapsedMs?: number; minFillMs?: number }
  | { kind: 'invalid'; fields: string[] }

export function parseSubmission(body: unknown, now: number, minFillMs = MIN_FILL_MS): Parsed {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { kind: 'invalid', fields: ['body'] }
  const b = body as Record<string, unknown>

  // Spam signals: the hidden field is filled in (or is not text), or the form was completed implausibly fast.
  if (Object.hasOwn(b, 'website') && (typeof b.website !== 'string' || clean(b.website).trim() !== '')) {
    return { kind: 'bot', reason: 'honeypot_filled' }
  }
  if (typeof b.elapsedMs !== 'number' || !Number.isFinite(b.elapsedMs) || b.elapsedMs < 0) {
    return { kind: 'bot', reason: 'timing_invalid' }
  }
  if (b.elapsedMs < minFillMs) {
    return { kind: 'bot', reason: 'timing_too_fast', elapsedMs: b.elapsedMs, minFillMs }
  }

  const bad: string[] = []
  // Only the keys the form sends, and every text field must actually be text ('' when left empty).
  if (Object.keys(b).some((k) => !ALLOWED_KEYS.has(k))) bad.push('body')
  for (const k of TEXT_FIELDS) if (typeof b[k] !== 'string') bad.push(k)
  if (bad.length) return { kind: 'invalid', fields: bad }

  const str = (k: (typeof TEXT_FIELDS)[number]) => clean(b[k] as string)
  const name = oneLine(str('name'))
  const phone = oneLine(str('phone'))
  const email = oneLine(str('email'))
  const date = str('date').trim()
  const time = str('time').trim()
  const message = str('message').trim()
  const requestId = typeof b.requestId === 'string' ? b.requestId : ''

  if (name.length < 2 || name.length > LIMITS.name) bad.push('name')
  if (phone.length > LIMITS.phone || !PHONE_RE.test(phone) || phone.replace(/\D/g, '').length < 7) bad.push('phone')
  // Email is optional; when given it must look like an address.
  if (email && (email.length > LIMITS.email || !EMAIL_RE.test(email))) bad.push('email')
  if (date && !validDate(date, now)) bad.push('date')
  if (time && !isTimeKey(time)) bad.push('time')
  if (message.length > LIMITS.message) bad.push('message')
  if (b.consent !== true) bad.push('consent')
  if (!REQUEST_ID_RE.test(requestId)) bad.push('requestId')
  if (bad.length) return { kind: 'invalid', fields: bad }

  return { kind: 'ok', data: { name, phone, email, date, time: time as TimeKey | '', message }, requestId }
}

/* ── The WhatsApp message ────────────────────────────────────────────────── */

export const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/**
 * The template parameters. Only fields the visitor entered are included: the
 * optional ones are combined into one "details" line (template parameters
 * cannot contain line breaks and cannot be empty; consent is always present).
 */
export function templateParameters(c: Consultation) {
  const fixed = { name: c.name, phone: c.phone, email: c.email || 'Not provided' }
  const parts: string[] = []
  if (c.date) parts.push(`Preferred Date: ${formatDate(c.date)}`)
  if (c.time) parts.push(`Preferred Time: ${TIME_LABELS[c.time]}`)
  const consent = 'Consent: Yes'

  if (c.message) {
    const used = Object.values(fixed).join('').length + [...parts, consent].join(' · ').length + ' · Reason: '.length
    const room = Math.max(120, TEMPLATE_PARAMS_BUDGET - used)
    const flat = oneLine(c.message)
    parts.push(`Reason: ${flat.length > room ? `${flat.slice(0, room - 14).trimEnd()}… (shortened)` : flat}`)
  }
  parts.push(consent)
  return { ...fixed, details: parts.join(' · ') }
}

type SendResult = { ok: true; messageId: string } | { ok: false; reason: string }

async function sendWhatsApp(c: Consultation, env: Required<Pick<Env, RequiredKey>> & Env, fetchImpl: typeof fetch, log: Logger): Promise<SendResult> {
  const version = env.WHATSAPP_API_VERSION && /^v\d+\.\d+$/.test(env.WHATSAPP_API_VERSION) ? env.WHATSAPP_API_VERSION : DEFAULT_API_VERSION
  const url = `https://graph.facebook.com/${version}/${encodeURIComponent(env.WHATSAPP_PHONE_NUMBER_ID)}/messages`
  const params = templateParameters(c)

  let res: Response
  try {
    res = await fetchImpl(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: env.WHATSAPP_RECIPIENT_NUMBER.replace(/\D/g, ''),
        type: 'template',
        template: {
          name: env.WHATSAPP_TEMPLATE_NAME,
          language: { code: env.WHATSAPP_TEMPLATE_LANGUAGE || 'en' },
          components: [
            {
              type: 'body',
              parameters: Object.entries(params).map(([parameter_name, text]) => ({ type: 'text', parameter_name, text })),
            },
          ],
        },
      }),
      signal: AbortSignal.timeout(META_TIMEOUT_MS),
    })
  } catch (err) {
    const timeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
    log.error(`consultation: WhatsApp request ${timeout ? 'timed out' : 'could not connect'}`)
    return { ok: false, reason: timeout ? 'timeout' : 'network' }
  }

  const data = (await res.json().catch(() => null)) as {
    messages?: { id?: unknown }[]
    error?: { code?: unknown; error_subcode?: unknown; fbtrace_id?: unknown }
  } | null

  if (res.ok && typeof data?.messages?.[0]?.id === 'string') {
    return { ok: true, messageId: data.messages[0].id }
  }

  // Codes and trace id only: Meta's error text can echo submitted values.
  const e = data?.error
  log.error(
    `consultation: WhatsApp rejected the message (status ${res.status}, code ${String(e?.code ?? 'none')}, subcode ${String(e?.error_subcode ?? 'none')}, trace ${String(e?.fbtrace_id ?? 'none')})`,
  )
  return { ok: false, reason: 'rejected' }
}

/* ── Abuse controls (per instance) ───────────────────────────────────────── */

/** Drops the least recently used entries (the front of the map) until it fits. */
function trimOldest(map: Map<string, unknown>, max: number) {
  for (const key of map.keys()) {
    if (map.size <= max) break
    map.delete(key)
  }
}

function rateLimited(store: Store, key: string, now: number, max = RATE_LIMIT_MAX) {
  const recent = (store.hits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  recent.push(now)
  // Re-insert so the map stays ordered by last activity.
  store.hits.delete(key)
  store.hits.set(key, recent)
  trimOldest(store.hits, store.maxKeys)
  return recent.length > max
}

/** Removes expired entries. The size cap is applied after this, so expired entries always go first. */
function pruneExpired(store: Store, now: number) {
  for (const [k, times] of store.hits) if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) store.hits.delete(k)
  for (const [k, v] of store.sent) if (now - v.at >= DUPLICATE_WINDOW_MS) store.sent.delete(k)
}

function recordSent(store: Store, keys: string[], fingerprint: string, now: number) {
  for (const k of keys) {
    store.sent.delete(k)
    store.sent.set(k, { at: now, fingerprint })
  }
  trimOldest(store.sent, store.maxKeys)
}

async function contentFingerprint(c: Consultation) {
  const text = [c.phone.replace(/\D/g, ''), c.email.toLowerCase(), c.date, c.time, oneLine(c.message)].join('|')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function clientIp(request: Request, fallback?: string) {
  return request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || fallback || 'unknown'
}

/** Same-origin only: ALLOWED_ORIGINS when set, otherwise the host the request was sent to. */
function originAllowed(request: Request, env: Env) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  const allowed = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean)
  if (allowed.length) return allowed.includes(origin)
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  try {
    return !!host && new URL(origin).host === host
  } catch {
    return false
  }
}

const REQUIRED = ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_RECIPIENT_NUMBER', 'WHATSAPP_TEMPLATE_NAME'] as const
type RequiredKey = (typeof REQUIRED)[number]

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

/** Logging can never turn a handled request into a failure. */
function safeLogger(log: Logger): Logger {
  const wrap = (fn: (message: string) => void) => (message: string) => {
    try {
      fn.call(log, message)
    } catch {
      /* a broken logger must not affect the response */
    }
  }
  return { info: wrap(log.info), warn: wrap(log.warn), error: wrap(log.error) }
}

async function handle(request: Request, opts: Options, log: Logger): Promise<Response> {
  const { env } = opts
  const store = opts.store ?? defaultStore
  const now = (opts.now ?? Date.now)()

  if (request.method !== 'POST') return fail(405, 'method_not_allowed', { Allow: 'POST' })
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return fail(415, 'unsupported_media_type')
  if (!originAllowed(request, env)) return fail(403, 'forbidden')

  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_BODY_BYTES) return fail(413, 'too_large')
  const raw = await request.text()
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return fail(413, 'too_large')

  const isDev = Boolean(env.WHATSAPP_DEV_MOCK)
  const rateLimitMax = isDev ? 100 : RATE_LIMIT_MAX

  pruneExpired(store, now)
  if (rateLimited(store, `ip:${clientIp(request, opts.clientIp)}`, now, rateLimitMax)) {
    log.warn('consultation: rate limit reached')
    return fail(429, 'rate_limited', { 'Retry-After': String(RATE_LIMIT_WINDOW_MS / 1000) })
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return isDev
      ? reply(400, { ok: false, error: 'bad_request', reason: 'malformed_json' })
      : fail(400, 'bad_request')
  }

  // In development mock mode, permit fast submissions (elapsedMs >= 0).
  // Production strictly enforces MIN_FILL_MS (2500ms).
  const minFillMs = isDev ? 0 : MIN_FILL_MS
  const parsed = parseSubmission(body, now, minFillMs)
  if (parsed.kind === 'bot') {
    if (parsed.reason === 'timing_too_fast') {
      log.warn(`consultation: rejected as automated (timing: ${parsed.elapsedMs}ms < ${parsed.minFillMs}ms)`)
    } else if (parsed.reason === 'timing_invalid') {
      log.warn('consultation: rejected as automated (timing: invalid elapsedMs)')
    } else {
      log.warn('consultation: rejected as automated (honeypot field filled)')
    }
    return isDev
      ? reply(400, {
          ok: false,
          error: 'bad_request',
          ...(parsed.reason === 'timing_too_fast'
            ? { reason: parsed.reason, elapsedMs: parsed.elapsedMs, minFillMs: parsed.minFillMs }
            : { reason: parsed.reason }),
        })
      : fail(400, 'bad_request')
  }
  if (parsed.kind === 'invalid') {
    log.warn(`consultation: invalid fields (${parsed.fields.join(', ')})`)
    return isDev
      ? reply(422, { ok: false, error: 'invalid', fields: parsed.fields })
      : fail(422, 'invalid')
  }

  // Check Supabase credentials
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    log.error('consultation: Supabase is not configured (missing SUPABASE_URL or SUPABASE_SECRET_KEY)')
    return isDev
      ? reply(503, { ok: false, error: 'unavailable', reason: 'missing_supabase_config' })
      : fail(503, 'unavailable')
  }

  const missing = REQUIRED.filter((k) => !env[k])
  if (missing.length) {
    log.error(`consultation: WhatsApp is not configured (missing ${missing.join(', ')})`)
    return isDev
      ? reply(503, { ok: false, error: 'unavailable', reason: 'missing_whatsapp_config' })
      : fail(503, 'unavailable')
  }

  // Use injected Supabase client for testing, otherwise create real one
  const supabase = opts.supabaseClient ?? (() => {
    if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
      log.error('consultation: Supabase is not configured (missing SUPABASE_URL or SUPABASE_SECRET_KEY)')
      throw new Error('unavailable')
    }
    return createSupabaseServerClient(env)
  })()

  // Persist appointment to Supabase with idempotency via request_id unique constraint
  const { name, phone, email, date, time, message } = parsed.data
  const { error: insertError } = await supabase.from('appointments').insert({
    request_id: parsed.requestId,
    name,
    phone,
    email: email || null,
    preferred_date: date || null,
    preferred_time: time || null,
    message: message || null,
    consent: true,
    notification_status: 'pending',
  })

  if (insertError) {
    if (insertError.code === '23505') { // unique_violation on request_id
      log.info('consultation: duplicate request id, checking existing record')
      const { data: existing } = await supabase
        .from('appointments')
        .select('notification_status, whatsapp_message_id')
        .eq('request_id', parsed.requestId)
        .single()

      if (existing?.notification_status === 'sent' && existing?.whatsapp_message_id) {
        log.info('consultation: duplicate suppressed (already sent)')
        return reply(200, { ok: true })
      }
      // If pending/failed, continue to retry WhatsApp
    } else {
      log.error(`consultation: database error (${insertError.code})`)
      return fail(503, 'unavailable')
    }
  }

  const idKey = `id:${parsed.requestId}`
  const fingerprint = await contentFingerprint(parsed.data)
  const fpKey = `fp:${fingerprint}`

  // No await between these checks and claiming the keys, so two concurrent requests cannot both pass.
  const previous = store.sent.get(idKey)
  if (previous && previous.fingerprint !== fingerprint) {
    log.warn('consultation: request id reused with different details')
    return fail(409, 'conflict')
  }
  if (previous || store.sent.has(fpKey)) {
    log.info('consultation: duplicate suppressed')
    return reply(200, { ok: true })
  }
  if (store.inFlight.has(idKey) || store.inFlight.has(fpKey)) return fail(409, 'in_progress')

  store.inFlight.add(idKey).add(fpKey)
  let result: SendResult
  try {
    result = await sendWhatsApp(parsed.data, env as Required<Pick<Env, RequiredKey>> & Env, opts.fetch ?? fetch, log)

    // Update notification status in database
    if (result.ok) {
      try {
        const { error: updateError } = await supabase
          .from('appointments')
          .update({
            notification_status: 'sent',
            notification_sent_at: new Date().toISOString(),
            whatsapp_message_id: result.messageId,
          })
          .eq('request_id', parsed.requestId)

        if (updateError) {
          log.error(`consultation: failed to update notification status (${updateError.code})`)
        }
      } catch (err) {
        log.error(`consultation: exception updating notification status (${err instanceof Error ? err.name : typeof err})`)
      }
    } else {
      try {
        const { error: updateError } = await supabase
          .from('appointments')
          .update({
            notification_status: 'failed',
            notification_error: result.reason,
            last_notification_attempt: new Date().toISOString(),
          })
          .eq('request_id', parsed.requestId)

        if (updateError) {
          log.error(`consultation: failed to update notification failure (${updateError.code})`)
        }
      } catch (err) {
        log.error(`consultation: exception updating notification failure (${err instanceof Error ? err.name : typeof err})`)
      }
    }
  } finally {
    store.inFlight.delete(idKey)
    store.inFlight.delete(fpKey)
  }

  if (!result.ok) return fail(502, 'delivery_failed')
  recordSent(store, [idKey, fpKey], fingerprint, now)
  log.info('consultation: WhatsApp notification accepted by Meta')
  return reply(200, { ok: true })
}

/** Vercel entry point. Other common methods get a 405 from the handler. */
export function POST(request: Request) {
  return handleConsultation(request, { env: process.env as Env })
}
export { POST as GET, POST as PUT, POST as PATCH, POST as DELETE }
