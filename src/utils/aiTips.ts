import type { MileageStats } from './mileage'

/** Rule-based “AI” tips from aggregate mileage (km/L). */
export function getSmartTips(stats: MileageStats): string[] {
  const { average } = stats
  if (average == null) {
    return [
      'Log a few fill-ups with distance to unlock personalized efficiency tips.',
      'After 2–3 entries, RideIQ compares your km/L and highlights trends.',
    ]
  }
  if (average < 35) {
    return [
      'Your average km/L looks on the lower side. Try smoother throttle and early upshifts.',
      'Check tire pressure weekly — under-inflation is a common mileage killer.',
      'Avoid long idling; short warm-ups save fuel without hurting the engine.',
    ]
  }
  if (average >= 50) {
    return [
      'Strong average mileage — you are riding efficiently. Keep that steady throttle habit.',
      'Your numbers suggest good route choices and maintenance discipline. Nice work.',
    ]
  }
  return [
    'Solid mid-range efficiency. Small gains: reduce hard braking and carry less dead weight.',
    'Track seasonal changes — cold starts and winter blends can shift km/L slightly.',
  ]
}
