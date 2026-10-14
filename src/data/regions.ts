/** The part of the head and neck each area of care concerns, shown as a short label. */
export type Region = 'oral' | 'thyroid' | 'salivary' | 'larynx' | 'recurrent' | 'sinus' | 'skin' | 'neck' | 'reconstruction' | 'recovery' | 'records'

/** Which region an area concerns, from the words in its title. */
export function regionFor(title: string): Region {
  const t = title.toLowerCase()
  if (t.includes('recurrent')) return 'recurrent'
  if (t.includes('skin')) return 'skin'
  if (t.includes('sinus') || t.includes('nasal')) return 'sinus'
  if (t.includes('benign') || t.includes('neck mass')) return 'neck'
  if (t.includes('oral')) return 'oral'
  if (t.includes('thyroid')) return 'thyroid'
  if (t.includes('salivary')) return 'salivary'
  if (t.includes('laryn') || t.includes('pharyn')) return 'larynx'
  if (t.includes('reconstruct')) return 'reconstruction'
  if (t.includes('survivor') || t.includes('recovery')) return 'recovery'
  return 'records'
}

export const REGION_LABEL: Record<Region, string> = {
  oral: 'Oral cavity and oropharynx',
  thyroid: 'Thyroid and parathyroid glands',
  salivary: 'Parotid and submandibular glands',
  larynx: 'Larynx and hypopharynx',
  recurrent: 'Head and neck, after earlier treatment',
  sinus: 'Nasal cavity and paranasal sinuses',
  skin: 'Skin of the face, scalp, ears and neck',
  neck: 'Neck',
  reconstruction: 'Mouth, jaw and neck',
  recovery: 'Speech and swallowing',
  records: 'Reports, scans and records',
}
