import type { Bike, BikeFuelType } from '../types'

/**
 * Partial bike fields returned by smart lookup (curated DB, Wikidata, or custom API).
 * User completes registration + year manually when missing.
 */
export type BikeLookupDraft = {
  brand: string
  model: string
  engineCc: string
  category: string
  claimedMileageKmL: number
  fuelType: BikeFuelType
  fuelSystem: Bike['fuelSystem']
}

export type BikeLookupResult =
  | { ok: true; source: 'curated' | 'wikidata' | 'api'; draft: BikeLookupDraft }
  | { ok: false; source: 'none'; message: string }

type CuratedRow = { keys: string[]; draft: BikeLookupDraft }

/** Offline “AI-style” knowledge base — common Indian two-wheelers. */
const CURATED: CuratedRow[] = [
  {
    keys: ['honda shine', 'shine 125', 'shine'],
    draft: {
      brand: 'Honda',
      model: 'Shine 125',
      engineCc: '124',
      category: 'Commuter',
      claimedMileageKmL: 55,
      fuelType: 'Petrol',
      fuelSystem: 'Fuel Injected',
    },
  },
  {
    keys: ['activa', 'honda activa'],
    draft: {
      brand: 'Honda',
      model: 'Activa 6G',
      engineCc: '110',
      category: 'Scooter',
      claimedMileageKmL: 48,
      fuelType: 'Petrol',
      fuelSystem: 'Fuel Injected',
    },
  },
  {
    keys: ['pulsar', 'ns200', 'pulsar 200'],
    draft: {
      brand: 'Bajaj',
      model: 'Pulsar NS200',
      engineCc: '199',
      category: 'Street',
      claimedMileageKmL: 35,
      fuelType: 'Petrol',
      fuelSystem: 'Fuel Injected',
    },
  },
  {
    keys: ['royal enfield', 'classic 350', 'meteor'],
    draft: {
      brand: 'Royal Enfield',
      model: 'Classic 350',
      engineCc: '349',
      category: 'Cruiser',
      claimedMileageKmL: 32,
      fuelType: 'Petrol',
      fuelSystem: 'Fuel Injected',
    },
  },
  {
    keys: ['ather', '450x', 'electric scooter'],
    draft: {
      brand: 'Ather',
      model: '450X',
      engineCc: '—',
      category: 'Electric scooter',
      claimedMileageKmL: 90,
      fuelType: 'Electric',
      fuelSystem: 'Fuel Injected',
    },
  },
  {
    keys: ['ntorq', 'tvs ntorq'],
    draft: {
      brand: 'TVS',
      model: 'Ntorq 125',
      engineCc: '125',
      category: 'Scooter',
      claimedMileageKmL: 42,
      fuelType: 'Petrol',
      fuelSystem: 'Fuel Injected',
    },
  },
]

function matchCurated(q: string): BikeLookupDraft | null {
  const n = q.trim().toLowerCase()
  if (!n) return null
  for (const row of CURATED) {
    if (row.keys.some((k) => n.includes(k))) return { ...row.draft }
  }
  return null
}

/** Pull rough specs from Wikidata search labels/descriptions (no API key). */
async function matchWikidata(q: string): Promise<BikeLookupDraft | null> {
  const query = q.trim()
  if (!query) return null
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
    query,
  )}&language=en&format=json&origin=*&limit=3`
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 8000)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return null
    const data = (await res.json()) as {
      search?: { label?: string; description?: string }[]
    }
    const hit = data.search?.[0]
    if (!hit?.label) return null
    const label = hit.label
    const desc = hit.description ?? ''
    const ccMatch = desc.match(/(\d{2,4})\s*cc\b/i) || label.match(/(\d{2,4})\s*cc\b/i)
    const engineCc = ccMatch ? ccMatch[1] : '125'
    const words = label.split(/\s+/)
    const brand = words[0] ?? 'Unknown'
    const model = words.slice(1).join(' ') || label
    const isScooter = /\bscooter\b/i.test(desc + label)
    return {
      brand,
      model,
      engineCc,
      category: isScooter ? 'Scooter' : 'Motorcycle',
      claimedMileageKmL: isScooter ? 42 : 40,
      fuelType: /\belectric\b/i.test(desc + label) ? 'Electric' : 'Petrol',
      fuelSystem: 'Fuel Injected',
    }
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

async function matchCustomApi(q: string): Promise<BikeLookupDraft | null> {
  const base = import.meta.env.VITE_BIKE_LOOKUP_URL as string | undefined
  if (!base?.trim()) return null
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 10000)
  try {
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q }),
      signal: ctrl.signal,
    })
    if (!res.ok) return null
    const j = (await res.json()) as Partial<BikeLookupDraft> & { error?: string }
    if (j.error || !j.brand || !j.model) return null
    return {
      brand: String(j.brand),
      model: String(j.model),
      engineCc: String(j.engineCc ?? '125'),
      category: String(j.category ?? 'Motorcycle'),
      claimedMileageKmL: Number(j.claimedMileageKmL) || 40,
      fuelType: (j.fuelType as BikeFuelType) ?? 'Petrol',
      fuelSystem: j.fuelSystem === 'Carburetor' ? 'Carburetor' : 'Fuel Injected',
    }
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

/**
 * Smart bike entry: try custom API → curated synonyms → Wikidata.
 * Always allows manual fallback in the UI when `ok` is false.
 */
export async function lookupBikeModel(query: string): Promise<BikeLookupResult> {
  const trimmed = query.trim()
  if (!trimmed) {
    return { ok: false, source: 'none', message: 'Enter a model name to look up.' }
  }

  const apiHit = await matchCustomApi(trimmed)
  if (apiHit) return { ok: true, source: 'api', draft: apiHit }

  const local = matchCurated(trimmed)
  if (local) return { ok: true, source: 'curated', draft: local }

  try {
    const wiki = await matchWikidata(trimmed)
    if (wiki) return { ok: true, source: 'wikidata', draft: wiki }
  } catch {
    /* network blocked / CORS in rare environments */
  }

  return {
    ok: false,
    source: 'none',
    message: 'No match found. Fill brand, engine, and category manually — you can still save the bike.',
  }
}
