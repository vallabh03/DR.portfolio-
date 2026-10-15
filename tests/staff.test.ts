/**
 * Tests for the staff actions (api/_lib/staff.ts), the delivery webhook
 * (api/whatsapp-webhook.ts) and the Supabase requests (api/_lib/db.ts).
 * Run with: npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { handleConsultation, createLimiter } from '../api/consultation.ts'
import { handleRetry, handleStatusChange } from '../api/_lib/staff.ts'
import { handleWebhook, statusUpdates } from '../api/whatsapp-webhook.ts'
import { memoryDb, supabaseDb, type MemoryDb } from '../api/_lib/db.ts'
import { ENV, metaStub } from './helpers.ts'

const NOW = Date.UTC(2026, 9, 6, 12)
const ORIGIN = 'https://www.example.test'
const STAFF_TOKEN = 'staff-access-token'

function post(path: string, body: unknown, token: string | null = STAFF_TOKEN) {
  const headers = new Headers({ host: 'www.example.test', origin: ORIGIN, 'content-type': 'application/json', 'x-real-ip': '203.0.113.50' })
  if (token) headers.set('authorization', `Bearer ${token}`)
  return new Request(`https://www.example.test${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
}

/** A database with one pending booking, signed-in staff, and the doctor already notified. */
async function setup() {
  const db = memoryDb(() => NOW)
  db.staff.set(STAFF_TOKEN, { userId: 'staff-1', name: 'Reception', role: 'receptionist' })
  const res = await handleConsultation(
    new Request('https://www.example.test/api/consultation', {
      method: 'POST',
      headers: { host: 'www.example.test', origin: ORIGIN, 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Visitor',
        phone: '+91 98765 43210',
        email: '',
        date: '2026-10-20',
        slot: 'morning',
        message: '',
        consent: true,
        requestId: 'req-staff-0001',
        elapsedMs: 30_000,
        website: '',
      }),
    }),
    { env: ENV, db, limiter: createLimiter(), fetch: metaStub('sent').fetchImpl, now: () => NOW, log: silent },
  )
  assert.equal(res.status, 201)
  const [appointment] = [...db.appointments.values()]
  return { db, appointment }
}

const silent = { info() {}, warn() {}, error() {} }
const opts = (db: MemoryDb, meta = metaStub('sent')) => ({ env: ENV, db, fetch: meta.fetchImpl, now: () => NOW, log: silent, limiter: createLimiter() })
const action = (appointmentId: string, extra: Record<string, unknown>) => ({ appointmentId, version: 0, actionId: 'act-0001-abcd', ...extra })

test('staff actions need a signed-in staff account', async () => {
  const { db, appointment } = await setup()
  for (const token of [null, 'not-staff']) {
    const res = await handleStatusChange(post('/api/appointments/status', action(appointment.id, { action: 'confirm' }), token), opts(db))
    assert.equal(res.status, 401)
  }
  assert.equal(db.appointments.get(appointment.id)?.status, 'pending')
})

test('confirming sets the status and sends the patient the confirmation template once', async () => {
  const { db, appointment } = await setup()
  const meta = metaStub('sent')
  const res = await handleStatusChange(post('/api/appointments/status', action(appointment.id, { action: 'confirm' })), opts(db, meta))
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { ok: true, status: 'confirmed', version: 1, notification: 'sent' })
  const saved = db.appointments.get(appointment.id)!
  assert.equal(saved.status, 'confirmed')
  assert.equal(saved.scheduled_date, '2026-10-20')
  assert.equal(saved.status_changed_by, 'staff-1')

  assert.equal(meta.calls.length, 1)
  const sent = JSON.parse(String(meta.calls[0].init.body))
  assert.equal(sent.to, '919876543210')
  assert.equal(sent.template.name, 'appointment_confirmed')
  assert.deepEqual(sent.template.components[0].parameters, [
    { type: 'text', parameter_name: 'name', text: 'Test Visitor' },
    { type: 'text', parameter_name: 'booking_id', text: appointment.booking_ref },
    { type: 'text', parameter_name: 'date_time', text: '20 October 2026, Morning' },
  ])

  // The dashboard retrying the same action (same action id) does not send again.
  const repeat = await handleStatusChange(post('/api/appointments/status', action(appointment.id, { action: 'confirm' })), opts(db, meta))
  assert.equal(repeat.status, 200)
  assert.equal((await repeat.json()).notification, 'already_sent')
  assert.equal(meta.calls.length, 1)
})

