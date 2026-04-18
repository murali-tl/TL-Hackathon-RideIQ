import { apiFetch } from './http'
import type { Bike } from '../types'

type ApiBike = Omit<Bike, 'id' | 'createdAt'> & {
  id: string
  createdAt?: string
  updatedAt?: string
}

type ApiEnvelope<T> = { success: boolean; data: T }

export async function fetchBikes(): Promise<Bike[]> {
  const res = await apiFetch<ApiEnvelope<ApiBike[]>>('/api/bikes')
  return (res.data ?? []).map(mapBike)
}

export async function fetchBike(id: string): Promise<Bike> {
  const res = await apiFetch<ApiEnvelope<ApiBike>>(`/api/bikes/${id}`)
  return mapBike(res.data)
}

export async function createBikeApi(input: Omit<Bike, 'id' | 'createdAt'>): Promise<Bike> {
  const res = await apiFetch<ApiEnvelope<ApiBike>>('/api/bikes', {
    method: 'POST',
    body: JSON.stringify({
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
    }),
  })
  return mapBike(res.data)
}

export async function updateBikeApi(id: string, patch: Partial<Omit<Bike, 'id' | 'createdAt'>>): Promise<Bike> {
  const res = await apiFetch<ApiEnvelope<ApiBike>>(`/api/bikes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  })
  return mapBike(res.data)
}

export async function deleteBikeApi(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ id: string }>>(`/api/bikes/${id}`, { method: 'DELETE' })
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
