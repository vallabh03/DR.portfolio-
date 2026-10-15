/** Shared booking vocabulary for the server functions and their tests. */

import { OFFERED_TYPES, SLOT_LABELS, TYPE_LABELS, type ConsultationType, type Slot } from '../../src/data/booking.ts'

export { OFFERED_TYPES, SLOT_LABELS, TYPE_LABELS, type ConsultationType, type Slot }

/** Own keys only: inherited names such as "toString" are never valid. */
export const isSlot = (value: unknown): value is Slot => typeof value === 'string' && Object.hasOwn(SLOT_LABELS, value)
/** Only the types the practice offers (src/data/booking.ts). */
export const isOfferedType = (value: unknown): value is ConsultationType => typeof value === 'string' && (OFFERED_TYPES as string[]).includes(value)

export type Status = 'pending' | 'confirmed' | 'rescheduled' | 'rejected'
export const STATUS_LABELS: Record<Status, string> = { pending: 'Pending', confirmed: 'Confirmed', rescheduled: 'Rescheduled', rejected: 'Rejected' }

export type NotificationKind = 'doctor_new' | 'patient_confirmed' | 'patient_rescheduled' | 'patient_rejected'
export type NotificationStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'skipped'

export type Appointment = {
  id: string
  booking_ref: string
  request_id: string
  fingerprint: string
  patient_name: string
  /** Digits only, country code first. */
  patient_phone: string
  patient_email: string | null
  requested_date: string
  requested_slot: Slot
  consultation_type: ConsultationType
  message: string | null
  consent: boolean
  status: Status
  scheduled_date: string | null
  scheduled_slot: Slot | null
  status_version: number
  last_action_id: string | null
  status_changed_by: string | null
  created_at: string
}

export type Notification = {
  id: string
  appointment_id: string
  kind: NotificationKind
  idempotency_key: string
  status: NotificationStatus
  attempts: number
  last_error: string | null
  meta_message_id: string | null
  delivery_status: string | null
  sent_at: string | null
}

/** What the booking form submits, after validation. */
export type BookingInput = {
  name: string
  /** Digits only, country code first. */
  phone: string
  email: string
  date: string
  slot: Slot
  type: ConsultationType
  message: string
  consent: true
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "2026-10-20" -> "20 October 2026" */
export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/** "20 October 2026, Morning" */
export const formatWhen = (date: string, slot: Slot) => `${formatDate(date)}, ${SLOT_LABELS[slot]}`

/** "919876543210" -> "+919876543210" */
export const displayPhone = (digits: string) => `+${digits}`
