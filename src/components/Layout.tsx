import { NavLink, Outlet } from 'react-router-dom'
import { APP_NAV_TABS } from '../layout/navTabs'
import { BikeSwitcher } from './BikeSwitcher'
import { useRide } from '../hooks/useRide'
import { Button } from './ui/Button'

function navLinkClass(isActive: boolean, variant: 'pill' | 'sidebar') {
  if (variant === 'pill') {
    return `shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition ${
      isActive
        ? 'border-[var(--rs-accent)] bg-[var(--rs-accent)] text-white'
        : 'border-[var(--rs-border)] bg-transparent text-[var(--rs-muted)] hover:text-[var(--rs-text)]'
    }`
  }
  return `block rounded-[var(--rs-radius-sm)] border px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'border-[var(--rs-accent)] bg-[rgba(255,92,26,0.12)] text-[var(--rs-accent)]'
      : 'border-transparent text-[var(--rs-muted)] hover:border-[var(--rs-border)] hover:bg-[var(--rs-surface2)] hover:text-[var(--rs-text)]'
  }`
}

/**
 * Full-viewport shell: desktop sidebar + fluid main; mobile keeps top bar + pill nav.
 * No max-width cap — content uses horizontal padding that scales with viewport.
 */
export function Layout() {
  const { toggleTheme, apiReady, syncError, clearSyncError } = useRide()

  return (
    <div className="flex min-h-svh w-full min-w-0">
      {/* Desktop sidebar */}
      <aside
        className="sticky top-0 z-[100] hidden h-svh min-h-0 w-[min(17rem,22vw)] shrink-0 flex-col border-r border-[var(--rs-border)] bg-[var(--rs-surface)] lg:flex"
        aria-label="Main navigation"
      >
        <div className="shrink-0 border-b border-[var(--rs-border)] px-4 py-5">
          <div className="font-[family-name:var(--rs-font-head)] text-xl font-extrabold tracking-tight text-[var(--rs-text)]">
            Ride<span className="text-[var(--rs-accent)]">IQ</span>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-[var(--rs-muted)]">Bike workspace</p>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2 py-3" aria-label="Sections">
          {APP_NAV_TABS.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/dashboard'} className={({ isActive }) => navLinkClass(isActive, 'sidebar')}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 space-y-3 border-t border-[var(--rs-border)] bg-[var(--rs-bg)]/50 p-3">
          <BikeSwitcher orientation="vertical" />
          <Button
            type="button"
            variant="muted"
            className="w-full !py-2.5 !text-xs"
            onClick={toggleTheme}
            aria-label="Toggle light or dark theme"
          >
            Theme
          </Button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        {/* Mobile: single sticky chrome (no chained top offsets). */}
        <div className="sticky top-0 z-[100] shrink-0 border-b border-[var(--rs-border)] bg-[var(--rs-bg)] lg:hidden">
          <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="font-[family-name:var(--rs-font-head)] text-[clamp(1.1rem,4vw,1.375rem)] font-extrabold tracking-tight text-[var(--rs-text)]">
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
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--rs-accent)] text-lg"
                aria-hidden
              >
                🏍
              </div>
            </div>
          </header>

          <nav
            className="flex gap-1.5 overflow-x-auto border-t border-[var(--rs-border)] px-3 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden"
            aria-label="Primary"
          >
            {APP_NAV_TABS.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/dashboard'} className={({ isActive }) => navLinkClass(isActive, 'pill')}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-[var(--rs-border)] px-3 py-2 sm:px-4">
            <BikeSwitcher orientation="horizontal" />
          </div>
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
          <div className="mx-auto w-full max-w-[min(100%,96rem)] px-[clamp(1rem,3vw,2.5rem)] py-5 sm:py-6 lg:py-8">
            {!apiReady ? (
              <p className="mb-4 rounded-[var(--rs-radius)] border border-[var(--rs-border)] bg-[var(--rs-surface2)] px-3 py-2 text-xs text-[var(--rs-muted)]">
                Loading garage from server…
              </p>
            ) : null}
            {syncError ? (
              <div
                role="alert"
                className="mb-4 flex flex-wrap items-start gap-2 rounded-[var(--rs-radius)] border border-[rgba(255,85,85,0.35)] bg-[rgba(220,50,50,0.08)] px-3 py-2 text-xs text-[var(--rs-text)]"
              >
                <span className="min-w-0 flex-1">{syncError}</span>
                <button
                  type="button"
                  className="shrink-0 font-medium text-[var(--rs-accent)] hover:underline"
                  onClick={clearSyncError}
                >
                  Dismiss
                </button>
              </div>
            ) : null}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
