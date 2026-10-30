/**
 * Tests for the WhatsApp booking assistant (api/_lib/bot.ts and the incoming
 * messages part of api/whatsapp-webhook.ts). Meta and Supabase are stand-ins.
 * Run with: npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { createLimiter, handleConsultation } from '../api/consultation.ts'
import { allowedNumbers, HELP_TEXT, LIST_LIMIT, parseCommand, replyFor } from '../api/_lib/bot.ts'
import { handleWebhook, incomingMessages } from '../api/whatsapp-webhook.ts'
import { memoryDb, supabaseDb, type MemoryDb } from '../api/_lib/db.ts'
import { ENV, metaStub } from './helpers.ts'

// 14 October 2026, 20:00 in India (14:30 UTC).
const NOW = Date.UTC(2026, 9, 14, 14, 30)
const APP_SECRET = 'app-secret-not-real'
const DOCTOR = '919000000000' // ENV.WHATSAPP_RECIPIENT_NUMBER, digits only
const silent = { info() {}, warn() {}, error() {} }

async function book(db: MemoryDb, n: number, date: string, slot = 'morning', name = `Patient ${n}`) {
  const res = await handleConsultation(
    new Request('https://www.example.test/api/consultation', {
      method: 'POST',
      headers: { host: 'www.example.test', origin: 'https://www.example.test', 'content-type': 'application/json', 'x-real-ip': `203.0.113.${n}` },
      body: JSON.stringify({
        name,
        phone: `+91 98765 4${String(n).padStart(4, '0')}`,
        email: '',
        date,
        slot,
        message: n === 1 ? 'Lump in the neck for two months.' : '',
        consent: true,
        requestId: `req-assistant-${String(n).padStart(4, '0')}`,
        elapsedMs: 30_000,
        website: '',
      }),
    }),
    { env: ENV, db, limiter: createLimiter(), fetch: metaStub('sent').fetchImpl, now: () => NOW, log: silent },
  )
  assert.equal(res.status, 201)
  return (await res.json()).bookingRef as string
}

const payload = (from: string, text: string | null, id = `wamid.in-${Math.random()}`) =>
  JSON.stringify({ entry: [{ changes: [{ value: { messages: [text === null ? { id, from, type: 'image' } : { id, from, type: 'text', text: { body: text } }] } }] }] })

const signed = (body: string, secret = APP_SECRET) =>
  new Request('https://www.example.test/api/whatsapp-webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': `sha256=${createHmac('sha256', secret).update(body).digest('hex')}` },
    body,
  })

const env = { ...ENV, WHATSAPP_APP_SECRET: APP_SECRET }

async function ask(db: MemoryDb, from: string, text: string | null, extra: { secret?: string; seen?: Set<string>; id?: string; logs?: string[]; env?: typeof env } = {}) {
  const meta = metaStub('sent')
  const logs = extra.logs ?? []
  const res = await handleWebhook(signed(payload(from, text, extra.id), extra.secret), {
    env: extra.env ?? env,
    db,
    fetch: meta.fetchImpl,
    now: () => NOW,
    seen: extra.seen ?? new Set(),
    log: { info: (m) => logs.push(m), warn: (m) => logs.push(m), error: (m) => logs.push(m) },
  })
  const replies = meta.calls.map((c) => JSON.parse(String(c.init.body)))
  return { res, replies, text: replies[0]?.text?.body as string | undefined, logs }
}

/* ── Commands ────────────────────────────────────────────────────────────── */

