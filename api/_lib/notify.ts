import type { Appointment } from './booking.ts'
import { DbError, supabaseDb, type BookingDb } from './db.ts'
import { buildParameters, kindOf, occurrenceKey, parseKind, type Audience, type EventName, type NotificationSetting } from './events.ts'
import type { Logger } from './http.ts'
import { DEFAULT_LEMINAI_URL, sendTemplate, type ProviderConfig, type WhatsAppConfig } from './whatsapp.ts'

/**
 * WhatsApp notifications for booking events. What is sent, to whom and with
 * which template comes from public.notification_settings (api/_lib/events.ts);
 * nothing here is specific to one event.
 *
 * Each message is one notification row, created once per event occurrence and
 * recipient, and claimed in the database before anything is sent, so a
 * retried request, a repeated webhook, a double click or two server instances
 * can never send it twice. The outcome (the provider's message id, or an
 * error code) is written back to the row.
 */

export type ServerEnv = Partial<
  Record<
    | 'SUPABASE_URL'
    | 'SUPABASE_SERVICE_ROLE_KEY'
    | 'SUPABASE_SECRET_KEY'
    | 'WHATSAPP_PROVIDER'
    | 'LEMINAI_API_KEY'
    | 'LEMINAI_API_URL'
    | 'WHATSAPP_ACCESS_TOKEN'
    | 'WHATSAPP_PHONE_NUMBER_ID'
    | 'WHATSAPP_RECIPIENT_NUMBER'
    | 'WHATSAPP_TEMPLATE_NAME'
    | 'WHATSAPP_TEMPLATE_LANGUAGE'
    | 'WHATSAPP_API_VERSION'
    | 'WHATSAPP_APP_SECRET'
    | 'WHATSAPP_WEBHOOK_VERIFY_TOKEN'
    | 'CRON_SECRET'
    | 'BOOKING_EVENTS_SECRET'
    | 'LEMINAI_WEBHOOK_TOKEN'
    | 'WHATSAPP_ALLOWED_NUMBERS'
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

/** Meta Cloud API settings, or null. Used for Meta templates and the booking assistant's text replies. */
export function whatsappConfig(env: ServerEnv): WhatsAppConfig | null {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) return null
  return {
    accessToken: env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
    language: env.WHATSAPP_TEMPLATE_LANGUAGE || 'en',
    apiVersion: env.WHATSAPP_API_VERSION,
  }
}

/**
 * The provider that sends templates: WHATSAPP_PROVIDER ("leminai" or "meta");
 * when it is not set, Leminai if LEMINAI_API_KEY is set, otherwise Meta.
 * Null when the chosen provider's settings are missing.
 */
export function providerConfig(env: ServerEnv): ProviderConfig | null {
  const provider = (env.WHATSAPP_PROVIDER || (env.LEMINAI_API_KEY ? 'leminai' : 'meta')).trim().toLowerCase()
  if (provider === 'leminai') return env.LEMINAI_API_KEY ? { provider: 'leminai', apiKey: env.LEMINAI_API_KEY, baseUrl: env.LEMINAI_API_URL || DEFAULT_LEMINAI_URL } : null
  if (provider !== 'meta') return null
  const meta = whatsappConfig(env)
  return meta && { provider: 'meta', ...meta }
}

const digits = (n: string) => n.replace(/\D/g, '')
const validNumber = (n: string) => /^[1-9]\d{7,14}$/.test(n)

/** Who an audience's message goes to: the patient, or the admin numbers (the row's own list, else WHATSAPP_RECIPIENT_NUMBER). */
export function recipientsFor(setting: Pick<NotificationSetting, 'audience' | 'recipients'>, a: Appointment, env: ServerEnv): string[] {
  if (setting.audience === 'customer') return validNumber(a.patient_phone) ? [a.patient_phone] : []
  const list = (setting.recipients?.trim() ? setting.recipients : (env.WHATSAPP_RECIPIENT_NUMBER ?? '')).split(',').map(digits).filter(validNumber)
  return [...new Set(list)]
}

/**
 * Until the settings table exists (its migration not yet run), the one
 * message sent before notifications were configurable keeps working, from the
 * WHATSAPP_TEMPLATE_NAME setting.
 */
