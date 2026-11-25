/**
 * Tests for the daily notification retry job (api/cron/retry-notifications.ts),
 * the delivery webhook (api/whatsapp-webhook.ts) and the Supabase requests
 * (api/_lib/db.ts).
 * Run with: npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { createLimiter, handleConsultation } from '../api/consultation.ts'
import { handleRetryJob, MAX_ATTEMPTS } from '../api/cron/retry-notifications.ts'
import { handleWebhook, statusUpdates } from '../api/whatsapp-webhook.ts'
import { supabaseDb, type MemoryDb } from '../api/_lib/db.ts'
import { ENV, metaStub, practiceOnlyDb as memoryDb } from './helpers.ts'

const NOW = Date.UTC(2026, 9, 6, 12)
const CRON_SECRET = 'cron-secret-not-real'
const silent = { info() {}, warn() {}, error() {} }

/** One booking whose doctor notification failed. */
async function failedBooking(db: MemoryDb = memoryDb(() => NOW), requestId = 'req-retry-0001') {
  const res = await handleConsultation(
    new Request('https://www.example.test/api/consultation', {
      method: 'POST',
      headers: { host: 'www.example.test', origin: 'https://www.example.test', 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Visitor',
        phone: '+91 98765 43210',
        email: '',
        date: '2026-10-20',
        slot: 'morning',
        message: requestId,
        consent: true,
        requestId,
        elapsedMs: 30_000,
        website: '',
      }),
    }),
    { env: ENV, db, limiter: createLimiter(), fetch: metaStub('rejected').fetchImpl, now: () => NOW, log: silent },
  )
  assert.equal(res.status, 201)
  return db
}

const cron = (secret: string | null = CRON_SECRET, method = 'GET') =>
  new Request('https://www.example.test/api/cron/retry-notifications', { method, headers: secret ? { authorization: `Bearer ${secret}` } : {} })

const env = { ...ENV, CRON_SECRET }

test('the retry job sends a failed doctor notification once, and leaves the booking alone', async () => {
  const db = await failedBooking()
  const [booking] = [...db.appointments.values()]
  const meta = metaStub('sent')
  const res = await handleRetryJob(cron(), { env, db, fetch: meta.fetchImpl, now: () => NOW, log: silent })
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { ok: true, checked: 1, sent: 1, failed: 0, skipped: 0 })
  assert.equal(meta.calls.length, 1)
  assert.equal(JSON.parse(String(meta.calls[0].init.body)).template.components[0].parameters[0].text, booking.booking_ref)
  const [n] = [...db.notifications.values()]
  assert.equal(n.status, 'sent')
  assert.equal(n.attempts, 2)
  assert.equal(db.appointments.size, 1)
  assert.deepEqual(db.appointments.get(booking.id), booking)

  // Nothing left to do on the next run.
  const again = await handleRetryJob(cron(), { env, db, fetch: meta.fetchImpl, now: () => NOW, log: silent })
  assert.equal((await again.json()).checked, 0)
  assert.equal(meta.calls.length, 1)
})

test('the retry job stops after the maximum number of attempts', async () => {
  const db = await failedBooking()
  const meta = metaStub('rejected')
  for (let i = 0; i < MAX_ATTEMPTS + 2; i++) await handleRetryJob(cron(), { env, db, fetch: meta.fetchImpl, now: () => NOW, log: silent })
  const [n] = [...db.notifications.values()]
  assert.equal(n.attempts, MAX_ATTEMPTS)
  assert.equal(n.status, 'failed')
})

test('the retry job and a patient retrying at the same moment send once', async () => {
  const db = await failedBooking()
  const meta = metaStub('sent')
  await Promise.all([1, 2, 3].map(() => handleRetryJob(cron(), { env, db, fetch: meta.fetchImpl, now: () => NOW, log: silent })))
  assert.equal(meta.calls.length, 1)
})

test('only Vercel’s scheduler, with the cron secret, can run the job', async () => {
  const db = await failedBooking()
  const meta = metaStub('sent')
  for (const secret of [null, 'wrong-secret']) assert.equal((await handleRetryJob(cron(secret), { env, db, fetch: meta.fetchImpl, log: silent })).status, 401)
  assert.equal((await handleRetryJob(cron(), { env: ENV, db, fetch: meta.fetchImpl, log: silent })).status, 503)
  assert.equal((await handleRetryJob(cron(CRON_SECRET, 'POST'), { env, db, fetch: meta.fetchImpl, log: silent })).status, 405)
  assert.equal(meta.calls.length, 0)
})

