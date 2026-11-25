/**
 * Tests for the booking endpoint (api/consultation.ts). The database is the
 * in-memory implementation with the same rules as the SQL functions, and Meta
 * is never called: every test passes a stand-in fetch and records what would
 * have been sent.
 * Run with: npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLimiter, handleConsultation, normalisePhone, type Env } from '../api/consultation.ts'
import { type BookingDb, type MemoryDb } from '../api/_lib/db.ts'
import { ENV, metaStub, practiceOnlyDb as memoryDb, SECRET, type Call } from './helpers.ts'

const NOW = Date.UTC(2026, 9, 6, 12)
const ORIGIN = 'https://www.example.test'


const valid = {
  name: 'Test Visitor',
  phone: '+91 98765 43210',
  email: 'visitor@example.test',
  date: '2026-10-20',
  slot: 'morning',
  message: 'Consultation regarding a follow-up.',
  consent: true,
  requestId: 'req-0001-abcdef',
  elapsedMs: 30_000,
  website: '',
}

function request(body: unknown, init: { method?: string; origin?: string | null; type?: string; ip?: string; raw?: string } = {}) {
  const headers = new Headers({ host: 'www.example.test', 'x-real-ip': init.ip ?? '203.0.113.1' })
  if (init.origin !== null) headers.set('origin', init.origin ?? ORIGIN)
  headers.set('content-type', init.type ?? 'application/json')
  const method = init.method ?? 'POST'
  return new Request('https://www.example.test/api/consultation', { method, headers, body: method === 'GET' ? undefined : (init.raw ?? JSON.stringify(body)) })
}

type RunOptions = {
  meta?: ReturnType<typeof metaStub>
  env?: Env
  db?: BookingDb | null
  limiter?: ReturnType<typeof createLimiter>
  logs?: string[]
  now?: number
} & Parameters<typeof request>[1]

async function run(body: unknown, opts: RunOptions = {}) {
  const meta = opts.meta ?? metaStub('sent')
  const logs = opts.logs ?? []
  const db = opts.db === undefined ? memoryDb(() => opts.now ?? NOW) : opts.db
  const res = await handleConsultation(request(body, opts), {
    env: opts.env ?? ENV,
    db,
    limiter: opts.limiter ?? createLimiter(),
    fetch: meta.fetchImpl,
    now: () => opts.now ?? NOW,
    log: { info: (m) => logs.push(m), warn: (m) => logs.push(m), error: (m) => logs.push(m) },
  })
  const text = await res.text()
  return { res, text, json: JSON.parse(text) as { ok: boolean; error?: string; bookingRef?: string; status?: string }, meta, logs, db: db as MemoryDb }
}

const sentBody = (call: Call) => JSON.parse(String(call.init.body))

/* ── Booking and doctor notification ─────────────────────────────────────── */

test('a valid booking is saved as pending, gets a reference, and the doctor is notified with the template', async () => {
  const { res, json, meta, db } = await run(valid)
  assert.equal(res.status, 201)
  assert.equal(json.ok, true)
  assert.equal(json.status, 'pending')
  assert.match(json.bookingRef ?? '', /^AT-[A-Z2-9]{6}$/)

  const [saved] = [...db.appointments.values()]
  assert.equal(saved.booking_ref, json.bookingRef)
  assert.equal(saved.status, 'pending')
  assert.equal(saved.patient_phone, '919876543210')
  assert.equal(saved.consultation_type, 'in_person')
  assert.equal(saved.requested_slot, 'morning')

  assert.equal(meta.calls.length, 1)
  const { url, init } = meta.calls[0]
  assert.equal(url, 'https://graph.facebook.com/v23.0/1234567890/messages')
  assert.equal((init.headers as Record<string, string>).Authorization, `Bearer ${SECRET}`)
  const sent = sentBody(meta.calls[0])
  assert.equal(sent.to, '919000000000')
  assert.equal(sent.template.name, 'new_booking_request')
  assert.deepEqual(sent.template.components[0].parameters, [
    { type: 'text', parameter_name: 'booking_id', text: json.bookingRef },
    { type: 'text', parameter_name: 'name', text: 'Test Visitor' },
    { type: 'text', parameter_name: 'phone', text: '+919876543210' },
    { type: 'text', parameter_name: 'requested', text: '20 October 2026, Morning' },
    { type: 'text', parameter_name: 'type', text: 'In-person' },
    { type: 'text', parameter_name: 'status', text: 'Pending' },
  ])

  const [n] = [...db.notifications.values()]
  assert.equal(n.kind, 'booking_received:admin')
  assert.equal(n.recipient, '919000000000')
  assert.equal(n.status, 'sent')
  assert.equal(n.meta_message_id, 'wamid.TEST-1')
  assert.equal(n.attempts, 1)
})

