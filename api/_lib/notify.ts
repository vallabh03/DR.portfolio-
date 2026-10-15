import { displayPhone, formatWhen, STATUS_LABELS, TYPE_LABELS, type Appointment, type NotificationKind, type Slot } from './booking.ts'
import { supabaseDb, type BookingDb } from './db.ts'
import type { Logger } from './http.ts'
import { sendTemplate, type WhatsAppConfig } from './whatsapp.ts'

/**
 * Sends the WhatsApp message for one notification row, at most once:
 * the row is claimed in the database before anything is sent, so a retried
 * request, a double click or two server instances can never send it twice.
 * The outcome (Meta's message id, or an error code) is written back to the row.
 */

export type ServerEnv = Partial<
  Record<
    | 'SUPABASE_URL'
    | 'SUPABASE_SERVICE_ROLE_KEY'
    | 'SUPABASE_SECRET_KEY'
    | 'WHATSAPP_ACCESS_TOKEN'
    | 'WHATSAPP_PHONE_NUMBER_ID'
    | 'WHATSAPP_RECIPIENT_NUMBER'
    | 'WHATSAPP_TEMPLATE_NAME'
    | 'WHATSAPP_TEMPLATE_CONFIRMED'
    | 'WHATSAPP_TEMPLATE_RESCHEDULED'
    | 'WHATSAPP_TEMPLATE_REJECTED'
    | 'WHATSAPP_TEMPLATE_LANGUAGE'
    | 'WHATSAPP_API_VERSION'
    | 'WHATSAPP_APP_SECRET'
    | 'WHATSAPP_WEBHOOK_VERIFY_TOKEN'
    | 'ALLOWED_ORIGINS',
    string | undefined
  >
>

/** The real database when it is configured, otherwise null. */
export function dbFromEnv(env: ServerEnv, fetchImpl: typeof fetch): BookingDb | null {
  // SUPABASE_SECRET_KEY is accepted as another name for the service-role key.
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY
  return env.SUPABASE_URL && key ? supabaseDb(env.SUPABASE_URL, key, fetchImpl) : null
}

/** A notification stuck in "sending" this long (a crashed attempt) may be claimed again. */
export const STALE_SENDING_SECONDS = 120

const TEMPLATE_ENV: Record<NotificationKind, keyof ServerEnv> = {
  doctor_new: 'WHATSAPP_TEMPLATE_NAME',
  patient_confirmed: 'WHATSAPP_TEMPLATE_CONFIRMED',
  patient_rescheduled: 'WHATSAPP_TEMPLATE_RESCHEDULED',
  patient_rejected: 'WHATSAPP_TEMPLATE_REJECTED',
}

export function whatsappConfig(env: ServerEnv): WhatsAppConfig | null {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) return null
  return {
    accessToken: env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
    language: env.WHATSAPP_TEMPLATE_LANGUAGE || 'en',
    apiVersion: env.WHATSAPP_API_VERSION,
  }
}

/** Who receives the message, which template it uses, and its named parameters. See docs/BOOKINGS.md for the templates. */
export function messageFor(kind: NotificationKind, a: Appointment, env: ServerEnv) {
  const template = env[TEMPLATE_ENV[kind]]
  const when = (date: string | null, slot: Slot | null) => (date && slot ? formatWhen(date, slot) : formatWhen(a.requested_date, a.requested_slot))
  if (kind === 'doctor_new') {
    return {
      to: env.WHATSAPP_RECIPIENT_NUMBER ?? '',
      template,
      params: {
        booking_id: a.booking_ref,
        name: a.patient_name,
        phone: displayPhone(a.patient_phone),
        requested: formatWhen(a.requested_date, a.requested_slot),
        type: TYPE_LABELS[a.consultation_type],
        status: STATUS_LABELS.pending,
      },
    }
  }
  const params: Record<string, string> = { name: a.patient_name, booking_id: a.booking_ref }
  if (kind !== 'patient_rejected') params.date_time = when(a.scheduled_date, a.scheduled_slot)
  return { to: a.patient_phone, template, params }
}

export type DeliveryOutcome = 'sent' | 'failed' | 'skipped' | 'already_sent' | 'busy'

export async function deliverNotification(
  db: BookingDb,
  notificationId: string,
  appointment: Appointment,
  ctx: { env: ServerEnv; fetch: typeof fetch; log: Logger },
): Promise<DeliveryOutcome> {
  const current = await db.getNotification(notificationId)
  if (!current) return 'failed'
  if (current.status === 'sent') return 'already_sent'
  if (current.status === 'skipped') return 'skipped'

  const claimed = await db.claimNotification(notificationId, STALE_SENDING_SECONDS)
  // Someone else is sending it right now (or has just sent it).
  if (!claimed) return 'busy'

  const config = whatsappConfig(ctx.env)
  const msg = messageFor(claimed.kind, appointment, ctx.env)
  if (!config || !msg.template || !msg.to) {
    // Not configured: kept as failed, so it can be retried once the settings exist.
    ctx.log.error(`notify: WhatsApp is not configured for ${claimed.kind}`)
    await db.finishNotification(notificationId, { status: 'failed', error: 'not_configured' })
    return 'failed'
  }

  const result = await sendTemplate(config, { to: msg.to, template: msg.template, params: msg.params }, ctx.fetch, ctx.log)
  if (result.ok) {
    await db.finishNotification(notificationId, { status: 'sent', messageId: result.messageId })
    ctx.log.info(`notify: ${claimed.kind} accepted by Meta (attempt ${claimed.attempts})`)
    return 'sent'
  }
  await db.finishNotification(notificationId, { status: 'failed', error: result.error })
  return 'failed'
}
