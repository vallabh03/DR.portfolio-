/**
 * Tests for api/consultation.ts. Meta is never called: every test passes a
 * stand-in fetch and records what would have been sent.
 * Run with: npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { createStore, handleConsultation, templateParameters, type Env } from '../api/consultation.ts'
import { createConsultationMiddleware } from '../vite.config.ts'

const NOW = Date.UTC(2026, 9, 6, 12)
const ORIGIN = 'https://www.example.test'
const SECRET = 'test-token-not-real'

const ENV: Env = {
  WHATSAPP_ACCESS_TOKEN: SECRET,
  WHATSAPP_PHONE_NUMBER_ID: '1234567890',
  WHATSAPP_RECIPIENT_NUMBER: '+91 90000 00000',
  WHATSAPP_TEMPLATE_NAME: 'consultation_request',
  WHATSAPP_TEMPLATE_LANGUAGE: 'en',
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SECRET_KEY: 'test-secret-key',
}

const valid = {
  name: 'Test Visitor',
  phone: '+91 98765 43210',
  email: 'visitor@example.test',
  date: '2026-10-20',
  time: 'morning',
  message: 'Consultation regarding a follow-up.',
  consent: true,
  requestId: 'req-0001-abcdef',
  elapsedMs: 30_000,
  website: '',
}

type Call = { url: string; init: RequestInit }

function metaStub(kind: 'sent' | 'rejected' | 'network' | 'timeout') {
  const calls: Call[] = []
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    if (kind === 'network') throw new TypeError('fetch failed')
    if (kind === 'timeout') throw new DOMException('timed out', 'TimeoutError')
    if (kind === 'rejected') return Response.json({ error: { message: `bad ${valid.name}`, code: 132000, fbtrace_id: 'trace' } }, { status: 400 })
    return Response.json({ messages: [{ id: 'wamid.TEST' }] })
  }) as typeof fetch
  return { calls, fetchImpl }
}

function request(body: unknown, init: { method?: string; origin?: string | null; type?: string; ip?: string; raw?: string } = {}) {
  const headers = new Headers({ host: 'www.example.test', 'x-real-ip': init.ip ?? '203.0.113.1' })
  if (init.origin !== null) headers.set('origin', init.origin ?? ORIGIN)
  headers.set('content-type', init.type ?? 'application/json')
  const method = init.method ?? 'POST'
  return new Request('https://www.example.test/api/consultation', {
    method,
    headers,
    body: method === 'GET' ? undefined : (init.raw ?? JSON.stringify(body)),
  })
}

type Logger = { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void }

type RunOptions = {
  meta?: { calls: Call[]; fetchImpl: typeof fetch }
  env?: Env
  store?: ReturnType<typeof createStore>
  logs?: string[]
  log?: Logger
  now?: number
  supabase?: ReturnType<typeof createSupabaseMock>
} & Parameters<typeof request>[1]

// Supabase mock for testing
type SupabaseCall = { table: string; method: string; args: unknown[] }

function createSupabaseMock() {
  const calls: SupabaseCall[] = []
  let insertResult: { error: { code: string } | null; data: unknown } = { error: null, data: null }
  let selectResult: { data: { notification_status: string; whatsapp_message_id: string | null } | null; error: null } = {
    data: null,
    error: null,
  }
  let updateResult: { error: { code: string } | null } = { error: null }

  const mock = {
    calls,
    from(table: string) {
      return {
        insert(data: unknown) {
          calls.push({ table, method: 'insert', args: [data] })
          return Promise.resolve(insertResult)
        },
        select(columns: string) {
          return {
            eq(key: string, value: string) {
              calls.push({ table, method: 'select', args: [columns, key, value] })
              return {
                single() {
                  return Promise.resolve(selectResult)
                },
              }
            },
          }
        },
        update(data: unknown) {
          return {
            eq(key: string, value: string) {
              calls.push({ table, method: 'update', args: [data, key, value] })
              return Promise.resolve(updateResult)
            },
          }
        },
        raw(sql: string) {
          return { raw: sql }
        },
      }
    },
    __setInsertResult(result: typeof insertResult) {
      insertResult = result
    },
    __setSelectResult(result: typeof selectResult) {
      selectResult = result
    },
    __setUpdateResult(result: typeof updateResult) {
      updateResult = result
    },
  }
  return mock
}

async function run(body: unknown, opts: RunOptions = {}) {
  const meta = opts.meta ?? metaStub('sent')
  const logs = opts.logs ?? []
  const log = opts.log ?? { info: (m: string) => logs.push(m), warn: (m: string) => logs.push(m), error: (m: string) => logs.push(m) }
  const supabaseMock = opts.supabase ?? createSupabaseMock()

  const res = await handleConsultation(request(body, opts), {
    env: opts.env ?? ENV,
    store: opts.store ?? createStore(),
    fetch: meta.fetchImpl,
    now: () => opts.now ?? NOW,
    log,
    supabaseClient: supabaseMock as any,
  })
  const text = await res.text()
  return { res, text, json: JSON.parse(text) as { ok: boolean; error?: string }, meta, logs, supabase: supabaseMock }
}

test('valid request is sent as the approved template and returns ok', async () => {
  const { res, json, meta } = await run(valid)
  assert.equal(res.status, 200)
  assert.deepEqual(json, { ok: true })
  assert.equal(meta.calls.length, 1)
  const { url, init } = meta.calls[0]
  assert.equal(url, 'https://graph.facebook.com/v23.0/1234567890/messages')
  assert.equal((init.headers as Record<string, string>).Authorization, `Bearer ${SECRET}`)
  const sent = JSON.parse(String(init.body))
  assert.equal(sent.to, '919000000000')
  assert.equal(sent.type, 'template')
  assert.equal(sent.template.name, 'consultation_request')
  assert.deepEqual(sent.template.components[0].parameters, [
    { type: 'text', parameter_name: 'name', text: 'Test Visitor' },
    { type: 'text', parameter_name: 'phone', text: '+91 98765 43210' },
    { type: 'text', parameter_name: 'email', text: 'visitor@example.test' },
    {
      type: 'text',
      parameter_name: 'details',
      text: 'Preferred Date: 20 October 2026 · Preferred Time: Morning · Reason: Consultation regarding a follow-up. · Consent: Yes',
    },
  ])
})

test('fields the visitor did not enter are left out of the message', () => {
  const p = templateParameters({ name: 'A B', phone: '0123456789', email: 'a@b.co', date: '', time: '', message: '' })
  assert.equal(p.details, 'Consent: Yes')
})

test('email is optional; when left empty the request is accepted and the message says so', async () => {
  const p = templateParameters({ name: 'A B', phone: '0123456789', email: '', date: '', time: '', message: '' })
  assert.equal(p.email, 'Not provided')
  const { res, meta } = await run({ ...valid, email: '', requestId: 'req-no-email-abc' })
  assert.equal(res.status, 200)
  assert.equal(meta.calls.length, 1)
})

test('line breaks in the message become spaces; very long messages are shortened', () => {
  const p = templateParameters({ name: 'A B', phone: '0123456789', email: 'a@b.co', date: '', time: '', message: 'one\n\ntwo\tthree' })
  assert.equal(p.details, 'Reason: one two three · Consent: Yes')
  const long = templateParameters({ name: 'N'.repeat(100), phone: '0123456789', email: 'e'.repeat(240) + '@x.co', date: '', time: '', message: 'x'.repeat(1000) })
  assert.ok(long.details.endsWith('… (shortened) · Consent: Yes'))
  assert.ok(Object.values(long).join('').length <= 840)
  for (const v of Object.values(long)) assert.ok(!/[\n\t]| {4}/.test(v))
})

test('Meta rejection returns delivery_failed and never echoes Meta or secrets', async () => {
  const { res, text, logs } = await run(valid, { meta: metaStub('rejected') })
  assert.equal(res.status, 502)
  assert.equal(JSON.parse(text).error, 'delivery_failed')
  assert.ok(!text.includes('132000') && !text.includes(SECRET))
  const joined = logs.join('\n')
  assert.ok(joined.includes('code 132000'))
  assert.ok(!joined.includes(valid.name) && !joined.includes(valid.email) && !joined.includes(SECRET))
})

test('network failure and timeout return delivery_failed', async () => {
  for (const kind of ['network', 'timeout'] as const) {
    const { res, json } = await run(valid, { meta: metaStub(kind) })
    assert.equal(res.status, 502)
    assert.equal(json.error, 'delivery_failed')
  }
})

test('a failed request can be retried with the same request id', async () => {
  const store = createStore()
  const first = await run(valid, { store, meta: metaStub('rejected') })
  assert.equal(first.res.status, 502)
  const retry = await run(valid, { store, meta: metaStub('sent') })
  assert.equal(retry.res.status, 200)
  assert.equal(retry.meta.calls.length, 1)
})

test('a repeat of a sent request is not sent twice', async () => {
  const store = createStore()
  await run(valid, { store })
  const again = await run(valid, { store })
  assert.equal(again.res.status, 200)
  assert.equal(again.meta.calls.length, 0)
  const sameDetailsNewId = await run({ ...valid, requestId: 'req-0002-abcdef' }, { store, ip: '203.0.113.9' })
  assert.equal(sameDetailsNewId.meta.calls.length, 0)
})

test('missing configuration returns unavailable without calling Meta', async () => {
  const { res, json, meta, logs } = await run(valid, { env: { ...ENV, WHATSAPP_ACCESS_TOKEN: '' } })
  assert.equal(res.status, 503)
  assert.equal(json.error, 'unavailable')
  assert.equal(meta.calls.length, 0)
  assert.match(logs.join(), /missing WHATSAPP_ACCESS_TOKEN/)
})

test('server-side validation rejects bad input', async () => {
  const cases: Record<string, unknown> = {
    'empty fields': { elapsedMs: 30_000, requestId: 'req-empty-abc' },
    'missing name': { ...valid, name: '' },
    'long name': { ...valid, name: 'x'.repeat(101) },
    'invalid phone': { ...valid, phone: 'call me' },
    'phone without digits': { ...valid, phone: '+++++++' },
    'invalid email': { ...valid, email: 'not-an-email' },
    'past date': { ...valid, date: '2026-01-01' },
    'impossible date': { ...valid, date: '2026-02-30' },
    'unknown time': { ...valid, time: 'midnight' },
    'long message': { ...valid, message: 'x'.repeat(1001) },
    'no consent': { ...valid, consent: false },
    'consent as string': { ...valid, consent: 'true' },
    'no request id': { ...valid, requestId: '' },
    'array body': [valid],
  }
  for (const [label, body] of Object.entries(cases)) {
    const { res, json, meta } = await run(body)
    assert.equal(res.status, 422, label)
    assert.equal(json.error, 'invalid', label)
    assert.equal(meta.calls.length, 0, label)
  }
})

test('spam signals are rejected', async () => {
  for (const body of [{ ...valid, website: 'http://spam.test' }, { ...valid, elapsedMs: 400 }, { ...valid, elapsedMs: undefined }]) {
    const { res, meta } = await run(body)
    assert.equal(res.status, 400)
    assert.equal(meta.calls.length, 0)
  }
})

test('dev mock mode accepts fast submissions (elapsedMs < MIN_FILL_MS)', async () => {
  const env = { ...ENV, WHATSAPP_DEV_MOCK: 'sent' }
  const body = { ...valid, elapsedMs: 100, requestId: 'req-fast-mock-abc' }
  const { res, meta } = await run(body, { env })
  assert.equal(res.status, 200)
  assert.equal(meta.calls.length, 1)
})

test('production mode rejects fast submissions (elapsedMs < MIN_FILL_MS)', async () => {
  const body = { ...valid, elapsedMs: 100, requestId: 'req-fast-prod-abc' }
  const { res, meta } = await run(body)
  assert.equal(res.status, 400)
  assert.equal(meta.calls.length, 0)
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
  assert.equal((await run(valid, { env, origin: 'https://www.real.test' })).res.status, 200)
})

test('more than five requests from one address in ten minutes are rate limited', async () => {
  const store = createStore()
  const statuses: number[] = []
  for (let i = 0; i < 6; i++) statuses.push((await run({ ...valid, requestId: `req-rate-${i}abc`, message: `m${i}` }, { store })).res.status)
  assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429])
})

test('responses carry no-store and JSON content type', async () => {
  const { res } = await run(valid)
  assert.equal(res.headers.get('cache-control'), 'no-store')
  assert.match(res.headers.get('content-type') ?? '', /application\/json/)
})

/* ── Validation allowlists ───────────────────────────────────────────────── */

