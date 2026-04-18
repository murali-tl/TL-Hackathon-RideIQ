import { api } from './http'

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
  const { data: envelope } = await api.post<ApiEnvelope<GeminiExtractResult>>(
    '/api/ai/document-extract',
    payload,
  )
  return envelope.data
}
