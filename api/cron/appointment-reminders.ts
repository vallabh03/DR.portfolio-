/**
 * GET /api/cron/appointment-reminders  (Vercel Cron Job, server-side only)
 *
 * Once a day (vercel.json "crons", 09:00 India time) sends the
 * appointment_reminder notifications switched on in
 * public.notification_settings: for each one, the confirmed or rescheduled
 * bookings whose appointment is `days_before` days away (default 1) get a
 * reminder, to the patient and/or the practice. Each booking's reminder is
 * sent once per appointment date, however often the job runs.
 *
 * Only Vercel's scheduler may call it ("Authorization: Bearer <CRON_SECRET>").
 * Bookings are only read; the response holds counts only.
 */

import { cronAuthorised, fail, reply, safeLogger, type Logger } from '../_lib/http.ts'
import { dbFromEnv, notifyEvent, settingsFor, type ServerEnv } from '../_lib/notify.ts'
import type { BookingDb } from '../_lib/db.ts'

/** India Standard Time (UTC+5:30): the practice's dates. */
const IST_OFFSET_MS = (5 * 60 + 30) * 60_000
const istDay = (ms: number, addDays: number) => new Date(ms + IST_OFFSET_MS + addDays * 86_400_000).toISOString().slice(0, 10)
/** Per setting and run, to stay well inside the function time limit. */
const BATCH = 50

export type ReminderOptions = { env: ServerEnv; db?: BookingDb | null; fetch?: typeof fetch; now?: () => number; log?: Logger }

export async function handleReminderJob(request: Request, opts: ReminderOptions): Promise<Response> {
  const log = safeLogger(opts.log ?? console)
  try {
    if (request.method !== 'GET') return fail(405, 'method_not_allowed', { Allow: 'GET' })
    if (!opts.env.CRON_SECRET) {
      log.error('reminders: CRON_SECRET is not set')
      return fail(503, 'unavailable')
    }
    if (!cronAuthorised(request, opts.env.CRON_SECRET)) return fail(401, 'unauthorized')

    const fetchImpl = opts.fetch ?? fetch
    const db = opts.db === undefined ? dbFromEnv(opts.env, fetchImpl) : opts.db
    if (!db) {
      log.error('reminders: database is not configured')
      return fail(503, 'unavailable')
    }

    const now = (opts.now ?? Date.now)()
    const counts = { bookings: 0, sent: 0, failed: 0, skipped: 0 }
    const settings = (await settingsFor(db, 'appointment_reminder', opts.env)).filter((s) => s.enabled)
    for (const s of settings) {
      const daysBefore = Number.isInteger(s.days_before) && (s.days_before as number) >= 0 ? (s.days_before as number) : 1
      const bookings = await db.appointmentsOn(istDay(now, daysBefore), BATCH)
      for (const a of bookings) {
        const c = await notifyEvent(db, 'appointment_reminder', a, { env: opts.env, fetch: fetchImpl, log }, s.audience)
        counts.bookings++
        counts.sent += c.sent
        counts.failed += c.failed
        counts.skipped += c.skipped
      }
    }
    log.info(`reminders: ${counts.bookings} booking reminder(s), ${counts.sent} sent, ${counts.failed} failed`)
    return reply(200, { ok: true, ...counts })
  } catch (err) {
    log.error(`reminders: unexpected error (${err instanceof Error ? err.name : typeof err})`)
    return fail(500, 'internal_error')
  }
}

export function GET(request: Request) {
  return handleReminderJob(request, { env: process.env as ServerEnv })
}