test('time accepts only the listed options, never inherited object properties', async () => {
  for (const time of ['', 'morning', 'midday', 'afternoon', 'evening']) {
    const { res } = await run({ ...valid, time, requestId: `req-time-${time || 'none'}`, message: `time ${time}` })
    assert.equal(res.status, 200, `"${time}" should be accepted`)
  }
  for (const time of ['toString', 'constructor', 'hasOwnProperty', '__proto__', 'valueOf', 'Morning']) {
    const { res, json, meta } = await run({ ...valid, time })
    assert.equal(res.status, 422, `"${time}" should be rejected`)
    assert.equal(json.error, 'invalid')
    assert.equal(meta.calls.length, 0)
  }
})

test('only the form fields are accepted, and text fields must be text', async () => {
  const { message: _omitted, ...withoutMessage } = valid
  const cases: Record<string, unknown> = {
    'date as a number': { ...valid, date: 20261020 },
    'time as null': { ...valid, time: null },
    'message as an object': { ...valid, message: { text: 'hi' } },
    'missing optional field': withoutMessage,
    'unexpected extra field': { ...valid, admin: true },
  }
  for (const [label, body] of Object.entries(cases)) {
    const { res, meta } = await run(body)
    assert.equal(res.status, 422, label)
    assert.equal(meta.calls.length, 0, label)
  }
  // A "__proto__" key written into the JSON text is an own key after parsing, so it is rejected too.
  const raw = JSON.stringify(valid).replace(/^\{/, '{"__proto__":{"admin":true},')
  assert.equal((await run(null, { raw })).res.status, 422)
})

test('a honeypot value that is not text counts as automated', async () => {
  const { res, meta } = await run({ ...valid, website: 1 })
  assert.equal(res.status, 400)
  assert.equal(meta.calls.length, 0)
})

/* ── Duplicate and idempotency handling ──────────────────────────────────── */

test('a request id reused with different details is a conflict, not a duplicate', async () => {
  const store = createStore()
  assert.equal((await run(valid, { store })).res.status, 200)
  const reused = await run({ ...valid, message: 'Something else entirely.' }, { store })
  assert.equal(reused.res.status, 409)
  assert.equal(reused.json.error, 'conflict')
  assert.equal(reused.meta.calls.length, 0)
})

test('concurrent copies of one request send once; later copies are duplicates', async () => {
  const store = createStore()
  let release!: () => void
  const gate = new Promise<void>((r) => (release = r))
  const calls: Call[] = []
  const slow = {
    calls,
    fetchImpl: (async (url: string, init: RequestInit) => {
      calls.push({ url, init })
      await gate
      return Response.json({ messages: [{ id: 'wamid.TEST' }] })
    }) as typeof fetch,
  }

  const first = run(valid, { store, meta: slow })
  await new Promise((r) => setTimeout(r, 20)) // let the first request claim its keys
  const second = await run(valid, { store, meta: slow })
  assert.equal(second.res.status, 409)
  assert.equal(second.json.error, 'in_progress')

  release()
  assert.equal((await first).res.status, 200)
  assert.equal(calls.length, 1)
  assert.equal(store.inFlight.size, 0)

  const third = await run(valid, { store })
  assert.equal(third.res.status, 200)
  assert.equal(third.meta.calls.length, 0)
})

test('in-flight state is cleared after a failure, so the request can be retried', async () => {
  const store = createStore()
  assert.equal((await run(valid, { store, meta: metaStub('timeout') })).res.status, 502)
  assert.equal(store.inFlight.size, 0)
  assert.equal(store.sent.size, 0)
  const retry = await run(valid, { store })
  assert.equal(retry.res.status, 200)
  assert.equal(retry.meta.calls.length, 1)
})

/* ── Unexpected errors ───────────────────────────────────────────────────── */

test('an unexpected error returns a generic 500 without secrets, request content or stack', async () => {
  const store = createStore()
  const logs: string[] = []
  const broken = {
    calls: [] as Call[],
    fetchImpl: (async () =>
      ({
        ok: true,
        json() {
          throw new Error(`boom ${valid.name} ${valid.email} ${SECRET}`)
        },
      }) as unknown as Response) as typeof fetch,
  }
  const { res, text } = await run(valid, { store, meta: broken, logs })
  assert.equal(res.status, 500)
  assert.deepEqual(JSON.parse(text), { ok: false, error: 'internal_error' })
  const everything = text + '\n' + logs.join('\n')
  for (const leaked of [SECRET, valid.name, valid.email, valid.phone, 'boom', 'at ']) assert.ok(!everything.includes(leaked), leaked)
  assert.match(logs.join(), /unexpected error \(Error\)/)
  assert.equal(store.inFlight.size, 0)
})

test('a failing logger never turns a sent request into a failure', async () => {
  const store = createStore()
  const down = () => {
    throw new Error('logger down')
  }
  const { res, meta } = await run(valid, { store, log: { info: down, warn: down, error: down } })
  assert.equal(res.status, 200)
  assert.equal(meta.calls.length, 1)
  // Recorded as sent, so a repeat is not sent again.
  assert.equal((await run(valid, { store })).meta.calls.length, 0)
})

/* ── Memory limits (per instance, best effort) ───────────────────────────── */

const MINUTE = 60_000

test('when the rate-limit memory is full, only the least recently active addresses are dropped', async () => {
  const store = createStore(3)
  for (const ip of ['198.51.100.1', '198.51.100.2', '198.51.100.3', '198.51.100.4']) await run(null, { store, ip, raw: '{bad' })
  assert.deepEqual([...store.hits.keys()], ['ip:198.51.100.2', 'ip:198.51.100.3', 'ip:198.51.100.4'])
})

test('an address at its limit stays limited while other addresses arrive', async () => {
  const store = createStore(3)
  for (let i = 0; i < 5; i++) await run(null, { store, ip: '198.51.100.9', raw: '{bad' })
  await run(null, { store, ip: '198.51.100.10', raw: '{bad' })
  await run(null, { store, ip: '198.51.100.11', raw: '{bad' })
  assert.equal((await run(null, { store, ip: '198.51.100.9', raw: '{bad' })).res.status, 429)
})

test('expired entries are removed before any active entry is dropped', async () => {
  const store = createStore(3)
  await run(null, { store, ip: '198.51.100.20', raw: '{bad', now: NOW - 11 * MINUTE }) // expired by NOW
  await run(null, { store, ip: '198.51.100.21', raw: '{bad', now: NOW - MINUTE })
  await run(null, { store, ip: '198.51.100.22', raw: '{bad', now: NOW })
  await run(null, { store, ip: '198.51.100.23', raw: '{bad', now: NOW })
  assert.deepEqual([...store.hits.keys()], ['ip:198.51.100.21', 'ip:198.51.100.22', 'ip:198.51.100.23'])
  assert.equal(store.hits.get('ip:198.51.100.21')?.length, 1)
})

test('sent-request memory keeps the most recent requests when full', async () => {
  const store = createStore(2)
  await run({ ...valid, requestId: 'req-old-0001', message: 'first' }, { store })
  await run({ ...valid, requestId: 'req-new-0002', message: 'second' }, { store, ip: '203.0.113.2' })
  assert.equal(store.sent.size, 2)
  assert.ok(store.sent.has('id:req-new-0002'))
  assert.ok(!store.sent.has('id:req-old-0001'))
})

/* ── Supabase persistence ────────────────────────────────────────────────── */

test('successful request persists appointment to Supabase before sending WhatsApp', async () => {
  const supabase = createSupabaseMock()
  const { res, meta, supabase: sb } = await run(valid, { supabase })

  assert.equal(res.status, 200)
  assert.equal(meta.calls.length, 1)

  // Verify Supabase insert was called with correct data
  const insertCall = sb.calls.find((c) => c.method === 'insert')
  assert.ok(insertCall, 'Supabase insert should be called')
  const insertedData = insertCall.args[0] as Record<string, unknown>
  assert.equal(insertedData.request_id, valid.requestId)
  assert.equal(insertedData.name, valid.name)
  assert.equal(insertedData.phone, valid.phone)
  assert.equal(insertedData.email, valid.email)
  assert.equal(insertedData.preferred_date, valid.date)
  assert.equal(insertedData.preferred_time, valid.time)
  assert.equal(insertedData.message, valid.message)
  assert.equal(insertedData.consent, true)
  assert.equal(insertedData.notification_status, 'pending')
})

test('missing Supabase credentials returns unavailable', async () => {
  const env = { ...ENV, SUPABASE_URL: '', SUPABASE_SECRET_KEY: '' }
  const { res, json, meta, logs } = await run(valid, { env })

  assert.equal(res.status, 503)
  assert.equal(json.error, 'unavailable')
  assert.equal(meta.calls.length, 0)
  assert.match(logs.join(), /Supabase is not configured/)
})

test('database error on insert returns unavailable without calling Meta', async () => {
  const supabase = createSupabaseMock()
  supabase.__setInsertResult({ error: { code: '42P01' }, data: null }) // table does not exist
  const { res, json, meta } = await run(valid, { supabase })

  assert.equal(res.status, 503)
  assert.equal(json.error, 'unavailable')
  assert.equal(meta.calls.length, 0)
})

test('duplicate request id returns ok without sending WhatsApp again if already sent', async () => {
  const supabase = createSupabaseMock()
  // First insert fails with unique violation
  supabase.__setInsertResult({ error: { code: '23505' }, data: null })
  // Select returns existing record with sent status
  supabase.__setSelectResult({
    data: { notification_status: 'sent', whatsapp_message_id: 'wamid.EXISTING' },
    error: null,
  })

  const { res, meta } = await run(valid, { supabase })

  assert.equal(res.status, 200)
  assert.equal(meta.calls.length, 0) // WhatsApp not called
})

test('duplicate request id with pending status retries WhatsApp', async () => {
  const supabase = createSupabaseMock()
  // First insert fails with unique violation
  supabase.__setInsertResult({ error: { code: '23505' }, data: null })
  // Select returns existing record with pending status
  supabase.__setSelectResult({
    data: { notification_status: 'pending', whatsapp_message_id: null },
    error: null,
  })

  const { res, meta } = await run(valid, { supabase })

  assert.equal(res.status, 200)
  assert.equal(meta.calls.length, 1) // WhatsApp called for retry
})

test('WhatsApp failure after persistence updates notification status to failed', async () => {
  const supabase = createSupabaseMock()
  const { res, supabase: sb } = await run(valid, { supabase, meta: metaStub('rejected') })

  assert.equal(res.status, 502)

  // Verify update was called to mark notification as failed
  const updateCall = sb.calls.find((c) => c.method === 'update')
  assert.ok(updateCall, 'Supabase update should be called on WhatsApp failure')
  const updateData = updateCall.args[0] as Record<string, unknown>
  assert.equal(updateData.notification_status, 'failed')
  assert.equal(updateData.notification_error, 'rejected')
})

test('WhatsApp network failure updates notification status to failed', async () => {
  const supabase = createSupabaseMock()
  const { res, supabase: sb } = await run(valid, { supabase, meta: metaStub('network') })

  assert.equal(res.status, 502)

  const updateCall = sb.calls.find((c) => c.method === 'update')
  assert.ok(updateCall, 'Supabase update should be called on network failure')
  const updateData = updateCall.args[0] as Record<string, unknown>
  assert.equal(updateData.notification_status, 'failed')
  assert.equal(updateData.notification_error, 'network')
})

test('WhatsApp timeout updates notification status to failed', async () => {
  const supabase = createSupabaseMock()
  const { res, supabase: sb } = await run(valid, { supabase, meta: metaStub('timeout') })

  assert.equal(res.status, 502)

  const updateCall = sb.calls.find((c) => c.method === 'update')
  assert.ok(updateCall, 'Supabase update should be called on timeout')
  const updateData = updateCall.args[0] as Record<string, unknown>
  assert.equal(updateData.notification_status, 'failed')
  assert.equal(updateData.notification_error, 'timeout')
})

test('successful WhatsApp send updates notification status to sent with message ID', async () => {
  const supabase = createSupabaseMock()
  const { res, supabase: sb } = await run(valid, { supabase })

  assert.equal(res.status, 200)

  const updateCall = sb.calls.find((c) => c.method === 'update')
  assert.ok(updateCall, 'Supabase update should be called on success')
  const updateData = updateCall.args[0] as Record<string, unknown>
  assert.equal(updateData.notification_status, 'sent')
  assert.equal(updateData.whatsapp_message_id, 'wamid.TEST')
  assert.ok(typeof updateData.notification_sent_at === 'string')
})

/* ── Regression Tests: Dev Mock Diagnostics, Rejection Paths & Vite Middleware ─ */

test('dev mock returns non-sensitive diagnostic details for honeypot', async () => {
  const env = { ...ENV, WHATSAPP_DEV_MOCK: 'sent' }
  const { res, json } = await run({ ...valid, website: 'https://bot.test', requestId: 'req-hp-dev' }, { env })
  assert.equal(res.status, 400)
  assert.equal(json.error, 'bad_request')
  assert.equal((json as Record<string, unknown>).reason, 'honeypot_filled')
})

test('production mode returns generic 400 for honeypot without diagnostic details', async () => {
  const { res, json } = await run({ ...valid, website: 'https://bot.test', requestId: 'req-hp-prod' })
  assert.equal(res.status, 400)
  assert.equal(json.error, 'bad_request')
  assert.equal((json as Record<string, unknown>).reason, undefined)
})

test('dev mock returns non-sensitive diagnostic details for invalid elapsedMs', async () => {
  const env = { ...ENV, WHATSAPP_DEV_MOCK: 'sent' }
  const { res, json } = await run({ ...valid, elapsedMs: -50, requestId: 'req-neg-elapsed' }, { env })
  assert.equal(res.status, 400)
  assert.equal(json.error, 'bad_request')
  assert.equal((json as Record<string, unknown>).reason, 'timing_invalid')
})

test('dev mock mode accepts very fast submissions (e.g. 10ms) without rejection', async () => {
  const env = { ...ENV, WHATSAPP_DEV_MOCK: 'sent' }
  const { res, json } = await run({ ...valid, elapsedMs: 10, requestId: 'req-fast-10ms' }, { env })
  assert.equal(res.status, 200)
  assert.deepEqual(json, { ok: true })
})

test('production mode rejects submissions faster than 2500ms with generic 400', async () => {
  const { res, json } = await run({ ...valid, elapsedMs: 2499, requestId: 'req-prod-fast' })
  assert.equal(res.status, 400)
  assert.equal(json.error, 'bad_request')
  assert.equal((json as Record<string, unknown>).reason, undefined)
})

test('dev mock returns non-sensitive diagnostic details for malformed JSON', async () => {
  const env = { ...ENV, WHATSAPP_DEV_MOCK: 'sent' }
  const { res, json } = await run(null, { env, raw: '{"broken": json' })
  assert.equal(res.status, 400)
  assert.equal(json.error, 'bad_request')
  assert.equal((json as Record<string, unknown>).reason, 'malformed_json')
})

test('dev mock returns field diagnostics for invalid fields', async () => {
  const env = { ...ENV, WHATSAPP_DEV_MOCK: 'sent' }
  const { res, json } = await run({ ...valid, phone: 'invalid', requestId: 'req-inv-fields' }, { env })
  assert.equal(res.status, 422)
  assert.equal(json.error, 'invalid')
  assert.deepEqual((json as Record<string, unknown>).fields, ['phone'])
})

test('dev mock returns diagnostic for missing Supabase credentials', async () => {
  const env: Env = { ...ENV, SUPABASE_URL: undefined, SUPABASE_SECRET_KEY: undefined, WHATSAPP_DEV_MOCK: 'sent' }
  const { res, json } = await run(valid, { env })
  assert.equal(res.status, 503)
  assert.equal(json.error, 'unavailable')
  assert.equal((json as Record<string, unknown>).reason, 'missing_supabase_config')
})

test('dev mock returns diagnostic for missing WhatsApp credentials when mock is not active', async () => {
  const env: Env = { ...ENV, WHATSAPP_ACCESS_TOKEN: undefined, WHATSAPP_DEV_MOCK: undefined }
  const { res, json } = await run(valid, { env })
  assert.equal(res.status, 503)
  assert.equal(json.error, 'unavailable')
  assert.equal((json as Record<string, unknown>).reason, undefined)
})

type MockResponse = {
  statusCode: number
  headers: Record<string, string>
  setHeader(name: string, value: string): void
  end(body?: string): void
  body: string
}

function createMockRes(): MockResponse {
  const headers: Record<string, string> = {}
  let body = ''
  return {
    statusCode: 200,
    headers,
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value
    },
    end(chunk?: string) {
      if (chunk) body += chunk
    },
    get body() {
      return body
    },
  }
}

