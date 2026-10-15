# WhatsApp (Meta Cloud API) setup

The booking system (database, staff dashboard, notifications) is described in
[BOOKINGS.md](BOOKINGS.md). This page covers the Meta side: creating the app,
the sending number and the access token. The browser never talks to Meta and
never sees a credential.

## 1. What you create in Meta

1. **Meta account and developer account.** Sign in at developers.facebook.com and
   register as a developer.
2. **Business portfolio.** Create one at business.facebook.com for the practice.
3. **Meta app.** In the developer dashboard create an app with the "Connect with
   customers through WhatsApp" use case and connect it to the business portfolio.
   This creates a WhatsApp Business Account (WABA) and a free test sending number.
4. **Recipient number for testing.** In WhatsApp > API Setup, add the practice's
   WhatsApp number as a test recipient and confirm the code sent to it.
5. **Message templates.** Create the four templates listed in
   [BOOKINGS.md](BOOKINGS.md#2-meta-whatsapp-cloud-api) (one for the doctor's
   new-booking message, three for patients). Utility templates are required
   because the recipients have not written to the business number first.
6. **Permanent access token.** The token on the API Setup page expires quickly.
   In Business settings > Users > System users, create a system user, give it
   access to the app and the WhatsApp account, and generate a token with
   `whatsapp_business_messaging` and `whatsapp_business_management`
   (and `business_management` if asked).
7. **For going live with a real sending number** (instead of the test number):
   - Add a phone number that can receive an SMS or call for verification, is
     not your personal number, and is not in use on the WhatsApp or WhatsApp
     Business app.
   - Set a display name; Meta reviews it.
   - Add a payment method to the WhatsApp account in Meta Business Suite.
   - Business verification may be requested to raise limits.
8. **Webhooks are optional.** Messages are sent without one; the webhook in
   BOOKINGS.md adds delivered/read receipts.

## 2. Values and where they go

All environment variables, including Supabase's, are listed in
[BOOKINGS.md](BOOKINGS.md#3-environment-variables) and in `.env.example`.
Never put these values in source files, and never prefix a secret with `VITE_`.

To try the form locally without Supabase or Meta, set `BOOKING_DEV_MOCK=sent`
or `BOOKING_DEV_MOCK=failed` in `.env.local` (development only).

## 3. Costs

Meta charges per delivered template message. Utility templates are charged
unless a customer service window is open with the recipient. The rate depends on
the recipient's country; see Meta's pricing page for the current rate card. The
test number needs no payment method.
