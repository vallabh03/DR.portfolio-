/**
 * GET /api/cron/retry-notifications  (Vercel Cron Job, server-side only)
 *
 * Sends the doctor's WhatsApp notification again for bookings whose first
 * attempt failed (Meta down, token expired, settings missing). Runs once a day
 * (vercel.json "crons"); bookings are never touched, only their notification
 * rows. Each row is claimed in the database before sending, so this job, a
 * patient's retried request and another instance can never send it twice.
 *
 * Only Vercel's scheduler may call it: Vercel sends "Authorization: Bearer
 * <CRON_SECRET>" when CRON_SECRET is set in the project. The response holds
 * counts only, never patient details.
 */

import { fail, reply, safeLogger, type Logger } from '../_lib/http.ts'
import { dbFromEnv, deliverNotification, type ServerEnv } from '../_lib/notify.ts'
import type { BookingDb } from '../_lib/db.ts'
import { timingSafeEqual } from 'node:crypto'

/** Give up on a notification after this many attempts in total. */
export const MAX_ATTEMPTS = 5
/** Only notifications for bookings from the last week are retried. */
const WINDOW_MS = 7 * 86_400_000
/** Per run, to stay well inside the function time limit. */
const BATCH = 20

export type RetryOptions = { env: ServerEnv; db?: BookingDb | null; fetch?: typeof fetch; now?: () => number; log?: Logger }

function authorised(request: Request, secret: string) {
  const expected = Buffer.from(`Bearer ${secret}`)
  const given = Buffer.from(request.headers.get('authorization') ?? '')
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export async function handleRetryJob(request: Request, opts: RetryOptions): Promise<Response> {
  const log = safeLogger(opts.log ?? console)
  try {
    if (request.method !== 'GET') return fail(405, 'method_not_allowed', { Allow: 'GET' })
    if (!opts.env.CRON_SECRET) {
      log.error('retry: CRON_SECRET is not set')
      return fail(503, 'unavailable')
    }
    if (!authorised(request, opts.env.CRON_SECRET)) return fail(401, 'unauthorized')

    const fetchImpl = opts.fetch ?? fetch
    const db = opts.db === undefined ? dbFromEnv(opts.env, fetchImpl) : opts.db
    if (!db) {
      log.error('retry: database is not configured')
      return fail(503, 'unavailable')
    }

    const since = new Date((opts.now ?? Date.now)() - WINDOW_MS).toISOString()
    const due = await db.listRetryable(MAX_ATTEMPTS, since, BATCH)
    const counts = { checked: due.length, sent: 0, failed: 0, skipped: 0 }
    for (const n of due) {
      const appointment = await db.getAppointment(n.appointment_id)
      if (!appointment) continue
      const outcome = await deliverNotification(db, n.id, appointment, { env: opts.env, fetch: fetchImpl, log })
      if (outcome === 'sent') counts.sent++
      else if (outcome === 'failed') counts.failed++
      else counts.skipped++
    }
    log.info(`retry: ${counts.checked} checked, ${counts.sent} sent, ${counts.failed} failed`)
    return reply(200, { ok: true, ...counts })
  } catch (err) {
    log.error(`retry: unexpected error (${err instanceof Error ? err.name : typeof err})`)
    return fail(500, 'internal_error')
  }
}

export function GET(request: Request) {
  return handleRetryJob(request, { env: process.env as ServerEnv })
}