function fallbackSettings(event: EventName, env: ServerEnv): NotificationSetting[] {
  if (event !== 'booking_received' || !env.WHATSAPP_TEMPLATE_NAME) return []
  return [
    {
      event,
      audience: 'admin',
      enabled: true,
      template_name: env.WHATSAPP_TEMPLATE_NAME,
      language: env.WHATSAPP_TEMPLATE_LANGUAGE || 'en',
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
  ]
}

/** An event's settings from the database; the built-in fallback only when the table does not exist yet. */
export async function settingsFor(db: BookingDb, event: EventName, env: ServerEnv): Promise<NotificationSetting[]> {
  try {
    return await db.notificationSettings(event)
  } catch (err) {
    // PostgREST answers 404 for a table it does not know.
    if (err instanceof DbError && err.status === 404) return fallbackSettings(event, env)
    throw err
  }
}

type Ctx = { env: ServerEnv; fetch: typeof fetch; log: Logger }
export type NotifyCounts = { sent: number; failed: number; skipped: number }

/**
 * Sends an event's notifications for one booking: every switched-on setting
 * (optionally only one audience), to each of its recipients, once per event
 * occurrence. A failed send stays on record for the retry job.
 */
export async function notifyEvent(db: BookingDb, event: EventName, a: Appointment, ctx: Ctx, only?: Audience): Promise<NotifyCounts> {
  const counts: NotifyCounts = { sent: 0, failed: 0, skipped: 0 }
  const settings = (await settingsFor(db, event, ctx.env)).filter((s) => s.enabled && (!only || s.audience === only))
  const occurrence = occurrenceKey(event, a)
  for (const s of settings) {
    const recipients = recipientsFor(s, a, ctx.env)
    if (!recipients.length) {
      ctx.log.error(`notify: no valid recipient for ${kindOf(event, s.audience)}`)
      counts.failed++
      continue
    }
    for (const to of recipients) {
      const n = await db.ensureNotification(a.id, kindOf(event, s.audience), `${occurrence}:${s.audience}:${to}`, to)
      const outcome = await deliverNotification(db, n.id, a, ctx)
      if (outcome === 'sent' || outcome === 'already_sent') counts.sent++
      else if (outcome === 'failed') counts.failed++
      else counts.skipped++
    }
  }
  return counts
}

export type DeliveryOutcome = 'sent' | 'failed' | 'skipped' | 'already_sent' | 'busy'

/**
 * Sends one notification row, at most once. The row's setting is read again
 * now, so a notification switched off after it was created (or while it waits
 * for a retry) is skipped rather than sent.
 */
export async function deliverNotification(db: BookingDb, notificationId: string, appointment: Appointment, ctx: Ctx): Promise<DeliveryOutcome> {
  const current = await db.getNotification(notificationId)
  if (!current) return 'failed'
  if (current.status === 'sent') return 'already_sent'
  if (current.status === 'skipped') return 'skipped'

  const claimed = await db.claimNotification(notificationId, STALE_SENDING_SECONDS)
  // Someone else is sending it right now (or has just sent it).
  if (!claimed) return 'busy'

  const fail = async (error: string) => {
    await db.finishNotification(notificationId, { status: 'failed', error })
    return 'failed' as const
  }

  const kind = parseKind(claimed.kind)
  const setting = kind && (await settingsFor(db, kind.event, ctx.env)).find((s) => s.audience === kind.audience)
  if (!kind || !setting || !setting.enabled) {
    await db.finishNotification(notificationId, { status: 'skipped', error: kind ? 'turned_off' : 'unknown_kind' })
    ctx.log.info(`notify: ${claimed.kind} skipped (${kind ? 'turned off' : 'unknown kind'})`)
    return 'skipped'
  }
  if (!setting.template_name) return fail('no_template')

  const to = claimed.recipient || recipientsFor(setting, appointment, ctx.env)[0]
  if (!to) return fail('no_recipient')

  const built = buildParameters(setting.parameters, appointment)
  if (!built.ok) {
    ctx.log.error(`notify: ${claimed.kind} has an invalid parameter in its settings (${built.error})`)
    return fail(built.error)
  }

  const config = providerConfig(ctx.env)
  if (!config) {
    // Not configured: kept as failed, so it can be retried once the settings exist.
    ctx.log.error(`notify: WhatsApp is not configured for ${claimed.kind}`)
    return fail('not_configured')
  }

  const result = await sendTemplate(config, { to, template: setting.template_name, language: setting.language, params: built.params }, ctx.fetch, ctx.log)
  if (result.ok) {
    await db.finishNotification(notificationId, { status: 'sent', messageId: result.messageId })
    ctx.log.info(`notify: ${claimed.kind} accepted by ${config.provider} (attempt ${claimed.attempts})`)
    return 'sent'
  }
  return fail(result.error)
}
