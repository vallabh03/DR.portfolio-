/**
 * The gallery, in three sections. Add items to the lists below; each section
 * shows its first few items on /gallery and all of them on its own page.
 *
 * Photographs go in /public/images (run `npm run images` afterwards so the
 * site serves optimised versions); videos go in /public/videos.
 *
 * Surgery images and videos: add only material the patient has given written
 * consent to publish, with the face and any identifying details (names,
 * hospital numbers, tattoos, jewellery) removed or covered. These two sections
 * are shown only after the visitor confirms they are 18 or older.
 */

export type GalleryPhoto = {
  /** Path in /public, e.g. '/images/gallery-award-2025.jpg' (directly in /public/images, so the optimiser finds it). */
  src: string
  /** What the photograph shows; also used as its alternative text. */
  caption: string
  /** Optional context shown under the caption, e.g. the event and year. */
  detail?: string
  /** A portrait photograph: framed from the top in the grid so faces are not cropped. */
  portrait?: boolean
}

export type GalleryVideo = {
  /** Path in /public, e.g. '/videos/thyroidectomy.mp4' (MP4, H.264). */
  src: string
  title: string
  detail?: string
  /** Still image shown before the video plays. */
  poster?: string
  /** WebVTT captions, e.g. '/videos/thyroidectomy.en.vtt'. Recommended for any narrated video. */
  captions?: string
}

type SectionBase = {
  slug: string
  title: string
  intro: string
  sensitive: boolean
  /** Set to false to take a section off the site (it is hidden and its page redirects to /gallery). */
  enabled: boolean
}

export type GallerySection =
  | (SectionBase & { kind: 'photos'; items: GalleryPhoto[] })
  | (SectionBase & { kind: 'videos'; items: GalleryVideo[] })

// Captions describe only what the photographs and their event banners show.
export const awardsAndConferences: GalleryPhoto[] = [
  {
    src: '/images/gallery-fhno-global-2025.jpg',
    caption: 'Presenting at FHNO Global 2025',
    detail: '25th Annual Conference of the Foundation for Head & Neck Oncology, Bengaluru',
  },
  {
    src: '/images/gallery-kaizen-2026-case.jpg',
    caption: 'Case presentation at the Kaizen Precision Oncology Meet',
    detail: 'The Leela, Hyderabad · 23–24 May 2026',
  },
  {
    src: '/images/gallery-aiims-convocation-2023.jpg',
    caption: 'Receiving his degree at the Third Convocation of AIIMS Rishikesh',
    detail: '13 July 2023',
  },
  {
    src: '/images/gallery-aiims-rishikesh-quality-of-life.jpg',
    caption: '“Role of an Onco-surgeon in Improving Quality of Life in Oral Cancer Patients”',
    detail: 'All India Institute of Medical Sciences, Rishikesh',
  },
  {
    src: '/images/gallery-aoi-tg-con-2025-group.jpg',
    caption: 'With colleagues at AOI TG CON 2025',
    detail: '10th Telangana State ENT Conference, Gandhi Medical College, Secunderabad · 20–21 September 2025',
  },
  {
    src: '/images/gallery-sindhu-doi-auditorium.jpg',
    caption: 'Presenting on depth of invasion in oral cancer staging (AJCC 8th edition)',
    detail: 'Sindhu Hospitals',
  },
  {
    src: '/images/gallery-aoi-tg-con-2025-podium.jpg',
    caption: 'Speaking at AOI TG CON 2025',
    detail: 'Gandhi Medical College, Secunderabad · September 2025',
  },
  {
    src: '/images/gallery-kaizen-2026-podium.jpg',
    caption: 'Speaking at the Kaizen Precision Oncology Meet',
    detail: 'The Leela, Hyderabad · May 2026',
    portrait: true,
  },
  {
    src: '/images/gallery-aiims-rishikesh-cme-group.jpg',
    caption: 'CME on “Updates in Oral Cancer” cum Cadaveric Dissection Workshop',
    detail: 'All India Institute of Medical Sciences, Rishikesh',
  },
  {
    src: '/images/gallery-aiims-rishikesh-faculty.jpg',
    caption: 'On the faculty panel',
    detail: 'All India Institute of Medical Sciences, Rishikesh',
  },
  {
    src: '/images/gallery-aiims-rishikesh-podium.jpg',
    caption: 'Speaking at AIIMS Rishikesh',
    detail: 'All India Institute of Medical Sciences, Rishikesh',
  },
  {
    src: '/images/gallery-sindhu-doi-podium.jpg',
    caption: 'At the podium, depth of invasion update',
    detail: 'Sindhu Hospitals',
  },
  {
    src: '/images/gallery-sindhu-doi-stage.jpg',
    caption: 'Presenting the AJCC 8th edition update on depth of invasion',
    detail: 'Sindhu Hospitals',
  },
  {
    src: '/images/gallery-aiims-convocation-2023-closeup.jpg',
    caption: 'Third Convocation, AIIMS Rishikesh',
    detail: '13 July 2023',
  },
]

