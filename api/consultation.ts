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

export const TIME_LABELS: Record<string, string> = {
  morning: 'Morning',
  midday: 'Midday',
  afternoon: 'Afternoon',
  evening: 'Evening',
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export type Consultation = {
  name: string
  phone: string
  email: string
  /** YYYY-MM-DD or empty. */
  date: string
  /** A key of TIME_LABELS or empty. */
  time: string
  message: string
}

export type Env = Partial<
  Record<
    | 'WHATSAPP_ACCESS_TOKEN'
    | 'WHATSAPP_PHONE_NUMBER_ID'
    | 'WHATSAPP_RECIPIENT_NUMBER'
    | 'WHATSAPP_TEMPLATE_NAME'
    | 'WHATSAPP_TEMPLATE_LANGUAGE'
    | 'WHATSAPP_API_VERSION'
    | 'ALLOWED_ORIGINS',
    string | undefined
  >
>

type Logger = Pick<Console, 'info' | 'warn' | 'error'>

/** Per-instance memory for rate limiting and duplicate suppression. */
export type Store = {
  hits: Map<string, number[]>
  sent: Map<string, number>
  inFlight: Set<string>
}

export const createStore = (): Store => ({ hits: new Map(), sent: new Map(), inFlight: new Set() })

export type Options = {
  env: Env
  store?: Store
  fetch?: typeof fetch
  now?: () => number
  /** Used where the platform does not set x-real-ip / x-forwarded-for (local development). */
  clientIp?: string
  log?: Logger
}

const defaultStore = createStore()

/* ── Responses ───────────────────────────────────────────────────────────── */

const reply = (status: number, body: { ok: boolean; error?: string }, headers: Record<string, string> = {}) =>
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

type Parsed =
  | { kind: 'ok'; data: Consultation; requestId: string }
  | { kind: 'bot' }
  | { kind: 'invalid'; fields: string[] }

export function parseSubmission(body: unknown, now: number): Parsed {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { kind: 'invalid', fields: ['body'] }
  const b = body as Record<string, unknown>
  const str = (k: string) => (typeof b[k] === 'string' ? clean(b[k] as string) : '')

  // Spam signals: the hidden field is filled in, or the form was completed implausibly fast.
  if (str('website').trim() !== '') return { kind: 'bot' }
  if (typeof b.elapsedMs !== 'number' || !Number.isFinite(b.elapsedMs) || b.elapsedMs < MIN_FILL_MS) return { kind: 'bot' }

  const data: Consultation = {
    name: oneLine(str('name')),
    phone: oneLine(str('phone')),
    email: oneLine(str('email')),
    date: str('date').trim(),
    time: str('time').trim(),
    message: str('message').trim(),
  }
  const requestId = typeof b.requestId === 'string' ? b.requestId : ''

  const bad: string[] = []
  if (data.name.length < 2 || data.name.length > LIMITS.name) bad.push('name')
  if (!PHONE_RE.test(data.phone) || data.phone.replace(/\D/g, '').length < 7) bad.push('phone')
  if (data.email.length > LIMITS.email || !EMAIL_RE.test(data.email)) bad.push('email')
  if (data.date && !validDate(data.date, now)) bad.push('date')
  if (data.time && !(data.time in TIME_LABELS)) bad.push('time')
  if (data.message.length > LIMITS.message) bad.push('message')
  if (b.consent !== true) bad.push('consent')
  if (!REQUEST_ID_RE.test(requestId)) bad.push('requestId')

  return bad.length ? { kind: 'invalid', fields: bad } : { kind: 'ok', data, requestId }
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
  const fixed = { name: c.name, phone: c.phone, email: c.email }
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

type SendResult = { ok: true } | { ok: false; reason: string }

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

  if (res.ok && typeof data?.messages?.[0]?.id === 'string') return { ok: true }

  // Codes and trace id only: Meta's error text can echo submitted values.
  const e = data?.error
  log.error(
    `consultation: WhatsApp rejected the message (status ${res.status}, code ${String(e?.code ?? 'none')}, subcode ${String(e?.error_subcode ?? 'none')}, trace ${String(e?.fbtrace_id ?? 'none')})`,
  )
  return { ok: false, reason: 'rejected' }
}

/* ── Abuse controls (per instance) ───────────────────────────────────────── */

function rateLimited(store: Store, key: string, now: number) {
  const recent = (store.hits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  recent.push(now)
  store.hits.set(key, recent)
  return recent.length > RATE_LIMIT_MAX
}

function prune(store: Store, now: number) {
  for (const [k, times] of store.hits) if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) store.hits.delete(k)
  for (const [k, t] of store.sent) if (now - t >= DUPLICATE_WINDOW_MS) store.sent.delete(k)
  // Hard caps so memory cannot grow without bound under a flood.
  if (store.hits.size > 5000) store.hits.clear()
  if (store.sent.size > 5000) store.sent.clear()
}

async function fingerprint(c: Consultation) {
  const text = [c.phone.replace(/\D/g, ''), c.email.toLowerCase(), c.date, c.time, oneLine(c.message)].join('|')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return 'fp:' + Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
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
  const { env } = opts
  const store = opts.store ?? defaultStore
  const now = (opts.now ?? Date.now)()
  const log = opts.log ?? console

  if (request.method !== 'POST') return fail(405, 'method_not_allowed', { Allow: 'POST' })
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return fail(415, 'unsupported_media_type')
  if (!originAllowed(request, env)) return fail(403, 'forbidden')

  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_BODY_BYTES) return fail(413, 'too_large')
  const raw = await request.text()
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return fail(413, 'too_large')

  prune(store, now)
  if (rateLimited(store, `ip:${clientIp(request, opts.clientIp)}`, now)) {
    log.warn('consultation: rate limit reached')
    return fail(429, 'rate_limited', { 'Retry-After': String(RATE_LIMIT_WINDOW_MS / 1000) })
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return fail(400, 'bad_request')
  }

  const parsed = parseSubmission(body, now)
  if (parsed.kind === 'bot') {
    log.warn('consultation: rejected as automated')
    return fail(400, 'bad_request')
  }
  if (parsed.kind === 'invalid') {
    log.warn(`consultation: invalid fields (${parsed.fields.join(', ')})`)
    return fail(422, 'invalid')
  }

  const missing = REQUIRED.filter((k) => !env[k])
  if (missing.length) {
    log.error(`consultation: WhatsApp is not configured (missing ${missing.join(', ')})`)
    return fail(503, 'unavailable')
  }

  // A retry of a request that already went through, or the same details sent twice.
  const idKey = `id:${parsed.requestId}`
  const fpKey = await fingerprint(parsed.data)
  if (store.sent.has(idKey) || store.sent.has(fpKey)) {
    log.info('consultation: duplicate suppressed')
    return reply(200, { ok: true })
  }
  if (store.inFlight.has(idKey) || store.inFlight.has(fpKey)) return fail(409, 'in_progress')

  store.inFlight.add(idKey).add(fpKey)
  try {
    const result = await sendWhatsApp(parsed.data, env as Required<Pick<Env, RequiredKey>> & Env, opts.fetch ?? fetch, log)
    if (!result.ok) return fail(502, 'delivery_failed')
    store.sent.set(idKey, now).set(fpKey, now)
    log.info('consultation: WhatsApp notification accepted by Meta')
    return reply(200, { ok: true })
  } finally {
    store.inFlight.delete(idKey)
    store.inFlight.delete(fpKey)
  }
}

/** Vercel entry point. Other common methods get a 405 from the handler. */
export function POST(request: Request) {
  return handleConsultation(request, { env: process.env as Env })
}
export { POST as GET, POST as PUT, POST as PATCH, POST as DELETE }
