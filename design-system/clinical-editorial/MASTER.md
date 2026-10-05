# Clinical Editorial — Master Design System

Source of truth for the Dr. Abhinav Thaduri website. Page-specific overrides, if
ever needed, go in `design-system/clinical-editorial/pages/<page>.md` and take
precedence over this file for that page only.

Validated against the project-level UI UX Pro Max database
(`.claude/skills/ui-ux-pro-max`). The database informs and checks these rules; it
does not replace them. Its default "Medical Clinic" palette (teal/green on mint)
and font pairing (Figtree + Noto Sans) were reviewed and deliberately **not** used.

---

## 0. Non-negotiables

### Architecture
True multi-page React Router site. Each navigation item is its own route and page
component. No section-anchor navigation, no single long page.

| Route | Page |
|---|---|
| `/` | Home |
| `/about` | About (includes Approach to Care) |
| `/expertise` | Expertise |
| `/experience` | Experience (includes Credentials) |
| `/research` | Research |
| `/contact` | Contact |
| `/consultation` | Book a Consultation (3-step form) |

Legacy redirects: `/credentials → /experience`, `/approach → /about`,
`/testimonials → /`, unknown → `/`.

### The 20 exclusions (hard rules)
1. Purple-to-blue gradients
2. Gradient hero text
3. Decorative badges or labels above headlines
4. Three icon boxes in a row
5. Emojis in headings or UI
6. Cards with coloured left borders
7. Glassmorphism
8. Untouched / default shadcn components
9. Lucide (or any icon library) everywhere
10. Inter as the only font
11. Space Grotesk + Instrument Serif
12. Decorative serif italics for accent words
13. Excessive em dashes in website copy
14. Generic buzzwords / AI or SaaS marketing language
15. Generic fade-in animation on every section while scrolling
16. Cursor-following lines or effects
17. Generic button fade-on-hover
18. Low-contrast dark mode
19. Inconsistent spacing
20. Grain / noise texture

Also avoided: bounce, elastic or overshooting springs, infinite loops, spinning
decorations, floating blobs, glows, neon, magnetic buttons, parallax, unnecessary 3D.

---

## 1. Database validation summary

| Decision | UI UX Pro Max evidence | Outcome |
|---|---|---|
| Newsreader + Inter | Both in `google-fonts.csv`. Newsreader: opsz 6–72, wght 200–800. Inter: opsz 14–32, wght 100–900 | Kept (overrides default pairing) |
| Ink + brass | "Luxury/Premium Brand" profile: near-black + bronze (`#1C1917` / `#A16207`) | Kept with our exact values |
| Teal accent | "Medical Clinic" profile: teal primary | Kept, deeper `#1F5F63` |
| Contrast ≥ 4.5:1 | ux: Color Contrast | Pass (lowest pair 5.24:1) |
| Body line height 1.5–1.75 | ux: Line Height | Pass (1.6) |
| Consistent type scale | ux: Font Size Scale | Pass (fluid scale, §3) |
| Sequential headings | ux: Heading Hierarchy | One h1 per page, no skipped levels |
| Visible focus | ux: Focus States | Pass |
| Touch targets | ux: Touch Target Size (WCAG web min 24px) | Stricter 44px kept |
| 1–2 key animated elements per view | ux: Excessive Motion | Adopted |
| Decelerate in, accelerate out | ux: Easing Functions | Adopted (exit curve §5) |
| No layout shift on font load | ux: Font Loading | Metric-matched fallback fonts |
| Optimised images | ux: Image Optimization | AVIF/WebP pipeline (§7) |
| Database style matches (Skeuomorphism, Aurora, Motion-Driven) | — | Rejected (conflict with exclusions) |

---

## 2. Colour