// Clinical photographs published with the patients' written consent. Any photograph
// that showed a recognisable face was cropped to the affected area before import.
// Captions describe only what is visible; the doctor may make them more specific.
export const surgeryImages: GalleryPhoto[] = [
  { src: '/images/surgery-tongue-lesion.jpg', caption: 'Lesion of the tongue' },
  { src: '/images/surgery-lip-cheek-defect.jpg', caption: 'Lesion of the lower lip and cheek', detail: 'In theatre' },
  { src: '/images/surgery-ear-closure.jpg', caption: 'Wound closure around the ear', detail: 'After surgery' },
  { src: '/images/surgery-cheek-lesion.jpg', caption: 'Ulcerated lesion of the cheek', detail: 'In theatre' },
  { src: '/images/surgery-lip-lesion.jpg', caption: 'Lesion of the lower lip', portrait: true },
  { src: '/images/surgery-oral-commissure.jpg', caption: 'Lesion at the corner of the mouth, with skin involvement' },
  { src: '/images/surgery-buccal-mucosa.jpg', caption: 'Lesion of the inner cheek', portrait: true },
  { src: '/images/surgery-oral-cavity-intraoral.jpg', caption: 'Lesion inside the mouth, on examination' },
  { src: '/images/surgery-buccal-lesion.jpg', caption: 'Lesion of the gum and inner cheek', portrait: true },
  { src: '/images/surgery-cheek-skin-involvement.jpg', caption: 'Lesion involving the skin of the cheek' },
  { src: '/images/surgery-cheek-ulcer.jpg', caption: 'Ulcerated lesion of the cheek and jaw' },
]

export const surgeryVideos: GalleryVideo[] = []

export const gallerySections: GallerySection[] = [
  {
    slug: 'awards-and-conferences',
    title: 'Awards and conferences',
    intro: 'Recognition, conference presentations and academic meetings.',
    kind: 'photos',
    sensitive: false,
    enabled: true,
    items: awardsAndConferences,
  },
  {
    slug: 'surgery-images',
    title: 'Surgery images',
    intro: 'Photographs from surgical procedures, published with patient consent.',
    kind: 'photos',
    sensitive: true,
    enabled: true,
    items: surgeryImages,
  },
  {
    slug: 'surgery-videos',
    title: 'Surgery videos',
    intro: 'Recordings from surgical procedures, published with patient consent.',
    kind: 'videos',
    sensitive: true,
    // Disabled for now; set to true to show the section again.
    enabled: false,
    items: surgeryVideos,
  },
]

/** The sections currently shown on the site. */
export const visibleSections = gallerySections.filter((s) => s.enabled)

export const findSection = (slug: string | undefined) => visibleSections.find((s) => s.slug === slug)

/** How many items each section shows on the gallery overview before "View all". */
export const PREVIEW_COUNT = { photos: 6, videos: 3 } as const
