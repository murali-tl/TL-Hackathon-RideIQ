import { apiFetch } from './http'

export type GeminiExtractResult = {
  holderName: string | null
  documentNumber: string | null
  expiryDateIso: string | null
  issueDateIso?: string | null
  vehicleRegistration?: string | null
  insurerName?: string | null
  confidence: 'high' | 'medium' | 'low'
}

type ApiEnvelope<T> = { success: boolean; data: T }

export async function extractDocumentWithGemini(payload: {
  imageBase64: string
  mimeType: string
  fileName: string
  category?: string
}): Promise<GeminiExtractResult> {
  const res = await apiFetch<ApiEnvelope<GeminiExtractResult>>('/api/ai/document-extract', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res.data
}
