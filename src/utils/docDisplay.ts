import type { DocumentExtraction, VaultDocument } from '../types'

/** Expiry classification for badges and dashboard highlights. */
export function documentExpiryState(doc: VaultDocument): {
  label: string
  tone: 'green' | 'amber' | 'accent' | 'red'
  daysLeft: number | null
} {
  const iso = doc.extraction.expiryDateIso
  if (!iso) return { label: doc.category === 'rc' ? 'Active' : 'No expiry', tone: 'green', daysLeft: null }
  const exp = new Date(iso + 'T12:00:00')
  if (Number.isNaN(exp.getTime())) return { label: 'On file', tone: 'green', daysLeft: null }
  const days = Math.ceil((exp.getTime() - Date.now()) / 86400000)
  if (days < 0) return { label: 'Expired', tone: 'red', daysLeft: days }
  if (days <= 14) return { label: `Expiring · ${days}d`, tone: 'accent', daysLeft: days }
  if (days <= 45) return { label: `${days} days left`, tone: 'amber', daysLeft: days }
  return { label: 'Valid', tone: 'green', daysLeft: days }
}

/** @deprecated use documentExpiryState — kept for quick chip text */
export function documentStatusChip(doc: VaultDocument): { label: string; tone: 'green' | 'amber' | 'accent' } {
  const s = documentExpiryState(doc)
  const tone = s.tone === 'red' ? 'accent' : s.tone
  return { label: s.label, tone }
}

export function formatIsoDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function extractionSummary(e: DocumentExtraction): string {
  const parts: string[] = []
  if (e.expiryDateIso) parts.push(`Valid till: ${formatIsoDate(e.expiryDateIso)}`)
  if (e.documentNumber) parts.push(`No: ${e.documentNumber}`)
  if (e.holderName) parts.unshift(e.holderName)
  return parts.length ? parts.join(' · ') : 'No fields detected — edit or re-upload a clearer scan.'
}
