-- Configurable WhatsApp notifications: one row per event and audience says
-- whether it is sent, with which approved template, in which language, and
-- which booking fields fill the template's variables. See docs/BOOKINGS.md,
-- "Notification settings".
--
-- Apply after 20261015120000_appointments.sql, the same way (SQL Editor > New
-- query > paste > Run). Additive only, and safe to run more than once: it
-- creates a table, adds one optional column and grants access. No existing
-- booking or notification is changed or removed.

-- ── Settings ─────────────────────────────────────────────────────────────────

create table if not exists public.notification_settings (
  event          text not null check (event in ('booking_received', 'booking_confirmed', 'booking_rescheduled', 'booking_declined', 'appointment_reminder')),
  -- admin: the practice's numbers; customer: the patient who booked.
  audience       text not null check (audience in ('admin', 'customer')),
  -- Switch a message off here; it stops at once, including retries waiting to be sent.
  enabled        boolean not null default false,
  -- The approved WhatsApp template's name and language code (e.g. en, en_US).
  template_name  text check (template_name is null or (template_name ~ '^[a-z0-9_]+$' and char_length(template_name) <= 512)),
  language       text not null default 'en' check (language ~ '^[a-z]{2,3}(_[A-Z]{2})?$'),
  -- The template's body variables, in order. Each item is {"source": "<booking field>"}
  -- or {"text": "<fixed text>"}, plus "name" for templates with named variables.
  -- Booking fields: see docs/BOOKINGS.md.
  parameters     jsonb not null default '[]'::jsonb check (jsonb_typeof(parameters) = 'array'),
  -- Admin rows only: comma-separated numbers, country code first. Empty: WHATSAPP_RECIPIENT_NUMBER.
  recipients     text check (recipients is null or char_length(recipients) <= 500),
  -- appointment_reminder rows only: days before the appointment (empty means 1).
  days_before    smallint check (days_before is null or days_before between 0 and 30),
  note           text check (note is null or char_length(note) <= 500),
  updated_at     timestamptz not null default now(),
  primary key (event, audience)
);

drop trigger if exists notification_settings_touch on public.notification_settings;
create trigger notification_settings_touch before update on public.notification_settings for each row execute function public.touch_updated_at();

-- The starting rows. On: the practice's alert for a new booking and the
-- patient's booking_confirmation (both approved templates); switch the others
-- on once their templates are approved. Existing rows are never overwritten.
insert into public.notification_settings (event, audience, enabled, template_name, language, parameters, days_before, note) values
  ('booking_received', 'admin', true, 'new_booking_request', 'en',
   '[{"source":"booking_ref","name":"booking_id"},{"source":"patient_name","name":"name"},{"source":"patient_phone","name":"phone"},{"source":"requested_when","name":"requested"},{"source":"consultation_type","name":"type"},{"source":"status","name":"status"}]',
   null, 'New booking alert to the practice.'),
  ('booking_received', 'customer', true, 'booking_confirmation', 'en',
   '[{"source":"patient_first_name"},{"source":"patient_name"},{"source":"patient_email"},{"source":"patient_phone_digits"},{"source":"requested_date_short"},{"source":"requested_time"}]',
   null, 'Patient confirmation (Leminai template booking_confirmation): Dear {{1}}, Name {{2}}, Email {{3}}, Contact {{4}}, Preferred Date {{5}}, Preferred Slot {{6}}.'),
  ('booking_confirmed', 'customer', false, 'booking_confirmed', 'en',
   '[{"source":"patient_first_name"},{"source":"appointment_when"},{"source":"clinic_address"},{"source":"booking_ref"}]',
   null, 'Sent when staff set the status to confirmed.'),
  ('booking_confirmed', 'admin', false, 'admin_booking_update', 'en',
   '[{"source":"booking_ref"},{"source":"patient_name"},{"source":"status"},{"source":"appointment_when"}]',
   null, null),
  ('booking_rescheduled', 'customer', false, 'booking_rescheduled', 'en',
   '[{"source":"patient_first_name"},{"source":"appointment_when"},{"source":"booking_ref"}]',
   null, 'Sent when staff set the status to rescheduled or change the scheduled date or time.'),
  ('booking_rescheduled', 'admin', false, 'admin_booking_update', 'en',
   '[{"source":"booking_ref"},{"source":"patient_name"},{"source":"status"},{"source":"appointment_when"}]',
   null, null),
  ('booking_declined', 'customer', false, 'booking_declined', 'en',
   '[{"source":"patient_first_name"},{"source":"booking_ref"},{"source":"clinic_phone"}]',
   null, 'Sent when staff set the status to rejected.'),
  ('booking_declined', 'admin', false, 'admin_booking_update', 'en',
   '[{"source":"booking_ref"},{"source":"patient_name"},{"source":"status"},{"source":"appointment_when"}]',
   null, null),
  ('appointment_reminder', 'customer', false, 'appointment_reminder', 'en',
   '[{"source":"patient_first_name"},{"source":"appointment_when"},{"source":"clinic_address"}]',
   1, 'Daily at 09:00 India time, for confirmed or rescheduled appointments.'),
  ('appointment_reminder', 'admin', false, 'admin_appointment_reminder', 'en',
   '[{"source":"booking_ref"},{"source":"patient_name"},{"source":"appointment_when"}]',
   1, null)
on conflict (event, audience) do nothing;

alter table public.notification_settings enable row level security;
drop policy if exists "staff read notification settings" on public.notification_settings;
create policy "staff read notification settings" on public.notification_settings
  for select to authenticated using (public.is_staff());
revoke all on public.notification_settings from anon;
revoke insert, update, delete on public.notification_settings from authenticated;

-- ── Notifications: recipient and new kinds ───────────────────────────────────

-- Who each message went to (digits, country code first). Older rows keep null.
alter table public.notifications
  add column if not exists recipient text check (recipient is null or recipient ~ '^[1-9][0-9]{7,14}$');

-- Kinds are now "event:audience" (e.g. booking_confirmed:customer). The earlier
-- kinds stay allowed, so every existing row remains valid.
alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (
  kind in ('doctor_new', 'patient_confirmed', 'patient_rescheduled', 'patient_rejected')
  or kind ~ '^(booking_received|booking_confirmed|booking_rescheduled|booking_declined|appointment_reminder):(admin|customer)$'
);

-- ── Server access ────────────────────────────────────────────────────────────
-- The server functions use the service-role key for these REST requests.
-- Newer Supabase projects no longer grant this automatically. Deliberately no
-- DELETE: the website never removes bookings or notifications.
grant select, insert, update on public.appointments, public.notifications, public.staff to service_role;
grant select on public.notification_settings to service_role;
