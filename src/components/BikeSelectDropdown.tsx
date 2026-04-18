import { Field, Select } from './Form'
import { useRide } from '../hooks/useRide'

type Props = {
  id?: string
  className?: string
  /** Visually group with label; default "Bike". */
  label?: string
}

/**
 * Selects the active bike for the app (same as the sidebar bike switcher).
 * Use on pages where users should explicitly pick which bike data applies.
 */
export function BikeSelectDropdown({ id = 'page-active-bike', className = '', label = 'Bike' }: Props) {
  const { bikes, selectedBikeId, setSelectedBikeId } = useRide()

  if (bikes.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <Field label={label} htmlFor={id}>
        <Select
          id={id}
          value={selectedBikeId ?? bikes[0]?.id ?? ''}
          onChange={(e) => setSelectedBikeId(e.target.value)}
          aria-label="Select active bike"
        >
          {bikes.map((b) => (
            <option key={b.id} value={b.id}>
              {b.brand} {b.model} · {b.registrationNumber}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  )
}