test('rescheduling needs a new date and slot, and tells the patient the new time', async () => {
  const { db, appointment } = await setup()
  assert.equal((await handleStatusChange(post('/api/appointments/status', action(appointment.id, { action: 'reschedule' })), opts(db))).status, 422)
  const meta = metaStub('sent')
  const res = await handleStatusChange(post('/api/appointments/status', action(appointment.id, { action: 'reschedule', date: '2026-10-22', slot: 'afternoon' })), opts(db, meta))
  assert.equal(res.status, 200)
  const sent = JSON.parse(String(meta.calls[0].init.body))
  assert.equal(sent.template.name, 'appointment_rescheduled')
  assert.equal(sent.template.components[0].parameters[2].text, '22 October 2026, Afternoon')
  assert.equal(db.appointments.get(appointment.id)?.scheduled_slot, 'afternoon')
})

test('rejecting sends the declined template without a date', async () => {
  const { db, appointment } = await setup()
  const meta = metaStub('sent')
  const res = await handleStatusChange(post('/api/appointments/status', action(appointment.id, { action: 'reject' })), opts(db, meta))
  assert.equal(res.status, 200)
  const sent = JSON.parse(String(meta.calls[0].init.body))
  assert.equal(sent.template.name, 'appointment_declined')
  assert.deepEqual(sent.template.components[0].parameters.map((p: { parameter_name: string }) => p.parameter_name), ['name', 'booking_id'])
})

test('a change made from an out-of-date view is refused, so two staff cannot overwrite each other', async () => {
  const { db, appointment } = await setup()
  await handleStatusChange(post('/api/appointments/status', action(appointment.id, { action: 'confirm' })), opts(db))
  const late = await handleStatusChange(post('/api/appointments/status', action(appointment.id, { action: 'reject', actionId: 'act-0002-abcd' })), opts(db))
  assert.equal(late.status, 409)
  assert.equal((await late.json()).error, 'stale')
  assert.equal(db.appointments.get(appointment.id)?.status, 'confirmed')
})

test('a failed patient message is recorded and can be retried from the dashboard, once', async () => {
  const { db, appointment } = await setup()
  const res = await handleStatusChange(post('/api/appointments/status', action(appointment.id, { action: 'confirm' })), opts(db, metaStub('rejected')))
  assert.equal(res.status, 200)
  assert.equal((await res.json()).notification, 'failed')
  const failed = [...db.notifications.values()].find((n) => n.kind === 'patient_confirmed')!
  assert.equal(failed.status, 'failed')
  assert.match(failed.last_error ?? '', /code 132000/)

  const meta = metaStub('sent')
  const retry = await handleRetry(post('/api/notifications/retry', { notificationId: failed.id }), opts(db, meta))
  assert.equal(retry.status, 200)
  assert.equal(meta.calls.length, 1)
  assert.equal(db.notifications.get(failed.id)?.status, 'sent')

  const again = await handleRetry(post('/api/notifications/retry', { notificationId: failed.id }), opts(db, meta))
  assert.equal((await again.json()).notification, 'already_sent')
  assert.equal(meta.calls.length, 1)
})

test('two retries at the same moment send once', async () => {
  const { db, appointment } = await setup()
  await handleStatusChange(post('/api/appointments/status', action(appointment.id, { action: 'confirm' })), opts(db, metaStub('rejected')))
  const failed = [...db.notifications.values()].find((n) => n.kind === 'patient_confirmed')!
  const meta = metaStub('sent')
  await Promise.all([1, 2, 3].map(() => handleRetry(post('/api/notifications/retry', { notificationId: failed.id }), opts(db, meta))))
  assert.equal(meta.calls.length, 1)
})

test('staff input is validated', async () => {
  const { db, appointment } = await setup()
  const bad = [
    { ...action(appointment.id, { action: 'delete' }) },
    { ...action('not-a-uuid', { action: 'confirm' }) },
    { ...action(appointment.id, { action: 'confirm' }), version: -1 },
    { ...action(appointment.id, { action: 'reschedule', date: '2026-02-30', slot: 'morning' }) },
    { ...action(appointment.id, { action: 'reschedule', date: '2026-10-22', slot: 'toString' }) },
  ]
  for (const body of bad) assert.equal((await handleStatusChange(post('/api/appointments/status', body), opts(db))).status, 422, JSON.stringify(body))
  assert.equal((await handleRetry(post('/api/notifications/retry', { notificationId: 'x' }), opts(db))).status, 422)
})

