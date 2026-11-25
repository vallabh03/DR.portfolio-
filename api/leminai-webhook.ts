/**
 * POST /api/leminai-webhook?token=<LEMINAI_WEBHOOK_TOKEN>  (called by Leminai)
 *
 * Leminai forwards every WhatsApp message the business number receives
 * (Settings > Webhook). When the doctor taps **Confirm** on a booking alert,
 * the booking becomes confirmed and the patient gets their confirmation (the
 * booking_confirmed notification settings), exactly as if staff had confirmed
 * it in Supabase.
 *
 * Which booking: WhatsApp sends, with a button tap, the id of the message the
 * button belongs to; that is the doctor's alert, whose id was saved when it was
 * sent. If the id is missing or unknown, the tap is used only when exactly one
 * pending booking was alerted to that number in the last 7 days; otherwise
 * nothing is changed.
 *
 * Safety:
 * - Leminai cannot send a secret header, so the URL carries a secret token.
 * - Only taps from the practice's numbers (the booking_received admin setting:
 *   its recipients, else WHATSAPP_RECIPIENT_NUMBER) do anything.
 * - Only a pending booking is changed, once: a second tap or a repeated
 *   webhook changes nothing and sends nothing twice.
 * - Every other message is ignored. Logs hold outcomes only, never numbers,
 *   names or message text.
 */

import { timingSafeEqual } from 'node:crypto'
import { fail, reply, safeLogger, type Logger } from './_lib/http.ts'
import { dbFromEnv, notifyEvent, recipientsFor, settingsFor, type ServerEnv } from './_lib/notify.ts'
import { kindOf } from './_lib/events.ts'
import type { BookingDb } from './_lib/db.ts'
import type { Appointment } from './_lib/booking.ts'

const MAX_BODY_BYTES = 256 * 1024
/** How far back a doctor's alert can be matched when the tap carries no message id. */
const FALLBACK_WINDOW_MS = 7 * 86_400_000
const ADMIN_ALERT = kindOf('booking_received', 'admin')

export type LeminaiWebhookOptions = { env: ServerEnv; db?: BookingDb | null; fetch?: typeof fetch; now?: () => number; log?: Logger }

/** A button tap or text reply: who sent it, the text or payload, and the id of the message it answers. */
export type Tap = { from: string; action: string; context: string | null; id: string | null }

const str = (v: unknown) => (typeof v === 'string' ? v : null)
const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : null)

/** One message in WhatsApp's format: type button (template quick reply), interactive (button reply) or text. */
function readMessage(m: Record<string, unknown>): Tap | null {
  const from = str(m.from) ?? str(m.wa_id) ?? str(m.sender) ?? str(m.phone)
  if (!from) return null
  const button = obj(m.button)
  const reply = obj(obj(m.interactive)?.button_reply)
  const text = obj(m.text)
  const action = str(button?.payload) ?? str(button?.text) ?? str(reply?.id) ?? str(reply?.title) ?? str(text?.body) ?? str(m.text) ?? str(m.body) ?? ''
  const context = str(obj(m.context)?.id) ?? str(m.context_id) ?? str(m.reply_to) ?? null
  return { from: from.replace(/\D/g, ''), action: action.slice(0, 100), context, id: str(m.id) }
}

/**
 * The messages in a webhook payload. Accepts WhatsApp's own format
 * (entry[].changes[].value.messages[]), which Leminai forwards, and flatter
 * shapes ({messages: [...]}, {message: {...}}, {data: ...}); anything else is
 * ignored.
 */
export function incomingTaps(payload: unknown): Tap[] {
  const out: Tap[] = []
  const collect = (list: unknown) => {
    for (const m of Array.isArray(list) ? list : []) {
      const o = obj(m)
      const t = o && readMessage(o)
      if (t) out.push(t)
    }
  }
  const root = obj(payload)
  if (!root) return out
  for (const p of [root, obj(root.data)].filter(Boolean) as Record<string, unknown>[]) {
    for (const entry of Array.isArray(p.entry) ? p.entry : []) for (const change of Array.isArray(obj(entry)?.changes) ? (obj(entry)!.changes as unknown[]) : []) collect(obj(obj(change)?.value)?.messages)
    collect(p.messages)
    if (obj(p.message)) collect([p.message])
    if (str(p.from) && (obj(p.button) || obj(p.interactive) || p.text !== undefined)) collect([p])
  }
  return out
}

/** "Confirm", "CONFIRM", "confirm:AT-…", "✅ Confirm" … */
export const isConfirm = (action: string) => /^\W*confirm\b/i.test(action.trim())