test('commands are read loosely; dates are India dates', () => {
  assert.deepEqual(parseCommand('  TODAY ', NOW), { kind: 'range', label: 'today', from: '2026-10-14', to: '2026-10-14' })
  // 23:00 in India is already the next day in UTC terms only after 18:30 UTC.
  assert.equal((parseCommand('today', Date.UTC(2026, 9, 14, 19, 0)) as { from: string }).from, '2026-10-15')
  assert.deepEqual(parseCommand('tomorrow', NOW), { kind: 'range', label: 'tomorrow', from: '2026-10-15', to: '2026-10-15' })
  assert.deepEqual(parseCommand('Week', NOW), { kind: 'range', label: 'the next 7 days', from: '2026-10-14', to: '2026-10-20' })
  assert.deepEqual(parseCommand('pending', NOW), { kind: 'pending' })
  assert.deepEqual(parseCommand('at-7k3f9q', NOW), { kind: 'ref', ref: 'AT-7K3F9Q' })
  assert.deepEqual(parseCommand('AT 7K3F9Q', NOW), { kind: 'ref', ref: 'AT-7K3F9Q' })
  assert.deepEqual(parseCommand('hello', NOW), { kind: 'help' })
  assert.deepEqual(parseCommand('drop table appointments', NOW), { kind: 'unknown' })
})

test('the doctor’s number and listed numbers are allowed, nobody else', () => {
  const allowed = allowedNumbers({ WHATSAPP_RECIPIENT_NUMBER: '+91 90000 00000', WHATSAPP_ALLOWED_NUMBERS: '+91 98480 11111, 91-77801-61363,  ,12' })
  assert.deepEqual([...allowed].sort(), ['917780161363', '919000000000', '919848011111'])
})

test('"today" lists today’s bookings in time-slot order, with name, mobile and type', async () => {
  const db = memoryDb(() => NOW)
  await book(db, 2, '2026-10-14', 'evening', 'Evening Patient')
  const ref1 = await book(db, 1, '2026-10-14', 'morning', 'Morning Patient')
  await book(db, 3, '2026-10-15', 'morning', 'Tomorrow Patient')
  const reply = await replyFor(parseCommand('today', NOW), db)
  assert.match(reply, /^\*Bookings for today\* \(14 October 2026\): 2/)
  assert.ok(reply.indexOf('Morning Patient') < reply.indexOf('Evening Patient'))
  assert.ok(reply.includes(`*${ref1}* · Morning`))
  assert.ok(reply.includes('+919876540001'))
  assert.ok(reply.includes('In-person · Pending'))
  assert.ok(!reply.includes('Tomorrow Patient'))
  // Lists never include the patient's private message.
  assert.ok(!reply.includes('Lump'))
})

test('a booking reference shows the full details, including the patient’s message', async () => {
  const db = memoryDb(() => NOW)
  const ref = await book(db, 1, '2026-10-16')
  const reply = await replyFor(parseCommand(ref.toLowerCase(), NOW), db)
  assert.match(reply, new RegExp(`^\\*Booking ${ref}\\*`))
  assert.ok(reply.includes('Requested: 16 October 2026, Morning'))
  assert.ok(reply.includes('Lump in the neck for two months.'))
  assert.equal(await replyFor({ kind: 'ref', ref: 'AT-ZZZZZZ' }, db), 'No booking found with reference AT-ZZZZZZ.')
})

test('empty days, pending lists and long lists read sensibly', async () => {
  const db = memoryDb(() => NOW)
  assert.equal(await replyFor(parseCommand('tomorrow', NOW), db), 'No bookings requested for tomorrow (15 October 2026).')
  assert.equal(await replyFor(parseCommand('pending', NOW), db), 'There are no pending bookings.')
  for (let i = 1; i <= LIST_LIMIT + 2; i++) await book(db, i, '2026-10-14')
  const reply = await replyFor(parseCommand('today', NOW), db)
  assert.match(reply, new RegExp(`: ${LIST_LIMIT}\\+`))
  assert.match(reply, /Showing the first 15/)
  assert.ok(reply.length < 4096)
  assert.match(await replyFor(parseCommand('pending', NOW), db), /Showing the newest 15/)
})

/* ── Through the webhook ─────────────────────────────────────────────────── */