/* ── Delivery webhook ────────────────────────────────────────────────────── */

const APP_SECRET = 'app-secret-not-real'
const signed = (body: string, secret = APP_SECRET) =>
  new Request('https://www.example.test/api/whatsapp-webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': `sha256=${createHmac('sha256', secret).update(body).digest('hex')}` },
    body,
  })

test('the webhook verifies Meta’s subscription check with the verify token', async () => {
  const env = { WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'verify-me' }
  const ok = await handleWebhook(new Request('https://x.test/api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=123'), { env, log: silent })
  assert.equal(ok.status, 200)
  assert.equal(await ok.text(), '123')
  const wrong = await handleWebhook(new Request('https://x.test/api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=123'), { env, log: silent })
  assert.equal(wrong.status, 403)
})

test('the webhook records delivery status only for correctly signed payloads', async () => {
  const { db } = await setup()
  const [n] = [...db.notifications.values()]
  const body = JSON.stringify({ entry: [{ changes: [{ value: { statuses: [{ id: n.meta_message_id, status: 'delivered' }] } }] }] })
  const env = { WHATSAPP_APP_SECRET: APP_SECRET }
  assert.equal((await handleWebhook(signed(body, 'wrong-secret'), { env, db, log: silent })).status, 401)
  assert.equal(db.notifications.get(n.id)?.delivery_status, 'sent')
  assert.equal((await handleWebhook(signed(body), { env, db, log: silent })).status, 200)
  assert.equal(db.notifications.get(n.id)?.delivery_status, 'delivered')
})

test('webhook payloads are read defensively', () => {
  assert.deepEqual(statusUpdates(null), [])
  assert.deepEqual(statusUpdates({ entry: [{ changes: [{ value: { statuses: [{ id: 'w1', status: 'failed', errors: [{ code: 131026 }] }, { id: 2, status: 'read' }, { id: 'w3', status: 'odd' }] } }] }] }), [
    { id: 'w1', status: 'failed', error: 'code 131026' },
  ])
})

/* ── Supabase requests ───────────────────────────────────────────────────── */

test('Supabase is called server-side with the service key, through the booking function', async () => {
  const calls: { url: string; init: RequestInit }[] = []
  const fake = (async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return Response.json({ result: 'limited' })
  }) as typeof fetch
  const db = supabaseDb('https://abc.supabase.co/', 'service-key', fake)
  const r = await db.createBooking('req-1234-abcd', 'f'.repeat(64), { name: 'A B', phone: '919876543210', email: '', date: '2026-10-20', slot: 'morning', type: 'in_person', message: '', consent: true }, 3)
  assert.deepEqual(r, { result: 'limited' })
  assert.equal(calls[0].url, 'https://abc.supabase.co/rest/v1/rpc/create_booking')
  const h = calls[0].init.headers as Record<string, string>
  assert.equal(h.apikey, 'service-key')
  assert.equal(h.Authorization, 'Bearer service-key')
  assert.equal(JSON.parse(String(calls[0].init.body)).p_max_per_phone_per_day, 3)
})

test('a staff token is checked with Supabase Auth and the staff list', async () => {
  const fake = (async (url: string) => {
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: 'user-1' })
    if (url.includes('/rest/v1/staff?user_id=eq.user-1')) return Response.json([{ user_id: 'user-1', name: 'Dr', role: 'doctor' }])
    return new Response('[]')
  }) as typeof fetch
  assert.deepEqual(await supabaseDb('https://abc.supabase.co', 'k', fake).staffForToken('t'), { userId: 'user-1', name: 'Dr', role: 'doctor' })
  const notStaff = (async (url: string) => (url.endsWith('/auth/v1/user') ? Response.json({ id: 'user-2' }) : Response.json([]))) as typeof fetch
  assert.equal(await supabaseDb('https://abc.supabase.co', 'k', notStaff).staffForToken('t'), null)
  const badToken = (async () => new Response('{}', { status: 401 })) as typeof fetch
  assert.equal(await supabaseDb('https://abc.supabase.co', 'k', badToken).staffForToken('t'), null)
})
