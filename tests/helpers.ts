/** Shared stand-ins for the server tests (not a test file itself). */
import type { Env } from '../api/consultation.ts'

export const SECRET = 'test-token-not-real'

export const ENV: Env = {
  WHATSAPP_ACCESS_TOKEN: SECRET,
  WHATSAPP_PHONE_NUMBER_ID: '1234567890',
  WHATSAPP_RECIPIENT_NUMBER: '+91 90000 00000',
  WHATSAPP_TEMPLATE_NAME: 'new_booking_request',
  WHATSAPP_TEMPLATE_CONFIRMED: 'appointment_confirmed',
  WHATSAPP_TEMPLATE_RESCHEDULED: 'appointment_rescheduled',
  WHATSAPP_TEMPLATE_REJECTED: 'appointment_declined',
  WHATSAPP_TEMPLATE_LANGUAGE: 'en',
}

export type Call = { url: string; init: RequestInit }

export function metaStub(kind: 'sent' | 'rejected' | 'network' | 'timeout') {
  const calls: Call[] = []
  let n = 0
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    if (kind === 'network') throw new TypeError('fetch failed')
    if (kind === 'timeout') throw new DOMException('timed out', 'TimeoutError')
    if (kind === 'rejected') return Response.json({ error: { message: `bad Test Visitor`, code: 132000, fbtrace_id: 'trace' } }, { status: 400 })
    return Response.json({ messages: [{ id: `wamid.TEST-${++n}` }] })
  }) as typeof fetch
  return { calls, fetchImpl }
}

