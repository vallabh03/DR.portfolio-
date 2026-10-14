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
  /** The organisation's logo in /public/logos, shown above the entry when supplied. */
  logo?: string
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
    'Dr Abhinav Thaduri is an AIIMS-trained Head & Neck Surgical Oncologist practising at Continental Hospitals, Hyderabad. His clinical work focuses on oral cancer, thyroid and parathyroid surgery, salivary gland tumours, cancers of the larynx and hypopharynx, recurrent head and neck cancers, and skin cancers of the head and neck. His academic interests include cancer outcomes, speech and swallowing after treatment, and the long-term wellbeing of patients and families.',

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
      logo: '/logos/continental-hospitals.png',
      location: 'Hyderabad',
      description:
        'Clinical focus: assessment and surgical management of head and neck cancers, thyroid and salivary gland surgery, treatment planning, and follow-up.',
    },
    {
      year: 'November 2023–August 2026',
      role: 'Consultant Head and Neck Surgical Oncologist',
      institution: 'Basavatarakam Indo American Cancer Hospital & Research Institute',
      logo: '/logos/basavatarakam.png',
      location: 'Hyderabad',
      description:
        'Comprehensive head and neck cancer management, oral cancer surgery and neck dissections, thyroid and salivary gland surgery, reconstructive planning, rehabilitation, tumour board participation, clinical research and academic activities.',
    },
    {
      year: 'September 2022–November 2023',
      role: 'Consultant and Assistant Professor in ENT',
      institution: 'Prathima Cancer Institute and Prathima Relief Medical College',
      logo: '/logos/prathima-cancer-institute.png',
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
      image: '/images/expertise-larynx.jpg',
    },
    // The four areas below use the doctor's own wording.
    {
      title: 'Recurrent head and neck cancers',
      description:
        'Assessment and surgical management of head and neck cancers that return after previous treatment, including surgery, radiotherapy or chemoradiotherapy. Treatment planning considers the site and extent of recurrence, previous treatment, feasibility of salvage surgery and expected functional outcomes.',
      image: '/images/expertise-recurrent.jpg',
    },
    {
      title: 'Paranasal sinus and nasal cavity tumours',
      description:
        'Evaluation and surgical treatment of benign and malignant tumours affecting the nasal cavity and paranasal sinuses, including the maxillary and ethmoid sinuses. Surgical planning considers tumour extent, involvement of adjacent structures and the appropriate open, endoscopic or combined surgical approach.',
    },
    {
      title: 'Skin cancers of the head and neck',
      description:
        'Evaluation and surgical management of skin cancers involving the face, scalp, ear, neck and surrounding regions, including squamous cell carcinoma, basal cell carcinoma and melanomas. Surgical planning addresses complete tumour removal, regional lymph node involvement when indicated and reconstruction to preserve appearance and function.',
      image: '/images/expertise-skin.jpg',
    },
    {
      title: 'Benign neck tumours and neck masses',
      description:
        'Evaluation and surgical management of non-cancerous swellings and tumours of the neck, including branchial cleft cysts, thyroglossal duct cysts, dermoid cysts, lipomas and congenital neck masses. Treatment planning considers the underlying diagnosis, anatomical location, relationship to important nerves and blood vessels, and the need for safe surgical removal.',
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

  /**
   * Publications as supplied by the doctor (13 October 2026), newest first.
   * Duplicates in the supplied list were merged; fields the list did not give
   * (journal, year or link) are left out rather than guessed.
   */
  research: [
    {
      category: 'Publications',
      items: [
        { title: "Impact of adjuvant radiotherapy on recurrence outcomes in pT2N0 oral squamous cell carcinoma: a propensity score–matched survival analysis", venue: "Head & Neck", year: '2026', link: 'https://doi.org/10.1002/hed.70391' },
        { title: "Predictors of nodal metastasis in thin tongue tumours (depth of invasion <5 mm) – revisited", venue: "International Journal of Oral and Maxillofacial Surgery 55, 507–512", year: '2026' },
        { title: "Refining nodal classification in oral cancer: prognostic impact of nodal burden within N2b and implications for AJCC staging" },
        { title: "Development of a nodal burden–extranodal extension classification for pathological nodal staging in oral cavity squamous cell carcinoma" },
        { title: "Level V metastases in node-positive oral squamous cell carcinoma: beyond level IIA", link: 'https://doi.org/10.1159/000543140' },
        { title: "Five-year long-term functional and quality of life outcomes in total glossectomy survivors", venue: "European Archives of Oto-Rhino-Laryngology 282, 2063–2070", year: '2025', link: 'https://doi.org/10.1007/s00405-024-09059-0' },
        { title: "Addressing quality of life and rehabilitation outcomes in total glossectomy survivors", venue: "European Archives of Oto-Rhino-Laryngology 282, 2181–2182", year: '2025', link: 'https://doi.org/10.1007/s00405-024-09201-y' },
        { title: "Oncological outcomes of pathological extranodal extension (pENE) in oral squamous cell carcinoma (OSCC): a proposal to refine the current staging", venue: "Oral Oncology", year: '2025', link: 'https://doi.org/10.1016/j.oraloncology.2025.107281' },
        { title: "Clinico-pathological significance of tumor infiltrating immune cells in oral squamous cell carcinoma – hope or hype?", venue: "Head & Neck 47, 1706–1716", year: '2025', link: 'https://doi.org/10.1002/hed.28083' },
        { title: "Can elective neck dissection for oral cancer be planned on the basis of depth of invasion? Retrospective analysis", venue: "JCO Global Oncology 11, e2400451", year: '2025', link: 'https://doi.org/10.1200/GO-24-00451' },
        { title: "Long-term impact of financial distress and mental well-being in early vs advanced oral cancer patients on the quality of life of informal caregivers: an exploratory study of a real-world cohort from LMIC", venue: "Journal of Cancer Research and Therapeutics 21(1), 91–97", year: '2025', link: 'https://doi.org/10.4103/jcrt.jcrt_709_24' },
        { title: "Authors’ reply to Kansal et al.", venue: "Cancer Research, Statistics, and Treatment 8(1), 82–83", year: '2025', link: 'https://doi.org/10.4103/crst.crst_40_25' },
        { title: "424P Prognostic implications of histological bone involvement in oral squamous cell carcinoma: a comparative analysis", venue: "Annals of Oncology", year: '2024', link: 'https://doi.org/10.1016/j.annonc.2024.10.447' },
        { title: "Real-world data analysis of oncological outcomes in patients with pathological extranodal extension (ENE) in OSCC: a proposal to refine the pathological nodal staging system", venue: "Annals of Oncology 35, S648–S649" },
        { title: "Predictors of extra nodal extension in oral squamous cell carcinoma: a retrospective analysis", venue: "Cancer Research, Statistics, and Treatment 7(4), 421–427", year: '2024', link: 'https://doi.org/10.4103/crst.crst_51_24' },
        { title: "A real-world analysis of oncological outcomes in patients with oral squamous cell carcinoma requiring marginal mandibulectomy for achieving clear surgical margins", venue: "South Asian Journal of Cancer", year: '2024' },
        { title: "Can elective neck dissection for oral cancers be planned based on depth of invasion?", venue: "Journal of Clinical Oncology 42(16 suppl), e18042", year: '2024', link: 'https://doi.org/10.1200/JCO.2024.42.16_suppl.e18042' },
        { title: "Supraclavicular artery island flap in head-and-neck reconstruction: our experience", venue: "Journal of Head & Neck Physicians and Surgeons 11(2), 102–106", year: '2023', link: 'https://doi.org/10.4103/jhnps.jhnps_37_23' },
        { title: "Effect of financial distress and mental well-being of patients with early vs advanced oral cancer on informal caregiver’s quality of life: a prospective real-world data from public health sector hospital", venue: "Annals of Oncology 34, S1611" },
        { title: "Exploring the landscape of oral cancer care: real-world scenario", venue: "European Archives of Oto-Rhino-Laryngology 280(11), 5151–5152", year: '2023', link: 'https://doi.org/10.1007/s00405-023-08215-2' },
        { title: "Long-term swallow outcomes and factors affecting swallowing dysfunction and quality of life among oral cancer patients: a prospective observational study", venue: "European Archives of Oto-Rhino-Laryngology 280(11), 5091–5100", year: '2023', link: 'https://doi.org/10.1007/s00405-023-08155-x' },
        { title: "Financial toxicity and mental well-being of the oral cancer survivors residing in a developing country in the era of COVID-19 pandemic – a cross-sectional study", venue: "Psycho-Oncology 32(1), 58–67", year: '2023', link: 'https://doi.org/10.1002/pon.6030' },
        { title: "A longitudinal cohort study on assessing the impact of COVID-19 pandemic on the mental health of cancer care providers: developing world scenario", venue: "Journal of Head & Neck Physicians and Surgeons 11(1), 59–65", year: '2023', link: 'https://doi.org/10.4103/jhnps.jhnps_45_22' },
        { title: "Revisiting the predictive factors for nodal metastasis in oral cancers – a leap towards personalized patient treatment approach", venue: "Indian Journal of Surgical Oncology 14(2), 392–397", year: '2023', link: 'https://doi.org/10.1007/s13193-022-01701-9' },
        { title: "Radiological tumor thickness as a clinical predictor of pathological depth of invasion in oral squamous cell carcinoma: a retrospective analysis", venue: "European Archives of Oto-Rhino-Laryngology 280(3), 1417–1423", year: '2023', link: 'https://doi.org/10.1007/s00405-022-07692-1' },
        { title: "Analysis of the role of selective neck dissection in clinically node-positive T3/T4 oral cancers", venue: "BioMed Research International 2022, 2204745", year: '2022', link: 'https://doi.org/10.1155/2022/2204745' },
        { title: "Addressing the challenges of head and neck cancer care in India – a compelling need of the hour", venue: "Oral Oncology 124, 105638", year: '2022', link: 'https://doi.org/10.1016/j.oraloncology.2021.105638' },
        { title: "Robot assisted modified retro-auricular approach for posterior triangle of neck: the path differently taken", venue: "Oral Oncology 124, 105633", year: '2022', link: 'https://doi.org/10.1016/j.oraloncology.2021.105633' },
        { title: "Clinicopathological difference between gingivobuccal and oral tongue cancers: a cross-sectional observational study from a tertiary healthcare centre in northern India", venue: "Indian Journal of Otolaryngology and Head & Neck Surgery", year: '2022', link: 'https://doi.org/10.1007/s12070-021-03025-6' },
        { title: "Approach to T4b oral cancers – a surgeon’s perspective", venue: "Journal of Head & Neck Physicians and Surgeons 10(2), 127–131", year: '2022', link: 'https://doi.org/10.4103/jhnps.jhnps_46_22' },
        { title: "239P Prospective evaluation of difference in patient-reported swallowing outcomes and quality of life of tongue vs bucco-alveolar complex cancers treated with ablative surgery", venue: "Annals of Oncology 33, S1527" },
        { title: "1492P A longitudinal cohort study on assessing the impact COVID-19 pandemic on the mental health of cancer care providers: developing world scenario", venue: "Annals of Oncology 32, S1097", year: '2021', link: 'https://doi.org/10.1016/j.annonc.2021.08.820' },
        { title: "Mixed invasive fungal infections among COVID-19 patients", venue: "Current Medical Mycology 7(4), 19–27", year: '2021', link: 'https://doi.org/10.18502/cmm.7.4.8407' },
        { title: "Performance and survival outcomes of defect-driven versus specimen-driven method of frozen section intraoperative margin assessment in oral cancers", venue: "International Journal of Oral and Maxillofacial Surgery", year: '2021', link: 'https://doi.org/10.1016/j.ijom.2021.11.010' },
        { title: "Trans-cervical mandibulotomy approach for a multi-compartmental trigeminal schwannoma: a surgeon’s guide", venue: "Oral Oncology 122, 105572", year: '2021', link: 'https://doi.org/10.1016/j.oraloncology.2021.105572' },
        { title: "Technical nuances during reconstruction of a complex scalp defect: a pictorial essay", venue: "Indian Journal of Surgery 83, 1547–1551", year: '2021', link: 'https://doi.org/10.1007/s12262-021-02746-w' },
        { title: "Brown tumor, parathyroid adenoma, and papillary thyroid cancer: a triple whammy", venue: "Oral Oncology 116, 105159", year: '2021', link: 'https://doi.org/10.1016/j.oraloncology.2020.105159' },
        { title: "Oral cancer screening – a delphic horizon in India", venue: "Oral Oncology, 105174", year: '2021', link: 'https://doi.org/10.1016/j.oraloncology.2020.105174' },
        { title: "Lymph node ratio in oral cavity cancer and its impact on mortality and disease recurrence", venue: "Oral Oncology 111, 104880", year: '2020', link: 'https://doi.org/10.1016/j.oraloncology.2020.104880' },
        { title: "Letter to the Editor: Relevance of level IIb neck dissection in patients with head and neck squamous cell carcinomas", venue: "World Journal of Surgery 44(5), 1691–1692", year: '2020', link: 'https://doi.org/10.1007/s00268-020-05448-8' },
        { title: "Invasive fungal granuloma: a diagnostic challenge", venue: "International Journal of Otorhinolaryngology and Head and Neck Surgery 6(8), 1529–1532", year: '2020' },
        { title: "Management of invasive fungal rhino sinusitis in a tertiary health care center", venue: "International Journal of Otorhinolaryngology and Head and Neck Surgery 4(6), 1468–1472", year: '2018' },
        { title: "A study of correlation between CT findings and MMA findings in cases of maxillary sinusitis", venue: "Journal of Medical Science and Clinical Research 6(10)", year: '2018', link: 'http://jmscr.igmpublication.org/home/index.php/archive/155-volume-06-issue-10-october-2018/5942-a-study-of-correlation-between-ct-findings-and-mma-findings-in-cases-of-maxillary-sinusitis' },
        { title: "Prevalence of head and neck cancers – an institutional based study", venue: "IOSR Journal of Dental and Medical Sciences 17(10)", link: 'https://www.iosrjournals.org/iosr-jdms/papers/Vol17-issue10/version-9/I1710093443.pdf' },
        { title: "Epidemiology of various aetiologies for emergency tracheostomy in tertiary ENT hospital", venue: "IOSR Journal of Dental and Medical Sciences 17(10)", link: 'http://www.iosrjournals.org/iosr-jdms/papers/Vol17-issue10/Version-4/D1710041722.pdf' },
        { title: "A comparative study between different surgical techniques for preauricular sinus at tertiary care centre, Secunderabad, Telangana" },
      ],
    },
  ] as ResearchGroup[],

  /** Leave empty until real, patient-approved testimonials are supplied. */
  testimonials: [] as Testimonial[],

  contact: {
    clinic: 'Continental Hospitals, Hyderabad',
    addressLine: 'Plot No 3, Road No. 2, Financial District',
    locality: 'Gachibowli, Nanakramguda, Telangana',
    postcode: '500032',
    phone: '+91 77801 61363',
    email: 'dr.abhinavthaduri.hnonco@gmail.com',
    hours: [{ days: 'Monday–Saturday', time: '9 AM–5 PM' }],
    // Opens the location in Google Maps (directions); the Contact page map loads only on request.
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Continental+Hospitals%2C+Plot+No+3%2C+Road+No.+2%2C+Financial+District%2C+Gachibowli%2C+Nanakramguda%2C+Telangana+500032',
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
    siteUrl: 'https://www.drabhinavthaduri.in',
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

/** The About page heading, as two lines: "About" / "Dr Abhinav Thaduri", keeping the honorific with the name. */
export const aboutHeading: [string, string] = ['About', doctor.name]
