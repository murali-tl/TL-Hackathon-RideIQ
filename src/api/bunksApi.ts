import { api } from './http'
import type { BunkComment, BunkPlace } from '../types'

type ApiEnvelope<T> = { success: boolean; data: T }

type ApiBunk = {
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

type ApiBunkComment = {
  id: string
  bunkId: string
  text: string
  createdAt: string
}

export async function fetchBunks(): Promise<BunkPlace[]> {
  const { data: envelope } = await api.get<ApiEnvelope<ApiBunk[]>>('/api/bunks')
  return (envelope.data ?? []).map(mapBunk)
}

export async function createBunkApi(input: {
  name: string
  location: string
  stars: number
  initialComment?: string
}): Promise<BunkPlace> {
  const { data: envelope } = await api.post<ApiEnvelope<ApiBunk>>('/api/bunks', input)
  return mapBunk(envelope.data)
}

export async function fetchAllBunkComments(): Promise<BunkComment[]> {
  const { data: envelope } = await api.get<ApiEnvelope<ApiBunkComment[]>>('/api/bunks/comments')
  return (envelope.data ?? []).map(mapComment)
}

export async function addBunkCommentApi(bunkId: string, text: string): Promise<BunkComment> {
  const { data: envelope } = await api.post<ApiEnvelope<ApiBunkComment>>(`/api/bunks/${bunkId}/comments`, {
    text,
  })
  return mapComment(envelope.data)
}

export async function rateBunkApi(bunkId: string, stars: number): Promise<BunkPlace> {
  const { data: envelope } = await api.post<ApiEnvelope<ApiBunk>>(`/api/bunks/${bunkId}/rate`, { stars })
  return mapBunk(envelope.data)
}

export async function deleteBunkApi(bunkId: string): Promise<void> {
  await api.delete(`/api/bunks/${bunkId}`)
}

function mapBunk(b: ApiBunk): BunkPlace {
  const ar = b.accentRank
  const accentRank =
    ar === 'accent' || ar === 'muted' || ar === 'outline' ? ar : 'outline'
  return {
    id: b.id,
    rank: b.rank,
    name: b.name,
    location: b.location,
    stars: b.stars,
    trust: b.trust,
    boost: b.boost,
    reviews: b.reviews,
    accentRank,
  }
}

function mapComment(c: ApiBunkComment): BunkComment {
  return {
    id: c.id,
    bunkId: c.bunkId,
    text: c.text,
    createdAt: c.createdAt,
  }
}
