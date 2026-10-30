# SEO report: www.drabhinavthaduri.in

Prepared 30 October 2026. Covers what was found, what was changed in the code
(tested locally, not yet deployed), and what needs the doctor, Google accounts
or other websites.

## Executive summary

- **Root cause of the poor crawl results** (0 words, no H2, no images): each
  page file contained only head tags and a short fallback. **Fixed in code**:
  every page is now rendered to real HTML at build time.
- **Independently re-verified on 30 October 2026** (second pass, §0): raw HTML
  of all 10 pages, browser-rendered pages, direct page loads, tests (69/69),
  production build, sitemap, robots, structured data, verification tag.
- **Not yet live.** Nothing is committed to `main` or deployed. Rankings,
  Core Web Vitals and Google validation cannot be measured until it is.
- **Biggest remaining SEO factors are off the site**: conflicting hospital
  listings, no Google Business Profile, and no condition pages or articles
  (which need the doctor's reviewed content).

## 0. Second pass: independent validation (30 October 2026)

What was re-checked, how, and the result. "Local" means the production build on
this computer; nothing here is a claim about the live site.

| Check | Method | Result |
|---|---|---|
| Git state | `git status`, `git diff --stat` | Branch `design/home-blue`; SEO changes and the WhatsApp booking assistant are separate files except `.env.example` (separate sections). Prepared as separate local commits (§17). |
| Tests | `npm test` | **69/69 pass** (66 earlier + 3 new: empty blog noindex, first article indexable, address/no-invented-data). |
| Production build | `npm run build` | Succeeds; `prerender: 10 pages rendered to HTML`. |
| Raw HTML audit | `npm run seo` (`scripts/seo-audit.mjs`) on every built page | 1 title, 1 description, 1 canonical (indexable pages), exactly 1 H1, valid JSON-LD, all images with alt, no broken internal links, no duplicate titles/descriptions, no placeholder text. One warning: Contact 112 words (intentional). |
| Raw HTML vs browser DOM | H1/H2 lists from each `dist/*.html` compared with the DOM after the app starts, all 9 routes | **Identical on every route**; one `<main>` per page; no console errors. |
| Direct page loads | Local server with Vercel-style clean URLs; opened `/about`, `/consultation` | One header/main/footer (no duplicated content), correct title and canonical, booking form and WhatsApp links present, no console errors. |
| Hydration | Code review | The app uses `createRoot`, which replaces the prerendered markup (no hydration step), so hydration mismatches cannot occur. |
| Blog indexing | Tests with a test-only article | Empty: `noindex`, not in sitemap, page still reachable. With an article: blog indexable; article has its own title, canonical path, sitemap entry and `BlogPosting` (headline, `datePublished`, author). |
| Verification tag | Build with and without `GOOGLE_SITE_VERIFICATION` | Absent when unset; escaped tag on every page when set; no other environment value is read. |
| Social / favicon | Built files | `og-image.jpg` (1200×630), `favicon.svg`, Twitter `summary_large_image` present. |
| Profile links (`sameAs`) | Pages read 30 Oct 2026 | Continental profile: "Dr Abhinav Thaduri", Consultant – Head & Neck Oncologist, M.Ch AIIMS Rishikesh, MS Gandhi (gold medal), MBBS Bhaskar. Scholar: "Thaduri abhinav", "Consultant Head and Neck Oncologist", lists his papers (e.g. glossectomy QoL 2025, financial toxicity 2023, swallow outcomes 2023). **Both are his.** |
| Address in schema | Continental profile FAQ: "Continental Cancer Centre, Continental Hospitals, Financial District, Gachibowli, Hyderabad" | The schema address is the hospital where he consults (the same address the site has shown since it was supplied), split into street, city (Hyderabad), region and postcode; `areaServed` is the city. Doctor to confirm (§12). |
| Redirects | curl on the live site | http→https→www (two hops, Vercel platform), trailing slash → none, query strings keep the canonical. The `vercel.app` → www redirect is in `vercel.json` but **only takes effect after deploying**. |
| Bundle sizes | `dist/assets` | JS ≈ 157 KB (app) + 242 KB (React) + 139 KB (animation), uncompressed; ≈170 KB compressed. No third-party scripts. |
| Core Web Vitals, Rich Results, Search Console, Screaming Frog JS crawl | — | **Not measured**: need the deployed site and accounts (§11). |

**New conflicts found on re-check:** Continental lists hours 9:00 AM–6:00 PM;
the site says Monday–Saturday 9 AM–5 PM. HexaHealth shows a Telangana State
Medical Council registration number; the site shows none (doctor to decide).

Statuses used: **Fixed** (changed and tested) · **Partially fixed** ·
**Requires doctor confirmation** · **Requires external account access** ·
**Requires external Google validation** (needs the live site and Google's tools) ·
**Not applicable**.

Nothing in this report or the code claims the doctor is "best", "top" or
"number one", and no rating, review, registration number or credential was added
that the site did not already state.

---

## 1. Original assessment (live site, before changes)

Checked on 30 October 2026 by requesting each page the way a crawler without
JavaScript does:

| Page | Words in the HTML | H1 in the HTML | Title |
|---|---|---|---|
| `/` | ~97 | the page title repeated | Dr Abhinav Thaduri \| Head and Neck Surgical Oncologist, Hyderabad |
| `/about` | ~87 | "About · Dr Abhinav Thaduri" | About · Dr Abhinav Thaduri |
| `/expertise` | ~97 | the title repeated | Head and Neck Cancer Surgery in Hyderabad · … |
| `/research` | ~85 | the title repeated | Research · Dr Abhinav Thaduri |
| `/blog` | ~89 | the title repeated | Blog · Dr Abhinav Thaduri |
| `/gallery` | ~75 | the title repeated | Gallery · Dr Abhinav Thaduri |
| `/contact` | ~85 | the title repeated | Contact · Dr Abhinav Thaduri |
| `/consultation` | ~85 | the title repeated | Book a consultation · Dr Abhinav Thaduri |

This explains the Screaming Frog results (0 words, no H2, no images, title equals
H1). Each built page held only its head tags and a short `<noscript>` fallback
whose heading repeated the title; all real content, headings, images and links
were added by JavaScript in the browser. Google renders JavaScript, so it could
see the content after rendering, but other crawlers, link previews and Google's
first pass saw an almost empty page.

Other observations:
- Redirects: `http://drabhinavthaduri.in` → `https://drabhinavthaduri.in` → `https://www.drabhinavthaduri.in` (two hops); trailing slash → no slash (308); query strings return 200 with the correct canonical. Uppercase paths return 404 (acceptable).
- The Vercel address `dr-portfolio-kohl.vercel.app` served the same site with 200 (a duplicate host; canonical tags pointed to www).
- `robots.txt` and `sitemap.xml` existed, were valid and pointed to www.
- Structured data (Person, Physician, WebSite, WebPage) existed on every page; no ratings or reviews.
- No analytics or Search Console verification on the site.

## 2. Issue register

| # | Issue | Affected | Severity | Root cause | Fix | Files | Test | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | Pages had almost no crawlable content (0 words reported) | All pages | High | Client-only React rendering | Build-time prerendering: each page's real HTML is rendered into its file; the browser then starts the app as before | `src/entry-server.tsx`, `scripts/prerender.mjs`, `package.json`, `.gitignore` | `npm run build` + `npm run seo:check`: 112–1,570 words per page; browser check: no console errors, one `<main>`, page unchanged | **Fixed** (live after deploy) |
| 2 | No H2/H3 detected | All pages | High | Same as #1 | Same as #1: headings were already in the components | — | `seo:check`: 3–14 H2 per page, H3 where sections have them | **Fixed** |
| 3 | Title text duplicated as H1 | All pages | Medium | The fallback block used the title as its `<h1>` | Fallback uses a plain paragraph; each page now has exactly one real H1 | `scripts/seo-pages.ts` | `seo:check`: exactly 1 H1 per page | **Fixed** |
| 4 | Images not discovered | All pages | Medium | Same as #1 | Prerendered `<picture>` elements with AVIF/WebP srcsets, width/height, alt text, lazy loading below the fold, high priority for the hero | — | `seo:check`: 1–22 images per page, none without alt | **Fixed** |
| 5 | Loading placeholder text ("AT", file name) would appear in crawlable HTML | Pages with photos | Low | Placeholder shown while a photo loads | Placeholder only when there is no photo or it fails | `src/components/MedicalImage.tsx` | `seo:check` + browser | **Fixed** |
| 6 | Generic titles on About, Research, Gallery, Blog, Contact, Consultation | 6 pages | Medium | Titles were "Section · Name" | Descriptive, unique titles (see §6) | `src/data/seo.ts` | `tests/seo.test.ts` (unique, ≤65 chars) | **Fixed** |
| 7 | Short Gallery description (84 chars) | `/gallery` | Low | — | Rewritten (144 chars) | `src/data/seo.ts` | tests (70–170 chars) | **Fixed** |
| 8 | Empty blog indexable | `/blog` | Low | No articles yet | `noindex` and left out of the sitemap until the first article is published (automatic) | `src/data/seo.ts` | sitemap check | **Fixed** |
| 9 | No breadcrumbs in structured data | All non-home pages | Low | — | `BreadcrumbList` linked from each `WebPage` | `src/data/seo.ts`, `tests/seo.test.ts` | tests + JSON parses | **Fixed**; rich-result eligibility **Requires external Google validation** |
| 10 | Address in schema mixed areas and state into the city field | All pages | Low | Data line "Gachibowli, Nanakramguda, Telangana" used as locality | Street (incl. Gachibowli, Nanakramguda), city Hyderabad, region Telangana, postcode | `src/data/seo.ts` | output inspected | **Fixed** |
| 11 | Physician schema had no telephone, email or area served | All pages | Low | — | Added the site's published phone and email, `areaServed: Hyderabad` | `src/data/seo.ts` | output inspected | **Fixed** |
| 12 | No links from the site's identity to the doctor's other profiles | All pages | Medium | — | `sameAs`: Continental Hospitals profile and Google Scholar | `src/data/doctor.ts`, `src/data/seo.ts` | output inspected | **Requires doctor confirmation** (confirm both are his) |
| 13 | Duplicate host `dr-portfolio-kohl.vercel.app` | Whole site | Low | Vercel default domain | Permanent redirect to www when that host is used | `vercel.json` | JSON valid; behaviour **Requires external Google validation** after deploy | **Fixed** (after deploy) |
| 14 | Two-hop redirect from `http://` apex | Home | Low | Vercel applies HTTPS first, then apex→www | In Vercel → Domains, the apex is already set to redirect to www; the extra HTTPS hop is Vercel's and cannot be removed in code | — | curl | **Not applicable** (platform behaviour; harmless) |
| 15 | No Search Console verification | Site | Medium | — | Optional `GOOGLE_SITE_VERIFICATION` build variable adds the tag; DNS verification preferred (see §11) | `scripts/seo-pages.ts`, `.env.example` | build with test value → tag present | **Requires external account access** |
| 16 | Contact page is short (112 words) | `/contact` | Low | Kept minimal at the site owner's request | None (intentional) | — | `seo:check` warning | **Not applicable** |
| 17 | Core Web Vitals not measured | All | Medium | Needs the deployed site | Prerendering lets the browser find the hero image and text without waiting for JavaScript, which should help LCP | — | Measure in PageSpeed Insights after deploy | **Requires external Google validation** |
| 18 | Conflicting listings elsewhere (old hospital, phone numbers, experience years) | Off-site | High for local SEO | Outdated third-party pages | Outreach plan (§10) | — | — | **Requires doctor confirmation** |

## 3. Competitor research (30 October 2026)

Read-only research; no rankings, traffic or backlink figures are claimed (the
search tools used are not Hyderabad Google). Pages that blocked automated reading
are marked.

| Competitor page | Type | What they do well | What to learn (legitimately) |
|---|---|---|---|
| cioncancerclinics.com, "Best Oral Cancer Doctors in Hyderabad" | Cancer-clinic content hub | Named author + named medical reviewer + "last medically reviewed" date; ~10 FAQs; ~30 linked topic pages (symptoms, biopsy, staging, neck dissection, reconstruction, rehab, cost) | Condition pages with author/reviewer/date and FAQs |
| pacehospital.com, "Oral Cancer Specialist in Hyderabad" | Hospital landing page | Doctor card (degrees, years, languages, OPD timings), ~25 FAQs, booking/WhatsApp | FAQ answering real questions; avoid their unsupported "happy patients" claim |
| drvijayanandreddy.com (oral cancer page) | Personal doctor site | Per-cancer pages, videos, registration page, multiple contact routes | Videos on topic pages; avoid their copied text, unsourced survival and "#1" claims |
| yashodahospitals.com, thyroidectomy page | Hospital procedure page | Sections on types/procedure/recovery, FAQs, separate cost page | Procedure pages; "what affects cost" explained without prices |
| apollo247.com directory, head & neck surgical oncologists Hyderabad | Hospital-owned directory | Lists 4 surgeons with fees and recommendation % | Dr Thaduri is not listed on directories like this |
| continentalhospitals.com: Dr Harsh Suri, Dr G Kranthi Kumar | Same-hospital profiles | Titles target "head & neck surgical oncologist … Hyderabad"; bodies could not be read | Same-hospital colleagues compete for the same searches |
| credihealth.com, lybrate.com listings | Directories | Condition + city listing pages | Seen in results only, not read |

Common patterns among the strongest pages: one page per condition and per
procedure, long FAQ blocks, doctor credential cards, conversion options
(WhatsApp, callback, second opinion), and (rarely) named author/reviewer dates.

**Where this site is already stronger:** a verified research record (46
publications with DOIs and Scholar searches), real conference photographs and
talks, accurate structured data with no fake ratings, and fast, well-optimised
images. **Where it is weaker:** no condition or procedure pages, no FAQs, no
patient articles, no directory or Google Business Profile presence, and
conflicting details on other websites.

## 4. The doctor's existing public profiles

| Profile | Found | Note |
|---|---|---|
| Continental Hospitals | https://continentalhospitals.com/doctors/dr-abhinav-thaduri/ | Current consultant page. Lists WhatsApp +91 77993 60360 and +91 40 6700 0000 (hospital lines), different from the site's +91 77801 61363. |
| Basavatarakam | https://basavatarakam.org/dr-thaduri-abhinav-best-surgical-oncologist-in-india-basavatarakam-cancer-hospital/ | Still lists him as a current consultant there ("Nov 2023 – present"), with a different address and phone. |
| HexaHealth | https://www.hexahealth.com/hyderabad/doctor/dr-abhinav-thaduri-head-and-neck-surgeon | Lists him at Basavatarakam; shows a rating and its own helpline. |
| Google Scholar | https://scholar.google.com/citations?user=76O8qa0AAAAJ | "Thaduri abhinav", Consultant Head and Neck Oncologist; no verified email. |
| PubMed | https://pubmed.ncbi.nlm.nih.gov/?term=Thaduri+A%5BAuthor%5D | ~27 results. |
| ResearchGate | https://www.researchgate.net/profile/Abhinav-Thaduri | Exists per search results; not readable. |
| ORCID, Practo, LinkedIn, Google Business Profile | Not found / not verifiable | See §9–§10. |

Inconsistencies: experience stated as 6+, 10, 12+, over a decade and 14+ years in
different places; name order "Thaduri Abhinav" vs "Abhinav Thaduri"; affiliation
(Basavatarakam vs Continental). These matter for local search and should be made
consistent (§10).

## 5. Keyword research (qualitative)

No paid tool was used, so **no search volumes or difficulty scores are given**.
Evidence: **AC** = Google autocomplete for India, 30 Oct 2026; **CT** = used by
competitor titles/headings.

| Group | Phrases | Evidence | Page |
|---|---|---|---|
| Branded | dr abhinav thaduri; abhinav thaduri; dr abhinav thaduri hyderabad | AC | Home, About |
| Specialist | head and neck surgical oncologist in hyderabad; head and neck oncologist hyderabad; head and neck surgeon hyderabad; head and neck cancer surgeon hyderabad | AC, CT | Home (primary), Expertise |
| Treatment / procedure | oral cancer surgery; neck dissection; thyroidectomy / thyroid cancer surgery; parotid tumour surgery; laryngectomy; free flap reconstruction; mandibulectomy | AC, CT | Expertise now; future procedure pages |
| Condition | tongue cancer; oral cancer symptoms; throat / voice box cancer; thyroid nodule; salivary gland tumour | AC | Expertise now; future condition pages and articles |
| Local | oral cancer treatment in hyderabad; head and neck cancer treatment in hyderabad; thyroid cancer doctor in hyderabad; cancer hospital gachibowli | AC | Expertise (primary), Contact, Consultation |
| Informational | mouth ulcer not healing after 2 weeks; oral cancer symptoms in Telugu; what to expect after thyroidectomy; speech and swallowing after surgery | AC | Future reviewed articles |
| Consultation | book consultation head and neck surgeon hyderabad; second opinion head and neck cancer; oral cancer treatment cost | AC, CT | Consultation; future "what to expect / cost factors" page |
| **Sensitive** | best / top oncologist in hyderabad; best head and neck surgical oncologist | AC | Not targeted with superlatives; answered with factual content |

**Keyword-to-page mapping (one primary intent per page):**

| Page | Primary intent | Secondary |
|---|---|---|
| `/` | Dr Abhinav Thaduri, head and neck surgical oncologist, Hyderabad | head and neck surgeon Hyderabad |
| `/about` | About Dr Abhinav Thaduri (credentials, training) | — |
| `/expertise` | head and neck cancer surgery in Hyderabad | oral, thyroid, salivary, laryngeal, sinonasal, skin, recurrent cancers |
| `/research` | research and publications (brand + academic) | oral cancer staging, nodal burden, survivorship research |
| `/gallery` | conferences, talks and interviews (brand) | — |
| `/consultation` | book a consultation (Hyderabad) | — |
| `/contact` | contact Dr Abhinav Thaduri | — |
| future condition pages | e.g. "oral cancer surgery in Hyderabad" | symptoms, diagnosis, treatment, recovery |

Avoiding cannibalisation: the home page targets the doctor and specialty;
Expertise targets the services; future condition pages should each own one
condition and link back to Expertise rather than repeat it.

## 6. Metadata changes

| Page | Old title | New title |
|---|---|---|
| `/about` | About · Dr Abhinav Thaduri | About Dr Abhinav Thaduri \| Head and Neck Surgical Oncologist |
| `/expertise` | Head and Neck Cancer Surgery in Hyderabad · Dr Abhinav Thaduri | Head and Neck Cancer Surgery in Hyderabad \| Dr Abhinav Thaduri |
| `/research` | Research · Dr Abhinav Thaduri | Research and Publications \| Dr Abhinav Thaduri |
| `/gallery` | Gallery · Dr Abhinav Thaduri | Conferences, Talks and Interviews \| Dr Abhinav Thaduri |
| `/gallery/awards-and-conferences` | Awards and conferences · Gallery · … | Awards and conferences \| Dr Abhinav Thaduri |
| `/blog` | Blog · Dr Abhinav Thaduri | Head and Neck Cancer Articles \| Dr Abhinav Thaduri (noindex until articles exist) |
| `/contact` | Contact · Dr Abhinav Thaduri | Contact Dr Abhinav Thaduri \| Head and Neck Surgeon, Hyderabad |
| `/consultation` | Book a consultation · Dr Abhinav Thaduri | Book a Consultation \| Dr Abhinav Thaduri, Hyderabad |
| `/` | unchanged (brand first, 65 chars) | Dr Abhinav Thaduri \| Head and Neck Surgical Oncologist, Hyderabad |

Descriptions: Gallery, Contact and Consultation rewritten; all unique, 115–169
characters (tested). Open Graph and Twitter tags follow automatically.

## 7. Structured data (JSON-LD)

Every indexable page: `Person` + `Physician` + `WebSite` + its `WebPage`
(`AboutPage`, `MedicalWebPage`, `ContactPage`, `CollectionPage`), plus a
`BreadcrumbList` on every page except Home. Added: breadcrumbs, structured
address (Hyderabad, Telangana, 500032), telephone, email, `areaServed`,
`sameAs` (2 profiles). Not added, deliberately: ratings, reviews, registration
number (not published on the site), awards, memberships beyond what the site
lists. Articles will get `BlogPosting` with author and date automatically when
published. JSON-LD parses on every page (`npm run seo:check`); test it in the
Rich Results Test after deploying.

## 8. Sitemap, robots.txt, rendering

- **Sitemap** (`/sitemap.xml`, generated each build): 8 URLs (Home, About, Expertise, Research, Gallery, Gallery › Awards and conferences, Contact, Consultation). `/blog` returns automatically with the first article. No redirects, noindex pages or private URLs.
- **robots.txt**: allows everything except `/api/` and the consent-gated surgery photographs; references the sitemap. CSS, JS and images are not blocked.
- **Rendering**: `npm run build` now renders each page's HTML (`scripts/prerender.mjs`). The browser starts the app as before (`createRoot`), so booking, WhatsApp buttons, animations and navigation are unchanged. Verified locally: no console errors, one header and main element, images load.

## 9. Local SEO and Google Business Profile

**Google Business Profile** (could not be checked: needs account access). Steps:
1. Search Google Maps for "Dr Abhinav Thaduri". If a listing exists, click **Own this business?** and verify; do **not** create a second one.
2. If none exists, create a **practitioner** listing at business.google.com: name exactly "Dr Abhinav Thaduri" (no keywords added to the name), primary category **Oncologist** (also consider **Surgical oncologist** if offered, and **Otolaryngologist**), address = Continental Hospitals, Plot No 3, Road No. 2, Financial District, Gachibowli, Nanakramguda, Hyderabad 500032, phone, website `https://www.drabhinavthaduri.in`, appointment link `https://www.drabhinavthaduri.in/consultation`.
3. Hours: match the website (Monday–Saturday, 9 AM–5 PM, if still correct).
4. Services: the areas on the Expertise page, with the same names.
5. Description: factual, 2–3 sentences, no superlatives.
6. Photos: professional portrait, hospital entrance, conference photos (no patient photos).
7. Reviews: ask genuine patients to review if they wish; never offer anything for reviews; reply politely without discussing medical details.
8. Do not claim ownership of Continental Hospitals' own listing.

**Keep the same details everywhere** (name, practice address, phone, website):
the site, Google Business Profile, Continental profile and any directory.

## 10. Off-page and authority plan (no contact made)

| Opportunity | Why | Approach | Status |
|---|---|---|---|
| Basavatarakam doctor page | Still shows him as a current consultant there; conflicting address and phone | Doctor emails the hospital's web/HR team to update it to "former consultant" or remove it | Requires doctor |
| HexaHealth profile | Lists Basavatarakam and its own helpline | Request a correction through HexaHealth's doctor support | Requires doctor |
| Continental Hospitals profile | Strongest local authority page | Ask the hospital to link to www.drabhinavthaduri.in and keep experience/credentials consistent; check the two WhatsApp numbers shown there | Requires doctor |
| Google Scholar | Research authority | Verify an institutional email; add affiliation and a link to the website | Requires doctor |
| ORCID | Researcher identity (none found) | Create at orcid.org; link publications and the website | Requires doctor |
| ResearchGate | Research identity | Add the website link and current affiliation | Requires doctor |
| Practo / other directories | Patients search them; none found | Create one listing on a reputable directory with identical details | Requires doctor |
| Professional associations (e.g. FHNO, AOI) | Membership pages often link to members | If a member, ask for a profile link | Requires doctor confirmation of memberships |
| Conference and talk pages, YouTube channels | Already feature him | Ask organisers / Prathima Cancer Institute to link to the website in the talk description | Requires doctor |

Never: buy links, use link networks, create fake profiles or reviews, or overstate credentials.

## 11. Google Search Console and analytics

1. Go to https://search.google.com/search-console → **Add property** → **Domain** → `drabhinavthaduri.in`.
2. Google shows a TXT record. Add it in GoDaddy → **DNS** → **Add record** (type TXT, name `@`). Verification takes minutes to a day. *(Alternative: choose URL-prefix → HTML tag, put the code in Vercel as `GOOGLE_SITE_VERIFICATION`, redeploy.)*
3. **Sitemaps** → submit `https://www.drabhinavthaduri.in/sitemap.xml`.
4. **URL Inspection** → test `https://www.drabhinavthaduri.in/` and `/expertise` → **View tested page** → check the rendered HTML and screenshot → **Request indexing**.
5. After a few weeks, watch **Performance** (clicks, impressions, average position, branded vs non-branded queries, Hyderabad queries), **Pages** (indexed/excluded) and **Core Web Vitals**.
6. **PageSpeed Insights** (https://pagespeed.web.dev/): test Home, About, Expertise, Research, Consultation, Contact on mobile and desktop. Targets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.
7. **Rich Results Test** (https://search.google.com/test/rich-results): test Home and Expertise (breadcrumbs, Physician data).
8. **Analytics** is not installed. If wanted, use a privacy-friendly option (e.g. Vercel Web Analytics) or Google Analytics 4 with a consent banner update; never send form contents or patient details to analytics.

No Search Console or analytics data exists yet, so none is reported.

## 12. Information needed from the doctor

1. Confirm the two profile links used in structured data (Continental, Google Scholar).
2. Confirm the experience figure to use everywhere (site does not state one; other sites say 6+ to 14+ years).
3. Telangana State Medical Council registration number, if he wants it shown (patients and directories look for it).
4. Professional memberships, with membership pages if any.
5. Confirm current clinic hours and whether he also consults elsewhere.
6. Which phone number patients should use (site: +91 77801 61363; Continental: +91 77993 60360 / 040 6700 0000).
7a. Clinic hours (site: Mon–Sat 9 AM–5 PM; Continental: 9 AM–6 PM).
7b. Confirm the schema address (Continental Hospitals, Financial District) is where patients should come.
7. Approval to request corrections from Basavatarakam and HexaHealth.
8. Reviewed content for condition pages and articles (§13).

## 13. Content plan (drafts for medical review, not published)

AI-written medical articles were **not** published. Each topic below should be
written or approved by the doctor, with author, "medically reviewed by", date
and references (e.g. NCCN, AJCC, peer-reviewed sources):

1. Mouth ulcer that won't heal: when to get it checked
2. Early signs of oral cancer
3. How oral cancer is diagnosed (biopsy, scans, staging)
4. Oral cancer treatment options and what surgery involves
5. What a head and neck surgical oncologist does
6. Thyroid nodules and thyroid cancer surgery: what to expect
7. Salivary (parotid) gland tumours explained
8. Laryngeal (voice box) cancer: symptoms and treatment approaches
9. Risk factors: tobacco, betel nut, alcohol, HPV
10. Recovery after head and neck surgery: speech, swallowing, follow-up
11. Questions to ask at your first consultation; documents to bring
12. Getting a second opinion for head and neck cancer
13. Telugu versions of the symptom articles (autocomplete shows demand)

Publishing is ready: add each approved article to `src/data/blog.ts` (guide in
`docs/BLOG.md`); it gets its own page, `BlogPosting` schema, sitemap entry, and
the blog is indexed automatically.

**Condition pages** (after content exists): oral and oropharyngeal surgery,
thyroid and parathyroid surgery, salivary gland tumours, laryngeal cancers. Each
with an overview, when to see a specialist, how it is diagnosed, treatment
approaches, recovery, FAQs, and a link to book. Not created now, because pages
without genuine, reviewed content would be thin.

## 14. 30/60/90-day plan

**Days 1–30:** deploy these changes; verify Search Console and submit the
sitemap; URL-inspect key pages; run PageSpeed and Rich Results tests; claim or
create the Google Business Profile; correct the Basavatarakam and HexaHealth
listings; make the Continental profile link to the site.

**Days 31–60:** write and review the first 3–4 articles and the first condition
page (oral cancer); add FAQs to Expertise from real patient questions; create
ORCID and update Scholar/ResearchGate; one reputable directory listing.

**Days 61–90:** publish further reviewed content (thyroid, salivary, larynx,
recovery); review Search Console queries and improve pages that get impressions
but few clicks; check local visibility in Maps from Hyderabad; review enquiries
from the booking form.

No ranking position or traffic growth is promised; progress is measured with
Search Console data.

## 15. Files

**Created:** `src/entry-server.tsx`, `scripts/prerender.mjs`, `scripts/seo-audit.mjs`, `docs/SEO-REPORT.md`.

**Second pass:** `src/data/seo.ts` (blog pages as a testable function; articles get their own title and headline), `tests/seo.test.ts` (3 tests), `package.json` (`npm run seo`).

**Modified:** `package.json` (build runs prerendering; `npm run seo:check`), `.gitignore` (`dist-ssr`), `scripts/seo-pages.ts` (fallback without H1; optional verification tag; skips the server build), `src/data/seo.ts` (titles, descriptions, breadcrumbs, address, telephone/email, sameAs, blog noindex), `src/data/doctor.ts` (`seo.profiles`), `src/components/MedicalImage.tsx` (placeholder), `src/hooks/useTheme.tsx`, `src/components/LegalDialog.tsx`, `src/App.tsx` (safe at build time), `vercel.json` (vercel.app redirect), `.env.example` (`GOOGLE_SITE_VERIFICATION`), `tests/seo.test.ts`.

## 16. Tests run (30 October 2026)

- `npm test`: 69/69 pass (second pass; includes breadcrumb, blog-indexing and address tests).
- `npm run build`: succeeds; 10 pages prerendered.
- `npm run seo:check`: every page has 1 title, 1 description, 1 canonical (indexable pages), exactly 1 H1, valid JSON-LD, no images without alt, no broken internal links, no duplicate titles or descriptions; one warning (Contact is intentionally short).
- Local browser check of the production build: no console errors, page unchanged, hero served as AVIF.
- **Not yet possible** (needs deploy or accounts): Screaming Frog re-crawl with JavaScript rendering, Google URL Inspection, Rich Results Test, PageSpeed / Core Web Vitals, Search Console data.

## 17. Deployment readiness and release checklist

**Status: ready after approvals.** The code is tested locally and safe to
deploy; nothing in it depends on the doctor's answers. Approvals needed:

1. You approve pushing the branch and merging the pull request (I have not pushed).
2. Doctor confirms the two profile links and the address (§12). If either is wrong, remove it from `src/data/doctor.ts` / `src/data/seo.ts` before deploying.

After deploying (Vercel builds automatically):

- [ ] `https://www.drabhinavthaduri.in/about` → View source shows the page text (not an empty `<div id="root">`).
- [ ] `https://dr-portfolio-kohl.vercel.app/about` redirects to `https://www.drabhinavthaduri.in/about`.
- [ ] Booking form submits and shows a reference (one test booking).
- [ ] Rich Results Test on Home and Expertise: no errors.
- [ ] PageSpeed Insights (mobile + desktop) on Home and Expertise; record LCP/INP/CLS (lab), and field data once available.
- [ ] Search Console: verify, submit sitemap, URL-inspect Home and Expertise.
- [ ] Screaming Frog with JavaScript rendering: compare with the original export (expect words > 0, H2 present, images found).

Remaining issues by status: **Requires doctor confirmation**: profiles, address, hours, phone, experience figure, registration number, external listing corrections. **Requires Google account access**: Search Console, Google Business Profile. **Requires deployment / external validation**: redirects on the live domain, Rich Results, Core Web Vitals, re-crawl. **Requires post-deployment monitoring**: indexing, queries, local visibility.
