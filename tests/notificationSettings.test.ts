/**
 * Tests for configurable notifications: the settings table decides what is
 * sent (api/_lib/events.ts, api/_lib/notify.ts), the Leminai and Meta providers
 * (api/_lib/whatsapp.ts), status-change notifications from the Supabase webhook
 * (api/booking-events.ts) and reminders (api/cron/appointment-reminders.ts).
 * The database is the in-memory one; no provider is ever called for real.
 * Run with: npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLimiter, handleConsultation } from '../api/consultation.ts'
import { handleBookingEvents } from '../api/booking-events.ts'
import { handleReminderJob } from '../api/cron/appointment-reminders.ts'
import { handleRetryJob } from '../api/cron/retry-notifications.ts'
import { buildParameters, parseKind, statusEvent } from '../api/_lib/events.ts'
import { DbError, memoryDb, supabaseDb, type MemoryDb } from '../api/_lib/db.ts'
import type { Appointment } from '../api/_lib/booking.ts'
import { ENV, metaStub, practiceOnlyDb, type Call } from './helpers.ts'

// 14 October 2026, 12:00 UTC (17:30 in India).
const NOW = Date.UTC(2026, 9, 14, 12)
const SECRET = 'events-secret-not-real'
const CRON_SECRET = 'cron-secret-not-real'
const PATIENT = '919876543210'
const silent = { info() {}, warn() {}, error() {} }
const env = { ...ENV, BOOKING_EVENTS_SECRET: SECRET, CRON_SECRET }
const LEMINAI = { ...env, LEMINAI_API_KEY: 'leminai-key-not-real' }

const bodies = (calls: Call[]) => calls.map((c) => ({ url: c.url, body: JSON.parse(String(c.init.body)), auth: (c.init.headers as Record<string, string>).Authorization }))
const turnOn = (db: MemoryDb, event: string, audience: string, change: Record<string, unknown> = {}) =>
  Object.assign(db.settings.find((s) => s.event === event && s.audience === audience)!, { enabled: true, ...change })
const turnOff = (db: MemoryDb, event: string, audience: string) => Object.assign(db.settings.find((s) => s.event === event && s.audience === audience)!, { enabled: false })

async function book(db: MemoryDb, opts: { env?: typeof env; meta?: ReturnType<typeof metaStub>; requestId?: string; date?: string; slot?: string } = {}) {
  const meta = opts.meta ?? metaStub('sent')
  const res = await handleConsultation(
    new Request('https://www.example.test/api/consultation', {
      method: 'POST',
      headers: { host: 'www.example.test', origin: 'https://www.example.test', 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Ravi Kumar',
        phone: '+91 98765 43210',
        email: '',
        date: opts.date ?? '2026-10-20',
        slot: opts.slot ?? 'morning',
        message: '',
        consent: true,
        requestId: opts.requestId ?? 'req-notify-0001',
        elapsedMs: 30_000,
        website: '',
      }),
    }),
    { env: opts.env ?? env, db, limiter: createLimiter(), fetch: meta.fetchImpl, now: () => NOW, log: silent },
  )
  assert.equal(res.status, 201)
  // A copy: the stored booking changes later, and tests compare before and after.
  return { booking: structuredClone([...db.appointments.values()].at(-1)!), meta }
}

/** What Supabase's database webhook sends for an update of a booking. */
async function changed(db: MemoryDb, before: Appointment, change: Partial<Appointment>, opts: { secret?: string; env?: typeof env } = {}) {
  const after = Object.assign(db.appointments.get(before.id)!, change)
  const meta = metaStub('sent')
  const res = await handleBookingEvents(
    new Request('https://www.example.test/api/booking-events', {
      method: 'POST',
      headers: { authorization: `Bearer ${opts.secret ?? SECRET}`, 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'UPDATE', table: 'appointments', schema: 'public', record: after, old_record: before }),
    }),
    { env: opts.env ?? env, db, fetch: meta.fetchImpl, log: silent },
  )
  return { res, json: await res.json(), sent: bodies(meta.calls), after: structuredClone(after) }
}

/* ── Settings decide what is sent ───────────────────────────────────────── */

