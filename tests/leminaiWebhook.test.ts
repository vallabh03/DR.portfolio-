/**
 * Tests for the doctor's Confirm button (api/leminai-webhook.ts): Leminai
 * forwards the tap, the booking is confirmed and the patient is told.
 * In-memory database and stand-in providers only.
 * Run with: npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLimiter, handleConsultation } from '../api/consultation.ts'
import { handleLeminaiWebhook, incomingTaps, isConfirm } from '../api/leminai-webhook.ts'
import { leminaiMessageId } from '../api/_lib/whatsapp.ts'
import { memoryDb, type MemoryDb } from '../api/_lib/db.ts'
import { ENV, type Call } from './helpers.ts'

const NOW = Date.UTC(2026, 10, 25, 6)
const TOKEN = 'leminai-token-not-real'
const DOCTOR = '919000000000'
const PATIENT = '919876543210'
const silent = { info() {}, warn() {}, error() {} }
const env = { ...ENV, LEMINAI_API_KEY: 'leminai-key-not-real', LEMINAI_WEBHOOK_TOKEN: TOKEN }

/** Leminai stand-in: answers each send with a new WAMID (numbered across all stand-ins, like real ones). */
let sends = 0
function leminai() {
  const calls: Call[] = []
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    const n = ++sends
    return Response.json({ success: true, data: { message_id: 300 + n, wamid: `wamid.ALERT-${n}` } })
  }) as typeof fetch
  return { calls, fetchImpl }
}

/** The setup in use: the doctor gets the booking details, the patient gets booking_confirmation once confirmed. */
function setup() {
  const db = memoryDb(() => NOW)
  for (const s of db.settings) {
    if (s.event === 'booking_received' && s.audience === 'customer') s.enabled = false
    if (s.event === 'booking_confirmed' && s.audience === 'customer')
      Object.assign(s, {
        enabled: true,
        template_name: 'booking_confirmation',
        parameters: ['patient_first_name', 'patient_name', 'patient_email', 'patient_phone_digits', 'appointment_date_short', 'appointment_time'].map((source) => ({ source })),
      })
  }
  return db
}

async function book(db: MemoryDb, i: number) {
  const p = leminai()
  const res = await handleConsultation(
    new Request('https://www.example.test/api/consultation', {
      method: 'POST',
      headers: { host: 'www.example.test', origin: 'https://www.example.test', 'content-type': 'application/json', 'x-real-ip': `203.0.113.${i}` },
      body: JSON.stringify({
        name: `Patient ${i}`,
        phone: `+91 98765 4${String(3210 + i).padStart(4, '0')}`,
        email: '',
        date: '2026-11-27',
        slot: 'midday',
        message: '',
        consent: true,
        requestId: `req-tap-${String(i).padStart(4, '0')}`,
        elapsedMs: 30_000,
        website: '',
      }),
    }),
    { env, db, limiter: createLimiter(), fetch: p.fetchImpl, now: () => NOW, log: silent },
  )
  assert.equal(res.status, 201)
  const booking = [...db.appointments.values()].at(-1)!
  const alert = [...db.notifications.values()].find((n) => n.appointment_id === booking.id && n.kind === 'booking_received:admin')!
  return { booking, alertId: alert.meta_message_id! }
}

/** WhatsApp's inbound format for a tap on a template's quick-reply button, as Leminai forwards it. */
const tapPayload = (from: string, text: string, context?: string) => ({
  object: 'whatsapp_business_account',
  entry: [
    {
      changes: [
        {
          field: 'messages',
          value: {
            messages: [{ from, id: `wamid.TAP-${Math.random()}`, type: 'button', button: { text, payload: text }, ...(context && { context: { from: DOCTOR, id: context } }) }],
          },
        },
      ],
    },
  ],
})

async function tap(db: MemoryDb, payload: unknown, token = TOKEN) {
  const p = leminai()
  const res = await handleLeminaiWebhook(
    new Request(`https://www.example.test/api/leminai-webhook?token=${encodeURIComponent(token)}`, { method: 'POST', body: JSON.stringify(payload) }),
    { env, db, fetch: p.fetchImpl, now: () => NOW, log: silent },
  )
  return { res, json: await res.json(), sent: p.calls.map((c) => JSON.parse(String(c.init.body))) }
}

