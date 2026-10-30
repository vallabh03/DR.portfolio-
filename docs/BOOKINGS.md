# Consultation bookings: setup and operation

How a booking flows:

1. A patient fills in the form on `/consultation` (name, mobile number with
   country code, preferred date and time slot, optional message, consent).
2. The browser sends it to the site's own server function,
   `POST /api/consultation`. The function validates it again and saves it in
   Supabase as **Pending**, with a booking reference such as `AT-7K3F9Q`.
   The patient sees that reference straight away.
3. Only after the booking is saved, the function sends the doctor a WhatsApp
   message (Meta WhatsApp Cloud API, approved template) with the booking
   reference, patient name, mobile number, preferred date and time, and
   consultation type.
4. If WhatsApp fails, the booking is kept, and the failure is recorded in the
   `notifications` table. A daily job (`/api/cron/retry-notifications`) tries
   again, up to five attempts in total. A patient re-sending the same form also
   retries it. Neither ever creates a second booking or sends the message twice.

No staff login is needed. The practice sees every booking in Supabase
(Table Editor > `appointments`), including the patient's optional message,
which is deliberately left out of the WhatsApp notification because it can
contain medical details.

The browser never talks to Meta or Supabase and never sees a key or token.
Patients cannot see any booking, including their own.

---

## 1. Supabase

1. Create a project at supabase.com (a region near India, e.g. Mumbai).
2. **Create the tables:** Dashboard > SQL Editor > New query. Paste the whole of
   `supabase/migrations/20261015120000_appointments.sql` and click **Run**.
   If you have already run it, there is nothing more to do: the tables
   (`appointments`, `notifications`, `staff`) stay as they are. The `staff`
   table is no longer used by the website and can be left empty.

   If an earlier version of the appointments table was already created (from the
   removed `20261014_create_appointments.sql`), the script stops with a message;
   if that table holds only test data, run `drop table public.appointments cascade;`
   first and then run the script again.
3. **Key:** Project Settings > API (or "API Keys"):
   - Project URL → `SUPABASE_URL`
   - `service_role` / secret key → `SUPABASE_SERVICE_ROLE_KEY` (**server only;
     never with a `VITE_` prefix, never in source code**). `SUPABASE_SECRET_KEY`
     is accepted as another name for the same key.

   The public `anon` key is not needed.

### Who can see what (Row Level Security)

Row Level Security is on for all three tables, and no policy allows the public
(`anon`) key to read or write anything. Only the server functions, using the
service-role key, can create bookings and update notification records, and
they do so through the database functions in the migration
(`create_booking`, `claim_notification`), which only the service role may call.

## 2. Meta WhatsApp Cloud API

Follow steps 1–4 and 6–7 of the Meta section in [SETUP.md](SETUP.md) (Meta app,
WhatsApp Business Account, test or live sending number, permanent system-user
token). Then create **one template** in WhatsApp Manager > Message templates:
category **Utility**, language **English** (`en`, must match
`WHATSAPP_TEMPLATE_LANGUAGE`), parameter type **Named**.

**Doctor: new booking** (`WHATSAPP_TEMPLATE_NAME`, suggested name `new_booking_request`)

```
New consultation booking {{booking_id}}

Patient: {{name}}
Mobile: {{phone}}
Requested: {{requested}}
Type: {{type}}
Status: {{status}}

Please contact the patient to confirm a time.
```

Example values for Meta's review: `AT-7K3F9Q`, `Test Patient`,
`+919876543210`, `20 October 2026, Morning`, `In-person`, `Pending`.

A template is required because the doctor's number receives these messages
without having written to the business number first. Review can take up to
24 hours. With Meta's **test** sending number, the doctor's number must first be
added as a test recipient (WhatsApp > API Setup).

### Webhook: delivery receipts and the booking assistant

