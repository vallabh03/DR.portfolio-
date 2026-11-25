/**
 * POST /api/booking-events  (Vercel Function, called by a Supabase Database Webhook)
 *
 * When staff confirm, reschedule or decline a booking (by changing its status,
 * or the scheduled date or time, in Supabase), Supabase calls this with the
 * row before and after the change, and the matching notifications switched on
 * in public.notification_settings are sent: booking_confirmed,
 * booking_rescheduled or booking_declined, to the patient and/or the practice.
 *
 * - Only Supabase may call it: the webhook sends "Authorization: Bearer
 *   <BOOKING_EVENTS_SECRET>" (set up in docs/BOOKINGS.md).
 * - The booking is read again from the database; the payload is only used to
 *   see what changed. Each change is sent once, however often it is delivered.
 * - Nothing in the database is changed except the notification rows.
 * The response holds counts only, never patient details.
 */

import { cronAuthorised, fail, reply, safeLogger, type Logger } from './_lib/http.ts'
import { dbFromEnv, notifyEvent, type ServerEnv } from './_lib/notify.ts'
import { statusEvent } from './_lib/events.ts'
import type { BookingDb } from './_lib/db.ts'
import type { Appointment } from './_lib/booking.ts'

const MAX_BODY_BYTES = 64 * 1024
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type BookingEventsOptions = { env: ServerEnv; db?: BookingDb | null; fetch?: typeof fetch; log?: Logger }

type WebhookPayload = { type?: unknown; table?: unknown; record?: Partial<Appointment> | null; old_record?: Partial<Appointment> | null }

export async function handleBookingEvents(request: Request, opts: BookingEventsOptions): Promise<Response> {
  const log = safeLogger(opts.log ?? console)
  try {
    if (request.method !== 'POST') return fail(405, 'method_not_allowed', { Allow: 'POST' })
    if (!opts.env.BOOKING_EVENTS_SECRET) {
      log.error('booking-events: BOOKING_EVENTS_SECRET is not set')
      return fail(503, 'unavailable')
    }
    if (!cronAuthorised(request, opts.env.BOOKING_EVENTS_SECRET)) return fail(401, 'unauthorized')

    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) return fail(413, 'too_large')
    let payload: WebhookPayload
    try {
      payload = JSON.parse(raw)
    } catch {
      return fail(400, 'bad_request')
    }

    const id = payload?.record?.id
    if (payload?.table !== 'appointments' || payload?.type !== 'UPDATE' || typeof id !== 'string' || !UUID_RE.test(id)) {
      return reply(200, { ok: true, ignored: 'not a booking update' })
    }

    const fetchImpl = opts.fetch ?? fetch
    const db = opts.db === undefined ? dbFromEnv(opts.env, fetchImpl) : opts.db
    if (!db) {
      log.error('booking-events: database is not configured')
      return fail(503, 'unavailable')
    }

    // The booking as it is now; the payload only tells us what it was before.
    const appointment = await db.getAppointment(id)
    if (!appointment) return reply(200, { ok: true, ignored: 'booking not found' })
    const event = statusEvent(payload.old_record, appointment)
    if (!event) return reply(200, { ok: true, ignored: 'no notification for this change' })

    const counts = await notifyEvent(db, event, appointment, { env: opts.env, fetch: fetchImpl, log })
    log.info(`booking-events: ${event}: ${counts.sent} sent, ${counts.failed} failed, ${counts.skipped} skipped`)
    return reply(200, { ok: true, event, ...counts })
  } catch (err) {
    log.error(`booking-events: unexpected error (${err instanceof Error ? err.name : typeof err})`)
    return fail(500, 'internal_error')
  }
}

export function POST(request: Request) {
  return handleBookingEvents(request, { env: process.env as ServerEnv })
}
export { POST as GET, POST as PUT, POST as PATCH, POST as DELETE }
