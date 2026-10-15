-- Consultation bookings, staff and WhatsApp notifications.
--
-- Apply in the Supabase dashboard (SQL Editor > New query > paste > Run), or
-- with the Supabase CLI: `supabase db push`. See docs/BOOKINGS.md.
--
-- Access model
--   * The website never talks to these tables directly. Bookings are created by
--     the server function (api/consultation.ts) with the service-role key,
--     which is kept in server environment variables only.
--   * Patients have no access of any kind: there are no policies for the anon
--     role, so nobody can read, list or change bookings from a browser.
--   * Staff sign in with their own Supabase account. Only accounts listed in
--     public.staff can read appointments and notifications (Row Level Security).
--     Status changes go through the server (api/appointments/status.ts), which
--     checks the staff member and sends the patient's WhatsApp message.

-- gen_random_bytes for booking references. On Supabase pgcrypto is already installed in the extensions schema.
create extension if not exists pgcrypto;

-- ── Staff ────────────────────────────────────────────────────────────────────

create table if not exists public.staff (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 100),
  role       text not null default 'receptionist' check (role in ('doctor', 'receptionist')),
  created_at timestamptz not null default now()
);

-- True when the signed-in user is listed as staff. Security definer so the
-- check works inside policies without giving anyone read access to public.staff.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

-- ── Appointments ─────────────────────────────────────────────────────────────