In the Meta app > WhatsApp > Configuration > Webhook:
- Callback URL: `https://www.drabhinavthaduri.in/api/whatsapp-webhook`
- Verify token: any long random text; the same value in `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- Subscribe to the **messages** field.
- App secret (App settings > Basic) → `WHATSAPP_APP_SECRET`. Every webhook call
  is checked against it; unsigned calls are refused.

With the webhook on:

- The `notifications` table shows `delivered`, `read` or `failed` in
  `delivery_status`.
- **Booking assistant:** the doctor sends a message to the practice's WhatsApp
  Business number (the number the notifications come from) and gets the
  bookings back from Supabase:

  | Send | Reply |
  |---|---|
  | `today` | Bookings requested for today (India time), in time-slot order |
  | `tomorrow` | Bookings for tomorrow |
  | `week` | Bookings for the next 7 days |
  | `pending` | All pending bookings, newest first |
  | `AT-7K3F9Q` | Full details of that booking, including the patient's message |
  | `help` (or `hi`) | The list of commands |

  Lists show the reference, time slot, name, mobile number, type and status, at
  most 15 at a time; the patient's message appears only when one booking is
  asked for by reference. Only the doctor's number (`WHATSAPP_RECIPIENT_NUMBER`)
  and numbers in `WHATSAPP_ALLOWED_NUMBERS` get answers; every other sender is
  ignored and never receives booking data. Replies are ordinary text messages,
  which WhatsApp allows within 24 hours of the doctor's message, so no template
  is needed. The assistant only reads; it never changes a booking.

## 3. Vercel

**Environment variables:** Project > Settings > Environment Variables, for
Production (and Preview if previews should save real bookings), then redeploy.

| Variable | Purpose | Secret? |
|---|---|---|
| `SUPABASE_URL` | Supabase project URL | No |
| `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`) | Saving bookings | **Yes** |
| `WHATSAPP_ACCESS_TOKEN` | Sending the notification | **Yes** |
| `WHATSAPP_PHONE_NUMBER_ID` | The sending number | No |
| `WHATSAPP_RECIPIENT_NUMBER` | Doctor's WhatsApp number, country code first | No |
| `WHATSAPP_TEMPLATE_NAME` | The approved template, e.g. `new_booking_request` | No |
| `WHATSAPP_TEMPLATE_LANGUAGE` | Template language code, e.g. `en` | No |
| `CRON_SECRET` | Lets only Vercel's scheduler run the daily retry (any long random text) | **Yes** |
| `WHATSAPP_API_VERSION` | Optional, defaults to `v23.0` | No |
| `WHATSAPP_APP_SECRET`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Webhook (receipts and booking assistant) | **Yes** |
| `WHATSAPP_ALLOWED_NUMBERS` | Optional: more numbers allowed to ask the assistant, comma-separated | No |
| `ALLOWED_ORIGINS` | Optional, e.g. `https://www.drabhinavthaduri.in` | No |

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are no longer used and can be
removed from Vercel.

**Daily retry:** `vercel.json` schedules `/api/cron/retry-notifications` every
day at 03:00 UTC (08:30 IST). Vercel sends `CRON_SECRET` with each call; without
it the job refuses to run. It appears under Project > Settings > Cron Jobs after
deploying.

## 4. Reliability and protection

- **Saved first:** a booking is saved before any message is attempted; a failed
  message never loses the booking.
- **No duplicate bookings:** the browser sends one request id per submission and
  reuses it on retries. The database returns the same booking for a repeated id,
  and for the same details sent again within a day. A reused id with different
  details is refused.
- **No duplicate messages:** each message has one row with a unique key. Before
  sending, the row is claimed in the database, so a retried request, the daily
  job and a second server can never send it twice. A claim left by a crashed
  attempt expires after two minutes.
- **Limits:** 5 booking requests per connection per 10 minutes (per server
  instance), and 3 bookings per mobile number per day (in the database).
  Same-site requests only, JSON only, 8 KB maximum, hidden spam field and a
  minimum fill time.
- **Responses** to the browser contain only `ok`, the booking reference and an
  error code. **Logs** contain outcomes and error codes only: never names,
  numbers, messages, tokens or Meta's error text.

## 5. Trying it locally without Supabase or Meta

Set `BOOKING_DEV_MOCK=sent` (or `failed`) in `.env.local` and run `npm run dev`.
Bookings are kept in memory and WhatsApp is replaced by a stand-in that succeeds
(or fails). This only affects `npm run dev` / `npm run preview`.

## 6. Tests and the real end-to-end check

`npm test` covers validation, saving before notifying, duplicate and retry
handling, concurrent requests, failure recovery, the retry job, the webhook
signature and the exact requests sent to Supabase and Meta. They use stand-ins
for Supabase and Meta, so they do **not** prove that real delivery works.

After deploying, check it for real:

1. Make a test booking on the live site; note the reference.
2. Supabase > Table Editor > `appointments`: the booking is there as `pending`.
3. The doctor's WhatsApp receives the message; in `notifications` the row is
   `sent` with a `meta_message_id`.
4. To test recovery: temporarily set a wrong `WHATSAPP_ACCESS_TOKEN`, redeploy,
   make another booking. The booking succeeds and its notification shows
   `failed` with an error code. Restore the token and redeploy; the next daily
   run (or Vercel > Cron Jobs > Run) sends it once.