test('the doctor taps Confirm: the booking is confirmed and the patient gets booking_confirmation', async () => {
  const db = setup()
  const { booking, alertId } = await book(db, 1)
  assert.match(alertId, /^wamid\.ALERT-\d+$/, 'the WAMID is saved, so taps can be matched')
  const { res, json, sent } = await tap(db, tapPayload(DOCTOR, 'Confirm', alertId))
  assert.equal(res.status, 200)
  assert.equal(json.confirmed, 1)
  assert.equal(db.appointments.get(booking.id)!.status, 'confirmed')
  assert.equal(sent.length, 1)
  assert.equal(sent[0].to, booking.patient_phone)
  assert.equal(sent[0].template_name, 'booking_confirmation')
  assert.deepEqual(
    sent[0].components[0].parameters.map((p: { text: string }) => p.text).slice(4),
    ['27 Nov 2026', 'Midday'],
  )
})

test('with several bookings, each Confirm confirms the booking it was tapped on', async () => {
  const db = setup()
  const a = await book(db, 1)
  const b = await book(db, 2)
  await tap(db, tapPayload(DOCTOR, 'Confirm', b.alertId))
  assert.equal(db.appointments.get(a.booking.id)!.status, 'pending')
  assert.equal(db.appointments.get(b.booking.id)!.status, 'confirmed')
})

test('a second tap, or the same webhook twice, changes nothing and sends nothing more', async () => {
  const db = setup()
  const { alertId } = await book(db, 1)
  await tap(db, tapPayload(DOCTOR, 'Confirm', alertId))
  const again = await tap(db, tapPayload(DOCTOR, 'Confirm', alertId))
  assert.equal(again.json.confirmed, 0)
  assert.equal(again.sent.length, 0)
})

test('without a message id, the tap is used only when exactly one booking is pending', async () => {
  const db = setup()
  const one = await book(db, 1)
  const solo = await tap(db, tapPayload(DOCTOR, 'Confirm'))
  assert.equal(solo.json.confirmed, 1)
  assert.equal(db.appointments.get(one.booking.id)!.status, 'confirmed')

  const db2 = setup()
  await book(db2, 1)
  await book(db2, 2)
  const unsure = await tap(db2, tapPayload(DOCTOR, 'Confirm'))
  assert.equal(unsure.json.confirmed, 0)
  assert.ok([...db2.appointments.values()].every((x) => x.status === 'pending'))
})

test('taps from any other number, other buttons and other messages change nothing', async () => {
  const db = setup()
  const { booking, alertId } = await book(db, 1)
  assert.equal((await tap(db, tapPayload(PATIENT, 'Confirm', alertId))).json.confirmed, 0)
  assert.equal((await tap(db, tapPayload(DOCTOR, 'Reschedule', alertId))).json.ignored, 'no confirm tap')
  assert.equal((await tap(db, { entry: [{ changes: [{ value: { statuses: [{ id: alertId, status: 'read' }] } }] }] })).json.ignored, 'no confirm tap')
  assert.equal(db.appointments.get(booking.id)!.status, 'pending')
})

test('the webhook URL needs the secret token', async () => {
  const db = setup()
  const { booking, alertId } = await book(db, 1)
  assert.equal((await tap(db, tapPayload(DOCTOR, 'Confirm', alertId), 'wrong')).res.status, 401)
  const missing = await handleLeminaiWebhook(new Request('https://x.test/api/leminai-webhook?token=x', { method: 'POST', body: '{}' }), { env: { ...env, LEMINAI_WEBHOOK_TOKEN: '' }, db, log: silent })
  assert.equal(missing.status, 503)
  assert.equal(db.appointments.get(booking.id)!.status, 'pending')
})

test('taps are read from WhatsApp’s format and flatter ones', () => {
  assert.deepEqual(incomingTaps(tapPayload('+91 90000 00000', 'Confirm', 'wamid.X')).map((t) => [t.from, t.action, t.context]), [[DOCTOR, 'Confirm', 'wamid.X']])
  assert.deepEqual(
    incomingTaps({ data: { message: { from: DOCTOR, type: 'interactive', interactive: { button_reply: { id: 'confirm', title: 'Confirm' } }, context: { id: 'wamid.Y' } } } }).map((t) => [t.action, t.context]),
    [['confirm', 'wamid.Y']],
  )
  assert.deepEqual(incomingTaps(null), [])
  assert.ok(isConfirm('Confirm') && isConfirm('CONFIRM') && isConfirm('✅ Confirm') && !isConfirm('Reschedule') && !isConfirm('unconfirm'))
})

test('Leminai message ids: the WAMID is preferred, a numeric id is kept as text', () => {
  assert.equal(leminaiMessageId({ data: { message_id: 351, wamid: 'wamid.ABC' } }), 'wamid.ABC')
  assert.equal(leminaiMessageId({ message_id: 351 }), '351')
  assert.equal(leminaiMessageId({ messages: [{ id: 'wamid.Z' }] }), 'wamid.Z')
  assert.equal(leminaiMessageId({}), undefined)
})
