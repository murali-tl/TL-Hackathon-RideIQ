import { api } from './http'
import type { AiDashboardTipsResult } from '../types/aiDashboardTips'
import type { Bike } from '../types'
type ApiEnvelope<T> = { success: boolean; data: T; message?: string }

export type DashboardTipsRequest = {
  bike: Pick<
    Bike,
    | 'brand'
    | 'model'
    | 'year'
    | 'registrationNumber'
    | 'fuelType'
    | 'engineCc'
    | 'category'
    | 'claimedMileageKmL'
    | 'fuelSystem'
  >
  stats: {
    averageKmL: number | null
    bestKmL: number | null
    worstKmL: number | null
    totalFuelCost: number
    totalLiters: number
    totalKm: number
    fillCount: number
    totalServiceSpend: number
    lastFillLiters: number | null
    estRangeKm: number | null
  }
  imageBase64?: string
}

export type DashboardTipsResponse = {
  model: string
  vision_provider?: 'gemini' | 'ollama'
  tips: AiDashboardTipsResult
  raw_model_text: string
}

export async function postDashboardTips(body: DashboardTipsRequest): Promise<DashboardTipsResponse> {
  const { data: envelope } = await api.post<ApiEnvelope<DashboardTipsResponse>>('/api/ai/dashboard-tips', body, {
    timeout: 180_000,
  })
  if (!envelope.success || !envelope.data) {
    throw new Error(envelope.message ?? 'AI tips request failed')
  }
  return envelope.data
}
