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

  // Full biography for the About page, one string per paragraph, as supplied.
  // Not yet filled in (waits for the doctor's confirmation): registration: { body, number, show }
  bioFull: [
    'Dr Abhinav Thaduri is a Consultant Head & Neck Surgical Oncologist at Continental Cancer Centre, Continental Hospitals, Hyderabad. He has more than a decade of experience across otolaryngology, head and neck surgery, and oncology, including postgraduate and specialist training.',
    'He completed his M.Ch in Head & Neck Surgery and Oncology at the All India Institute of Medical Sciences, Rishikesh, and his MS in Otorhinolaryngology and Head & Neck Surgery at Gandhi Medical College, Hyderabad, where he received gold medal recognition. He also completed visiting fellowship training at the University of Brescia, Italy.',
    'Before joining Continental Hospitals, he worked as a Consultant Head & Neck Surgical Oncologist at Basavatarakam Indo American Cancer Hospital & Research Institute, Hyderabad. His earlier work at Prathima Cancer Institute and Prathima Relief Medical College, Warangal, combined clinical practice with teaching in otolaryngology.',
    'His practice includes oral cancer surgery, neck dissection, thyroid and parathyroid surgery, salivary gland surgery, and surgery for laryngeal and hypopharyngeal cancers. Treatment planning considers the extent of disease, the patient’s general health, and the likely effects on speech, swallowing and daily life, with a multidisciplinary approach.',
    'Alongside clinical work, Dr Thaduri contributes to research on oral cancer staging, treatment outcomes, functional recovery and survivorship. His work has been published in peer-reviewed journals including Oral Oncology, Psycho-Oncology, European Archives of Oto-Rhino-Laryngology, International Journal of Oral and Maxillofacial Surgery and JCO Global Oncology. He has presented research at ESMO, ASCO and FHNO meetings.',
  ],

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

  // Areas of expertise as supplied by the doctor. Images are added per area as they are supplied.
  expertise: [
    {
      title: 'Oral cancer surgery',
      description:
        'Assessment and surgical treatment of cancers affecting the tongue, inner cheek, gums, floor of the mouth and other oral cavity sites. Surgical planning addresses tumour removal, neck lymph nodes and reconstruction.',
      image: '/images/expertise-oral-cancer.jpg',
    },
    {
      title: 'Thyroid and parathyroid surgery',
      description:
        'Evaluation and surgical management of thyroid and parathyroid conditions, with the extent of surgery tailored to the diagnosis and clinical findings.',
      image: '/images/expertise-thyroid.jpg',
    },
    {
      title: 'Salivary gland tumours',
      description:
        'Assessment and surgery for benign and malignant tumours of the parotid, submandibular and other salivary glands, with attention to tumour clearance and relevant nerve function.',
      image: '/images/expertise-salivary.jpg',
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
  researchInterests: [
    'Oral cancer staging refinement & nodal burden',
    'Functional recovery, speech & swallowing outcomes',
    'Survivorship, financial toxicity & caregiver wellbeing',
  ],

  research: [
    {
      category: 'Peer-Reviewed Publications',
      items: [
        {
          title: 'Refining nodal classification in oral cancer: prognostic impact of nodal burden within N2b and implications for AJCC staging',
          description:
            'Prognostic evaluation demonstrating that absolute metastatic lymph node count within the AJCC 8th edition N2b category significantly improves survival discrimination in oral cavity squamous cell carcinoma.',
          year: '2026',
          venue: 'Oral Oncology',
          link: 'https://pubmed.ncbi.nlm.nih.gov/?term=Thaduri+A+refining+nodal+classification',
        },
        {
          title: 'Oncological outcomes of pathological extranodal extension (pENE) in oral squamous cell carcinoma (OSCC): A proposal to refine the current staging',
          description:
            'Investigation of survival outcomes associated with pathological extranodal extension and positive lymph node thresholds to refine current head and neck cancer staging frameworks.',
          year: '2025',
          venue: 'Oral Oncology',
          link: 'https://pubmed.ncbi.nlm.nih.gov/?term=Thaduri+A+extranodal+extension',
        },
        {
          title: 'Five-year long-term functional and quality of life outcomes in total glossectomy survivors',
          description:
            'Long-term evaluation of functional recovery, speech, swallowing, and quality-of-life trajectories in patients undergoing total glossectomy for advanced tongue malignancies.',
          year: '2025',
          venue: 'European Archives of Oto-Rhino-Laryngology',
          link: 'https://pubmed.ncbi.nlm.nih.gov/?term=Thaduri+total+glossectomy',
        },
        {
          title: 'Long-term impact of financial distress and mental well-being in early vs advanced oral cancer patients on the quality of life of informal caregivers',
          description:
            'Assessment of the psychological and economic burden of oral cancer treatment on patients and their primary caregivers across disease stages.',
          year: '2025',
          venue: 'Supportive Care in Cancer',
          link: 'https://pubmed.ncbi.nlm.nih.gov/?term=Thaduri+financial+distress+caregivers',
        },
        {
          title: 'Long-term swallow outcomes and factors affecting swallowing dysfunction and quality of life among oral cancer patients: a prospective observational study',
          description:
            'Prospective evaluation using the Sydney Swallow Questionnaire (SSQ) analyzing predictors of chronic swallowing dysfunction following multimodality oral cancer therapy.',
          year: '2023',
          venue: 'Dysphagia',
          link: 'https://pubmed.ncbi.nlm.nih.gov/?term=Thaduri+swallow+outcomes+dysphagia',
        },
        {
          title: 'Financial toxicity and mental well-being of the oral cancer survivors residing in a developing country in the era of COVID-19 pandemic',
          description:
            'Cross-sectional study analyzing out-of-pocket healthcare expenditure, financial distress, and mental health outcomes in head and neck cancer survivors.',
          year: '2023',
          venue: 'Supportive Care in Cancer',
          link: 'https://pubmed.ncbi.nlm.nih.gov/?term=Thaduri+financial+toxicity+COVID',
        },
      ],
    },
    {
      category: 'Academic & Conference Presentations',
      items: [
        {
          title: 'Clinical outcomes, functional preservation, and quality of life in head and neck oncology',
          description:
            'Scientific presentations delivered at national and international oncology congresses, including ASCO, ESMO, and FHNO annual meetings.',
          year: '2022–2025',
          venue: 'ASCO & ESMO Forums',
        },
      ],
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
    siteUrl: 'https://www.drabhinavthaduri.com',
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