| Token | Light (default) | Dark (optional) | Role |
|---|---|---|---|
| `--background` | `#F6F3EC` | `#0B1422` | Page (ivory paper) |
| `--surface` | `#FFFFFF` | `#111C2D` | Cards, alternating sections, footer |
| `--surface-2` | `#EDE9DF` | `#17243A` | Image placeholders |
| `--foreground` | `#0E1B2C` | `#ECE8DF` | Text, primary button |
| `--muted` | `#566070` | `#9AA3B2` | Secondary text |
| `--border` | ink 12% | ivory 12% | Hairlines |
| `--border-strong` | ink 26% | ivory 26% | Emphasised rules, inputs |
| `--accent` | `#1F5F63` | `#8CC5BF` | The only interactive colour |
| `--accent-hover` | `#174A4D` | `#A6D4CF` | Pressed / hover text |
| `--on-accent` | `#FFFFFF` | `#0B1422` | Text on accent |
| `--brass` | `#7A5C30` | `#C9A86A` | Numerals, short rules, crop marks only |
| `--danger` | `#A8352C` | `#F0928B` | Form errors |

WCAG contrast — light: ink 15.6, muted 5.7, teal 6.6, brass 5.6.
Dark: text 15.1, muted 7.3, teal 9.5, brass 8.2. All AA.

Rules: brass never on buttons or links. No gradients, glass or glow. No shadows
except where a modal must separate from the page.

## 3. Typography

- **Headlines:** Newsreader Variable, weight 400, `font-optical-sizing: auto`,
  sentence or title case, never all caps, **never italic**.
- **Body / interface:** Inter Variable, 400 and 500.
- **Fallbacks:** metric-matched local fonts (`Newsreader Fallback` on Georgia,
  `Inter Fallback` on Arial) to minimise layout shift.

| Role | Class | Size 320 → 1440 | Line height | Tracking |
|---|---|---|---|---|
| Hero | `.display-hero` | 44 → 112px | 0.98 | −0.025em |
| H1 | `.heading-1` | 44 → 72px | 1.04 | −0.02em |
| H2 | `.heading-2` | 34 → 52px | 1.08 | −0.018em |
| H3 | `.heading-3` | 22 → 24px | 1.25 | −0.01em |
| Lead | `.lead` | 18 → 21px | 1.6 | 0 |
| Body | `body` | 16 → 17px | 1.6 | 0 |
| Small | `text-sm` | 14px | 1.5 | 0 |
| Data label | `.label` | 12 → 13px, uppercase | 1.4 | 0.12em |

Labels are only for data (e.g. a `dt`), never above a headline. Measure ~65ch.
Tabular figures for years and counts. Copy: no em dashes, no buzzwords.

## 4. Space, layout, shape

- **Spacing:** 4px base — 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128.
- **Section rhythm** (`.section-y`): 64px mobile · 96px tablet · 128px desktop.
- **Container** (`.container-page`): max 1360px; gutters 20 / 32 / 56px.
- **Grid:** 4 columns mobile, 12 from 1024px.
- **Radius:** `--radius-sm` 4px (inputs, tags) · `--radius-md` 8px (buttons) ·
  `--radius-lg` 12px (cards, images) · full only for avatar, icon buttons, portrait arch.
- **Borders:** 1px hairlines. Structure from rules and whitespace, not boxes.

## 5. Motion (`motion/react` only)

### Tokens (`src/lib/motion.ts`)
| Token | Value | Use |
|---|---|---|
| `EASE` | `[0.16, 1, 0.3, 1]` | Entrances (decelerate) |
| `EASE_IN_OUT` | `[0.65, 0, 0.35, 1]` | Masks, wipes, line drawing |
| `EASE_EXIT` | `[0.4, 0, 1, 1]` | All exits (accelerate) |
| Durations | feedback 200–300ms · reveals 600–900ms · masks/lines 900–1400ms · exits ≈ 60% of entrance | |
| Stagger | 50–90ms, ≤ 8 items per sequence | |

Banned: overshooting springs, bounce, infinite loops, parallax, cursor effects,
fade-in-on-scroll wrappers.

