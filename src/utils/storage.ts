import type {
  Bike,
  DocumentExtraction,
  FuelEntry,
  NotificationPrefs,
  Reminder,
  ServiceRecord,
  ThemeMode,
  VaultDocument,
} from '../types'
import { computeMileage } from './mileage'

const FUEL_KEY = 'rideiq-fuel-entries'
const DOCS_KEY = 'rideiq-documents'
const THEME_KEY = 'rideiq-theme'
const REMINDERS_KEY = 'rideiq-reminders'
const NOTIF_KEY = 'rideiq-notification-prefs'
const BIKES_KEY = 'rideiq-bikes'
const SELECTED_BIKE_KEY = 'rideiq-selected-bike-id'
const SERVICE_KEY = 'rideiq-service-history'
/** Legacy single-vehicle blob — read once for migration only. */
const LEGACY_VEHICLE_KEY = 'rideiq-vehicle'

/** Stable id for seeded demo data so migrations stay deterministic. */
export const SEED_BIKE_ID = 'bike-seed-1'

export function emptyExtraction(source: DocumentExtraction['source'] = 'none'): DocumentExtraction {
  return {
    holderName: null,
    documentNumber: null,
    expiryDateIso: null,
    confidence: 'low',
    source,
  }
}

function isDocCategory(v: unknown): v is VaultDocument['category'] {
  return v === 'license' || v === 'rc' || v === 'insurance' || v === 'puc' || v === 'other'
}

function inferCategoryFromName(name: string): VaultDocument['category'] {
  const n = name.toLowerCase()
  if (n.includes('insur') || n.includes('policy')) return 'insurance'
  if (n.includes('puc')) return 'puc'
  if (n.includes('licen') || n.includes('license') || /\bdl\b/.test(n)) return 'license'
  if (n.includes('rc') || n.includes('registration')) return 'rc'
  return 'other'
}

function migrateExtraction(raw: unknown): DocumentExtraction {
  if (!raw || typeof raw !== 'object') return emptyExtraction()
  const e = raw as Record<string, unknown>
  const source = e.source === 'pdf-text' || e.source === 'ocr' ? e.source : 'none'
  const confidence =
    e.confidence === 'high' || e.confidence === 'medium' || e.confidence === 'low' ? e.confidence : 'low'
  return {
    holderName: typeof e.holderName === 'string' ? e.holderName : null,
    documentNumber: typeof e.documentNumber === 'string' ? e.documentNumber : null,
    expiryDateIso: typeof e.expiryDateIso === 'string' ? e.expiryDateIso : null,
    confidence,
    source,
  }
}

function migrateVaultDocument(raw: unknown, fallbackBikeId: string): VaultDocument | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Record<string, unknown>
  const id = typeof x.id === 'string' ? x.id : crypto.randomUUID()
  const bikeId = typeof x.bikeId === 'string' ? x.bikeId : fallbackBikeId
  const name = typeof x.name === 'string' ? x.name : 'Document'
  const type = typeof x.type === 'string' ? x.type : 'application/octet-stream'
  const uploadedAt = typeof x.uploadedAt === 'string' ? x.uploadedAt : new Date().toISOString()
  const category = isDocCategory(x.category) ? x.category : inferCategoryFromName(name)
  const extraction = migrateExtraction(x.extraction)
  const extractionError = typeof x.extractionError === 'string' ? x.extractionError : undefined
  return { id, bikeId, name, type, uploadedAt, category, extraction, extractionError }
}

function migrateFuelEntry(raw: unknown, fallbackBikeId: string): FuelEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Record<string, unknown>
  const id = typeof x.id === 'string' ? x.id : crypto.randomUUID()
  const bikeId = typeof x.bikeId === 'string' ? x.bikeId : fallbackBikeId
  const date = typeof x.date === 'string' ? x.date : new Date().toISOString().slice(0, 10)
  const fuelLiters = typeof x.fuelLiters === 'number' ? x.fuelLiters : Number(x.fuelLiters) || 0
  const cost = typeof x.cost === 'number' ? x.cost : Number(x.cost) || 0
  const distanceKm = typeof x.distanceKm === 'number' ? x.distanceKm : Number(x.distanceKm) || 0
  const mileage =
    typeof x.mileage === 'number' ? x.mileage : computeMileage(distanceKm, fuelLiters)
  return { id, bikeId, date, fuelLiters, cost, distanceKm, mileage }
}

