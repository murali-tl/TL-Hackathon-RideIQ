/** Fuel log line item — always tied to a bike. */
export type FuelEntry = {
  id: string
  bikeId: string
  date: string
  fuelLiters: number
  cost: number
  distanceKm: number
  mileage: number
}

/** Fields inferred from PDF text or image OCR (best-effort). */
export type DocumentExtraction = {
  holderName: string | null
  documentNumber: string | null
  /** ISO yyyy-mm-dd when parsed */
  expiryDateIso: string | null
  confidence: 'high' | 'medium' | 'low'
  source: 'pdf-text' | 'ocr' | 'none'
}

export type VaultDocument = {
  id: string
  bikeId: string
  name: string
  type: string
  uploadedAt: string
  category: 'license' | 'rc' | 'insurance' | 'puc' | 'other'
  extraction: DocumentExtraction
  extractionError?: string
}

export type ThemeMode = 'light' | 'dark'

export type BikeFuelType = 'Petrol' | 'Electric' | 'CNG' | 'Not applicable'

/** One physical bike in the user’s garage. */
export type Bike = {
  id: string
  brand: string
  model: string
  year: string
  registrationNumber: string
  fuelType: BikeFuelType
  /** e.g. "124" (digits only for flexibility) */
  engineCc: string
  /** e.g. Commuter, Scooter, Sport */
  category: string
  /** Typical claimed / ARAI-style km/L when known */
  claimedMileageKmL?: number
  fuelSystem: 'Fuel Injected' | 'Carburetor'
  createdAt: string
}

export type ReminderBadge = 'ok' | 'warn' | 'due'

export type Reminder = {
  id: string
  bikeId: string
  title: string
  subtitle: string
  badge: ReminderBadge
  badgeText: string
}

/** Workshop / DIY service entry for a bike. */
export type ServiceRecord = {
  id: string
  bikeId: string
  date: string
  title: string
  notes: string
  cost: number
  odoKm: number | null
}

export type NotificationPrefs = {
  service: boolean
  insurance: boolean
  documents: boolean
  weeklyFuel: boolean
  dailyTips: boolean
}

export type BunkPlace = {
  id: string
  rank: number
  name: string
  location: string
  stars: number
  trust: string
  boost: string
  reviews: number
  accentRank: 'accent' | 'muted' | 'outline'
}
