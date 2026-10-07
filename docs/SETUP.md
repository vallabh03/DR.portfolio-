# Consultation form: WhatsApp setup

The Consultation page sends each request to the site's own endpoint,
`POST /api/consultation` (`api/consultation.ts`, a Vercel Function). The endpoint
checks the request again on the server and sends one WhatsApp message to the
practice through the Meta WhatsApp Cloud API. The visitor sees "Your request has
been received." only after Meta has accepted that message. If sending fails, the
form keeps the visitor's details and asks them to try again.

The browser never talks to Meta and never sees a credential.

## 1. What you create in Meta

1. **Meta account and developer account.** Sign in at developers.facebook.com and
   register as a developer.
2. **Business portfolio.** Create one at business.facebook.com for the practice.
3. **Meta app.** In the developer dashboard create an app with the "Connect with
   customers through WhatsApp" use case and connect it to the business portfolio.
   This creates a WhatsApp Business Account (WABA) and a free test sending number.
4. **Recipient number for testing.** In WhatsApp > API Setup, add the practice's
   WhatsApp number as a test recipient and confirm the code sent to it.
5. **Message template.** In WhatsApp Manager > Message templates, create:
   - Category: **Utility**
   - Name: `consultation_request`
   - Language: **English** (the code must match `WHATSAPP_TEMPLATE_LANGUAGE`, e.g. `en`)
   - Parameter type: **Named**
   - Body (exactly):

     ```
     New consultation request from the website.

     Name: {{name}}
     Phone: {{phone}}
     Email: {{email}}
     {{details}}

     Sent by the consultation form.
     ```

   Example values for review: name `Test Visitor`, phone `+91 98765 43210`,
   email `visitor@example.com`, details
   `Preferred Date: 20 October 2026 · Preferred Time: Morning · Reason: Follow-up consultation · Consent: Yes`.
   Review can take up to 24 hours.

   Why a template: the practice receives these messages without having written
   to the business number first, and WhatsApp only allows approved templates in
   that case. Template values cannot contain line breaks or be empty, so the
   optional fields the visitor entered (date, time, reason) are combined on the
   `details` line, and fields they left empty are not included.
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
8. **Webhooks are not needed** to send these messages. They would only be needed
   for delivery or read receipts.

## 2. Values to collect

| Value | Where to find it | Environment variable |
|---|---|---|
| Access token (secret) | System user token, step 6 | `WHATSAPP_ACCESS_TOKEN` |
| Phone number ID | WhatsApp > API Setup | `WHATSAPP_PHONE_NUMBER_ID` |
| WhatsApp Business Account ID | WhatsApp > API Setup | `WHATSAPP_BUSINESS_ACCOUNT_ID` |
| The number that receives requests | Your WhatsApp number, country code first | `WHATSAPP_RECIPIENT_NUMBER` |
| Template name and language | Step 5 | `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANGUAGE` |
| The site's address (optional) | e.g. `https://www.yourdomain.com` | `ALLOWED_ORIGINS` |

## 3. Where the values go

- **Production (Vercel):** Project > Settings > Environment Variables. Add each
  variable for Production (and Preview if previews should send real messages),
  then redeploy. If `ALLOWED_ORIGINS` is set, previews on other addresses are
  refused; leave it empty to allow whichever address the site is served from.
- **Local development:** copy `.env.example` to `.env.local` and fill it in.
  `.env.local` is git-ignored. `npm run dev` then sends real messages.
- **Never** put these values in source files, and never prefix them with `VITE_`.

To try the form locally without Meta, set `WHATSAPP_DEV_MOCK=sent` or
`WHATSAPP_DEV_MOCK=failed` in `.env.local`. This only affects `npm run dev` and
`npm run preview`; it does not exist in the deployed function.

## 4. Costs

Meta charges per delivered template message. Utility templates are charged
unless a customer service window is open with the recipient. The rate depends on
the recipient's country; see Meta's pricing page for the current rate card. The
test number needs no payment method.

## 5. Protection built into the endpoint

- Same-site requests only (`Origin` check); JSON only; 8 KB body limit.
- Server-side validation matching the form, with length limits.
- Hidden field and minimum fill time to turn away automated submissions.
- At most 5 requests per address per 10 minutes, and repeats of a request that
  was already sent are not sent again. These are kept in memory on each server
  instance, so they are best-effort. For strict limits, a shared store such as
  Upstash Redis or Vercel Firewall rate-limit rules can be added later.
- No visitor details, tokens or Meta error text are logged or returned.

## 6. Tests

`npm test` runs the endpoint tests with a stand-in for Meta. They do not prove
that real delivery works; that needs the steps above and a real test message.
