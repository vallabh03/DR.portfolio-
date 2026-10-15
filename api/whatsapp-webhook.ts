/**
 * GET/POST /api/whatsapp-webhook  (Vercel Function, called by Meta only)
 *
 * Records delivery receipts for the WhatsApp notifications: Meta reports each
 * message as sent, delivered, read or failed, and the matching notification row
 * is updated (delivery_status, delivery_error). Optional: bookings and
 * notifications work without it; it adds the "delivered/read" detail.
 *
 * - GET answers Meta's one-time subscription check (WHATSAPP_WEBHOOK_VERIFY_TOKEN).
 * - POST is accepted only with a valid X-Hub-Signature-256 made with the app
 *   secret (WHATSAPP_APP_SECRET), so nobody else can change delivery records.
 * Only message ids, statuses and error codes are read; nothing is logged about patients.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'
import { fail, safeLogger, type Logger } from './_lib/http.ts'
import { dbFromEnv, type ServerEnv } from './_lib/notify.ts'
import type { BookingDb } from './_lib/db.ts'

const MAX_BODY_BYTES = 256 * 1024
const STATUSES = new Set(['sent', 'delivered', 'read', 'failed'])

export type WebhookOptions = { env: ServerEnv; db?: BookingDb | null; fetch?: typeof fetch; log?: Logger }

export function signatureValid(raw: string, header: string | null, secret: string) {
  const expected = `sha256=${createHmac('sha256', secret).update(raw, 'utf8').digest('hex')}`
  if (!header || header.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(header), Buffer.from(expected))
}

type StatusUpdate = { id: string; status: string; error?: string }

/** The status updates in a webhook payload; anything unexpected is ignored. */
export function statusUpdates(payload: unknown): StatusUpdate[] {
  const out: StatusUpdate[] = []
  const entries = (payload as { entry?: unknown })?.entry
  if (!Array.isArray(entries)) return out
  for (const entry of entries) {
    for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
      for (const s of Array.isArray(change?.value?.statuses) ? change.value.statuses : []) {
        if (typeof s?.id !== 'string' || typeof s?.status !== 'string' || !STATUSES.has(s.status)) continue
        const code = Array.isArray(s.errors) ? s.errors[0]?.code : undefined
        out.push({ id: s.id, status: s.status, ...(code !== undefined && { error: `code ${String(code)}` }) })
      }
    }
  }
  return out
}

export async function handleWebhook(request: Request, opts: WebhookOptions): Promise<Response> {
  const log = safeLogger(opts.log ?? console)
  const { env } = opts
  try {
    if (request.method === 'GET') {
      const url = new URL(request.url)
      const ok =
        !!env.WHATSAPP_WEBHOOK_VERIFY_TOKEN &&
        url.searchParams.get('hub.mode') === 'subscribe' &&
        url.searchParams.get('hub.verify_token') === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
      if (!ok) return fail(403, 'forbidden')
      return new Response(url.searchParams.get('hub.challenge') ?? '', { status: 200, headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' } })
    }
    if (request.method !== 'POST') return fail(405, 'method_not_allowed', { Allow: 'GET, POST' })
    if (!env.WHATSAPP_APP_SECRET) {
      log.error('webhook: WHATSAPP_APP_SECRET is not set')
      return fail(503, 'unavailable')
    }
    if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return fail(413, 'too_large')
    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) return fail(413, 'too_large')
    if (!signatureValid(raw, request.headers.get('x-hub-signature-256'), env.WHATSAPP_APP_SECRET)) {
      log.warn('webhook: invalid signature')
      return fail(401, 'unauthorized')
    }

    let payload: unknown
    try {
      payload = JSON.parse(raw)
    } catch {
      return fail(400, 'bad_request')
    }
    const updates = statusUpdates(payload)
    const db = opts.db === undefined ? dbFromEnv(env, opts.fetch ?? fetch) : opts.db
    if (updates.length && !db) {
      log.error('webhook: database is not configured')
      // A non-2xx answer makes Meta retry the delivery later.
      return fail(503, 'unavailable')
    }
    for (const u of updates) await db!.recordDelivery(u.id, u.status, u.error)
    if (updates.length) log.info(`webhook: ${updates.length} delivery update(s) recorded`)
    return new Response(null, { status: 200 })
  } catch (err) {
    log.error(`webhook: unexpected error (${err instanceof Error ? err.name : typeof err})`)
    return fail(500, 'internal_error')
  }
}

export function GET(request: Request) {
  return handleWebhook(request, { env: process.env as ServerEnv })
}
export { GET as POST, GET as PUT, GET as PATCH, GET as DELETE }