function migrateReminder(raw: unknown, fallbackBikeId: string): Reminder | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Record<string, unknown>
  const badge = x.badge === 'warn' || x.badge === 'ok' || x.badge === 'due' ? x.badge : 'ok'
  return {
    id: typeof x.id === 'string' ? x.id : crypto.randomUUID(),
    bikeId: typeof x.bikeId === 'string' ? x.bikeId : fallbackBikeId,
    title: typeof x.title === 'string' ? x.title : 'Reminder',
    subtitle: typeof x.subtitle === 'string' ? x.subtitle : '',
    badge,
    badgeText: typeof x.badgeText === 'string' ? x.badgeText : '',
  }
}

function migrateServiceRecord(raw: unknown, fallbackBikeId: string): ServiceRecord | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Record<string, unknown>
  const odo = x.odoKm
  return {
    id: typeof x.id === 'string' ? x.id : crypto.randomUUID(),
    bikeId: typeof x.bikeId === 'string' ? x.bikeId : fallbackBikeId,
    date: typeof x.date === 'string' ? x.date : new Date().toISOString().slice(0, 10),
    title: typeof x.title === 'string' ? x.title : 'Service',
    notes: typeof x.notes === 'string' ? x.notes : '',
    cost: typeof x.cost === 'number' ? x.cost : Number(x.cost) || 0,
    odoKm: typeof odo === 'number' ? odo : odo != null ? Number(odo) : null,
  }
}

export function createSeedBike(): Bike {
  return {
    id: SEED_BIKE_ID,
    brand: 'Honda',
    model: 'Shine 125',
    year: '2020',
    registrationNumber: 'TS 09 EF 2024',
    fuelType: 'Petrol',
    engineCc: '124',
    category: 'Commuter',
    claimedMileageKmL: 55,
    fuelSystem: 'Fuel Injected',
    createdAt: new Date().toISOString(),
  }
}

/** Build a bike row from the legacy single-vehicle JSON shape. */
function bikeFromLegacyVehicle(raw: Record<string, unknown>): Bike {
  const makeModel = String(raw.makeModel ?? 'My Bike')
  const parts = makeModel.split(/\s+/)
  const brand = parts[0] ?? 'Unknown'
  const model = parts.slice(1).join(' ') || makeModel
  return {
    id: SEED_BIKE_ID,
    brand,
    model: model || makeModel,
    year: String(raw.year ?? ''),
    registrationNumber: String(raw.regNumber ?? ''),
    fuelType: 'Petrol',
    engineCc: String(raw.engineCc ?? '').replace(/[^\d.]/g, '') || '125',
    category: 'Commuter',
    claimedMileageKmL: 50,
    fuelSystem: raw.fuelSystem === 'Carburetor' ? 'Carburetor' : 'Fuel Injected',
    createdAt: new Date().toISOString(),
  }
}

