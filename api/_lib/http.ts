import { timingSafeEqual } from 'node:crypto'

/**
 * Small helpers shared by the server functions in api/. Files in api/_lib are
 * not turned into endpoints (Vercel skips paths that start with an underscore).
 */

export type Logger = Pick<Console, 'info' | 'warn' | 'error'>

export const MAX_BODY_BYTES = 8 * 1024

export const reply = (status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  })

export const fail = (status: number, error: string, headers?: Record<string, string>) => reply(status, { ok: false, error }, headers)

/** Logging can never turn a handled request into a failure. */
export function safeLogger(log: Logger): Logger {
  const wrap = (fn: (message: string) => void) => (message: string) => {
    try {
      fn.call(log, message)
    } catch {
      /* a broken logger must not affect the response */
    }
  }
  return { info: wrap(log.info), warn: wrap(log.warn), error: wrap(log.error) }
}

export function clientIp(request: Request, fallback?: string) {
  return request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || fallback || 'unknown'
}

/** Same-origin only: ALLOWED_ORIGINS when set, otherwise the host the request was sent to. */
export function originAllowed(request: Request, allowedOrigins?: string) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  const allowed = (allowedOrigins ?? '')
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

/**
 * The checks every JSON endpoint applies before reading the body: POST only,
 * JSON only, same-site, and at most MAX_BODY_BYTES. Returns the parsed body, or
 * the response to send instead.
 */
export async function readJson(request: Request, allowedOrigins?: string): Promise<{ body: unknown } | { response: Response }> {
  if (request.method !== 'POST') return { response: fail(405, 'method_not_allowed', { Allow: 'POST' }) }
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return { response: fail(415, 'unsupported_media_type') }
  if (!originAllowed(request, allowedOrigins)) return { response: fail(403, 'forbidden') }
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return { response: fail(413, 'too_large') }
  const raw = await request.text()
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return { response: fail(413, 'too_large') }
  try {
    return { body: JSON.parse(raw) }
  } catch {
    return { response: fail(400, 'bad_request') }
  }
}

/** True when the request carries "Authorization: Bearer <secret>" (scheduled jobs and the Supabase webhook). Constant-time comparison. */
export function cronAuthorised(request: Request, secret: string) {
  const expected = Buffer.from(`Bearer ${secret}`)
  const given = Buffer.from(request.headers.get('authorization') ?? '')
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/** The bearer token from an Authorization header, if any. */
export const bearerToken = (request: Request) => /^Bearer\s+(\S+)$/i.exec(request.headers.get('authorization') ?? '')?.[1]

export async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Per-instance request counter for rate limiting. It is lost when the instance
 * stops and is not shared between instances, so it is a first line of defence;
 * the database also limits bookings per phone number.
 */
export type RateLimiter = { hits: Map<string, number[]>; max: number; windowMs: number; maxKeys: number }

export const createRateLimiter = (max: number, windowMs: number, maxKeys = 5000): RateLimiter => ({ hits: new Map(), max, windowMs, maxKeys })

export function rateLimited(limiter: RateLimiter, key: string, now: number) {
  for (const [k, times] of limiter.hits) if (times.every((t) => now - t >= limiter.windowMs)) limiter.hits.delete(k)
  const recent = (limiter.hits.get(key) ?? []).filter((t) => now - t < limiter.windowMs)
  recent.push(now)
  // Re-insert so the map stays ordered by last activity; drop the least recently active first.
  limiter.hits.delete(key)
  limiter.hits.set(key, recent)
  for (const k of limiter.hits.keys()) {
    if (limiter.hits.size <= limiter.maxKeys) break
    limiter.hits.delete(k)
  }
  return recent.length > limiter.max
}
