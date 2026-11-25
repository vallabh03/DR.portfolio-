import { displayPhone, formatDate, formatWhen, SLOT_LABELS, STATUS_LABELS, TYPE_LABELS, type Appointment, type Slot } from './booking.ts'
import { doctor } from '../../src/data/doctor.ts'

/**
 * WhatsApp notifications are configured per event and audience in the
 * database (public.notification_settings), not in code: each row says whether
 * it is on, which approved template to send, in which language, and which
 * booking fields fill the template's variables. Turning a row off stops that
 * message at once, including retries of messages already waiting.
 *
 * This file holds the vocabulary those rows may use: the events, the
 * audiences, and the booking fields a template parameter can take.
 */

export const EVENTS = ['booking_received', 'booking_confirmed', 'booking_rescheduled', 'booking_declined', 'appointment_reminder'] as const
export type EventName = (typeof EVENTS)[number]

/** admin: the practice (the doctor or staff numbers). customer: the patient who booked. */
export const AUDIENCES = ['admin', 'customer'] as const
export type Audience = (typeof AUDIENCES)[number]

/** One template variable: a booking field (`source`) or fixed text (`text`); `name` for templates with named variables ({{booking_id}}). */
export type ParameterSpec = { source?: string; text?: string; name?: string }

/** One row of public.notification_settings. */
export type NotificationSetting = {
  event: EventName
  audience: Audience
  enabled: boolean
  template_name: string | null
  /** Template language code as approved, e.g. "en" or "en_US". */
  language: string
  /** The template's body variables, in order. */
  parameters: ParameterSpec[]
  /** Admin rows: comma-separated numbers, country code first; empty means WHATSAPP_RECIPIENT_NUMBER. */
  recipients: string | null
  /** appointment_reminder rows: how many days before the appointment (default 1). */
  days_before: number | null
}

export const isEvent = (v: unknown): v is EventName => typeof v === 'string' && (EVENTS as readonly string[]).includes(v)
export const isAudience = (v: unknown): v is Audience => typeof v === 'string' && (AUDIENCES as readonly string[]).includes(v)

/** A notification row's kind: "booking_confirmed:customer". */
export const kindOf = (event: EventName, audience: Audience) => `${event}:${audience}`

/** Kinds written before notifications were configurable. */
const LEGACY_KINDS: Record<string, [EventName, Audience]> = {
  doctor_new: ['booking_received', 'admin'],
  patient_confirmed: ['booking_confirmed', 'customer'],
  patient_rescheduled: ['booking_rescheduled', 'customer'],
  patient_rejected: ['booking_declined', 'customer'],
}

