import type { BikeType } from './fuelCalculator'

/** Map garage engine CC string to fuel-calculator segment (defaults). */
export function engineCcToFuelCalculatorType(ccStr: string): BikeType {
  const n = parseInt(String(ccStr).replace(/\D/g, ''), 10)
  if (!Number.isFinite(n) || n <= 0) return '125cc'
  if (n <= 110) return '100cc'
  if (n <= 135) return '125cc'
  if (n <= 180) return '150cc'
  if (n <= 250) return '200cc'
  return 'premium'
}

/** Short label for UI badges (e.g. speed tips). */
export function formatEngineCcLabel(cc: string): string {
  const t = cc.trim()
  if (!t) return 'Your bike'
  const digits = t.replace(/\D/g, '')
  if (!digits) return t
  return `${digits}cc bike`
}

/** Normalized “124 cc” for hero / switcher (avoids “cc cc”). */
export function formatEngineCcDisplay(cc: string): string {
  const t = cc.trim()
  if (!t) return '—'
  const base = t.replace(/\s*cc\s*$/i, '').trim()
  return /\d/.test(base) ? `${base} cc` : t
}
