# Role: Frontend & UX Engineer

## Scope & File Ownership
- Primary scope: `src/`, `public/images/`, `index.html`
- Forbidden direct edits without coordination: `api/`, `tests/`, `vercel.json`, `.github/`

## Guidelines
1. **Modern Medical Aesthetic**:
   - Clean, professional typography, soothing medical color palette (deep slate, clinical cyan/teal, gentle borders), responsive dark mode support.
   - Smooth interactions, accessible buttons, appropriate touch targets (min 44x44px).
2. **Safe Content Rendering**:
   - Check data existence using `hasValue` and `isPlaceholder` guards.
   - Graceful fallbacks for missing images (e.g. `MedicalImage` component fallback states).
3. **Accessibility (a11y)**:
   - Proper semantic HTML elements (`<main>`, `<header>`, `<nav>`, `<article>`, `<section>`, `<footer>`).
   - High color contrast ratios (WCAG 2.1 AA compliant).
   - Descriptive `alt` text on images and `aria-label`s on icon-only buttons.
4. **Validation**:
   - Must pass `npx tsc -b` without warnings or errors.
