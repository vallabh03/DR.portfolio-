// Builds public/og-image.jpg (1200 × 630), the preview image shown when the site
// is shared: the doctor's portrait beside his name, title and practice, in the
// site's deep blue. Run with: node scripts/og-image.mjs
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const W = 1200
const H = 630
const PHOTO_W = 520

const text = {
  label: 'HEAD AND NECK SURGICAL ONCOLOGY',
  name: 'Dr Abhinav Thaduri',
  title: ['Consultant Head and Neck', 'Surgical Oncologist'],
  place: 'Continental Hospitals, Hyderabad',
}

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

const overlay = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W - PHOTO_W}" height="${H}" fill="#0c2236"/>
  <rect x="72" y="150" width="56" height="3" fill="#7cc0ec"/>
  <text x="72" y="128" fill="#7cc0ec" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" letter-spacing="3">${escape(text.label)}</text>
  <text x="72" y="246" fill="#eef5fa" font-family="Georgia, 'Times New Roman', serif" font-size="66">${escape(text.name)}</text>
  <text x="72" y="320" fill="#d6e6f1" font-family="Arial, Helvetica, sans-serif" font-size="32">${escape(text.title[0])}</text>
  <text x="72" y="362" fill="#d6e6f1" font-family="Arial, Helvetica, sans-serif" font-size="32">${escape(text.title[1])}</text>
  <text x="72" y="470" fill="#b3c4d1" font-family="Arial, Helvetica, sans-serif" font-size="26">${escape(text.place)}</text>
</svg>`)

const photo = await sharp(path.join(root, 'public/images/doctor-hero.jpg'))
  .resize({ width: PHOTO_W, height: H, fit: 'cover', position: 'top' })
  .toBuffer()

await sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' } })
  .composite([
    { input: photo, left: W - PHOTO_W, top: 0 },
    { input: overlay, left: 0, top: 0 },
  ])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(path.join(root, 'public/og-image.jpg'))

console.log('Wrote public/og-image.jpg (1200 × 630)')
