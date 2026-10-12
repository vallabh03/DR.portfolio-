/** The part of the head and neck each area of care concerns, shown as a short label. */
export type Region = 'oral' | 'thyroid' | 'salivary' | 'larynx' | 'reconstruction' | 'recovery' | 'records'

/** Which region an area concerns, from the words in its title. */
export function regionFor(title: string): Region {
  const t = title.toLowerCase()
  if (t.includes('oral')) return 'oral'
  if (t.includes('thyroid')) return 'thyroid'
  if (t.includes('salivary')) return 'salivary'
  if (t.includes('laryn') || t.includes('pharyn')) return 'larynx'
  if (t.includes('reconstruct')) return 'reconstruction'
  if (t.includes('survivor') || t.includes('recovery')) return 'recovery'
  return 'records'
}

export const REGION_LABEL: Record<Region, string> = {
  oral: 'Oral cavity',
  thyroid: 'Thyroid and parathyroid glands',
  salivary: 'Parotid and submandibular glands',
  larynx: 'Larynx and hypopharynx',
  reconstruction: 'Mouth, jaw and neck',
  recovery: 'Speech and swallowing',
  records: 'Reports, scans and records',
}
