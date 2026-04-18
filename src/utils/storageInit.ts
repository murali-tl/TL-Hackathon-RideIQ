import type { Bike } from '../types'
import { loadBikes, loadSelectedBikeId } from './storage'

/** Single garage bootstrap so React state initializers stay in sync. */
export function getInitialGarageState(): { bikes: Bike[]; selectedBikeId: string } {
  const bikes = loadBikes()
  return { bikes, selectedBikeId: loadSelectedBikeId(bikes) }
}