function persistChildrenWithBikeId(bikeId: string) {
  try {
    const fuelRaw = localStorage.getItem(FUEL_KEY)
    if (fuelRaw) {
      const arr = JSON.parse(fuelRaw) as unknown[]
      if (Array.isArray(arr)) {
        const next = arr
          .map((r) => migrateFuelEntry(r, bikeId))
          .filter(Boolean) as FuelEntry[]
        localStorage.setItem(FUEL_KEY, JSON.stringify(next))
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const docRaw = localStorage.getItem(DOCS_KEY)
    if (docRaw) {
      const arr = JSON.parse(docRaw) as unknown[]
      if (Array.isArray(arr)) {
        const next = arr
          .map((r) => migrateVaultDocument(r, bikeId))
          .filter(Boolean) as VaultDocument[]
        localStorage.setItem(DOCS_KEY, JSON.stringify(next))
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const remRaw = localStorage.getItem(REMINDERS_KEY)
    if (remRaw) {
      const arr = JSON.parse(remRaw) as unknown[]
      if (Array.isArray(arr)) {
        const next = arr
          .map((r) => migrateReminder(r, bikeId))
          .filter(Boolean) as Reminder[]
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(next))
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const svcRaw = localStorage.getItem(SERVICE_KEY)
    if (svcRaw) {
      const arr = JSON.parse(svcRaw) as unknown[]
      if (Array.isArray(arr)) {
        const next = arr
          .map((r) => migrateServiceRecord(r, bikeId))
          .filter(Boolean) as ServiceRecord[]
        localStorage.setItem(SERVICE_KEY, JSON.stringify(next))
      }
    }
  } catch {
    /* ignore */
  }
}

function isBike(x: unknown): x is Bike {
  if (!x || typeof x !== 'object') return false
  const b = x as Record<string, unknown>
  return (
    typeof b.id === 'string' &&
    typeof b.brand === 'string' &&
    typeof b.model === 'string' &&
    typeof b.registrationNumber === 'string'
  )
}

/**
 * Loads bikes from localStorage, creating a default row and attaching `bikeId`
 * to legacy fuel/docs/reminders when needed.
 */
export function loadBikes(): Bike[] {
  try {
    const raw = localStorage.getItem(BIKES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown[]
      if (Array.isArray(parsed)) {
        const bikes = parsed.filter(isBike)
        if (bikes.length) {
          return bikes
        }
      }
    }

    let primary: Bike = createSeedBike()
    const legacy = localStorage.getItem(LEGACY_VEHICLE_KEY)
    if (legacy) {
      try {
        const v = JSON.parse(legacy) as Record<string, unknown>
        primary = bikeFromLegacyVehicle(v)
      } catch {
        /* use seed */
      }
    }

    const list = [primary]
    localStorage.setItem(BIKES_KEY, JSON.stringify(list))
    persistChildrenWithBikeId(primary.id)
    return list
  } catch {
    return [createSeedBike()]
  }
}

export function saveBikes(bikes: Bike[]) {
  localStorage.setItem(BIKES_KEY, JSON.stringify(bikes))
}

export function loadSelectedBikeId(bikes: Bike[]): string {
  if (!bikes.length) return SEED_BIKE_ID
  try {
    const v = localStorage.getItem(SELECTED_BIKE_KEY)
    if (v && bikes.some((b) => b.id === v)) return v
  } catch {
    /* fallthrough */
  }
  const id = bikes[0].id
  localStorage.setItem(SELECTED_BIKE_KEY, id)
  return id
}

export function saveSelectedBikeId(id: string) {
  localStorage.setItem(SELECTED_BIKE_KEY, id)
}

export const DUMMY_FUEL_ENTRIES: FuelEntry[] = [
  {
    id: 'seed-1',
    bikeId: SEED_BIKE_ID,
    date: '2026-04-01',
    fuelLiters: 4.2,
    cost: 520,
    distanceKm: 198,
    mileage: computeMileage(198, 4.2),
  },
  {
    id: 'seed-2',
    bikeId: SEED_BIKE_ID,
    date: '2026-04-08',
    fuelLiters: 3.8,
    cost: 475,
    distanceKm: 172,
    mileage: computeMileage(172, 3.8),
  },
  {
    id: 'seed-3',
    bikeId: SEED_BIKE_ID,
    date: '2026-04-14',
    fuelLiters: 4.0,
    cost: 498,
    distanceKm: 210,
    mileage: computeMileage(210, 4.0),
  },
]

export const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: 'r1',
    bikeId: SEED_BIKE_ID,
    title: 'Engine Service',
    subtitle: 'Due at 15,000 km · Currently 14,820 km',
    badge: 'warn',
    badgeText: '12 days',
  },
  {
    id: 'r2',
    bikeId: SEED_BIKE_ID,
    title: 'Insurance Renewal',
    subtitle: 'Policy expires: 25 May 2026',
    badge: 'warn',
    badgeText: '38 days',
  },
  {
    id: 'r3',
    bikeId: SEED_BIKE_ID,
    title: 'Chain Lubrication',
    subtitle: 'Every 700 km · Last done 680 km ago',
    badge: 'due',
    badgeText: 'Overdue!',
  },
  {
    id: 'r4',
    bikeId: SEED_BIKE_ID,
    title: 'Tyre Pressure Check',
    subtitle: 'Every 2 weeks · Last: 10 days ago',
    badge: 'ok',
    badgeText: '4 days',
  },
  {
    id: 'r5',
    bikeId: SEED_BIKE_ID,
    title: 'Spark Plug Change',
    subtitle: 'Every 10,000 km · Changed at 10,000',
    badge: 'ok',
    badgeText: '5,180 km',
  },
  {
    id: 'r6',
    bikeId: SEED_BIKE_ID,
    title: 'PUC Certificate',
    subtitle: 'Valid till: 14 August 2026',
    badge: 'ok',
    badgeText: '119 days',
  },
]

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  service: true,
  insurance: true,
  documents: true,
  weeklyFuel: true,
  dailyTips: false,
}

export const DUMMY_DOCUMENTS: VaultDocument[] = [
  {
    id: 'doc-seed-1',
    bikeId: SEED_BIKE_ID,
    name: 'Driving Licence',
    type: 'application/pdf',
    uploadedAt: '2026-01-10T10:00:00.000Z',
    category: 'license',
    extraction: {
      holderName: 'Rahul Kumar',
      documentNumber: 'TS0920200012345',
      expiryDateIso: '2034-03-14',
      confidence: 'high',
      source: 'none',
    },
  },
  {
    id: 'doc-seed-2',
    bikeId: SEED_BIKE_ID,
    name: 'Registration Certificate (RC)',
    type: 'application/pdf',
    uploadedAt: '2026-01-10T10:00:00.000Z',
    category: 'rc',
    extraction: {
      holderName: null,
      documentNumber: 'TS 09 EF 2024',
      expiryDateIso: null,
      confidence: 'medium',
      source: 'none',
    },
  },
  {
    id: 'doc-seed-3',
    bikeId: SEED_BIKE_ID,
    name: 'Insurance Policy — HDFC Ergo',
    type: 'application/pdf',
    uploadedAt: '2026-01-10T10:00:00.000Z',
    category: 'insurance',
    extraction: {
      holderName: null,
      documentNumber: 'POL-HDFC-88291',
      expiryDateIso: '2026-05-25',
      confidence: 'high',
      source: 'none',
    },
  },
  {
    id: 'doc-seed-4',
    bikeId: SEED_BIKE_ID,
    name: 'PUC Certificate',
    type: 'application/pdf',
    uploadedAt: '2026-01-10T10:00:00.000Z',
    category: 'puc',
    extraction: {
      holderName: null,
      documentNumber: 'PUC-HYD-44102',
      expiryDateIso: '2026-08-14',
      confidence: 'medium',
      source: 'none',
    },
  },
]

export const DEFAULT_SERVICE: ServiceRecord[] = [
  {
    id: 'svc-seed-1',
    bikeId: SEED_BIKE_ID,
    date: '2026-01-05',
    title: 'Periodic service (10k)',
    notes: 'Oil + filter, chain clean',
    cost: 1850,
    odoKm: 10020,
  },
]

export function loadFuelEntries(): FuelEntry[] {
  try {
    const raw = localStorage.getItem(FUEL_KEY)
    if (!raw) {
      localStorage.setItem(FUEL_KEY, JSON.stringify(DUMMY_FUEL_ENTRIES))
      return [...DUMMY_FUEL_ENTRIES]
    }
    const parsed = JSON.parse(raw) as unknown[]
    if (!Array.isArray(parsed)) return DUMMY_FUEL_ENTRIES
    const fallback = loadBikes()[0]?.id ?? SEED_BIKE_ID
    const migrated = parsed.map((r) => migrateFuelEntry(r, fallback)).filter(Boolean) as FuelEntry[]
    if (migrated.some((e, i) => JSON.stringify(e) !== JSON.stringify(parsed[i]))) {
      localStorage.setItem(FUEL_KEY, JSON.stringify(migrated))
    }
    return migrated.length ? migrated : DUMMY_FUEL_ENTRIES
  } catch {
    return DUMMY_FUEL_ENTRIES
  }
}

export function saveFuelEntries(entries: FuelEntry[]) {
  localStorage.setItem(FUEL_KEY, JSON.stringify(entries))
}

export function loadDocuments(): VaultDocument[] {
  try {
    const raw = localStorage.getItem(DOCS_KEY)
    if (!raw) {
      localStorage.setItem(DOCS_KEY, JSON.stringify(DUMMY_DOCUMENTS))
      return [...DUMMY_DOCUMENTS]
    }
    const parsed = JSON.parse(raw) as unknown[]
    if (!Array.isArray(parsed)) return DUMMY_DOCUMENTS
    const fallback = loadBikes()[0]?.id ?? SEED_BIKE_ID
    const migrated = parsed.map((r) => migrateVaultDocument(r, fallback)).filter(Boolean) as VaultDocument[]
    if (migrated.some((e, i) => JSON.stringify(e) !== JSON.stringify(parsed[i]))) {
      localStorage.setItem(DOCS_KEY, JSON.stringify(migrated))
    }
    return migrated.length ? migrated : DUMMY_DOCUMENTS
  } catch {
    return DUMMY_DOCUMENTS
  }
}

export function saveDocuments(docs: VaultDocument[]) {
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs))
}