test('the booking is kept when WhatsApp fails, the failure is recorded, and the response is still a booking', async () => {
  for (const kind of ['rejected', 'network', 'timeout'] as const) {
    const { res, json, db, text, logs } = await run(valid, { meta: metaStub(kind) })
    assert.equal(res.status, 201, kind)
    assert.match(json.bookingRef ?? '', /^AT-/)
    assert.equal(db.appointments.size, 1)
    const [n] = [...db.notifications.values()]
    assert.equal(n.status, 'failed', kind)
    assert.ok(n.last_error, kind)
    // Meta's error text (which can echo submitted values) and secrets never reach the response or logs.
    const everything = text + logs.join('\n') + (n.last_error ?? '')
    for (const leaked of [SECRET, valid.name, valid.email, '98765']) assert.ok(!everything.includes(leaked), `${kind}: ${leaked}`)
  }
})

test('a retry of the same request returns the same booking and only retries a notification that failed', async () => {
  const db = memoryDb(() => NOW)
  const first = await run(valid, { db, meta: metaStub('rejected') })
  assert.equal(first.res.status, 201)
  const retry = await run(valid, { db, meta: metaStub('sent') })
  assert.equal(retry.res.status, 200)
  assert.equal(retry.json.bookingRef, first.json.bookingRef)
  assert.equal(retry.meta.calls.length, 1)
  assert.equal(db.appointments.size, 1)
  const [n] = [...db.notifications.values()]
  assert.equal(n.status, 'sent')
  assert.equal(n.attempts, 2)

  // Once sent, repeats never send again.
  const again = await run(valid, { db })
  assert.equal(again.json.bookingRef, first.json.bookingRef)
  assert.equal(again.meta.calls.length, 0)
})

test('the same details sent again with a new request id are the same booking, not a duplicate', async () => {
  const db = memoryDb(() => NOW)
  const first = await run(valid, { db })
  const second = await run({ ...valid, requestId: 'req-0002-abcdef' }, { db, ip: '203.0.113.9' })
  assert.equal(second.res.status, 200)
  assert.equal(second.json.bookingRef, first.json.bookingRef)
  assert.equal(second.meta.calls.length, 0)
  assert.equal(db.appointments.size, 1)
})

test('a request id reused with different details is a conflict', async () => {
  const db = memoryDb(() => NOW)
  await run(valid, { db })
  const reused = await run({ ...valid, message: 'Something else entirely.' }, { db })
  assert.equal(reused.res.status, 409)
  assert.equal(reused.json.error, 'conflict')
  assert.equal(reused.meta.calls.length, 0)
  assert.equal(db.appointments.size, 1)
})

test('concurrent copies of one request create one booking and send one notification', async () => {
  const db = memoryDb(() => NOW)
  const meta = metaStub('sent')
  const results = await Promise.all([run(valid, { db, meta }), run(valid, { db, meta }), run(valid, { db, meta })])
  assert.equal(new Set(results.map((r) => r.json.bookingRef)).size, 1)
  assert.equal(db.appointments.size, 1)
  assert.equal(meta.calls.length, 1)
})

test('at most three bookings per phone number per day', async () => {
  const db = memoryDb(() => NOW)
  const statuses: number[] = []
  for (let i = 0; i < 4; i++) statuses.push((await run({ ...valid, requestId: `req-day-${i}abcd`, message: `m${i}` }, { db, ip: `203.0.113.${20 + i}` })).res.status)
  assert.deepEqual(statuses, [201, 201, 201, 429])
})

test('missing database configuration returns unavailable and sends nothing', async () => {
  const { res, json, meta, logs } = await run(valid, { db: null, env: ENV })
  assert.equal(res.status, 503)
  assert.equal(json.error, 'unavailable')
  assert.equal(meta.calls.length, 0)
  assert.match(logs.join(), /database is not configured/)
})

test('a database failure returns save_failed and sends nothing', async () => {
  const broken: BookingDb = { ...memoryDb(), createBooking: async () => Promise.reject(new Error('database request failed (500)')) }
  const { res, json, meta } = await run(valid, { db: broken })
  assert.equal(res.status, 502)
  assert.equal(json.error, 'save_failed')
  assert.equal(meta.calls.length, 0)
})

test('missing WhatsApp settings keep the booking and mark the notification for retry', async () => {
  const { res, db, meta } = await run(valid, { env: { ...ENV, WHATSAPP_ACCESS_TOKEN: '' } })
  assert.equal(res.status, 201)
  assert.equal(meta.calls.length, 0)
  const [n] = [...db.notifications.values()]
  assert.equal(n.status, 'failed')
  assert.equal(n.last_error, 'not_configured')
})

/* ── Validation ──────────────────────────────────────────────────────────── */

test('phone numbers need a country code', () => {
  assert.equal(normalisePhone('+91 98765 43210'), '919876543210')
  assert.equal(normalisePhone('+1 (415) 555-0100'), '14155550100')
  for (const bad of ['98765 43210', '+0 98765 43210', '+91', 'call me', '+91 98765 43210 1234 5678']) assert.equal(normalisePhone(bad), null, bad)
})

