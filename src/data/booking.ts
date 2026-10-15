/**
 * Booking options shared by the consultation form and the server function
 * (api/consultation.ts), so both always accept exactly the same values.
 */

/** Preferred time slots offered on the form. */
export const SLOT_LABELS = {
  morning: 'Morning',
  midday: 'Midday',
  afternoon: 'Afternoon',
  evening: 'Evening',
} as const
export type Slot = keyof typeof SLOT_LABELS

export const TYPE_LABELS = {
  in_person: 'In-person',
  online: 'Online',
} as const
export type ConsultationType = keyof typeof TYPE_LABELS

/**
 * The consultation types the practice offers. The form shows a choice only
 * when there is more than one; add 'online' here to offer online consultations.
 */
export const OFFERED_TYPES: ConsultationType[] = ['in_person']

/** How far ahead a consultation can be requested. */
export const MAX_DAYS_AHEAD = 180

/** Country codes offered beside the mobile number (the first is the default). */
export const COUNTRY_CODES = ['+91', '+1', '+44', '+61', '+65', '+971', '+966', '+974', '+968', '+973', '+965', '+977', '+880', '+94', '+60']
