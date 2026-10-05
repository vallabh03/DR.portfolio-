# Images

Drop verified photographs here using these exact filenames — no code changes needed.
Until a file exists, the site shows an abstract, theme-aware placeholder (never a fake photo).

| File | Used on | Suggested size |
| --- | --- | --- |
| doctor-hero.jpg | Home hero (arched portrait) | 1200×1500, portrait |
| doctor-about.jpg | About | 1200×1500, portrait |
| clinic.jpg | About, Contact, Expertise 04 | 1600×1000 |
| expertise-01.jpg … expertise-03.jpg | Expertise | 1200×900 |
| research.jpg | Research | 1600×900 |
| credential-01.jpg | Credentials | 1600×1000 |

Export originals as high-quality JPEG (or PNG), at least the suggested size.

## Optimising

After adding or replacing a photograph, run:

```
npm run images
```

This writes AVIF and WebP versions at 640 / 960 / 1280 / 1920px (never upscaled)
to `public/images/optimized/`, and records each image's intrinsic size in
`src/data/image-manifest.json`. The site then serves the smallest suitable
AVIF/WebP automatically via `<picture>` + `srcset`, with width/height set so the
layout never shifts. Originals are not modified and remain the fallback.
