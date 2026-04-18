import { NavLink, Outlet } from 'react-router-dom'
import { BikeSwitcher } from './BikeSwitcher'
import { useRide } from '../hooks/useRide'
import { Button } from './ui/Button'

const tabs = [
  { to: '/dashboard', label: 'Home' },
  { to: '/fuel-log', label: 'Fuel' },
  { to: '/service', label: 'Service' },
  { to: '/split', label: 'Split' },
  { to: '/tips', label: 'Smart Tips' },
  { to: '/reminders', label: 'Reminders' },
  { to: '/bunks', label: 'Bunks' },
  { to: '/documents', label: 'My Docs' },
  { to: '/bikes', label: 'Garage' },
] as const

/**
 * RideSmart-style shell: sticky top bar, horizontal pill tabs, single-column content.
 * Max width ~460px on mobile reference; scales up centered on larger screens.
 */
export function Layout() {
  const { toggleTheme } = useRide()
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[520px] flex-col lg:max-w-[640px]">
      <header className="sticky top-0 z-[100] border-b border-[var(--rs-border)] bg-[var(--rs-bg)] px-5 pb-3 pt-[18px]">
        <div className="flex items-center justify-between gap-3">
          <div className="font-[family-name:var(--rs-font-head)] text-[22px] font-extrabold tracking-tight text-[var(--rs-text)]">
            Ride<span className="text-[var(--rs-accent)]">IQ</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="muted"
              className="!px-3 !py-2 text-xs"
              onClick={toggleTheme}
              aria-label="Toggle light or dark theme"
            >
              Theme
            </Button>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--rs-accent)] text-lg"
              aria-hidden
            >
              🏍
            </div>
          </div>
        </div>
      </header>

      <nav
        className="sticky top-[63px] z-[99] flex gap-1.5 overflow-x-auto border-b border-[var(--rs-border)] bg-[var(--rs-bg)] px-4 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Primary"
      >
        {tabs.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                isActive
                  ? 'border-[var(--rs-accent)] bg-[var(--rs-accent)] text-white'
                  : 'border-[var(--rs-border)] bg-transparent text-[var(--rs-muted)] hover:text-[var(--rs-text)]'
              }`
            }
            end={to === '/dashboard'}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-b border-[var(--rs-border)] bg-[var(--rs-bg)] px-4 pb-2 pt-1">
        <BikeSwitcher />
      </div>

      <div className="flex-1 px-4 py-4">
        <Outlet />
      </div>
    </div>
  )
}
