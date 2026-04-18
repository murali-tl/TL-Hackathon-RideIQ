import { Link } from 'react-router-dom'
import { useRide } from '../hooks/useRide'

type BikeSwitcherProps = {
  /** `vertical` fills sidebar; `horizontal` for mobile toolbar. */
  orientation?: 'horizontal' | 'vertical'
}

/**
 * Quick bike switcher — horizontal chips on mobile, stacked list in desktop sidebar.
 */
export function BikeSwitcher({ orientation = 'horizontal' }: BikeSwitcherProps) {
  const { bikes, selectedBikeId, setSelectedBikeId } = useRide()
  const isVertical = orientation === 'vertical'

  if (!bikes.length) {
    return (
      <div
        className={`rounded-[var(--rs-radius)] border border-dashed border-[var(--rs-border)] bg-[var(--rs-surface)] px-3 py-2 text-center text-xs text-[var(--rs-muted)] ${
          isVertical ? '' : 'mb-1'
        }`}
      >
        <Link to="/bikes" className="font-medium text-[var(--rs-accent)]">
          Add your first bike
        </Link>
      </div>
    )
  }

  return (
    <div className={isVertical ? '' : 'mb-1'}>
      <div className={`mb-1.5 flex items-center justify-between gap-2 ${isVertical ? 'px-0' : 'px-0.5'}`}>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--rs-muted)]">Active bike</span>
        <Link to="/bikes" className="text-[10px] font-medium text-[var(--rs-accent)]">
          Garage
        </Link>
      </div>
      <div
        className={
          isVertical
            ? 'flex flex-col gap-2'
            : 'flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        }
      >
        {bikes.map((b) => {
          const active = b.id === selectedBikeId
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBikeId(b.id)}
              className={
                isVertical
                  ? `flex w-full items-center gap-2 rounded-[var(--rs-radius-sm)] border px-3 py-2.5 text-left text-xs font-medium transition ${
                      active
                        ? 'border-[var(--rs-accent)] bg-[var(--rs-accent)] text-white'
                        : 'border-[var(--rs-border)] bg-[var(--rs-surface2)] text-[var(--rs-muted)] hover:border-[var(--rs-accent)] hover:text-[var(--rs-text)]'
                    }`
                  : `flex max-w-[min(200px,55vw)] shrink-0 items-center gap-2 rounded-full border px-2 py-1.5 text-left text-[11px] font-medium transition ${
                      active
                        ? 'border-[var(--rs-accent)] bg-[var(--rs-accent)] text-white'
                        : 'border-[var(--rs-border)] bg-[var(--rs-surface2)] text-[var(--rs-muted)] hover:border-[var(--rs-accent)] hover:text-[var(--rs-text)]'
                    }`
              }
            >
              {b.image ? (
                <img
                  src={b.image}
                  alt=""
                  className={`shrink-0 rounded-md object-cover ${isVertical ? 'h-9 w-9' : 'h-7 w-7'}`}
                />
              ) : (
                <span className={`flex shrink-0 items-center justify-center rounded-md bg-black/10 ${isVertical ? 'h-9 w-9 text-base' : 'h-7 w-7 text-sm'}`} aria-hidden>
                  🏍
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate">
                  {b.brand} {b.model}
                </span>
                {!active ? (
                  <span className={`mt-0.5 block truncate text-[10px] opacity-80`}>{b.registrationNumber}</span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
