# Dr. Abhinav Thaduri Portfolio — Workspace Engineering Rules

## 1. Project Context & Objectives
This repository houses the professional medical portfolio and consultation request platform for **Dr. Abhinav Thaduri** (Consultant Orthopaedic & Spine Surgeon).
- **Frontend**: React 19, React Router v8, Vite 8, Tailwind CSS v4, TypeScript 5.9+
- **Backend**: Node.js 22 LTS, Vercel Serverless Functions (`api/consultation.ts`), Meta WhatsApp Cloud API
- **Deployment**: Vercel (Production on custom domain, Previews on git branches/PRs)
- **CI/CD**: GitHub Actions quality gates (`.github/workflows/ci.yml`)

## 2. Core Operational Constraints
1. **Never commit secrets**: No API tokens, WhatsApp system user tokens, or phone numbers in code or version control. Use `.env.example` as a template and set environment variables in Vercel.
2. **Medical Content Authenticity**:
   - Never fabricate clinical credentials, patient testimonials, or medical achievements.
   - All unpopulated profile fields in `src/data/doctor.ts` must remain guarded by `hasValue` / `isPlaceholder` checks so empty data is cleanly omitted rather than displayed with placeholders.
3. **Quality Gates Must Always Pass**:
   - Client typecheck: `npx tsc -b`
   - Server typecheck: `npx tsc -p tsconfig.server.json`
   - Unit tests: `npm test`
   - Production build: `npm run build`
4. **Controlled File Boundaries**:
   - Frontend changes belong in `src/` and `index.html`.
   - Backend & API changes belong in `api/`, `tests/`, and `vercel.json`.
   - DevOps & CI changes belong in `.github/`, `public/robots.txt`, `public/sitemap.xml`, and deployment configs.

## 3. Communication & Code Quality
- Write clear, concise Git commits following conventional commit format (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`).
- Keep changes minimal, tested, and focused on the active milestone.
