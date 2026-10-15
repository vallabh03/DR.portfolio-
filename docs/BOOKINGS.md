# Consultation bookings: setup and operation

How a booking flows:

1. A patient fills in the form on `/consultation` (name, mobile number with
   country code, preferred date and time slot, optional message, consent).
2. The browser sends it to the site's own server function,
   `POST /api/consultation`. The function validates it again and saves it in
   Supabase as **Pending**, with a booking reference such as `AT-7K3F9Q`.
   The patient sees that reference straight away.
3. Only after the booking is saved, the function sends the doctor a WhatsApp
   message (Meta WhatsApp Cloud API, approved template). If WhatsApp fails, the
   booking is kept and the message is marked **failed** so it can be retried.
4. Staff sign in at `/staff`, see the bookings, and **Confirm**, **Reschedule**
   or **Reject** each one. Each change sends the patient a WhatsApp message.
5. Every message is recorded (sent / failed, attempts, error code, and, with the
   optional webhook, delivered / read).

The browser never talks to Meta, never sees a Meta token, and never sees the
Supabase service-role key. Patients cannot see any booking, including their own.

---

## 1. Supabase

1. Create a project at supabase.com (choose a region near India, e.g. Mumbai).
2. **Create the tables:** Dashboard > SQL Editor > New query. Paste the whole of
   `supabase/migrations/20261015120000_appointments.sql` and click **Run**.
   It creates:
   - `appointments`: booking reference, patient details, requested date/slot,
     consultation type, consent, status, scheduled date/slot, timestamps.
   - `notifications`: one row per WhatsApp message, with status, attempts,
     error code and delivery status.
   - `staff`: who may use the dashboard.
   - Row Level Security on all three, plus the server-only functions
     `create_booking`, `claim_notification` and `set_appointment_status`.
3. **Staff accounts:** Authentication > Users > Add user > Create new user (email
   and a strong password; tick "Auto confirm user"). Then add each account to
   the staff list in the SQL Editor:

   ```sql
   insert into public.staff (user_id, name, role)
   select id, 'Reception', 'receptionist' from auth.users where email = 'reception@example.com';
   ```

   Use `'doctor'` as the role for the doctor. Removing a row removes access.
   Turn off public sign-ups: Authentication > Sign In / Providers > Email >
   disable "Allow new users to sign up". Staff accounts are only created by you.
4. **Keys:** Project Settings > API (or "API Keys"):
   - Project URL → `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - `anon` / publishable key → `VITE_SUPABASE_ANON_KEY` (safe in the browser:
     Row Level Security lets it read bookings only for staff, and never write)
   - `service_role` / secret key → `SUPABASE_SERVICE_ROLE_KEY` (**server only;
     never with a `VITE_` prefix, never in source code**)

### Who can see what (Row Level Security)

| | Patients / public (anon key) | Signed-in staff | Server functions (service role) |
|---|---|---|---|
| Read bookings | No | Yes | Yes |
| Create bookings | No (only via `/api/consultation`) | No | Yes, after validation |
| Change status | No | Only via `/api/appointments/status` | Yes, after checking the staff sign-in |
| Read notifications | No | Yes | Yes |

## 2. Meta WhatsApp Cloud API

Follow steps 1–4 and 6–7 of the Meta section in [SETUP.md](SETUP.md) (Meta app,
WhatsApp Business Account, test or live sending number, permanent system-user
token). Then create these **four templates** in WhatsApp Manager > Message
templates: category **Utility**, language **English** (`en`, must match
`WHATSAPP_TEMPLATE_LANGUAGE`), parameter type **Named**.

**Doctor: new booking** (`WHATSAPP_TEMPLATE_NAME`, suggested name `new_booking_request`)

```
New consultation booking {{booking_id}}

Patient: {{name}}
Mobile: {{phone}}
Requested: {{requested}}
Type: {{type}}
Status: {{status}}