create table if not exists public.appointments (
  id                 uuid primary key default gen_random_uuid(),
  -- The reference shown to the patient, e.g. AT-7K3F9Q.
  booking_ref        text not null unique check (booking_ref ~ '^AT-[A-Z2-9]{6}$'),
  -- The browser's id for this submission; a retried request reuses it.
  request_id         text not null unique check (char_length(request_id) between 8 and 64),
  -- SHA-256 of the submitted details, so a reused request id with different details is refused.
  fingerprint        text not null,
  patient_name       text not null check (char_length(patient_name) between 2 and 100),
  -- International format, digits only, country code first (e.g. 919876543210).
  patient_phone      text not null check (patient_phone ~ '^[1-9][0-9]{7,14}$'),
  patient_email      text check (patient_email is null or char_length(patient_email) <= 254),
  requested_date     date not null,
  requested_slot     text not null check (requested_slot in ('morning', 'midday', 'afternoon', 'evening')),
  consultation_type  text not null default 'in_person' check (consultation_type in ('in_person', 'online')),
  message            text check (message is null or char_length(message) <= 1000),
  consent            boolean not null check (consent),
  status             text not null default 'pending' check (status in ('pending', 'confirmed', 'rescheduled', 'rejected')),
  -- Set when staff confirm or reschedule.
  scheduled_date     date,
  scheduled_slot     text check (scheduled_slot is null or scheduled_slot in ('morning', 'midday', 'afternoon', 'evening')),
  -- Increases with every status change; staff actions name the version they saw.
  status_version     integer not null default 0,
  last_action_id     text,
  status_changed_by  uuid references public.staff (user_id) on delete set null,
  status_changed_at  timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists appointments_status_created_idx on public.appointments (status, created_at desc);
create index if not exists appointments_phone_created_idx on public.appointments (patient_phone, created_at desc);

-- ── Notifications ────────────────────────────────────────────────────────────

create table if not exists public.notifications (
  id               uuid primary key default gen_random_uuid(),
  appointment_id   uuid not null references public.appointments (id) on delete cascade,
  kind             text not null check (kind in ('doctor_new', 'patient_confirmed', 'patient_rescheduled', 'patient_rejected')),
  -- One notification per event: a retried request finds the existing row instead of sending again.
  idempotency_key  text not null unique,
  status           text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempts         integer not null default 0,
  -- Codes only (Meta status/code/subcode/trace id); never message text or patient details.
  last_error       text,
  meta_message_id  text unique,
  -- From Meta's delivery webhook: sent, delivered, read or failed.
  delivery_status  text check (delivery_status is null or delivery_status in ('sent', 'delivered', 'read', 'failed')),
  delivery_error   text,
  sent_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists notifications_appointment_idx on public.notifications (appointment_id, created_at);
create index if not exists notifications_status_idx on public.notifications (status);

-- ── Timestamps ───────────────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists appointments_touch on public.appointments;
create trigger appointments_touch before update on public.appointments for each row execute function public.touch_updated_at();
drop trigger if exists notifications_touch on public.notifications;
create trigger notifications_touch before update on public.notifications for each row execute function public.touch_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────────
-- No policy is created for the anon role on any table, so the public key used
-- in browsers cannot read or write anything here. The service role bypasses
-- RLS and is used only by the server functions.

alter table public.staff enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "staff read own row" on public.staff;
create policy "staff read own row" on public.staff
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "staff read appointments" on public.appointments;
create policy "staff read appointments" on public.appointments
  for select to authenticated using (public.is_staff());

drop policy if exists "staff read notifications" on public.notifications;
create policy "staff read notifications" on public.notifications
  for select to authenticated using (public.is_staff());

-- Writes from browsers are not allowed at all (no insert/update/delete policies):
-- every change goes through a server function that validates it first.
revoke insert, update, delete on public.appointments, public.notifications, public.staff from anon, authenticated;
revoke all on public.appointments, public.notifications, public.staff from anon;

-- ── Booking creation (server only) ───────────────────────────────────────────
-- One atomic step: refuses a reused request id with different details, returns
-- the existing booking for a retry or an identical recent booking, applies a
-- per-phone limit, and otherwise inserts a new pending booking with a fresh
-- reference.

create or replace function public.create_booking(
  p_request_id text,
  p_fingerprint text,
  p_name text,
  p_phone text,
  p_email text,
  p_date date,
  p_slot text,
  p_type text,
  p_message text,
  p_consent boolean,
  p_max_per_phone_per_day integer default 3
)
returns jsonb
language plpgsql
security definer
-- extensions: where Supabase installs pgcrypto (gen_random_bytes).
set search_path = public, extensions
as $$
declare
  existing public.appointments;
  created  public.appointments;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  ref      text;
  attempt  integer := 0;
begin
  -- Serialise bookings for the same phone number so the checks below cannot race.
  perform pg_advisory_xact_lock(hashtext('booking:' || p_phone));

  select * into existing from public.appointments where request_id = p_request_id;
  if found then
    if existing.fingerprint <> p_fingerprint then
      return jsonb_build_object('result', 'conflict');
    end if;
    return jsonb_build_object('result', 'existing', 'appointment', to_jsonb(existing));
  end if;

  -- The same details sent again (a new request id) within a day: the same booking.
  select * into existing from public.appointments
    where fingerprint = p_fingerprint and status = 'pending' and created_at > now() - interval '1 day'
    order by created_at desc limit 1;
  if found then
    return jsonb_build_object('result', 'existing', 'appointment', to_jsonb(existing));
  end if;

  if (select count(*) from public.appointments where patient_phone = p_phone and created_at > now() - interval '1 day') >= p_max_per_phone_per_day then
    return jsonb_build_object('result', 'limited');
  end if;

  loop
    attempt := attempt + 1;
    ref := 'AT-';
    for i in 1..6 loop
      ref := ref || substr(alphabet, 1 + (get_byte(gen_random_bytes(1), 0) % 32), 1);
    end loop;
    begin
      insert into public.appointments (
        booking_ref, request_id, fingerprint, patient_name, patient_phone, patient_email,
        requested_date, requested_slot, consultation_type, message, consent
      ) values (
        ref, p_request_id, p_fingerprint, p_name, p_phone, nullif(p_email, ''),
        p_date, p_slot, p_type, nullif(p_message, ''), p_consent
      ) returning * into created;
      exit;
    exception when unique_violation then
      -- A reference collision (or a concurrent copy of this request): try again or return it.
      select * into existing from public.appointments where request_id = p_request_id;
      if found then
        return jsonb_build_object('result', 'existing', 'appointment', to_jsonb(existing));
      end if;
      if attempt >= 5 then raise; end if;
    end;
  end loop;

  return jsonb_build_object('result', 'created', 'appointment', to_jsonb(created));
end;
$$;

-- ── Notification claiming (server only) ──────────────────────────────────────
-- Marks a notification as being sent, but only if it is waiting, failed, or
-- stuck in "sending" for longer than p_stale_seconds. Two concurrent attempts
-- can therefore never both send the same message.

create or replace function public.claim_notification(p_id uuid, p_stale_seconds integer default 120)
returns setof public.notifications
language sql
security definer
set search_path = public
as $$
  update public.notifications
     set status = 'sending', attempts = attempts + 1
   where id = p_id
     and (status in ('pending', 'failed') or (status = 'sending' and updated_at < now() - make_interval(secs => p_stale_seconds)))
  returning *;
$$;

-- ── Staff status change (server only) ────────────────────────────────────────
-- Applies confirm / reschedule / reject only if the appointment is still at the
-- version the staff member saw. A retry of the same action (same p_action_id)
-- returns the already-updated appointment instead of failing.

create or replace function public.set_appointment_status(
  p_id uuid,
  p_expected_version integer,
  p_action_id text,
  p_status text,
  p_date date,
  p_slot text,
  p_staff uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  appt public.appointments;
begin
  if p_status not in ('confirmed', 'rescheduled', 'rejected') then
    raise exception 'invalid status';
  end if;

  update public.appointments
     set status = p_status,
         scheduled_date = case when p_status = 'rejected' then null else p_date end,
         scheduled_slot = case when p_status = 'rejected' then null else p_slot end,
         status_version = status_version + 1,
         last_action_id = p_action_id,
         status_changed_by = p_staff,
         status_changed_at = now()
   where id = p_id and status_version = p_expected_version
  returning * into appt;
  if found then
    return jsonb_build_object('result', 'updated', 'appointment', to_jsonb(appt));
  end if;

  select * into appt from public.appointments where id = p_id;
  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;
  if appt.last_action_id = p_action_id and appt.status_version = p_expected_version + 1 then
    return jsonb_build_object('result', 'repeat', 'appointment', to_jsonb(appt));
  end if;
  return jsonb_build_object('result', 'stale', 'appointment', to_jsonb(appt));
end;
$$;

-- Only the server (service role) may call these functions.
revoke execute on function public.create_booking(text, text, text, text, text, date, text, text, text, boolean, integer) from public, anon, authenticated;
revoke execute on function public.claim_notification(uuid, integer) from public, anon, authenticated;
revoke execute on function public.set_appointment_status(uuid, integer, text, text, date, text, uuid) from public, anon, authenticated;
grant execute on function public.create_booking(text, text, text, text, text, date, text, text, text, boolean, integer) to service_role;
grant execute on function public.claim_notification(uuid, integer) to service_role;
grant execute on function public.set_appointment_status(uuid, integer, text, text, date, text, uuid) to service_role;
grant execute on function public.is_staff() to authenticated;
