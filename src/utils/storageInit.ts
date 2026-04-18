import type { Bike } from '../types'

/** Garage list is loaded from the API in RideProvider; selection id is restored after fetch. */
export function getInitialGarageState(): { bikes: Bike[]; selectedBikeId: string | null } {
  return { bikes: [], selectedBikeId: null }
}