test('by default a new booking alerts the practice and sends the patient booking_confirmation with its six variables', async () => {
  const db = memoryDb(() => NOW)
  const { meta } = await book(db)
  const sent = bodies(meta.calls)
  assert.equal(sent.length, 2)
  const practice = sent.find((s) => s.body.to === '919000000000')!
  assert.equal(practice.body.template.name, 'new_booking_request')
  const patient = sent.find((s) => s.body.to === PATIENT)!
  assert.equal(patient.body.template.name, 'booking_confirmation')
  assert.equal(patient.body.template.language.code, 'en')
  // "Dear {{1}}, ... Name: {{2}} Email: {{3}} Contact: {{4}} Preferred Date: {{5}} Preferred Slot: {{6}}"
  assert.deepEqual(
    patient.body.template.components[0].parameters,
    ['Ravi', 'Ravi Kumar', '-', '919876543210', '20 Oct 2026', 'Morning'].map((text) => ({ type: 'text', text })),
  )
})

test('the patient message follows the table: template, language and variables in order', async () => {
  const db = memoryDb(() => NOW)
  turnOn(db, 'booking_received', 'customer', {
    template_name: 'request_received',
    language: 'en_US',
    parameters: [{ source: 'patient_first_name' }, { source: 'booking_ref' }, { source: 'requested_when' }],
  })
  const { booking, meta } = await book(db)
  const sent = bodies(meta.calls)
  assert.equal(sent.length, 2)
  const patient = sent.find((s) => s.body.to === PATIENT)!
  assert.equal(patient.body.template.name, 'request_received')
  assert.equal(patient.body.template.language.code, 'en_US')
  assert.deepEqual(
    patient.body.template.components[0].parameters.map((p: { text: string }) => p.text),
    ['Ravi', booking.booking_ref, '20 October 2026, Morning'],
  )
  assert.ok(patient.body.template.components[0].parameters.every((p: Record<string, unknown>) => !('parameter_name' in p)), 'numbered variables')
  const kinds = [...db.notifications.values()].map((n) => n.kind).sort()
  assert.deepEqual(kinds, ['booking_received:admin', 'booking_received:customer'])
})

test('each message switches off on its own; with both off nothing is sent and the booking is still saved', async () => {
  const db = memoryDb(() => NOW)
  turnOff(db, 'booking_received', 'admin')
  const patientOnly = await book(db)
  assert.deepEqual(bodies(patientOnly.meta.calls).map((s) => s.body.to), [PATIENT])

  const db2 = memoryDb(() => NOW)
  turnOff(db2, 'booking_received', 'admin')
  turnOff(db2, 'booking_received', 'customer')
  const { meta } = await book(db2)
  assert.equal(meta.calls.length, 0)
  assert.equal(db2.appointments.size, 1)
  assert.equal(db2.notifications.size, 0)
})

test('a message switched off while waiting for a retry is skipped, not sent', async () => {
  const db = practiceOnlyDb(() => NOW)
  await book(db, { meta: metaStub('rejected') })
  const [n] = [...db.notifications.values()]
  assert.equal(n.status, 'failed')
  turnOff(db, 'booking_received', 'admin')
  const meta = metaStub('sent')
  await handleRetryJob(new Request('https://x.test/api/cron/retry-notifications', { headers: { authorization: `Bearer ${CRON_SECRET}` } }), {
    env,
    db,
    fetch: meta.fetchImpl,
    now: () => NOW,
    log: silent,
  })
  assert.equal(meta.calls.length, 0)
  assert.equal(db.notifications.get(n.id)!.status, 'skipped')
  assert.equal(db.notifications.get(n.id)!.last_error, 'turned_off')
})

test('an admin row can list several numbers; each gets one message', async () => {
  const db = practiceOnlyDb(() => NOW)
  turnOn(db, 'booking_received', 'admin', { recipients: '+91 98480 11111, 919000000000, 91-98480-11111' })
  const { meta } = await book(db)
  assert.deepEqual(bodies(meta.calls).map((s) => s.body.to).sort(), ['919000000000', '919848011111'])
})