function createMockReq(body: unknown, options: { url?: string; method?: string; origin?: string } = {}) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body)
  const stream = Readable.from([Buffer.from(raw)]) as any
  stream.url = options.url ?? '/api/consultation'
  stream.method = options.method ?? 'POST'
  stream.headers = {
    host: 'localhost:5173',
    origin: options.origin ?? 'http://localhost:5173',
    'content-type': 'application/json',
    'content-length': String(Buffer.byteLength(raw)),
  }
  stream.socket = { remoteAddress: '127.0.0.1' }
  return stream
}

test('Vite consultation middleware processes valid request in development mode', async () => {
  const supabase = createSupabaseMock()
  const middleware = createConsultationMiddleware('development', {
    store: createStore(),
    supabaseClient: supabase as any,
    env: { WHATSAPP_DEV_MOCK: 'sent' },
  })
  const req = createMockReq({ ...valid, requestId: 'req-vite-mw-001' })
  const res = createMockRes()
  let nextCalled = false

  await middleware(req, res as any, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 200)
  assert.equal(res.headers['content-type'], 'application/json; charset=utf-8')
  const json = JSON.parse(res.body)
  assert.equal(json.ok, true)
})

test('Vite consultation middleware ignores non-consultation paths and calls next', async () => {
  const middleware = createConsultationMiddleware('development', { store: createStore() })
  const req = createMockReq({}, { url: '/api/something-else' })
  const res = createMockRes()
  let nextCalled = false

  await middleware(req, res as any, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, true)
  assert.equal(res.body, '')
})

test('Vite consultation middleware catches honeypot submission and returns diagnostic detail', async () => {
  const middleware = createConsultationMiddleware('development', {
    store: createStore(),
    env: { WHATSAPP_DEV_MOCK: 'sent' },
  })
  const req = createMockReq({ ...valid, website: 'http://bot.test', requestId: 'req-vite-mw-hp' })
  const res = createMockRes()
  let nextCalled = false

  await middleware(req, res as any, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 400)
  const json = JSON.parse(res.body)
  assert.equal(json.ok, false)
  assert.equal(json.error, 'bad_request')
  assert.equal(json.reason, 'honeypot_filled')
})