export function parseKind(kind: string): { event: EventName; audience: Audience } | null {
  const legacy = LEGACY_KINDS[kind]
  if (legacy) return { event: legacy[0], audience: legacy[1] }
  const [event, audience] = kind.split(':')
  return isEvent(event) && isAudience(audience) ? { event, audience } : null
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** "2026-11-26" -> "26 Nov 2026" */
const shortDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`
}

/** The appointment as arranged: the scheduled date and time once staff set them, otherwise the requested ones. */
const appointmentDate = (a: Appointment) => a.scheduled_date ?? a.requested_date
const appointmentSlot = (a: Appointment): Slot => a.scheduled_slot ?? a.requested_slot

const clinicAddress = [doctor.contact.clinic, doctor.contact.addressLine, [doctor.contact.locality, doctor.contact.postcode].filter(Boolean).join(' ')]
  .filter(Boolean)
  .join(', ')

/**
 * The booking fields a template parameter can use. The patient's free-text
 * message is deliberately not offered: it can hold medical details.
 */
export const PARAMETER_SOURCES: Record<string, (a: Appointment) => string> = {
  booking_ref: (a) => a.booking_ref,
  patient_name: (a) => a.patient_name,
  patient_first_name: (a) => a.patient_name.split(/\s+/)[0] || a.patient_name,
  patient_phone: (a) => displayPhone(a.patient_phone),
  /** Digits only, country code first: 919876543210 */
  patient_phone_digits: (a) => a.patient_phone,
  patient_email: (a) => a.patient_email || '-',
  requested_date: (a) => formatDate(a.requested_date),
  /** "26 Nov 2026" */
  requested_date_short: (a) => shortDate(a.requested_date),
  requested_time: (a) => SLOT_LABELS[a.requested_slot],
  requested_when: (a) => formatWhen(a.requested_date, a.requested_slot),
  appointment_date: (a) => formatDate(appointmentDate(a)),
  /** "26 Nov 2026": the scheduled date once staff set it, otherwise the requested one */
  appointment_date_short: (a) => shortDate(appointmentDate(a)),
  appointment_time: (a) => SLOT_LABELS[appointmentSlot(a)],
  appointment_when: (a) => formatWhen(appointmentDate(a), appointmentSlot(a)),
  consultation_type: (a) => TYPE_LABELS[a.consultation_type],
  status: (a) => STATUS_LABELS[a.status],
  doctor_name: () => doctor.name,
  clinic_name: () => doctor.contact.clinic ?? '',
  clinic_address: () => clinicAddress,
  clinic_phone: () => doctor.contact.phone ?? '',
  website: () => doctor.seo.siteUrl,
}

/** The template's parameter values, in order; an unknown source or an empty spec is an error (nothing is sent). */
export function buildParameters(specs: ParameterSpec[], a: Appointment): { ok: true; params: { text: string; name?: string }[] } | { ok: false; error: string } {
  if (!Array.isArray(specs)) return { ok: false, error: 'bad_parameters' }
  const params: { text: string; name?: string }[] = []
  for (const spec of specs) {
    const name = typeof spec?.name === 'string' && spec.name ? spec.name : undefined
    if (typeof spec?.text === 'string') params.push({ text: spec.text, name })
    else if (typeof spec?.source === 'string' && Object.hasOwn(PARAMETER_SOURCES, spec.source)) params.push({ text: PARAMETER_SOURCES[spec.source](a), name })
    else return { ok: false, error: `bad_parameter_${params.length + 1}` }
  }
  return { ok: true, params }
}

/** Status changes that send a notification. */
const STATUS_EVENTS: Partial<Record<Appointment['status'], EventName>> = {
  confirmed: 'booking_confirmed',
  rescheduled: 'booking_rescheduled',
  rejected: 'booking_declined',
}

/**
 * The event for a change to a booking, or null: a new status, or a new date or
 * time for a booking that is already confirmed or rescheduled.
 */
export function statusEvent(before: Partial<Appointment> | null | undefined, after: Appointment): EventName | null {
  const event = STATUS_EVENTS[after.status]
  if (!event) return null
  if (!before || before.status !== after.status) return event
  const moved = (before.scheduled_date ?? null) !== (after.scheduled_date ?? null) || (before.scheduled_slot ?? null) !== (after.scheduled_slot ?? null)
  return moved && after.status !== 'rejected' ? event : null
}

/**
 * Identifies one occurrence of an event for a booking, so the same occurrence
 * is never sent twice (a repeated webhook, a retry), while a later change (a
 * second reschedule) is a new occurrence.
 */
export function occurrenceKey(event: EventName, a: Appointment) {
  if (event === 'booking_received') return `${a.id}:${event}`
  if (event === 'appointment_reminder') return `${a.id}:${event}:${appointmentDate(a)}`
  return `${a.id}:${event}:${a.status}:${appointmentDate(a)}:${appointmentSlot(a)}`
}

/** The date a booking's appointment is on (scheduled, else requested). */
export const appointmentDay = appointmentDate

/**
 * The settings the database starts with (supabase/migrations/20261123120000_notification_settings.sql
 * inserts the same rows), also used by the in-memory database for tests and
 * local trials. On: the practice's alert for a new booking and the patient's
 * booking_confirmation (both approved templates). The others start off until
 * their templates are approved and switched on in the table.
 */
export const DEFAULT_SETTINGS: NotificationSetting[] = [
  {
    event: 'booking_received',
    audience: 'admin',
    enabled: true,
    template_name: 'new_booking_request',
    language: 'en',
    parameters: [
      { source: 'booking_ref', name: 'booking_id' },
      { source: 'patient_name', name: 'name' },
      { source: 'patient_phone', name: 'phone' },
      { source: 'requested_when', name: 'requested' },
      { source: 'consultation_type', name: 'type' },
      { source: 'status', name: 'status' },
    ],
    recipients: null,
    days_before: null,
  },
  // The approved template booking_confirmation: "Dear {{1}}, ... Name: {{2}} Email: {{3}} Contact: {{4}} Preferred Date: {{5}} Preferred Slot: {{6}}"
  {
    ...setting('booking_received', 'customer', 'booking_confirmation', [
      'patient_first_name',
      'patient_name',
      'patient_email',
      'patient_phone_digits',
      'requested_date_short',
      'requested_time',
    ]),
    enabled: true,
  },
  setting('booking_confirmed', 'customer', 'booking_confirmed', ['patient_first_name', 'appointment_when', 'clinic_address', 'booking_ref']),
  setting('booking_confirmed', 'admin', 'admin_booking_update', ['booking_ref', 'patient_name', 'status', 'appointment_when']),
  setting('booking_rescheduled', 'customer', 'booking_rescheduled', ['patient_first_name', 'appointment_when', 'booking_ref']),
  setting('booking_rescheduled', 'admin', 'admin_booking_update', ['booking_ref', 'patient_name', 'status', 'appointment_when']),
  setting('booking_declined', 'customer', 'booking_declined', ['patient_first_name', 'booking_ref', 'clinic_phone']),
  setting('booking_declined', 'admin', 'admin_booking_update', ['booking_ref', 'patient_name', 'status', 'appointment_when']),
  { ...setting('appointment_reminder', 'customer', 'appointment_reminder', ['patient_first_name', 'appointment_when', 'clinic_address']), days_before: 1 },
  { ...setting('appointment_reminder', 'admin', 'admin_appointment_reminder', ['booking_ref', 'patient_name', 'appointment_when']), days_before: 1 },
]

function setting(event: EventName, audience: Audience, template: string, sources: string[]): NotificationSetting {
  return { event, audience, enabled: false, template_name: template, language: 'en', parameters: sources.map((source) => ({ source })), recipients: null, days_before: null }
}