test('a setting with an unknown booking field fails safely: nothing is sent', async () => {
  const db = practiceOnlyDb(() => NOW)
  turnOn(db, 'booking_received', 'admin', { parameters: [{ source: 'booking_ref' }, { source: 'patient_password' }] })
  const { meta } = await book(db)
  assert.equal(meta.calls.length, 0)
  const [n] = [...db.notifications.values()]
  assert.equal(n.status, 'failed')
  assert.equal(n.last_error, 'bad_parameter_2')
})

test('parameters: booking fields, fixed text and names; the patient’s message is never offered', () => {
  const a = { booking_ref: 'AT-7K3F9Q', patient_name: 'Ravi Kumar', message: 'private' } as Appointment
  assert.deepEqual(buildParameters([{ source: 'booking_ref', name: 'booking_id' }, { text: 'See you soon' }], a), {
    ok: true,
    params: [{ text: 'AT-7K3F9Q', name: 'booking_id' }, { text: 'See you soon', name: undefined }],
  })
  assert.equal(buildParameters([{ source: 'message' }], a).ok, false)
  assert.equal(buildParameters([{ source: 'toString' }], a).ok, false)
})

/* ── Providers ──────────────────────────────────────────────────────────── */

test('with a Leminai key, messages go to Leminai in its template format', async () => {
  const db = memoryDb(() => NOW)
  const { booking, meta } = await book(db, { env: LEMINAI })
  const [call] = bodies(meta.calls)
  assert.equal(call.url, 'https://app.leminai.com/api/v1/messages/template')
  assert.equal(call.auth, 'Bearer leminai-key-not-real')
  assert.deepEqual(Object.keys(call.body).sort(), ['components', 'language', 'template_name', 'to'])
  assert.equal(call.body.to, '919000000000')
  assert.equal(call.body.template_name, 'new_booking_request')
  assert.equal(call.body.language, 'en')
  assert.equal(call.body.components[0].type, 'body')
  assert.deepEqual(call.body.components[0].parameters[0], { type: 'text', parameter_name: 'booking_id', text: booking.booking_ref })
  assert.ok([...db.notifications.values()].every((n) => n.status === 'sent'))

  // The patient's booking_confirmation, exactly as Leminai's API docs show: numbered variables, no names.
  const patient = bodies(meta.calls).find((c) => c.body.to === PATIENT)!
  assert.deepEqual(patient.body, {
    to: PATIENT,
    template_name: 'booking_confirmation',
    language: 'en',
    components: [
      {
        type: 'body',
        parameters: ['Ravi', 'Ravi Kumar', '-', '919876543210', '20 Oct 2026', 'Morning'].map((text) => ({ type: 'text', text })),
      },
    ],
  })
})