test('server-side validation rejects bad input and saves nothing', async () => {
  const cases: Record<string, unknown> = {
    'empty fields': { elapsedMs: 30_000, requestId: 'req-empty-abc' },
    'missing name': { ...valid, name: '' },
    'long name': { ...valid, name: 'x'.repeat(101) },
    'phone without country code': { ...valid, phone: '98765 43210' },
    'invalid phone': { ...valid, phone: 'call me' },
    'invalid email': { ...valid, email: 'not-an-email' },
    'no date': { ...valid, date: '' },
    'past date': { ...valid, date: '2026-01-01' },
    'too far ahead': { ...valid, date: '2027-12-01' },
    'impossible date': { ...valid, date: '2026-02-30' },
    'no slot': { ...valid, slot: '' },
    'unknown slot': { ...valid, slot: 'midnight' },
    'type not offered': { ...valid, type: 'online' },
    'long message': { ...valid, message: 'x'.repeat(1001) },
    'no consent': { ...valid, consent: false },
    'consent as string': { ...valid, consent: 'true' },
    'no request id': { ...valid, requestId: '' },
    'array body': [valid],
  }
  for (const [label, body] of Object.entries(cases)) {
    const { res, json, meta, db } = await run(body)
    assert.equal(res.status, 422, label)
    assert.equal(json.error, 'invalid', label)
    assert.equal(meta.calls.length, 0, label)
    assert.equal(db.appointments.size, 0, label)
  }
})

test('email and message are optional; in-person is accepted when named', async () => {
  for (const body of [{ ...valid, email: '', message: '' }, { ...valid, type: 'in_person', requestId: 'req-type-abcd', message: 'x' }]) {
    assert.equal((await run(body)).res.status, 201)
  }
})

test('slot accepts only the listed options, never inherited object properties', async () => {
  for (const slot of ['toString', 'constructor', 'hasOwnProperty', '__proto__', 'valueOf', 'Morning']) {
    const { res } = await run({ ...valid, slot })
    assert.equal(res.status, 422, slot)
  }
})

test('only the form fields are accepted, and text fields must be text', async () => {
  const { message: _omitted, ...withoutMessage } = valid
  const cases: Record<string, unknown> = {
    'date as a number': { ...valid, date: 20261020 },
    'slot as null': { ...valid, slot: null },
    'message as an object': { ...valid, message: { text: 'hi' } },
    'missing field': withoutMessage,
    'unexpected extra field': { ...valid, status: 'confirmed' },
  }
  for (const [label, body] of Object.entries(cases)) assert.equal((await run(body)).res.status, 422, label)
  const raw = JSON.stringify(valid).replace(/^\{/, '{"__proto__":{"admin":true},')
  assert.equal((await run(null, { raw })).res.status, 422)
})

test('spam signals are rejected', async () => {
  for (const body of [{ ...valid, website: 'http://spam.test' }, { ...valid, website: 1 }, { ...valid, elapsedMs: 400 }, { ...valid, elapsedMs: undefined }]) {
    const { res, meta, db } = await run(body)
    assert.equal(res.status, 400)
    assert.equal(meta.calls.length, 0)
    assert.equal(db.appointments.size, 0)
  }
})

test('malformed, oversized, cross-origin and wrong-method requests are rejected', async () => {
  assert.equal((await run(null, { raw: '{not json' })).res.status, 400)
  assert.equal((await run(null, { raw: JSON.stringify({ ...valid, message: 'x'.repeat(9000) }) })).res.status, 413)
  assert.equal((await run(valid, { origin: 'https://evil.test' })).res.status, 403)
  assert.equal((await run(valid, { origin: null })).res.status, 403)
  assert.equal((await run(valid, { type: 'text/plain' })).res.status, 415)
  assert.equal((await run(valid, { method: 'GET' })).res.status, 405)
})

test('ALLOWED_ORIGINS restricts which sites may post', async () => {
  const env = { ...ENV, ALLOWED_ORIGINS: 'https://www.real.test' }
  assert.equal((await run(valid, { env })).res.status, 403)
  assert.equal((await run(valid, { env, origin: 'https://www.real.test' })).res.status, 201)
})

test('more than five requests from one address in ten minutes are rate limited', async () => {
  const limiter = createLimiter()
  const db = memoryDb(() => NOW)
  const statuses: number[] = []
  for (let i = 0; i < 6; i++) statuses.push((await run(null, { limiter, db, raw: '{bad' })).res.status)
  assert.deepEqual(statuses, [400, 400, 400, 400, 400, 429])
})

test('responses carry no-store and JSON content type', async () => {
  const { res } = await run(valid)
  assert.equal(res.headers.get('cache-control'), 'no-store')
  assert.match(res.headers.get('content-type') ?? '', /application\/json/)
})

test('an unexpected error returns a generic 500 without secrets, request content or stack', async () => {
  const logs: string[] = []
  const broken: BookingDb = {
    ...memoryDb(),
    createBooking: () => {
      throw new TypeError(`boom ${valid.name} ${valid.email} ${SECRET}`)
    },
  }
  const { res, text } = await run(valid, { db: broken, logs })
  // createBooking throwing synchronously is still caught where the save happens.
  assert.equal(res.status, 502)
  const everything = text + '\n' + logs.join('\n')
  for (const leaked of [SECRET, valid.name, valid.email, 'boom']) assert.ok(!everything.includes(leaked), leaked)
})
