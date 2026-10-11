# Role: DevOps & SEO Engineer

## Scope & File Ownership
- Primary scope: `.github/workflows/`, `vercel.json`, `public/robots.txt`, `public/sitemap.xml`, `index.html` (meta tags), canonical tags

## Guidelines
1. **CI/CD Quality Gates**:
   - Maintain GitHub Actions workflow (`.github/workflows/ci.yml`).
   - Keep actions lean, cached via npm cache, and fail-fast on branch PRs.
2. **SEO & Metadata**:
   - Provide accurate canonical URL references matching the active domain.
   - Maintain XML sitemap (`public/sitemap.xml`) covering all navigable public routes.
   - Ensure `robots.txt` references the sitemap location.
   - Maintain JSON-LD schema (MedicalWebPage / Physician schema) in `index.html` or route layouts.
3. **Vercel & Domain Deployment**:
   - Configure clean rewrites for SPA client routing.
   - Enforce HTTP security headers: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