function tokenValid(given: string | null, expected: string) {
  if (!given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** The booking a doctor's tap is about, or null when it cannot be told for certain. */
async function bookingFor(tap: Tap, db: BookingDb, now: number): Promise<{ booking: Appointment | null; how: string }> {
  if (tap.context) {
    const n = await db.notificationByMessageId(tap.context)
    if (n) return { booking: await db.getAppointment(n.appointment_id), how: 'message id' }
  }
  // No usable message id: only when exactly one pending booking was alerted to this number.
  const alerts = await db.sentTo(tap.from, ADMIN_ALERT, new Date(now - FALLBACK_WINDOW_MS).toISOString(), 50)
  const pending: Appointment[] = []
  for (const id of new Set(alerts.map((n) => n.appointment_id))) {
    const a = await db.getAppointment(id)
    if (a?.status === 'pending') pending.push(a)
  }
  return pending.length === 1 ? { booking: pending[0], how: 'only pending booking' } : { booking: null, how: pending.length ? 'several pending bookings' : 'no pending booking' }
}

export async function handleLeminaiWebhook(request: Request, opts: LeminaiWebhookOptions): Promise<Response> {
  const log = safeLogger(opts.log ?? console)
  try {
    // Some services check the URL with a GET first.
    if (request.method === 'GET') return reply(200, { ok: true })
    if (request.method !== 'POST') return fail(405, 'method_not_allowed', { Allow: 'GET, POST' })
    const expected = opts.env.LEMINAI_WEBHOOK_TOKEN
    if (!expected) {
      log.error('leminai-webhook: LEMINAI_WEBHOOK_TOKEN is not set')
      return fail(503, 'unavailable')
    }
    if (!tokenValid(new URL(request.url).searchParams.get('token'), expected)) return fail(401, 'unauthorized')

    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) return fail(413, 'too_large')
    let payload: unknown
    try {
      payload = JSON.parse(raw)
    } catch {
      return reply(200, { ok: true, ignored: 'not json' })
    }

    const taps = incomingTaps(payload).filter((t) => isConfirm(t.action))
    if (!taps.length) {
      const keys = obj(payload) ? Object.keys(obj(payload)!).slice(0, 8).join(',') : typeof payload
      log.info(`leminai-webhook: no Confirm tap in payload (top-level keys: ${keys})`)
      return reply(200, { ok: true, ignored: 'no confirm tap' })
    }

    const fetchImpl = opts.fetch ?? fetch
    const db = opts.db === undefined ? dbFromEnv(opts.env, fetchImpl) : opts.db
    if (!db) {
      log.error('leminai-webhook: database is not configured')
      return fail(503, 'unavailable')
    }

    // The practice's numbers, from the same setting that sends them the booking alert.
    const adminSetting = (await settingsFor(db, 'booking_received', opts.env)).find((s) => s.audience === 'admin')
    const practice = new Set(adminSetting ? recipientsFor(adminSetting, { patient_phone: '' } as Appointment, opts.env) : [])
    const now = (opts.now ?? Date.now)()
    const counts = { confirmed: 0, ignored: 0, sent: 0, failed: 0 }

    for (const tap of taps) {
      if (!practice.has(tap.from)) {
        counts.ignored++
        log.warn('leminai-webhook: Confirm tap from a number that is not the practice; ignored')
        continue
      }
      const { booking, how } = await bookingFor(tap, db, now)
      if (!booking) {
        counts.ignored++
        log.warn(`leminai-webhook: Confirm tap not matched to a booking (${how}); nothing changed`)
        continue
      }
      if (booking.status !== 'pending') {
        counts.ignored++
        log.info(`leminai-webhook: booking already ${booking.status}; nothing changed`)
        continue
      }
      const confirmed = await db.confirmPending(booking)
      if (!confirmed) {
        counts.ignored++
        log.info('leminai-webhook: booking changed meanwhile; nothing changed')
        continue
      }
      counts.confirmed++
      // The Supabase webhook may report the same change too; each message is still sent once.
      const c = await notifyEvent(db, 'booking_confirmed', confirmed, { env: opts.env, fetch: fetchImpl, log })
      counts.sent += c.sent
      counts.failed += c.failed
      log.info(`leminai-webhook: booking confirmed by the doctor (matched by ${how}); ${c.sent} sent, ${c.failed} failed`)
    }
    return reply(200, { ok: true, ...counts })
  } catch (err) {
    log.error(`leminai-webhook: unexpected error (${err instanceof Error ? err.name : typeof err})`)
    // 200 so a fault here does not make Leminai resend every message; the error is logged.
    return reply(200, { ok: false })
  }
}

export function POST(request: Request) {
  return handleLeminaiWebhook(request, { env: process.env as ServerEnv })
}
export { POST as GET }