test('WHATSAPP_PROVIDER=meta switches back to Meta even with a Leminai key', async () => {
  const db = memoryDb(() => NOW)
  const { meta } = await book(db, { env: { ...LEMINAI, WHATSAPP_PROVIDER: 'meta' } })
  assert.match(meta.calls[0].url, /^https:\/\/graph\.facebook\.com\//)
})

test('a Leminai error is recorded as codes only and kept for retry', async () => {
  const db = memoryDb(() => NOW)
  const fetchImpl = (async () => Response.json({ success: false, error: { code: 'TEMPLATE_NOT_FOUND', message: 'Ravi Kumar 919876543210' } }, { status: 422 })) as typeof fetch
  await book(db, { env: LEMINAI, meta: { calls: [], fetchImpl } })
  const [n] = [...db.notifications.values()]
  assert.equal(n.status, 'failed')
  assert.equal(n.last_error, 'leminai status 422, code TEMPLATE_NOT_FOUND')
})

test('a provider that is chosen but not configured keeps the message for retry', async () => {
  const db = memoryDb(() => NOW)
  const { meta } = await book(db, { env: { ...env, WHATSAPP_PROVIDER: 'leminai' } })
  assert.equal(meta.calls.length, 0)
  assert.equal([...db.notifications.values()][0].last_error, 'not_configured')
})

/* ── Status changes (Supabase webhook) ──────────────────────────────────── */

test('confirming a booking sends the confirmation once, however often the webhook arrives', async () => {
  const db = memoryDb(() => NOW)
  turnOn(db, 'booking_confirmed', 'customer')
  const { booking } = await book(db)
  const first = await changed(db, booking, { status: 'confirmed', scheduled_date: '2026-10-21', scheduled_slot: 'afternoon' })
  assert.equal(first.res.status, 200)
  assert.equal(first.json.event, 'booking_confirmed')
  assert.equal(first.sent.length, 1)
  assert.equal(first.sent[0].body.to, PATIENT)
  assert.equal(first.sent[0].body.template.name, 'booking_confirmed')
  assert.deepEqual(
    first.sent[0].body.template.components[0].parameters.map((p: { text: string }) => p.text).slice(0, 2),
    ['Ravi', '21 October 2026, Afternoon'],
  )
  const again = await changed(db, booking, {})
  assert.equal(again.sent.length, 0)
})

test('the patient confirmation can use the confirmed date in short form', async () => {
  const db = memoryDb(() => NOW)
  turnOn(db, 'booking_confirmed', 'customer', {
    template_name: 'booking_confirmation',
    parameters: ['patient_first_name', 'patient_name', 'patient_email', 'patient_phone_digits', 'appointment_date_short', 'appointment_time'].map((source) => ({ source })),
  })
  const { booking } = await book(db)
  const { sent } = await changed(db, booking, { status: 'confirmed', scheduled_date: '2026-11-26', scheduled_slot: 'midday' })
  assert.equal(sent.length, 1)
  assert.equal(sent[0].body.to, PATIENT)
  assert.deepEqual(
    sent[0].body.template.components[0].parameters.map((p: { text: string }) => p.text),
    ['Ravi', 'Ravi Kumar', '-', '919876543210', '26 Nov 2026', 'Midday'],
  )
})

test('a new date for a confirmed booking is a new reschedule message; other edits send nothing', async () => {
  const db = memoryDb(() => NOW)
  turnOn(db, 'booking_rescheduled', 'customer')
  const { booking } = await book(db)
  const confirmed = (await changed(db, booking, { status: 'confirmed', scheduled_date: '2026-10-21', scheduled_slot: 'morning' })).after
  const moved = await changed(db, { ...confirmed, status: 'rescheduled' }, { status: 'rescheduled', scheduled_date: '2026-10-23' })
  assert.equal(moved.json.event, 'booking_rescheduled')
  assert.equal(moved.sent.length, 1)
  const nothing = await changed(db, moved.after, { patient_email: 'x@example.test' })
  assert.equal(nothing.json.ignored, 'no notification for this change')
  assert.equal(nothing.sent.length, 0)
})

test('declining notifies according to its own settings; switched-off events send nothing', async () => {
  const db = memoryDb(() => NOW)
  const { booking } = await book(db)
  const off = await changed(db, booking, { status: 'rejected' })
  assert.equal(off.json.event, 'booking_declined')
  assert.equal(off.sent.length, 0)
})

test('the status webhook needs its secret, and ignores other tables', async () => {
  const db = memoryDb(() => NOW)
  turnOn(db, 'booking_confirmed', 'customer')
  const { booking } = await book(db)
  assert.equal((await changed(db, booking, { status: 'confirmed' }, { secret: 'wrong' })).res.status, 401)
  assert.equal((await changed(db, booking, { status: 'confirmed' }, { env: { ...env, BOOKING_EVENTS_SECRET: '' } })).res.status, 503)
  const res = await handleBookingEvents(
    new Request('https://x.test/api/booking-events', { method: 'POST', headers: { authorization: `Bearer ${SECRET}` }, body: JSON.stringify({ type: 'UPDATE', table: 'staff', record: { id: booking.id } }) }),
    { env, db, fetch: metaStub('sent').fetchImpl, log: silent },
  )
  assert.equal((await res.json()).ignored, 'not a booking update')
})

test('status events follow the status, and dates for confirmed or rescheduled bookings', () => {
  const a = { status: 'confirmed', scheduled_date: '2026-10-21', scheduled_slot: 'morning' } as Appointment
  assert.equal(statusEvent({ status: 'pending' }, a), 'booking_confirmed')
  assert.equal(statusEvent({ status: 'confirmed', scheduled_date: '2026-10-21', scheduled_slot: 'morning' }, a), null)
  assert.equal(statusEvent({ status: 'confirmed', scheduled_date: '2026-10-20', scheduled_slot: 'morning' }, a), 'booking_confirmed')
  assert.equal(statusEvent({ status: 'confirmed' }, { ...a, status: 'pending' }), null)
  assert.deepEqual(parseKind('doctor_new'), { event: 'booking_received', audience: 'admin' })
  assert.equal(parseKind('booking_received:nobody'), null)
})

/* ── Reminders ──────────────────────────────────────────────────────────── */

const cron = (secret = CRON_SECRET) => new Request('https://x.test/api/cron/appointment-reminders', { headers: { authorization: `Bearer ${secret}` } })

test('reminders go once to confirmed appointments the configured number of days ahead', async () => {
  const db = memoryDb(() => NOW)
  turnOn(db, 'appointment_reminder', 'customer')
  const { booking } = await book(db, { date: '2026-10-15' })
  await book(db, { date: '2026-10-15', slot: 'evening', requestId: 'req-notify-0002' }) // still pending: no reminder
  Object.assign(db.appointments.get(booking.id)!, { status: 'confirmed' })

  const meta = metaStub('sent')
  const res = await handleReminderJob(cron(), { env, db, fetch: meta.fetchImpl, now: () => NOW, log: silent })
  assert.deepEqual(await res.json(), { ok: true, bookings: 1, sent: 1, failed: 0, skipped: 0 })
  const [sent] = bodies(meta.calls)
  assert.equal(sent.body.to, PATIENT)
  assert.equal(sent.body.template.name, 'appointment_reminder')

  const again = metaStub('sent')
  await handleReminderJob(cron(), { env, db, fetch: again.fetchImpl, now: () => NOW, log: silent })
  assert.equal(again.calls.length, 0, 'not twice')
})

test('reminder timing and switching come from the settings; the job needs the cron secret', async () => {
  const db = memoryDb(() => NOW)
  const { booking } = await book(db, { date: '2026-10-16' })
  Object.assign(db.appointments.get(booking.id)!, { status: 'confirmed' })
  const run = async () => {
    const meta = metaStub('sent')
    await handleReminderJob(cron(), { env, db, fetch: meta.fetchImpl, now: () => NOW, log: silent })
    return meta.calls.length
  }
  assert.equal(await run(), 0, 'switched off')
  turnOn(db, 'appointment_reminder', 'customer')
  assert.equal(await run(), 0, 'one day before: not yet')
  turnOn(db, 'appointment_reminder', 'customer', { days_before: 2 })
  assert.equal(await run(), 1)
  assert.equal((await handleReminderJob(cron('wrong'), { env, db, log: silent })).status, 401)
})

/* ── Before the settings table exists ───────────────────────────────────── */

test('until the settings migration is run, the practice alert still works from WHATSAPP_TEMPLATE_NAME', async () => {
  const db = memoryDb(() => NOW)
  db.notificationSettings = async () => {
    throw new DbError(404)
  }
  const { meta } = await book(db)
  const [call] = bodies(meta.calls)
  assert.equal(call.body.template.name, 'new_booking_request')
  assert.equal(call.body.to, '919000000000')
})

test('the settings and reminder lookups are read-only Supabase queries', async () => {
  const calls: { url: string; method?: string }[] = []
  const fake = (async (url: string, init: RequestInit) => {
    calls.push({ url, method: init.method })
    return Response.json([])
  }) as typeof fetch
  const db = supabaseDb('https://abc.supabase.co', 'k', fake)
  await db.notificationSettings('booking_confirmed')
  await db.appointmentsOn('2026-10-15', 50)
  assert.ok(calls.every((c) => c.method === undefined))
  assert.match(calls[0].url, /\/rest\/v1\/notification_settings\?event=eq\.booking_confirmed&select=\*/)
  assert.match(calls[1].url, /status=in\.\(confirmed,rescheduled\)&or=\(scheduled_date\.eq\.2026-10-15,and\(scheduled_date\.is\.null,requested_date\.eq\.2026-10-15\)\)/)
})
