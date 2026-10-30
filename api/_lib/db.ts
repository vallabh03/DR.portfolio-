import type { Appointment, BookingInput, Notification, NotificationKind, NotificationStatus } from './booking.ts'

/**
 * The storage the server functions need, as one small interface with two
 * implementations:
 *
 * - supabaseDb: the real database (supabase/migrations/*.sql), reached over
 *   Supabase's REST API with the service-role key. Server-side only.
 * - memoryDb: the same rules in memory, for tests and for trying the form
 *   locally without a database (BOOKING_DEV_MOCK).
 *
 * The rules that must be atomic (one booking per request, claiming a
 * notification before sending it) live in SQL functions in the real database,
 * and are mirrored exactly in memoryDb.
 */

export type CreateResult = { result: 'created' | 'existing'; appointment: Appointment } | { result: 'conflict' } | { result: 'limited' }
export type FinishUpdate = { status: Extract<NotificationStatus, 'sent' | 'failed' | 'skipped'>; messageId?: string; error?: string }

export interface BookingDb {
  createBooking(requestId: string, fingerprint: string, input: BookingInput, maxPerPhonePerDay: number): Promise<CreateResult>
  /** The notification for this event, created if it does not exist yet. */
  ensureNotification(appointmentId: string, kind: NotificationKind, idempotencyKey: string): Promise<Notification>
  /** Marks a waiting, failed or stale notification as sending; null when it is not available to send. */
  claimNotification(id: string, staleSeconds: number): Promise<Notification | null>
  finishNotification(id: string, update: FinishUpdate): Promise<void>
  getNotification(id: string): Promise<Notification | null>
  getAppointment(id: string): Promise<Appointment | null>
  /** Notifications still to be delivered (waiting or failed), created since `since`, with fewer than `maxAttempts` attempts. */
  listRetryable(maxAttempts: number, since: string, limit: number): Promise<Notification[]>
  /** Delivery receipts from Meta's webhook. */
  recordDelivery(messageId: string, status: string, error?: string): Promise<void>
  /** Bookings requested for dates from `from` to `to` (YYYY-MM-DD, inclusive), not rejected, up to `limit`. */
  bookingsBetween(from: string, to: string, limit: number): Promise<Appointment[]>
  /** Pending bookings, newest first, up to `limit`. */
  pendingBookings(limit: number): Promise<Appointment[]>
  /** One booking by its reference (e.g. AT-7K3F9Q), or null. */
  bookingByRef(ref: string): Promise<Appointment | null>
}

export class DbError extends Error {
  readonly status: number
  constructor(status: number) {
    super(`database request failed (${status})`)
    this.name = 'DbError'
    this.status = status
  }
}

/* ── Supabase ────────────────────────────────────────────────────────────── */