test('the doctor asks on WhatsApp and gets a text reply with the bookings', async () => {
  const db = memoryDb(() => NOW)
  const ref = await book(db, 1, '2026-10-14')
  const { res, replies, text } = await ask(db, DOCTOR, 'today')
  assert.equal(res.status, 200)
  assert.equal(replies.length, 1)
  assert.equal(replies[0].to, DOCTOR)
  assert.equal(replies[0].type, 'text')
  assert.ok(text?.includes(ref))
})

test('anyone not on the allow list gets no reply and no booking data', async () => {
  const db = memoryDb(() => NOW)
  await book(db, 1, '2026-10-14')
  for (const cmd of ['today', 'pending', 'help']) {
    const { res, replies, logs } = await ask(db, '919876540001', cmd)
    assert.equal(res.status, 200)
    assert.equal(replies.length, 0, cmd)
    assert.ok(logs.some((l) => l.includes('not on the allow list')))
  }
})

test('extra numbers can be allowed with WHATSAPP_ALLOWED_NUMBERS', async () => {
  const db = memoryDb(() => NOW)
  const { replies } = await ask(db, '919848011111', 'help', { env: { ...env, WHATSAPP_ALLOWED_NUMBERS: '+91 98480 11111' } })
  assert.equal(replies.length, 1)
  assert.equal(replies[0].text.body, HELP_TEXT)
})

test('a forged webhook (wrong signature) triggers nothing', async () => {
  const db = memoryDb(() => NOW)
  await book(db, 1, '2026-10-14')
  const { res, replies } = await ask(db, DOCTOR, 'today', { secret: 'attacker-secret' })
  assert.equal(res.status, 401)
  assert.equal(replies.length, 0)
})

test('the same message delivered twice by Meta is answered once', async () => {
  const db = memoryDb(() => NOW)
  const seen = new Set<string>()
  const first = await ask(db, DOCTOR, 'help', { seen, id: 'wamid.same' })
  const second = await ask(db, DOCTOR, 'help', { seen, id: 'wamid.same' })
  assert.equal(first.replies.length + second.replies.length, 1)
})

test('photos and other non-text messages get the help list', async () => {
  const { replies } = await ask(memoryDb(() => NOW), DOCTOR, null)
  assert.match(replies[0].text.body, /^I can only read text messages/)
})

test('logs never contain numbers, names or message text', async () => {
  const db = memoryDb(() => NOW)
  const ref = await book(db, 1, '2026-10-14')
  const logs: string[] = []
  await ask(db, DOCTOR, ref, { logs })
  await ask(db, '919876540001', 'today', { logs })
  const all = logs.join('\n')
  for (const leaked of [DOCTOR, '919876540001', 'Patient 1', 'Lump', ref]) assert.ok(!all.includes(leaked), leaked)
})

test('incoming messages are read defensively', () => {
  assert.deepEqual(incomingMessages(null), [])
  assert.deepEqual(incomingMessages({ entry: [{ changes: [{ value: { messages: [{ id: 1 }, { id: 'a', from: '+91 900', type: 'text', text: { body: 'x'.repeat(500) } }] } }] }] }), [
    { id: 'a', from: '91900', text: 'x'.repeat(200) },
  ])
})

test('the Supabase lookups are read-only queries with the expected filters', async () => {
  const calls: { url: string; method?: string }[] = []
  const fake = (async (url: string, init: RequestInit) => {
    calls.push({ url, method: init.method })
    return Response.json([])
  }) as typeof fetch
  const db = supabaseDb('https://abc.supabase.co', 'k', fake)
  await db.bookingsBetween('2026-10-14', '2026-10-20', 16)
  await db.pendingBookings(16)
  await db.bookingByRef('AT-7K3F9Q')
  assert.ok(calls.every((c) => c.method === undefined))
  assert.match(calls[0].url, /appointments\?requested_date=gte\.2026-10-14&requested_date=lte\.2026-10-20&status=neq\.rejected/)
  assert.match(calls[1].url, /appointments\?status=eq\.pending&order=created_at\.desc&limit=16/)
  assert.match(calls[2].url, /appointments\?booking_ref=eq\.AT-7K3F9Q/)
})
