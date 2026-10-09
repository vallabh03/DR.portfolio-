/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SINGLE SOURCE OF TRUTH FOR ALL PERSONAL CONTENT
 * ─────────────────────────────────────────────────────────────────────────────
 *  Every value wrapped in [SQUARE BRACKETS] is a placeholder that must be
 *  replaced with VERIFIED information supplied by Dr. Abhinav Thaduri.
 *
 *  Never add degrees, affiliations, specialties, years of experience, awards,
 *  publications, patient numbers, outcome rates, testimonials, research or
 *  certifications that have not been verified.
 *
 *  Nothing here is shown to visitors unless it is publishable (see hasValue):
 *  empty values and [PLACEHOLDERS] are hidden, along with their row, chapter,
 *  category or section, so unconfirmed information never reaches the page.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type TimelineItem = {
  year: string
  role: string
  institution: string
  location?: string
  description?: string
  highlights?: string[]
}

export type Credential = {
  title: string
  institution: string
  year?: string
  description?: string
  link?: string
}

export type CredentialGroup = {
  category: string
  items: Credential[]
}

export type ExpertiseItem = {
  title: string
  description: string
  /** Conditions and procedures; the list is hidden when empty. */
  details?: string[]
  /** Illustrative image in /public/images; the area works without one. */
  image?: string
}

export type ResearchItem = {
  title: string
  description?: string
  year?: string
  venue?: string
  link?: string
}

export type ResearchGroup = {
  category: string
  items: ResearchItem[]
}

export type Testimonial = {
  /** Only add testimonials that the patient has explicitly approved for publication. */
  quote: string
  attribution: string
  context?: string
}

export type ApproachStage = {
  title: string
  description: string
}

export type Registration = {
  body: string
  number: string
  /** Published only when true. */
  show: boolean
}

export type Contact = {
  clinic: string
  addressLine?: string
  /** City, state and country. */
  locality?: string
  postcode?: string
  phone?: string
  email?: string
  hours: { days: string; time: string }[]
  mapUrl?: string
  links: { label: string; href: string }[]
}

export type Doctor = {
  name: string
  firstLine: string
  lastLine: string
  initials: string
  title: string
  specialty?: string
  /** Qualification line, e.g. degrees after the name. */
  qualifications?: string
  /** Homepage headline and the sentence beneath it. */
  headline?: string
  headlineSupport?: string
  /** Short biography for the homepage. */
  bioShort?: string
  /** Full biography for the About page, one string per paragraph. */
  bioFull?: string[]
  /** The doctor's approach to care, in their own words (Home quote, About philosophy). */
  approachStatement?: string
  registration?: Registration
  about: {
    journey: string
    philosophy: string
    patientCentered: string
    education: string[]
    training: string[]
    experience: string[]
    languages: string[]
  }
  experience: TimelineItem[]
  credentials: CredentialGroup[]
  expertise: ExpertiseItem[]
  approach: ApproachStage[]
  researchIntro?: string
  researchInterests: string[]
  research: ResearchGroup[]
  testimonials: Testimonial[]
  contact: Contact
  booking: { endpoint: string }
  seo: { siteUrl: string }
}

