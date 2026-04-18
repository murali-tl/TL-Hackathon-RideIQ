import { api } from './http'
import type { Bike } from '../types'

type ApiBike = Omit<Bike, 'id' | 'createdAt'> & {
  id: string
  createdAt?: string
  updatedAt?: string
}

type ApiEnvelope<T> = { success: boolean; data: T }

export async function fetchBikes(): Promise<Bike[]> {
  const { data: envelope } = await api.get<ApiEnvelope<ApiBike[]>>('/api/bikes')
  return (envelope.data ?? []).map(mapBike)
}

export async function fetchBike(id: string): Promise<Bike> {
  const { data: envelope } = await api.get<ApiEnvelope<ApiBike>>(`/api/bikes/${id}`)
  return mapBike(envelope.data)
}

export async function createBikeApi(input: Omit<Bike, 'id' | 'createdAt'>): Promise<Bike> {
  const { data: envelope } = await api.post<ApiEnvelope<ApiBike>>('/api/bikes', {
    brand: input.brand,
    model: input.model,
    year: input.year,
    registrationNumber: input.registrationNumber,
    fuelType: input.fuelType,
    engineCc: input.engineCc,
    category: input.category,
    claimedMileageKmL: input.claimedMileageKmL ?? null,
    fuelSystem: input.fuelSystem,
    image: input.image || '',
  })
  return mapBike(envelope.data)
}

export async function updateBikeApi(id: string, patch: Partial<Omit<Bike, 'id' | 'createdAt'>>): Promise<Bike> {
  const { data: envelope } = await api.put<ApiEnvelope<ApiBike>>(`/api/bikes/${id}`, patch)
  return mapBike(envelope.data)
}

export async function deleteBikeApi(id: string): Promise<void> {
  await api.delete(`/api/bikes/${id}`)
}

function mapBike(b: ApiBike): Bike {
  const createdAt =
    typeof b.createdAt === 'string' ? b.createdAt : new Date().toISOString()
  return {
    id: b.id,
    brand: b.brand,
    model: b.model,
    year: b.year,
    registrationNumber: b.registrationNumber,
    fuelType: b.fuelType as Bike['fuelType'],
    engineCc: b.engineCc ?? '',
    category: b.category ?? '',
    claimedMileageKmL: b.claimedMileageKmL ?? undefined,
    fuelSystem: (b.fuelSystem as Bike['fuelSystem']) ?? 'Fuel Injected',
    createdAt,
    image: b.image && String(b.image).length ? b.image : undefined,
  }
}
