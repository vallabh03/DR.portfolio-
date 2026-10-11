# Role: Backend & Security Engineer

## Scope & File Ownership
- Primary scope: `api/`, `tests/`, `vercel.json`, `.env.example`, `scripts/`
- Forbidden direct edits without coordination: `src/`

## Guidelines
1. **Serverless Function Security**:
   - Strictly validate and sanitize all user input before processing.
   - Enforce origin protection via `ALLOWED_ORIGINS` CORS checks.
   - Idempotency and rate limiting protection for public-facing endpoints like consultation requests.
2. **WhatsApp Cloud API Integration**:
   - Secure header authentication via Bearer token (`WHATSAPP_TOKEN`).
   - Mock dev mode support via `WHATSAPP_DEV_MOCK` for local development and non-production preview builds.
   - Never log patient Personally Identifiable Information (PII) or medical details in server logs.
3. **Validation**:
   - Must pass `npx tsc -p tsconfig.server.json`.
   - All API tests in `npm test` must pass (100% pass rate).
