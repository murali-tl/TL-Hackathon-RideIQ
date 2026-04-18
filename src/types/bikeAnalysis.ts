export type MileageSuggestion = {
  title?: string
  detail?: string
  expected_impact?: string
}

export type BikeAnalysis = {
  image_assessment?: string
  vehicle_type?: string
  identified_details?: {
    brand_guess?: string | null
    model_guess?: string | null
    approx_engine_cc_or_equivalent?: string | null
    notable_visible_features?: unknown
  }
  mileage_improvement_suggestions?: MileageSuggestion[]
  disclaimer?: string
  parse_error?: boolean
  note?: string
  fallback_text?: string
}

export function asBikeAnalysis(raw: unknown): BikeAnalysis | null {
  if (raw == null || typeof raw !== 'object') return null
  return raw as BikeAnalysis
}

export function featureList(details: BikeAnalysis['identified_details']): string[] {
  const raw = details?.notable_visible_features
  if (!Array.isArray(raw)) return []
  return raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
}
