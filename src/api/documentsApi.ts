import { apiFetch } from './http'
import type { DocumentExtraction, VaultDocument } from '../types'

type ApiDoc = {
  id: string
  bikeId: string
  name?: string
  mimeType?: string
  category?: string
  type?: string
  documentNumber?: string
  expiryDate?: string | null
  image?: string
  extractedData?: Record<string, unknown> | null
  createdAt?: string
  updatedAt?: string
}

type ApiEnvelope<T> = { success: boolean; data: T }

export async function fetchDocumentsForBike(bikeId: string): Promise<VaultDocument[]> {
  const res = await apiFetch<ApiEnvelope<ApiDoc[]>>(`/api/documents/${bikeId}`)
  return (res.data ?? []).map(mapDocument)
}

export async function createDocumentApi(payload: {
  bikeId: string
  name: string
  mimeType: string
  category: VaultDocument['category']
  image: string
  documentNumber?: string
  expiryDate?: string | null
  extractedData: Record<string, unknown>
}): Promise<VaultDocument> {
  const res = await apiFetch<ApiEnvelope<ApiDoc>>('/api/documents', {
    method: 'POST',
    body: JSON.stringify({
      bikeId: payload.bikeId,
      name: payload.name,
      mimeType: payload.mimeType,
      category: payload.category,
      documentNumber: payload.documentNumber ?? '',
      expiryDate: payload.expiryDate || null,
      image: payload.image,
      extractedData: payload.extractedData,
    }),
  })
  return mapDocument(res.data)
}

export async function updateDocumentApi(
  id: string,
  patch: Partial<{
    name: string
    mimeType: string
    category: VaultDocument['category']
    documentNumber: string
    expiryDate: string | null
    extractedData: Record<string, unknown>
  }>,
): Promise<VaultDocument> {
  const res = await apiFetch<ApiEnvelope<ApiDoc>>(`/api/documents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
  return mapDocument(res.data)
}

function mapDocument(d: ApiDoc): VaultDocument {
  const category = (d.category as VaultDocument['category']) || inferCategory(d)
  const raw =
    d.extractedData && typeof d.extractedData === 'object'
      ? ({ ...d.extractedData } as Record<string, unknown>)
      : {}
  const extractionError =
    typeof raw.extractionError === 'string' ? raw.extractionError : undefined
  delete raw.extractionError
  const extracted = normalizeExtraction(raw)
  const uploadedAt =
    typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString()
  return {
    id: d.id,
    bikeId: String(d.bikeId),
    name: d.name || 'Document',
    type: d.mimeType || 'application/octet-stream',
    uploadedAt,
    category,
    extraction: extracted,
    ...(extractionError ? { extractionError } : {}),
  }
}

function inferCategory(d: ApiDoc): VaultDocument['category'] {
  const c = (d.category || '').toLowerCase()
  if (c === 'license' || c === 'rc' || c === 'insurance' || c === 'puc' || c === 'other') {
    return c
  }
  const t = (d.type || '').toLowerCase()
  if (t.includes('licen')) return 'license'
  if (t.includes('insur')) return 'insurance'
  if (t === 'rc' || t.includes('registration')) return 'rc'
  if (t.includes('puc')) return 'puc'
  return 'other'
}

function normalizeExtraction(raw: Record<string, unknown> | null | undefined): DocumentExtraction {
  if (!raw || typeof raw !== 'object') {
    return {
      holderName: null,
      documentNumber: null,
      expiryDateIso: null,
      confidence: 'low',
      source: 'none',
    }
  }
  const source = raw.source
  const src: DocumentExtraction['source'] =
    source === 'pdf-text' || source === 'ocr' || source === 'gemini' ? source : 'none'
  const confidence =
    raw.confidence === 'high' || raw.confidence === 'medium' || raw.confidence === 'low'
      ? raw.confidence
      : 'low'
  return {
    holderName: typeof raw.holderName === 'string' ? raw.holderName : null,
    documentNumber: typeof raw.documentNumber === 'string' ? raw.documentNumber : null,
    expiryDateIso: typeof raw.expiryDateIso === 'string' ? raw.expiryDateIso : null,
    confidence,
    source: src,
  }
}