### Where motion lives
| Area | Treatment |
|---|---|
| Route transition | Outgoing page −8px + fade (220ms, `EASE_EXIT`); teal hairline sweeps under the header; incoming page runs its own entrance. Scroll position restored per history entry; focus to page `h1` |
| Headlines | Line-by-line mask reveal, once |
| Images | Frame opens bottom-up (clip-path) while the image settles 1.08 → 1; layered pairs stagger; hover 1.00 → 1.02 |
| Editorial lines | Rules, dividers, crop marks, grid lines draw themselves |
| Timelines | Line fills with scroll progress; nodes fill as passed (Approach, Experience) |
| Research | Hairline bars draw; counters count verified entries only |
| Expertise | Height expand/collapse; sticky image changes with a horizontal mask wipe |
| Consultation | Steps slide in direction of travel; step indicator fills |
| Mobile menu | Opens with a top-down clip-path; links rise in sequence |
| Buttons | Fill wipes in from the left; arrow shifts 4px (no opacity fade) |

### Density
At most 1–2 primary animated elements per view. On the Home hero the name reveal
and portrait opening are primary; grid lines and crop marks are faint, late,
single-pass supporting details.

### Reduced motion
`<MotionConfig reducedMotion="user">` removes transform movement. Decorative
clip-path masks and line drawing check `useDecorativeMotion()` and render in their
final state. Route change becomes a ≤ 300ms opacity crossfade. Content is never
hidden behind animation.

## 6. Components

- **Buttons** (`Button.tsx`): 48px, 8px radius. `primary` ink · `secondary` ink
  outline · `inverse` on ink band · `text` teal with drawn underline.
- **Cards:** surface, 1px border, no shadow; hover border → teal, lift 2px.
- **Header:** sticky ivory; Home · About · Expertise · Experience · Research ·
  Contact + "Book a consultation"; `NavLink` with sliding teal underline
  (`layoutId`). Mobile/tablet: full-screen menu with the same routes.
- **Forms:** visible labels, 48px fields, 16px text, errors under the field with
  `aria-invalid` / `aria-describedby`, loading → success/error states.
- **Icons:** a handful of hand-drawn inline SVGs. No icon library, no emojis.

## 7. Images

- Originals go in `public/images/` using the documented filenames.
- `npm run images` generates AVIF + WebP at 640 / 960 / 1280 / 1920px into
  `public/images/optimized/` and writes `src/data/image-manifest.json`
  (intrinsic width/height + generated widths).
- `MedicalImage` emits `<picture>` with AVIF/WebP `srcset` + `sizes` only for
  images listed in the manifest, sets `width`/`height` from the manifest, and
  always sits in an aspect-ratio frame, so there is no layout shift.
- Until real photos exist, an abstract placeholder is shown. Never a stock or fake photo.

## 8. Responsive & accessibility

- Breakpoints: 320 / 375 / 768 / 1024 / 1440+. Mobile first. No horizontal scroll.
- Phones: single column, sticky bottom "Book" bar (except on `/consultation`),
  safe-area insets.
- Skip link; visible focus on every control; focus to page `h1` after navigation.
- Exactly one `h1` per page; sequential `h2`/`h3`/`h4`; footer headings are `h2`.
- Descriptive alt text; decorative graphics `aria-hidden`.
- 44px minimum tap targets; body text ≥ 16px; labels ≥ 12px.

## 9. Pre-delivery checklist

- [ ] None of the 20 exclusions present
- [ ] Every nav item is a separate route; direct load, Back/Forward work
- [ ] Contrast ≥ 4.5:1 in both themes
- [ ] One h1 per page, no skipped heading levels
- [ ] No horizontal scroll at 320px; tap targets ≥ 44px; text ≥ 12px
- [ ] Exits use `EASE_EXIT`; no bounce or loops; reduced motion respected
- [ ] Images in aspect-ratio frames; optimised variants when photos exist
- [ ] `npm run build` passes; no console errors