export function loadTheme(): ThemeMode {
  const v = localStorage.getItem(THEME_KEY)
  if (v === 'light') return 'light'
  if (v === 'dark') return 'dark'
  return 'dark'
}

export function saveTheme(mode: ThemeMode) {
  localStorage.setItem(THEME_KEY, mode)
}

export function loadReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(REMINDERS_KEY)
    if (!raw) {
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(DEFAULT_REMINDERS))
      return [...DEFAULT_REMINDERS]
    }
    const parsed = JSON.parse(raw) as unknown[]
    if (!Array.isArray(parsed)) return DEFAULT_REMINDERS
    const fallback = loadBikes()[0]?.id ?? SEED_BIKE_ID
    const migrated = parsed.map((r) => migrateReminder(r, fallback)).filter(Boolean) as Reminder[]
    if (migrated.some((e, i) => JSON.stringify(e) !== JSON.stringify(parsed[i]))) {
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(migrated))
    }
    return migrated.length ? migrated : DEFAULT_REMINDERS
  } catch {
    return DEFAULT_REMINDERS
  }
}

export function saveReminders(r: Reminder[]) {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(r))
}

export function loadServiceHistory(): ServiceRecord[] {
  try {
    const raw = localStorage.getItem(SERVICE_KEY)
    if (!raw) {
      localStorage.setItem(SERVICE_KEY, JSON.stringify(DEFAULT_SERVICE))
      return [...DEFAULT_SERVICE]
    }
    const parsed = JSON.parse(raw) as unknown[]
    if (!Array.isArray(parsed)) return DEFAULT_SERVICE
    const fallback = loadBikes()[0]?.id ?? SEED_BIKE_ID
    const migrated = parsed.map((r) => migrateServiceRecord(r, fallback)).filter(Boolean) as ServiceRecord[]
    if (migrated.some((e, i) => JSON.stringify(e) !== JSON.stringify(parsed[i]))) {
      localStorage.setItem(SERVICE_KEY, JSON.stringify(migrated))
    }
    return migrated.length ? migrated : DEFAULT_SERVICE
  } catch {
    return DEFAULT_SERVICE
  }
}

