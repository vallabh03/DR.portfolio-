/**
 * GET/POST /api/whatsapp-webhook  (Vercel Function, called by Meta only)
 *
 * Two jobs, both optional (bookings and notifications work without them):
 *
 * 1. Delivery receipts: Meta reports each sent message as sent, delivered,
 *    read or failed, and the matching notification row is updated.
 * 2. Booking assistant: when an allowed number (the doctor's, plus
 *    WHATSAPP_ALLOWED_NUMBERS) sends a command such as "today" or "AT-7K3F9Q"
 *    to the practice's WhatsApp number, the reply lists those bookings from
 *    Supabase (api/_lib/bot.ts). Messages from any other number are ignored and
 *    never receive booking data.
 *
 * - GET answers Meta's one-time subscription check (WHATSAPP_WEBHOOK_VERIFY_TOKEN).
 * - POST is accepted only with a valid X-Hub-Signature-256 made with the app
 *   secret (WHATSAPP_APP_SECRET), so nobody else can trigger replies or change
 *   delivery records.
 * Logs hold counts and outcomes only: never numbers, names or message text.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'
import { fail, safeLogger, type Logger } from './_lib/http.ts'
import { dbFromEnv, whatsappConfig, type ServerEnv } from './_lib/notify.ts'
import type { BookingDb } from './_lib/db.ts'
import { allowedNumbers, HELP_TEXT, parseCommand, replyFor } from './_lib/bot.ts'
import { sendText } from './_lib/whatsapp.ts'

const MAX_BODY_BYTES = 256 * 1024
const STATUSES = new Set(['sent', 'delivered', 'read', 'failed'])

export type WebhookOptions = {
  env: ServerEnv
  db?: BookingDb | null
  fetch?: typeof fetch
  now?: () => number
  log?: Logger
  /** Message ids already answered (Meta can deliver the same webhook twice). */
  seen?: Set<string>
}

/** Per-instance memory of answered message ids, so a repeated webhook does not reply twice. */
const answered = new Set<string>()
const remember = (seen: Set<string>, id: string) => {
  seen.add(id)
  if (seen.size > 2000) seen.delete(seen.values().next().value as string)
}

type IncomingMessage = { id: string; from: string; text: string | null }

/** Messages sent to the business number; anything unexpected is ignored. */
export function incomingMessages(payload: unknown): IncomingMessage[] {
  const out: IncomingMessage[] = []
  const entries = (payload as { entry?: unknown })?.entry
  if (!Array.isArray(entries)) return out
  for (const entry of entries) {
    for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
      for (const m of Array.isArray(change?.value?.messages) ? change.value.messages : []) {
        if (typeof m?.id !== 'string' || typeof m?.from !== 'string') continue
        out.push({ id: m.id, from: m.from.replace(/\D/g, ''), text: m.type === 'text' && typeof m.text?.body === 'string' ? m.text.body.slice(0, 200) : null })
      }
    }
  }
  return out
}

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
    const messages = incomingMessages(payload)
    const fetchImpl = opts.fetch ?? fetch
    const db = opts.db === undefined ? dbFromEnv(env, fetchImpl) : opts.db
    if ((updates.length || messages.length) && !db) {
      log.error('webhook: database is not configured')
      // A non-2xx answer makes Meta retry the delivery later.
      return fail(503, 'unavailable')
    }
    for (const u of updates) await db!.recordDelivery(u.id, u.status, u.error)
    if (updates.length) log.info(`webhook: ${updates.length} delivery update(s) recorded`)

    if (messages.length) await answer(messages, db!, opts, fetchImpl, log)
    return new Response(null, { status: 200 })
  } catch (err) {
    log.error(`webhook: unexpected error (${err instanceof Error ? err.name : typeof err})`)
    return fail(500, 'internal_error')
  }
}

/** Replies to commands from allowed numbers; everything else is ignored. */
async function answer(messages: IncomingMessage[], db: BookingDb, opts: WebhookOptions, fetchImpl: typeof fetch, log: Logger) {
  const allowed = allowedNumbers(opts.env)
  const seen = opts.seen ?? answered
  const config = whatsappConfig(opts.env)
  let ignored = 0
  for (const m of messages) {
    if (!allowed.has(m.from)) {
      ignored++
      continue
    }
    if (seen.has(m.id)) continue
    remember(seen, m.id)
    if (!config) {
      log.error('webhook: WhatsApp is not configured, so the assistant cannot reply')
      return
    }
    const command = m.text === null ? { kind: 'help' as const } : parseCommand(m.text, (opts.now ?? Date.now)())
    const body = m.text === null ? `I can only read text messages.\n\n${HELP_TEXT}` : await replyFor(command, db)
    const sent = await sendText(config, { to: m.from, body }, fetchImpl, log)
    log.info(`webhook: assistant ${command.kind} command ${sent.ok ? 'answered' : 'reply failed'}`)
  }
  if (ignored) log.info(`webhook: ignored ${ignored} message(s) from numbers not on the allow list`)
}

export function GET(request: Request) {
  return handleWebhook(request, { env: process.env as ServerEnv })
}
export { GET as POST, GET as PUT, GET as PATCH, GET as DELETE }
