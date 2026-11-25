/** Shared stand-ins for the server tests (not a test file itself). */
import type { Env } from '../api/consultation.ts'
import { memoryDb, type MemoryDb } from '../api/_lib/db.ts'

export const SECRET = 'test-token-not-real'

export const ENV: Env = {
  WHATSAPP_ACCESS_TOKEN: SECRET,
  WHATSAPP_PHONE_NUMBER_ID: '1234567890',
  WHATSAPP_RECIPIENT_NUMBER: '+91 90000 00000',
  WHATSAPP_TEMPLATE_NAME: 'new_booking_request',
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


/**
 * The in-memory database with only the practice's new-booking alert switched
 * on: for tests about that alert, which count the messages sent. The patient's
 * messages are covered in notificationSettings.test.ts.
 */
export function practiceOnlyDb(now?: () => number): MemoryDb {
  const db = memoryDb(now)
  for (const s of db.settings) if (s.audience === 'customer') s.enabled = false
  return db
}
