import type { BunkComment, BunkPlace } from '../types'

const CUSTOM_KEY = 'rideiq-bunk-custom'
const RATINGS_KEY = 'rideiq-bunk-user-ratings'
const COMMENTS_KEY = 'rideiq-bunk-comments'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadCustomBunks(): BunkPlace[] {
  const list = readJson<unknown[]>(CUSTOM_KEY, [])
  if (!Array.isArray(list)) return []
  return list.filter((x): x is BunkPlace => {
    if (!x || typeof x !== 'object') return false
    const o = x as Record<string, unknown>
    return typeof o.id === 'string' && typeof o.name === 'string' && typeof o.location === 'string'
  })
}

export function saveCustomBunks(bunks: BunkPlace[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(bunks))
}

/** User-submitted star rating (1–5) per bunk id. */
export function loadBunkRatings(): Record<string, number> {
  const m = readJson<Record<string, number>>(RATINGS_KEY, {})
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(m)) {
    if (typeof v === 'number' && v >= 1 && v <= 5) out[k] = Math.round(v)
  }
  return out
}

export function setBunkRating(bunkId: string, stars: number) {
  const next = loadBunkRatings()
  next[bunkId] = Math.min(5, Math.max(1, Math.round(stars)))
  localStorage.setItem(RATINGS_KEY, JSON.stringify(next))
}

export function removeBunkRating(bunkId: string) {
  const next = loadBunkRatings()
  delete next[bunkId]
  localStorage.setItem(RATINGS_KEY, JSON.stringify(next))
}

export function loadBunkComments(): BunkComment[] {
  const list = readJson<unknown[]>(COMMENTS_KEY, [])
  if (!Array.isArray(list)) return []
  return list.filter((x): x is BunkComment => {
    if (!x || typeof x !== 'object') return false
    const o = x as Record<string, unknown>
    return (
      typeof o.id === 'string' &&
      typeof o.bunkId === 'string' &&
      typeof o.text === 'string' &&
      typeof o.createdAt === 'string'
    )
  })
}

export function appendBunkComment(comment: BunkComment) {
  const next = [...loadBunkComments(), comment]
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(next))
}

export function removeCommentsForBunk(bunkId: string) {
  const next = loadBunkComments().filter((c) => c.bunkId !== bunkId)
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(next))
}
