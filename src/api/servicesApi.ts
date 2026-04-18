import { api } from './http'
import type { ServiceRecord } from '../types'

type ApiService = {
  id: string
  bikeId: string
  serviceDate: string
  title: string
  notes?: string
  cost: number
  odoKm?: number | null
  serviceCenter?: string
}

type ApiEnvelope<T> = { success: boolean; data: T }

export async function fetchServicesForBike(bikeId: string): Promise<ServiceRecord[]> {
  const { data: envelope } = await api.get<ApiEnvelope<ApiService[]>>(`/api/services/${bikeId}`)
  return (envelope.data ?? []).map(mapService)
}

export async function createServiceApi(input: Omit<ServiceRecord, 'id'>): Promise<ServiceRecord> {
  const { data: envelope } = await api.post<ApiEnvelope<ApiService>>('/api/services', {
    bikeId: input.bikeId,
    serviceDate: `${input.date}T12:00:00.000Z`,
    title: input.title,
    notes: input.notes ?? '',
    cost: input.cost,
    odoKm: input.odoKm ?? null,
    serviceCenter: '',
  })
  return mapService(envelope.data)
}

export async function updateServiceApi(
  id: string,
  patch: Partial<Omit<ServiceRecord, 'id'>>,
): Promise<ServiceRecord> {
  const body: Record<string, unknown> = {}
  if (patch.date != null) body.serviceDate = `${patch.date}T12:00:00.000Z`
  if (patch.title !== undefined) body.title = patch.title
  if (patch.notes !== undefined) body.notes = patch.notes
  if (patch.cost !== undefined) body.cost = patch.cost
  if (patch.odoKm !== undefined) body.odoKm = patch.odoKm
  const { data: envelope } = await api.put<ApiEnvelope<ApiService>>(`/api/services/${id}`, body)
  return mapService(envelope.data)
}

export async function deleteServiceApi(id: string): Promise<void> {
  await api.delete(`/api/services/${id}`)
}

function mapService(s: ApiService): ServiceRecord {
  const d = new Date(s.serviceDate)
  const date = Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : s.serviceDate.slice(0, 10)
  return {
    id: s.id,
    bikeId: String(s.bikeId),
    date,
    title: s.title,
    notes: s.notes ?? '',
    cost: s.cost,
    odoKm: s.odoKm != null && Number.isFinite(Number(s.odoKm)) ? Number(s.odoKm) : null,
  }
}
