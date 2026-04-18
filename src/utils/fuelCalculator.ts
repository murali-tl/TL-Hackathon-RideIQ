/** Ported from RideSmart_App.html — estimates by bike segment + riding style. */

export const bikeDefaults = {
  '100cc': { tank: 9, expected: 65 },
  '125cc': { tank: 10.5, expected: 55 },
  '150cc': { tank: 12, expected: 45 },
  '200cc': { tank: 13, expected: 35 },
  scooter: { tank: 5.3, expected: 45 },
  premium: { tank: 14, expected: 25 },
} as const

export type BikeType = keyof typeof bikeDefaults
export type RidingStyle = 'eco' | 'normal' | 'sport'

export type FuelCalcInput = {
  bikeType: BikeType
  fuelFilled: number
  fuelPricePerLiter: number
  ridingStyle: RidingStyle
}

export type FuelCalcResult = {
  totalCost: number
  estimatedMileage: number
  tankFillPercent: number
  estimatedRangeKm: number
  compareLine: string
}

const styleMultiplier: Record<RidingStyle, number> = {
  eco: 1.08,
  normal: 1,
  sport: 0.82,
}

export function calculateFuelEstimate(input: FuelCalcInput): FuelCalcResult {
  const d = bikeDefaults[input.bikeType]
  const filled = Number.isFinite(input.fuelFilled) ? input.fuelFilled : 0
  const price = Number.isFinite(input.fuelPricePerLiter) ? input.fuelPricePerLiter : 0
  const mult = styleMultiplier[input.ridingStyle]
  const mileage = Math.round(d.expected * mult)
  const cost = Math.round(filled * price)
  const range = Math.round(filled * mileage)
  const pct = Math.min(Math.round((filled / d.tank) * 100), 100)
  return {
    totalCost: cost,
    estimatedMileage: mileage,
    tankFillPercent: pct,
    estimatedRangeKm: range,
    compareLine: `City avg for this bike: ${d.expected} km/L · Your style gives: ${mileage} km/L`,
  }
}
