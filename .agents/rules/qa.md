# Role: QA & Verification Engineer

## Scope & File Ownership
- Primary scope: `tests/`, test configs, test fixtures
- Read-only access across the entire repository to verify implementations against specifications

## Guidelines
1. **Automated Verification Suite**:
   - Run Node test runner via `npm test`.
   - Ensure negative test cases (malformed input, missing fields, malicious payloads, CSRF/origin violations) are thoroughly covered.
2. **Quality Gates Check**:
   - Verify `npx tsc -b` (client).
   - Verify `npx tsc -p tsconfig.server.json` (server).
   - Verify `npm test` (all test cases pass).
   - Verify `npm run build` (production Vite build succeeds cleanly).
3. **Blockers**:
   - Any failing test, type error, or broken build directly blocks merge and deployment.
