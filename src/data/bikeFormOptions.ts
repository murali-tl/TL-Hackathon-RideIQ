/** Preset values for Garage add/edit bike form — keeps entry fast on mobile. */

export const BIKE_BRAND_OPTIONS = [
  'Honda',
  'Hero',
  'Bajaj',
  'TVS',
  'Yamaha',
  'Suzuki',
  'Royal Enfield',
  'KTM',
  'Aprilia',
  'Vespa',
  'Ather',
  'Ola',
  'Ultraviolette',
  'BMW',
  'Ducati',
  'Harley-Davidson',
  'Jawa',
  'Yezdi',
  'Kawasaki',
  'Benelli',
  'Keeway',
  'Triumph',
  'Indian',
  'CFMoto',
  'Other',
] as const

export const BIKE_CATEGORY_OPTIONS = [
  'Commuter',
  'Scooter',
  'Street',
  'Sports',
  'Cruiser',
  'Adventure',
  'Touring',
  'Naked',
  'Electric scooter',
  'Motorcycle',
  'Off-road',
  'Moped',
  'Other',
] as const

export function buildYearOptions(): string[] {
  const current = new Date().getFullYear()
  const start = current + 1
  const end = 1985
  const out: string[] = []
  for (let y = start; y >= end; y--) out.push(String(y))
  return out
}

/** Sensible km/L presets (no “Custom” here — that is a separate `<option>` in the form). */
export const TYPICAL_KMPL_PRESET_NUMS = ['35', '40', '45', '50', '55', '60', '65', '70', '75', '80', '90', '100'] as const