test('the retry job response and logs contain counts only', async () => {
  const db = await failedBooking()
  const logs: string[] = []
  const res = await handleRetryJob(cron(), {
    env,
    db,
    fetch: metaStub('rejected').fetchImpl,
    now: () => NOW,
    log: { info: (m) => logs.push(m), warn: (m) => logs.push(m), error: (m) => logs.push(m) },
  })
  const everything = (await res.text()) + logs.join('\n')
  for (const leaked of ['Test Visitor', '98765', 'AT-', CRON_SECRET]) assert.ok(!everything.includes(leaked), leaked)
})

/* ── Delivery webhook ────────────────────────────────────────────────────── */

const APP_SECRET = 'app-secret-not-real'
const signed = (body: string, secret = APP_SECRET) =>
  new Request('https://www.example.test/api/whatsapp-webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': `sha256=${createHmac('sha256', secret).update(body).digest('hex')}` },
    body,
  })

test('the webhook answers Meta’s subscription check only with the verify token', async () => {
  const env = { WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'verify-me' }
  const ok = await handleWebhook(new Request('https://x.test/api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=123'), { env, log: silent })
  assert.equal(ok.status, 200)
  assert.equal(await ok.text(), '123')
  const wrong = await handleWebhook(new Request('https://x.test/api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=123'), { env, log: silent })
  assert.equal(wrong.status, 403)
})

test('the webhook records delivery status only for correctly signed payloads', async () => {
  const db = memoryDb(() => NOW)
  await failedBooking(db)
  await handleRetryJob(cron(), { env, db, fetch: metaStub('sent').fetchImpl, now: () => NOW, log: silent })
  const [n] = [...db.notifications.values()]
  const body = JSON.stringify({ entry: [{ changes: [{ value: { statuses: [{ id: n.meta_message_id, status: 'delivered' }] } }] }] })
  const hookEnv = { WHATSAPP_APP_SECRET: APP_SECRET }
  assert.equal((await handleWebhook(signed(body, 'wrong-secret'), { env: hookEnv, db, log: silent })).status, 401)
  assert.equal(db.notifications.get(n.id)?.delivery_status, 'sent')
  assert.equal((await handleWebhook(signed(body), { env: hookEnv, db, log: silent })).status, 200)
  assert.equal(db.notifications.get(n.id)?.delivery_status, 'delivered')
})

test('webhook payloads are read defensively', () => {
  assert.deepEqual(statusUpdates(null), [])
  assert.deepEqual(statusUpdates({ entry: [{ changes: [{ value: { statuses: [{ id: 'w1', status: 'failed', errors: [{ code: 131026 }] }, { id: 2, status: 'read' }, { id: 'w3', status: 'odd' }] } }] }] }), [
    { id: 'w1', status: 'failed', error: 'code 131026' },
  ])
})

/* ── Supabase requests ───────────────────────────────────────────────────── */

test('bookings go to Supabase server-side with the service key, through the booking function', async () => {
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
})

test('the retry query asks only for undelivered, recent notifications under the attempt limit', async () => {
  const calls: string[] = []
  const fake = (async (url: string) => {
    calls.push(url)
    return Response.json([])
  }) as typeof fetch
  await supabaseDb('https://abc.supabase.co', 'k', fake).listRetryable(5, '2026-09-29T12:00:00.000Z', 20)
  assert.match(calls[0], /\/rest\/v1\/notifications\?status=in\.\(pending,failed\)&attempts=lt\.5&created_at=gte\.2026-09-29T12%3A00%3A00\.000Z&order=created_at\.asc&limit=20/)
})

test('a database error is reported by status only', async () => {
  const fake = (async () => new Response('secret details', { status: 500 })) as typeof fetch
  await assert.rejects(supabaseDb('https://abc.supabase.co', 'k', fake).getAppointment('x'), (e: Error) => e.message === 'database request failed (500)')
})
