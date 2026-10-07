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
 *  Empty arrays are handled gracefully by the UI (e.g. testimonials).
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type TimelineItem = {
  year: string
  role: string
  institution: string
  location?: string
  description: string
  highlights?: string[]
}

export type Credential = {
  title: string
  institution: string
  year: string
  description: string
  link?: string
}

export type CredentialGroup = {
  category: string
  items: Credential[]
}

export type ExpertiseItem = {
  title: string
  description: string
  details: string[]
  image: string
}

export type ResearchItem = {
  title: string
  description: string
  year: string
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

export const doctor = {
  name: 'Dr. Abhinav Thaduri',
  firstLine: 'Dr. Abhinav',
  lastLine: 'Thaduri',
  initials: 'AT',
  title: '[VERIFY SPECIALTY]',
  statement: ['Precision in diagnosis.', 'Compassion in care.', 'Evidence in every decision.'],

  biography:
    '[DOCTOR BIO] — A short, first-person introduction to Dr. Abhinav Thaduri will appear here once it has been written and verified. It should describe Dr. Thaduri as a clinician, the patients cared for, and what shapes this approach to medicine.',

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
    {
      year: '[YEAR]',
      role: '[POSITION]',
      institution: '[INSTITUTION]',
      location: '[CITY]',
      description: '[DESCRIPTION OF ROLE AND RESPONSIBILITIES]',
      highlights: ['[KEY RESPONSIBILITY]', '[KEY RESPONSIBILITY]'],
    },
  ] as TimelineItem[],

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
   * A general description of how a consultation unfolds. It deliberately makes
   * no promises about outcomes — edit wording with Dr. Thaduri before launch.
   */
  approach: [
    {
      title: 'Consultation',
      description:
        'A conversation first. Time to hear your concerns, your history and what matters most to you — in your own words.',
    },
    {
      title: 'Assessment',
      description:
        'A careful clinical examination, together with a review of previous records and any relevant tests.',
    },
    {
      title: 'Diagnosis',
      description:
        'Findings are explained clearly, including what is known, what is still uncertain, and why.',
    },
    {
      title: 'Treatment Planning',
      description:
        'Options are discussed openly — their benefits, risks and alternatives — so decisions are made together.',
    },
    {
      title: 'Follow-up',
      description:
        'Progress is reviewed over time, and the plan is adjusted as your needs change.',
    },
  ] as ApproachStage[],

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
    address: '[STREET ADDRESS]',
    city: '[CITY, POSTCODE]',
    phone: '',
    email: '',
    hours: [
      { days: '[DAYS]', time: '[HOURS]' },
      { days: '[DAYS]', time: '[HOURS]' },
    ],
    mapUrl: '',
    links: [] as { label: string; href: string }[],
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

export type Doctor = typeof doctor

/** True for strings that are still unverified placeholders. */
export const isPlaceholder = (value: string) => /^\[.*\]/.test(value.trim())