export function saveServiceHistory(s: ServiceRecord[]) {
  localStorage.setItem(SERVICE_KEY, JSON.stringify(s))
}

export function loadNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(NOTIF_KEY)
    if (!raw) {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(DEFAULT_NOTIFICATION_PREFS))
      return DEFAULT_NOTIFICATION_PREFS
    }
    const p = JSON.parse(raw) as Partial<NotificationPrefs>
    return {
      service: typeof p.service === 'boolean' ? p.service : DEFAULT_NOTIFICATION_PREFS.service,
      insurance: typeof p.insurance === 'boolean' ? p.insurance : DEFAULT_NOTIFICATION_PREFS.insurance,
      documents: typeof p.documents === 'boolean' ? p.documents : DEFAULT_NOTIFICATION_PREFS.documents,
      weeklyFuel: typeof p.weeklyFuel === 'boolean' ? p.weeklyFuel : DEFAULT_NOTIFICATION_PREFS.weeklyFuel,
      dailyTips: typeof p.dailyTips === 'boolean' ? p.dailyTips : DEFAULT_NOTIFICATION_PREFS.dailyTips,
    }
  } catch {
    return DEFAULT_NOTIFICATION_PREFS
  }
}

export function saveNotificationPrefs(p: NotificationPrefs) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(p))
}
