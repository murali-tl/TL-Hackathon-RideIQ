import type { FuelEntry } from '../types'

export function computeMileage(distanceKm: number, fuelLiters: number): number {
  if (fuelLiters <= 0 || distanceKm < 0) return 0
  return Math.round((distanceKm / fuelLiters) * 100) / 100
}

export type MileageStats = {
  average: number | null
  best: number | null
  worst: number | null
  totalFuelCost: number
  totalLiters: number
}

export function computeMileageStats(entries: FuelEntry[]): MileageStats {
  const totalFuelCost = entries.reduce((s, e) => s + e.cost, 0)
  const totalLiters = entries.reduce((s, e) => s + e.fuelLiters, 0)
  const valid = entries.filter((e) => e.fuelLiters > 0 && e.distanceKm > 0)
  if (valid.length === 0) {
    return {
      average: null,
      best: null,
      worst: null,
      totalFuelCost,
      totalLiters,
    }
  }
  const mileages = valid.map((e) => e.mileage)
  const sum = mileages.reduce((a, b) => a + b, 0)
  return {
    average: Math.round((sum / mileages.length) * 100) / 100,
    best: Math.max(...mileages),
    worst: Math.min(...mileages),
    totalFuelCost,
    totalLiters,
  }
}