Please review it in the staff dashboard.
```

Example values: `AT-7K3F9Q`, `Test Patient`, `+919876543210`,
`20 October 2026, Morning`, `In-person`, `Pending`.

**Patient: confirmed** (`WHATSAPP_TEMPLATE_CONFIRMED`, e.g. `appointment_confirmed`)

```
Hello {{name}}, your consultation with Dr. Abhinav Thaduri is confirmed for {{date_time}}. Booking reference: {{booking_id}}.
```

**Patient: rescheduled** (`WHATSAPP_TEMPLATE_RESCHEDULED`, e.g. `appointment_rescheduled`)

```
Hello {{name}}, your consultation request {{booking_id}} with Dr. Abhinav Thaduri has been rescheduled to {{date_time}}. Please contact the practice if this time does not suit you.
```

**Patient: declined** (`WHATSAPP_TEMPLATE_REJECTED`, e.g. `appointment_declined`)

```
Hello {{name}}, we are unable to offer an appointment for your request {{booking_id}} at this time. Please contact the practice to arrange another time.
```

`{{date_time}}` is filled like `22 October 2026, Afternoon`. The doctor and
practice should approve the wording before submitting the templates; Meta's
review can take up to 24 hours.

Patient messages go to the mobile number the patient entered (they consent to
WhatsApp contact on the form). With Meta's **test** number, every recipient
must first be added as a test recipient, so patient messages only reach real
patients once a live sending number is set up.

### Optional: delivery receipts (webhook)

In the Meta app > WhatsApp > Configuration > Webhook:
- Callback URL: `https://www.drabhinavthaduri.in/api/whatsapp-webhook`
- Verify token: any long random text; the same value in `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- Subscribe to the **messages** field.
- App secret (App settings > Basic) → `WHATSAPP_APP_SECRET`. Every webhook call
  is checked against it; unsigned calls are refused.

The dashboard then shows "Sent (delivered)" / "(read)" / "(failed)".

## 3. Environment variables

Vercel > Project > Settings > Environment Variables (Production, and Preview if
previews should use them), then redeploy. Locally: `.env.local`.

| Variable | Where it is used | Secret? |
|---|---|---|
| `SUPABASE_URL` | Server functions | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Server functions | **Yes** |
| `VITE_SUPABASE_URL` | Staff dashboard (browser) | No |
| `VITE_SUPABASE_ANON_KEY` | Staff dashboard (browser) | No (public by design) |
| `WHATSAPP_ACCESS_TOKEN` | Server functions | **Yes** |
| `WHATSAPP_PHONE_NUMBER_ID` | Server functions | No |
| `WHATSAPP_RECIPIENT_NUMBER` | Doctor's WhatsApp number, country code first | No |
| `WHATSAPP_TEMPLATE_NAME` | Doctor's new-booking template | No |
| `WHATSAPP_TEMPLATE_CONFIRMED` | Patient confirmation template | No |
| `WHATSAPP_TEMPLATE_RESCHEDULED` | Patient reschedule template | No |
| `WHATSAPP_TEMPLATE_REJECTED` | Patient declined template | No |
| `WHATSAPP_TEMPLATE_LANGUAGE` | Template language code, e.g. `en` | No |
| `WHATSAPP_API_VERSION` | Optional, defaults to `v23.0` | No |
| `WHATSAPP_APP_SECRET` | Webhook signature check (optional webhook) | **Yes** |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Webhook subscription check (optional webhook) | **Yes** |
| `ALLOWED_ORIGINS` | Optional; e.g. `https://www.drabhinavthaduri.in` | No |

## 4. Reliability and protection

- **Saved first:** a booking is saved before any message is attempted; a failed
  message never loses the booking.
- **No duplicate bookings:** the browser sends one request id per submission and
  reuses it on retries. The database returns the same booking for a repeated id,
  and for the same details sent again within a day. A reused id with different
  details is refused.
- **No duplicate messages:** each message has its own row with a unique key
  (booking + event). Before sending, the row is claimed in the database, so a
  retried request, a double click or two servers can never send it twice. A
  claim left by a crashed attempt expires after two minutes.
- **Retries:** failed messages show a **Retry** button in the dashboard. A
  patient retrying the same submission also retries the doctor's message if it
  had failed.
- **Two staff at once:** each status change names the version the staff member
  saw; if someone else changed it first, the change is refused and the list
  reloads.
- **Limits:** 5 booking requests per connection per 10 minutes (per server
  instance), and 3 bookings per mobile number per day (in the database).
  Same-site requests only, JSON only, 8 KB maximum, hidden spam field and a
  minimum fill time.
- **Logs** contain outcomes and error codes only: never names, numbers,
  messages, tokens or Meta's error text.

## 5. Trying it locally without Supabase or Meta

Set `BOOKING_DEV_MOCK=sent` (or `failed`) in `.env.local` and run `npm run dev`.
Bookings are kept in memory and WhatsApp is replaced by a stand-in that succeeds
(or fails). This only affects `npm run dev` / `npm run preview`. The staff
dashboard needs a real Supabase project.

## 6. Tests

`npm test` covers validation, saving before notifying, duplicate and retry
handling, concurrent requests, failure recovery, staff sign-in checks, status
changes, the webhook signature and the exact requests sent to Supabase and Meta.
They use stand-ins for Supabase and Meta, so they do **not** prove that real
delivery works: that needs the setup above and a test booking on the deployed
site.

### Checklist after deploying

1. Make a test booking on the live site; note the reference.
2. In Supabase > Table Editor > `appointments`, the booking is there as `pending`.
3. The doctor's WhatsApp receives the new-booking message; in `notifications`
   the row is `sent` with a `meta_message_id`.
4. Sign in at `/staff`, confirm the test booking; the test patient number
   receives the confirmation.
5. Temporarily set a wrong `WHATSAPP_ACCESS_TOKEN`, make another booking: the
   booking still succeeds and the notification shows `failed`. Restore the
   token, redeploy, press **Retry**: it is sent once.
