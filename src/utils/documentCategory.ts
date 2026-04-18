import type { VaultDocument } from '../types'

export function inferDocumentCategory(fileName: string): VaultDocument['category'] {
  const n = fileName.toLowerCase()
  if (n.includes('insur') || n.includes('policy')) return 'insurance'
  if (n.includes('puc')) return 'puc'
  if (n.includes('licen') || n.includes('license') || /\bdl\b/.test(n)) return 'license'
  if (n.includes('rc') || n.includes('registration')) return 'rc'
  return 'other'
}
