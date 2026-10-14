-- Migration: Create appointments table for consultation requests
-- Version: 20261014
-- Description: Persist consultation form submissions with idempotency and notification tracking

-- Enable required extensions
create extension if not exists "pgcrypto";

-- Appointments table
create table if not exists public.appointments (
  -- Internal primary key
  id uuid primary key default gen_random_uuid(),

  -- Unique request ID from the client (idempotency key)
  request_id text not null unique,

  -- Patient details (validated by the API before insert)
  name text not null,
  phone text not null,
  email text,

  -- Appointment preferences (validated: date is YYYY-MM-DD, time is one of allowed keys)
  preferred_date date,
  preferred_time text check (preferred_time in ('morning', 'midday', 'afternoon', 'evening')),

  -- Optional consultation message (max 1000 chars, validated by API)
  message text,

  -- Consent tracking
  consent boolean not null default false,
  consented_at timestamptz not null default now(),

  -- Notification status tracking
  notification_status text not null default 'pending'
    check (notification_status in ('pending', 'sent', 'failed', 'retrying')),
  notification_sent_at timestamptz,
  notification_error text,
  notification_retry_count int not null default 0,
  last_notification_attempt timestamptz,

  -- WhatsApp message ID from Meta (when sent successfully)
  whatsapp_message_id text,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for querying by request_id (idempotency lookups)
create index if not exists idx_appointments_request_id on public.appointments (request_id);

-- Index for notification retry queue (find pending/failed notifications)
create index if not exists idx_appointments_notification_status on public.appointments (notification_status)
  where notification_status in ('pending', 'failed', 'retrying');

-- Index for rate-limiting queries (by phone, date range)
create index if not exists idx_appointments_phone_created on public.appointments (phone, created_at);

-- Updated_at trigger
create or replace function public.update_appointments_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trigger_appointments_updated_at on public.appointments;
create trigger trigger_appointments_updated_at
before update on public.appointments
for each row execute function public.update_appointments_updated_at();

-- Trigger to increment notification_retry_count when notification_status changes to 'failed'
create or replace function public.increment_notification_retry_count()
returns trigger language plpgsql as $$
begin
  if new.notification_status = 'failed' and old.notification_status != 'failed' then
    new.notification_retry_count = old.notification_retry_count + 1;
  end if;
  return new;
end $$;

drop trigger if exists trigger_increment_notification_retry_count on public.appointments;
create trigger trigger_increment_notification_retry_count
before update on public.appointments
for each row execute function public.increment_notification_retry_count();

-- Row Level Security (RLS)
alter table public.appointments enable row level security;

-- No policies for anon or authenticated roles - server uses service role key
-- This prevents any direct browser access to patient data

-- Comments for documentation
comment on table public.appointments is 'Consultation requests from the website form. Server-side writes only via service role key.';
comment on column public.appointments.request_id is 'Client-generated unique ID for idempotency. Enforced unique in DB.';
comment on column public.appointments.notification_status is 'WhatsApp delivery status: pending, sent, failed, retrying.';
comment on column public.appointments.whatsapp_message_id is 'Meta WhatsApp message ID returned on successful send.';