export const doctor: Doctor = {
  name: 'Dr. Abhinav Thaduri',
  firstLine: 'Dr. Abhinav',
  lastLine: 'Thaduri',
  initials: 'AT',
  title: '[VERIFY SPECIALTY]',

  // Not yet filled in: each waits for confirmed wording from the doctor.
  // specialty, qualifications, headline, headlineSupport, bioShort, approachStatement: strings
  // bioFull: one string per paragraph
  // registration: { body, number, show }
  bioFull: [],

  about: {
    journey:
      '[PROFESSIONAL JOURNEY] — The path through medical school, residency and clinical practice, supplied and verified by Dr. Thaduri.',
    philosophy:
      '[CLINICAL PHILOSOPHY] — The principles that guide clinical decisions, in Dr. Thaduri’s own words.',
    patientCentered:
      '[PATIENT-CENTERED APPROACH] — How patients and families are involved in understanding their condition and their options.',
    education: ['[EDUCATION]'],
    training: ['[TRAINING]'],
    experience: ['[PROFESSIONAL EXPERIENCE]'],
    languages: ['[LANGUAGES SPOKEN]'],
  },

  experience: [
    {
      year: '[YEAR]',
      role: '[POSITION]',
      institution: '[INSTITUTION]',
      location: '[CITY]',
      description: '[DESCRIPTION OF ROLE AND RESPONSIBILITIES]',
      highlights: ['[KEY RESPONSIBILITY]', '[KEY RESPONSIBILITY]'],
    },
    {
      year: '[YEAR]',
      role: '[POSITION]',
      institution: '[INSTITUTION]',
      location: '[CITY]',
      description: '[DESCRIPTION OF ROLE AND RESPONSIBILITIES]',
      highlights: ['[KEY RESPONSIBILITY]', '[KEY RESPONSIBILITY]'],
    },
    {
      year: '[YEAR]',
      role: '[POSITION]',
      institution: '[INSTITUTION]',
      location: '[CITY]',
      description: '[DESCRIPTION OF ROLE AND RESPONSIBILITIES]',
      highlights: ['[KEY RESPONSIBILITY]', '[KEY RESPONSIBILITY]'],
    },
  ],

  credentials: [
    {
      category: 'Medical Qualifications',
      items: [
        { title: '[DEGREE]', institution: '[INSTITUTION]', year: '[YEAR]', description: '[DESCRIPTION]' },
        { title: '[DEGREE]', institution: '[INSTITUTION]', year: '[YEAR]', description: '[DESCRIPTION]' },
      ],
    },
    {
      category: 'Specialized Training',
      items: [{ title: '[TRAINING / FELLOWSHIP]', institution: '[INSTITUTION]', year: '[YEAR]', description: '[DESCRIPTION]' }],
    },
    {
      category: 'Certifications',
      items: [{ title: '[CERTIFICATION]', institution: '[CERTIFYING BODY]', year: '[YEAR]', description: '[DESCRIPTION]' }],
    },
    {
      category: 'Professional Memberships',
      items: [{ title: '[MEMBERSHIP]', institution: '[ORGANISATION]', year: '[YEAR]', description: '[DESCRIPTION]' }],
    },
    {
      category: 'Awards',
      items: [{ title: '[AWARD]', institution: '[AWARDING BODY]', year: '[YEAR]', description: '[DESCRIPTION]' }],
    },
    {
      category: 'Academic Achievements',
      items: [{ title: '[ACHIEVEMENT]', institution: '[INSTITUTION]', year: '[YEAR]', description: '[DESCRIPTION]' }],
    },
  ] as CredentialGroup[],

  expertise: [
    {
      title: '[EXPERTISE]',
      description: '[SHORT DESCRIPTION OF THIS AREA OF CARE — VERIFIED ONLY]',
      details: ['[CONDITION / PROCEDURE]', '[CONDITION / PROCEDURE]', '[CONDITION / PROCEDURE]'],
      image: '/images/expertise-01.jpg',
    },
    {
      title: '[EXPERTISE]',
      description: '[SHORT DESCRIPTION OF THIS AREA OF CARE — VERIFIED ONLY]',
      details: ['[CONDITION / PROCEDURE]', '[CONDITION / PROCEDURE]', '[CONDITION / PROCEDURE]'],
      image: '/images/expertise-02.jpg',
    },
    {
      title: '[EXPERTISE]',
      description: '[SHORT DESCRIPTION OF THIS AREA OF CARE — VERIFIED ONLY]',
      details: ['[CONDITION / PROCEDURE]', '[CONDITION / PROCEDURE]', '[CONDITION / PROCEDURE]'],
      image: '/images/expertise-03.jpg',
    },
    {
      title: '[EXPERTISE]',
      description: '[SHORT DESCRIPTION OF THIS AREA OF CARE — VERIFIED ONLY]',
      details: ['[CONDITION / PROCEDURE]', '[CONDITION / PROCEDURE]', '[CONDITION / PROCEDURE]'],
      image: '/images/clinic.jpg',
    },
  ] as ExpertiseItem[],

  /**
   * The stages of a consultation, only in wording supplied and approved by the
   * doctor. While this is empty the stage sequences on Home and About are hidden.
   */
  approach: [],

  // researchIntro: the Research page introduction (not yet filled in)
  researchInterests: ['[RESEARCH INTEREST]', '[RESEARCH INTEREST]', '[RESEARCH INTEREST]'],

  research: [
    {
      category: 'Publications',
      items: [
        { title: '[RESEARCH TITLE]', description: '[DESCRIPTION]', year: '[YEAR]', venue: '[JOURNAL]', link: '' },
        { title: '[RESEARCH TITLE]', description: '[DESCRIPTION]', year: '[YEAR]', venue: '[JOURNAL]', link: '' },
      ],
    },
    {
      category: 'Clinical Research',
      items: [{ title: '[STUDY TITLE]', description: '[DESCRIPTION]', year: '[YEAR]', venue: '[INSTITUTION]', link: '' }],
    },
    {
      category: 'Conferences',
      items: [{ title: '[CONFERENCE]', description: '[DESCRIPTION]', year: '[YEAR]', venue: '[LOCATION]', link: '' }],
    },
    {
      category: 'Presentations',
      items: [{ title: '[PRESENTATION TITLE]', description: '[DESCRIPTION]', year: '[YEAR]', venue: '[EVENT]', link: '' }],
    },
    {
      category: 'Academic Work',
      items: [{ title: '[ACADEMIC WORK]', description: '[DESCRIPTION]', year: '[YEAR]', venue: '[INSTITUTION]', link: '' }],
    },
  ] as ResearchGroup[],

  /** Leave empty until real, patient-approved testimonials are supplied. */
  testimonials: [] as Testimonial[],

  contact: {
    clinic: '[CLINIC / HOSPITAL NAME]',
    addressLine: '[STREET ADDRESS]',
    locality: '[CITY, STATE, COUNTRY]',
    postcode: '[POSTCODE]',
    phone: '',
    email: '',
    hours: [{ days: '[DAYS]', time: '[HOURS]' }],
    mapUrl: '',
    links: [],
  },

  booking: {
    /**
     * The site's own consultation endpoint (api/consultation.ts), which sends the
     * request to the practice on WhatsApp. Credentials live only in server
     * environment variables, never here. See docs/SETUP.md.
     */
    endpoint: '/api/consultation',
  },

  seo: {
    siteUrl: 'https://www.example.com',
  },
}

/** True for strings that are still unverified placeholders. */
export const isPlaceholder = (value: string) => /^\[.*\]/.test(value.trim())

/** True when a value can be shown to visitors: present, not blank, and not a [PLACEHOLDER]. */
export const hasValue = (value?: string | null): value is string => typeof value === 'string' && value.trim() !== '' && !isPlaceholder(value)

/** Only the publishable entries of a list. */
export const publishable = (values?: string[]) => (values ?? []).filter(hasValue)

/* ── Name-based text, derived so it always follows doctor.name ──────────── */

const [honorific, ...givenAndFamily] = doctor.name.split(' ')
const hasHonorific = /^Dr\.?$/i.test(honorific)

/** "Dr. Thaduri": honorific and family name, for links such as "About Dr. Thaduri". */
export const shortName = hasHonorific ? `${honorific} ${givenAndFamily[givenAndFamily.length - 1]}` : doctor.name

/** The About page heading, as two lines: "About Dr." / "Abhinav Thaduri". */
export const aboutHeading: [string, string] = hasHonorific ? [`About ${honorific}`, givenAndFamily.join(' ')] : ['About', doctor.name]
