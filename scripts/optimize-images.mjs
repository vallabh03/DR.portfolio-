/**
 * Generates responsive AVIF + WebP versions of the photographs in public/images
 * and writes src/data/image-manifest.json, which MedicalImage reads to build
 * <picture> sources, srcset and intrinsic width/height.
 *
 *   npm run images
 *
 * Originals are never modified. Images without an entry in the manifest are
 * served as-is (or show the placeholder while they don't exist yet).
 */
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const srcDir = path.join(root, 'public', 'images')
const outDir = path.join(srcDir, 'optimized')
const manifestPath = path.join(root, 'src', 'data', 'image-manifest.json')

/** Target widths. Widths larger than the original are skipped (no upscaling). */
const WIDTHS = [640, 960, 1280, 1920]
const FORMATS = {
  avif: { quality: 50 },
  webp: { quality: 72 },
}

const files = (await readdir(srcDir)).filter((f) => /\.(jpe?g|png)$/i.test(f))
await mkdir(outDir, { recursive: true })

const manifest = {}
for (const file of files) {
  const input = path.join(srcDir, file)
  const base = file.replace(/\.[^.]+$/, '')
  const meta = await sharp(input).rotate().metadata()
  const width = meta.autoOrient?.width ?? meta.width
  const height = meta.autoOrient?.height ?? meta.height
  const widths = WIDTHS.filter((w) => w < width).concat(width).filter((w, i, a) => a.indexOf(w) === i)

  for (const w of widths) {
    for (const [format, options] of Object.entries(FORMATS)) {
      await sharp(input).rotate().resize({ width: w }).toFormat(format, options).toFile(path.join(outDir, `${base}-${w}.${format}`))
    }
  }

  manifest[`/images/${file}`] = { width, height, widths, formats: Object.keys(FORMATS), base: `/images/optimized/${base}` }
  console.log(`✓ ${file}  ${width}×${height}  →  ${widths.join(', ')}px × ${Object.keys(FORMATS).join(' + ')}`)
}

await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
console.log(files.length ? `\nWrote ${path.relative(root, manifestPath)} (${files.length} image${files.length === 1 ? '' : 's'})` : 'No photographs found in public/images yet. Manifest left empty.')
