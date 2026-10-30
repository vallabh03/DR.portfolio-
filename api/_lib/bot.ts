import { displayPhone, formatDate, SLOT_LABELS, STATUS_LABELS, TYPE_LABELS, type Appointment } from './booking.ts'
import type { BookingDb } from './db.ts'

/**
 * The WhatsApp booking assistant: the doctor (or another allowed number) sends
 * a short command to the practice's WhatsApp Business number, and the reply
 * lists bookings from Supabase. Read-only: nothing is created or changed.
 *
 * Commands (case and extra spaces are ignored):
 *   today · tomorrow · week · pending · AT-XXXXXX · help
 */

/** Dates are the practice's local dates (India Standard Time, UTC+5:30). */
const IST_OFFSET_MS = (5 * 60 + 30) * 60_000
const istDay = (ms: number, addDays = 0) => new Date(ms + IST_OFFSET_MS + addDays * 86_400_000).toISOString().slice(0, 10)

/** At most this many bookings per reply, so a reply stays well inside WhatsApp's 4096-character limit. */
export const LIST_LIMIT = 15

export type Command =
  | { kind: 'range'; label: string; from: string; to: string }
  | { kind: 'pending' }
  | { kind: 'ref'; ref: string }
  | { kind: 'help' }
  | { kind: 'unknown' }

export function parseCommand(text: string, now: number): Command {
  const t = text.trim().toLowerCase().replace(/\s+/g, ' ')
  const ref = /^at-?([a-z2-9]{6})$/.exec(t.replace(/\s/g, ''))
  if (ref) return { kind: 'ref', ref: `AT-${ref[1].toUpperCase()}` }
  if (['today', 'todays', "today's"].includes(t)) return { kind: 'range', label: 'today', from: istDay(now), to: istDay(now) }
  if (t === 'tomorrow') return { kind: 'range', label: 'tomorrow', from: istDay(now, 1), to: istDay(now, 1) }
  if (['week', 'this week', 'next 7 days', '7 days'].includes(t)) return { kind: 'range', label: 'the next 7 days', from: istDay(now), to: istDay(now, 6) }
  if (['pending', 'new', 'all'].includes(t)) return { kind: 'pending' }
  if (['help', 'menu', '?', 'hi', 'hello', 'hey'].includes(t)) return { kind: 'help' }
  return { kind: 'unknown' }
}

export const HELP_TEXT = [
  '*Booking assistant*',
  'Send one of these:',
  '',
  '*today*: bookings requested for today',
  '*tomorrow*: bookings for tomorrow',
  '*week*: bookings for the next 7 days',
  '*pending*: all pending bookings, newest first',
  '*AT-XXXXXX*: full details of one booking',
  '*help*: this list',
].join('\n')

const SLOT_ORDER = Object.keys(SLOT_LABELS)
const bySlot = (a: Appointment, b: Appointment) => a.requested_date.localeCompare(b.requested_date) || SLOT_ORDER.indexOf(a.requested_slot) - SLOT_ORDER.indexOf(b.requested_slot)

/** Two lines per booking: reference and time, then name, mobile, type and status. */
function line(a: Appointment, i: number, withDate: boolean) {
  const when = `${withDate ? `${formatDate(a.requested_date)}, ` : ''}${SLOT_LABELS[a.requested_slot]}`
  return `${i + 1}. *${a.booking_ref}* · ${when}\n${a.patient_name} · ${displayPhone(a.patient_phone)}\n${TYPE_LABELS[a.consultation_type]} · ${STATUS_LABELS[a.status]}`
}

function detail(a: Appointment) {
  return [
    `*Booking ${a.booking_ref}*`,
    '',
    `Patient: ${a.patient_name}`,
    `Mobile: ${displayPhone(a.patient_phone)}`,
    ...(a.patient_email ? [`Email: ${a.patient_email}`] : []),
    `Requested: ${formatDate(a.requested_date)}, ${SLOT_LABELS[a.requested_slot]}`,
    `Type: ${TYPE_LABELS[a.consultation_type]}`,
    `Status: ${STATUS_LABELS[a.status]}`,
    `Received: ${formatDate(new Date(Date.parse(a.created_at) + IST_OFFSET_MS).toISOString().slice(0, 10))}`,
    '',
    a.message ? `Message from the patient:\n${a.message}` : 'No message from the patient.',
  ].join('\n')
}

/** The reply text for a command, read from the database. */
export async function replyFor(command: Command, db: BookingDb): Promise<string> {
  switch (command.kind) {
    case 'help':
      return HELP_TEXT
    case 'unknown':
      return `Sorry, I did not understand that.\n\n${HELP_TEXT}`
    case 'ref': {
      const a = await db.bookingByRef(command.ref)
      return a ? detail(a) : `No booking found with reference ${command.ref}.`
    }
    case 'pending': {
      const rows = await db.pendingBookings(LIST_LIMIT + 1)
      if (rows.length === 0) return 'There are no pending bookings.'
      const shown = rows.slice(0, LIST_LIMIT)
      const more = rows.length > LIST_LIMIT ? `\n\nShowing the newest ${LIST_LIMIT}. Older ones are in Supabase.` : ''
      return `*Pending bookings* (newest first)\n\n${shown.map((a, i) => line(a, i, true)).join('\n\n')}${more}`
    }
    case 'range': {
      const rows = (await db.bookingsBetween(command.from, command.to, LIST_LIMIT + 1)).sort(bySlot)
      const span = command.from === command.to ? formatDate(command.from) : `${formatDate(command.from)} to ${formatDate(command.to)}`
      if (rows.length === 0) return `No bookings requested for ${command.label} (${span}).`
      const shown = rows.slice(0, LIST_LIMIT)
      const more = rows.length > LIST_LIMIT ? `\n\nShowing the first ${LIST_LIMIT}. The rest are in Supabase.` : ''
      return `*Bookings for ${command.label}* (${span}): ${shown.length}${rows.length > LIST_LIMIT ? '+' : ''}\n\n${shown
        .map((a, i) => line(a, i, command.from !== command.to))
        .join('\n\n')}${more}`
    }
  }
}

/** The numbers allowed to use the assistant: the doctor's number plus any listed in WHATSAPP_ALLOWED_NUMBERS. Digits only. */
export function allowedNumbers(env: { WHATSAPP_RECIPIENT_NUMBER?: string; WHATSAPP_ALLOWED_NUMBERS?: string }) {
  return new Set(
    [env.WHATSAPP_RECIPIENT_NUMBER ?? '', ...(env.WHATSAPP_ALLOWED_NUMBERS ?? '').split(',')]
      .map((n) => n.replace(/\D/g, ''))
      .filter((n) => n.length >= 8),
  )
}
