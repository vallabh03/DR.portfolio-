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
  institution?: string
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
  /** Heading for the details list, when the doctor labels it differently (default: "Conditions and procedures"). */
  detailsLabel?: string
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

/** Credential categories that the About page also lists as Education and Training. */
export const QUALIFICATIONS = 'Medical Qualifications'
export const TRAINING = 'Specialized Training'

export const doctor: Doctor = {
  name: 'Dr Abhinav Thaduri',
  firstLine: 'Dr Abhinav',
  lastLine: 'Thaduri',
  initials: 'AT',
  title: 'Consultant Head and Neck Surgical Oncologist',
  specialty: 'Head and Neck Surgical Oncology',
  qualifications: 'MBBS, MS (ORL-HNS), M.Ch (Head & Neck Surgery & Oncology)',

  headline: 'Specialist surgical care for head and neck cancer',
  headlineSupport:
    'Assessment, treatment planning and surgery for oral, thyroid, salivary gland and laryngeal cancers, with attention to functional recovery and life after treatment.',

  bioShort:
    'Dr Abhinav Thaduri is an AIIMS-trained Head & Neck Surgical Oncologist practising at Continental Hospitals, Hyderabad. His clinical work focuses on oral cancer, thyroid and parathyroid surgery, salivary gland tumours, and cancers of the larynx and hypopharynx. His academic interests include cancer outcomes, speech and swallowing after treatment, and the long-term wellbeing of patients and families.',

  approachStatement:
    'My approach begins with understanding the disease and the person facing it. I explain the diagnosis, available treatment options and expected effects on everyday life so that patients and families can make informed decisions. Treatment planning considers cancer control alongside balancing the quality of life. Where needed, I work with colleagues in radiation oncology, medical oncology, reconstruction and rehabilitation to coordinate care through treatment and follow-up.',

  // Not yet filled in: each waits for the doctor's confirmation.
  // bioFull: one string per paragraph (full biography)
  // registration: { body, number, show }
  bioFull: [],

  about: {
    // Professional journey: empty until the doctor supplies the text; the chapter is hidden while empty.
    journey: '',
    philosophy: '',
    patientCentered: '',
    experience: ['[PROFESSIONAL EXPERIENCE]'],
    languages: ['[LANGUAGES SPOKEN]'],
  },

  experience: [
    {
      year: '2026–present',
      role: 'Consultant Head and Neck Surgical Oncologist',
      institution: 'Continental Hospitals',
      location: 'Hyderabad',
      description:
        'Clinical focus: assessment and surgical management of head and neck cancers, thyroid and salivary gland surgery, treatment planning, and follow-up.',
    },
    {
      year: 'November 2023–August 2026',
      role: 'Consultant Head and Neck Surgical Oncologist',
      institution: 'Basavatarakam Indo American Cancer Hospital & Research Institute',
      location: 'Hyderabad',
      description:
        'Comprehensive head and neck cancer management, oral cancer surgery and neck dissections, thyroid and salivary gland surgery, reconstructive planning, rehabilitation, tumour board participation, clinical research and academic activities.',
    },
    {
      year: 'September 2022–November 2023',
      role: 'Consultant and Assistant Professor in ENT',
      institution: 'Prathima Cancer Institute and Prathima Relief Medical College',
      location: 'Warangal',
      description:
        'Head and neck surgical oncology practice and postgraduate / undergraduate teaching in otolaryngology.',
    },
  ],

  // Awards, academic achievements and registration are added separately, once confirmed.
  credentials: [
    {
      category: QUALIFICATIONS,
      items: [
        { title: 'M.Ch Head & Neck Surgery and Oncology', institution: 'AIIMS Rishikesh', year: '2019–2022' },
        { title: 'MS Otorhinolaryngology and Head & Neck Surgery', institution: 'Gandhi Medical College, Hyderabad', year: '2015–2018' },
        { title: 'MBBS', institution: 'Bhaskar Medical College, Hyderabad', year: '2008–2014' },
      ],
    },
    {
      category: TRAINING,
      items: [
        { title: 'Fellowship in Head and Neck Oncology', institution: 'Basavatarakam Indo American Cancer Hospital & Research Institute, Hyderabad', year: 'February–August 2019' },
        { title: 'Visiting Head and Neck Surgery Fellow', institution: 'University of Brescia, Italy', year: 'December 2022–January 2023', description: 'Exposure to head and neck oncology, minimally invasive laryngeal surgery and multidisciplinary cancer care.' },
      ],
    },
    {
      category: 'Professional Memberships',
      items: [
        { title: 'American Society of Clinical Oncology (ASCO)' },
        { title: 'European Society for Medical Oncology (ESMO)' },
        { title: 'Indian Association of Surgical Oncology (IASO)' },
        { title: 'Foundation for Head and Neck Oncology (FHNO)' },
        { title: 'Association of Otorhinolaryngologists of India (AOI)' },
        { title: 'Association of Otorhinolaryngologists of Telangana' },
      ],
    },
  ],

  // Areas of expertise as supplied by the doctor. No images have been approved yet.
  expertise: [
    {
      title: 'Oral cancer surgery',
      description:
        'Assessment and surgical treatment of cancers affecting the tongue, inner cheek, gums, floor of the mouth and other oral cavity sites. Surgical planning addresses tumour removal, neck lymph nodes and reconstruction.',
    },
    {
      title: 'Thyroid and parathyroid surgery',
      description:
        'Evaluation and surgical management of thyroid and parathyroid conditions, with the extent of surgery tailored to the diagnosis and clinical findings.',
    },
    {
      title: 'Salivary gland tumours',
      description:
        'Assessment and surgery for benign and malignant tumours of the parotid, submandibular and other salivary glands, with attention to tumour clearance and relevant nerve function.',
    },
    {
      title: 'Laryngeal and hypopharyngeal cancers',
      description:
        'Assessment and surgical care for cancers of the voice box and lower throat. Treatment discussions include cancer control and the expected effects on voice, swallowing and breathing.',
    },
    {
      title: 'Head and neck reconstruction',
      description:
        'Reconstructive planning following cancer surgery to restore tissue coverage and support oral function, swallowing and recovery.',
    },
    {
      title: 'Survivorship and functional recovery',
      description:
        'Follow-up that considers recovery beyond the operation, including speech, swallowing, nutrition, return to daily activities and the needs of caregivers.',
      details: [
        'Post-treatment follow-up',
        'assessment of functional concerns',
        'coordination with speech and swallowing therapy, nutrition and rehabilitation services',
      ],
      detailsLabel: 'Scope',
    },
    {
      title: 'Second opinions and treatment planning',
      description:
        'Review of an established diagnosis or proposed treatment plan, with discussion of available options and their likely implications. Bring biopsy reports, scans and previous treatment records to the consultation.',
    },
  ],

  /**
   * The stages of a consultation, only in wording supplied and approved by the
   * doctor. While this is empty the stage sequences on Home and About are hidden.
   */
  approach: [],

  researchIntro:
    'Dr Thaduri’s research focuses on practical questions in head and neck cancer care: how disease extent and lymph node involvement influence outcomes, how treatment affects speech and swallowing, and how patients and families experience life after cancer. His work includes clinical outcomes research, patient-reported outcomes and studies of financial and psychological burden.',
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
    clinic: 'Continental Hospitals, Hyderabad',
    addressLine: '[STREET ADDRESS]',
    locality: '[CITY, STATE, COUNTRY]',
    postcode: '[POSTCODE]',
    phone: '',
    email: '',
    hours: [{ days: 'Monday–Saturday', time: '9 AM–5 PM' }],
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