export function supabaseDb(url: string, serviceKey: string, fetchImpl: typeof fetch = fetch): BookingDb {
  const base = url.replace(/\/+$/, '')
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' }

  async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetchImpl(`${base}${path}`, { ...init, headers: { ...headers, ...(init.headers as Record<string, string>) }, signal: AbortSignal.timeout(10_000) })
    if (!res.ok) throw new DbError(res.status)
    const text = await res.text()
    return (text ? JSON.parse(text) : null) as T
  }
  const rpc = <T>(fn: string, args: Record<string, unknown>) => call<T>(`/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) })
  const one = async <T>(path: string) => ((await call<T[]>(path)) ?? [])[0] ?? null
  const eq = (v: string) => `eq.${encodeURIComponent(v)}`

  return {
    createBooking: (requestId, fingerprint, i, max) =>
      rpc<CreateResult>('create_booking', {
        p_request_id: requestId,
        p_fingerprint: fingerprint,
        p_name: i.name,
        p_phone: i.phone,
        p_email: i.email,
        p_date: i.date,
        p_slot: i.slot,
        p_type: i.type,
        p_message: i.message,
        p_consent: i.consent,
        p_max_per_phone_per_day: max,
      }),

    async ensureNotification(appointmentId, kind, key) {
      await call('/rest/v1/notifications?on_conflict=idempotency_key', {
        method: 'POST',
        headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
        body: JSON.stringify({ appointment_id: appointmentId, kind, idempotency_key: key }),
      })
      const row = await one<Notification>(`/rest/v1/notifications?idempotency_key=${eq(key)}&select=*`)
      if (!row) throw new DbError(404)
      return row
    },

    async claimNotification(id, staleSeconds) {
      const rows = await rpc<Notification[]>('claim_notification', { p_id: id, p_stale_seconds: staleSeconds })
      return rows?.[0] ?? null
    },

    async finishNotification(id, u) {
      await call(`/rest/v1/notifications?id=${eq(id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          status: u.status,
          last_error: u.status === 'sent' ? null : (u.error ?? null),
          ...(u.messageId && { meta_message_id: u.messageId, sent_at: new Date().toISOString(), delivery_status: 'sent' }),
        }),
      })
    },

    getNotification: (id) => one<Notification>(`/rest/v1/notifications?id=${eq(id)}&select=*`),
    getAppointment: (id) => one<Appointment>(`/rest/v1/appointments?id=${eq(id)}&select=*`),

    listRetryable: async (maxAttempts, since, limit) =>
      (await call<Notification[]>(
        `/rest/v1/notifications?status=in.(pending,failed)&attempts=lt.${maxAttempts}&created_at=gte.${encodeURIComponent(since)}&order=created_at.asc&limit=${limit}&select=*`,
      )) ?? [],

    async recordDelivery(messageId, status, error) {
      await call(`/rest/v1/notifications?meta_message_id=${eq(messageId)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ delivery_status: status, delivery_error: error ?? null }),
      })
    },

    bookingsBetween: async (from, to, limit) =>
      (await call<Appointment[]>(
        `/rest/v1/appointments?requested_date=gte.${from}&requested_date=lte.${to}&status=neq.rejected&order=requested_date.asc,created_at.asc&limit=${limit}&select=*`,
      )) ?? [],
    pendingBookings: async (limit) => (await call<Appointment[]>(`/rest/v1/appointments?status=eq.pending&order=created_at.desc&limit=${limit}&select=*`)) ?? [],
    bookingByRef: (ref) => one<Appointment>(`/rest/v1/appointments?booking_ref=${eq(ref)}&select=*`),
  }
}

/* ── In memory (tests and local trial) ───────────────────────────────────── */

type MemoryNotification = Notification & { updatedAt: number; createdAt: number }

export type MemoryDb = BookingDb & {
  appointments: Map<string, Appointment>
  notifications: Map<string, MemoryNotification>
}

export function memoryDb(now: () => number = Date.now): MemoryDb {
  const appointments = new Map<string, Appointment & { createdAt: number }>()
  const notifications = new Map<string, MemoryNotification>()
  let counter = 0
  const id = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const newRef = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(6))
    return `AT-${Array.from(bytes, (b) => ALPHABET[b % 32]).join('')}`
  }
  const copy = <T>(v: T): T => structuredClone(v)
  const DAY = 86_400_000

  return {
    appointments,
    notifications,

    async createBooking(requestId, fingerprint, i, max) {
      const all = [...appointments.values()]
      const byRequest = all.find((a) => a.request_id === requestId)
      if (byRequest) return byRequest.fingerprint === fingerprint ? { result: 'existing', appointment: copy(byRequest) } : { result: 'conflict' }
      const same = all.filter((a) => a.fingerprint === fingerprint && a.status === 'pending' && now() - a.createdAt < DAY).at(-1)
      if (same) return { result: 'existing', appointment: copy(same) }
      if (all.filter((a) => a.patient_phone === i.phone && now() - a.createdAt < DAY).length >= max) return { result: 'limited' }
      let ref = newRef()
      while (all.some((a) => a.booking_ref === ref)) ref = newRef()
      const a: Appointment & { createdAt: number } = {
        id: id(),
        booking_ref: ref,
        request_id: requestId,
        fingerprint,
        patient_name: i.name,
        patient_phone: i.phone,
        patient_email: i.email || null,
        requested_date: i.date,
        requested_slot: i.slot,
        consultation_type: i.type,
        message: i.message || null,
        consent: i.consent,
        status: 'pending',
        scheduled_date: null,
        scheduled_slot: null,
        status_version: 0,
        last_action_id: null,
        status_changed_by: null,
        created_at: new Date(now()).toISOString(),
        createdAt: now(),
      }
      appointments.set(a.id, a)
      return { result: 'created', appointment: copy(a) }
    },

    async ensureNotification(appointmentId, kind, key) {
      const found = [...notifications.values()].find((n) => n.idempotency_key === key)
      if (found) return copy(found)
      const n: MemoryNotification = {
        id: id(),
        appointment_id: appointmentId,
        kind,
        idempotency_key: key,
        status: 'pending',
        attempts: 0,
        last_error: null,
        meta_message_id: null,
        delivery_status: null,
        sent_at: null,
        updatedAt: now(),
        createdAt: now(),
      }
      notifications.set(n.id, n)
      return copy(n)
    },

    async claimNotification(nid, staleSeconds) {
      const n = notifications.get(nid)
      if (!n) return null
      const available = n.status === 'pending' || n.status === 'failed' || (n.status === 'sending' && now() - n.updatedAt > staleSeconds * 1000)
      if (!available) return null
      Object.assign(n, { status: 'sending', attempts: n.attempts + 1, updatedAt: now() })
      return copy(n)
    },

    async finishNotification(nid, u) {
      const n = notifications.get(nid)
      if (!n) return
      Object.assign(n, {
        status: u.status,
        last_error: u.status === 'sent' ? null : (u.error ?? null),
        updatedAt: now(),
        ...(u.messageId && { meta_message_id: u.messageId, sent_at: new Date(now()).toISOString(), delivery_status: 'sent' }),
      })
    },

    getNotification: async (nid) => (notifications.has(nid) ? copy(notifications.get(nid)!) : null),
    getAppointment: async (aid) => (appointments.has(aid) ? copy(appointments.get(aid)!) : null),

    listRetryable: async (maxAttempts, since, limit) =>
      [...notifications.values()]
        .filter((n) => (n.status === 'pending' || n.status === 'failed') && n.attempts < maxAttempts && n.createdAt >= Date.parse(since))
        .slice(0, limit)
        .map(copy),

    async recordDelivery(messageId, status, error) {
      for (const n of notifications.values()) if (n.meta_message_id === messageId) Object.assign(n, { delivery_status: status, delivery_error: error ?? null })
    },

    bookingsBetween: async (from, to, limit) =>
      [...appointments.values()]
        .filter((a) => a.requested_date >= from && a.requested_date <= to && a.status !== 'rejected')
        .sort((x, y) => x.requested_date.localeCompare(y.requested_date) || x.createdAt - y.createdAt)
        .slice(0, limit)
        .map(copy),
    pendingBookings: async (limit) =>
      [...appointments.values()]
        .filter((a) => a.status === 'pending')
        .sort((x, y) => y.createdAt - x.createdAt)
        .slice(0, limit)
        .map(copy),
    bookingByRef: async (ref) => {
      const a = [...appointments.values()].find((x) => x.booking_ref === ref)
      return a ? copy(a) : null
    },
  }
}
