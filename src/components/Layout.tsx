import { Suspense } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { APP_NAV_TABS } from '../layout/navTabs'
import { BikeSwitcher } from './BikeSwitcher'
import { LottieBikeLoading } from './LottieBikeLoading'
import { ThemeBikeToggle } from './ThemeBikeToggle'
import { useRide } from '../hooks/useRide'
import { useAuth } from '../context/AuthContext'

function navLinkClass(isActive: boolean, variant: 'pill' | 'sidebar') {
  if (variant === 'pill') {
    return `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
      isActive
        ? 'border-[var(--rs-accent)] bg-[var(--rs-accent)] text-white [&_svg]:text-white'
        : 'border-[var(--rs-border)] bg-transparent text-[var(--rs-muted)] hover:text-[var(--rs-text)] [&_svg]:text-current'
    }`
  }
  return `flex items-center gap-3 rounded-[var(--rs-radius-sm)] border px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'border-[var(--rs-accent)] bg-[rgba(255,92,26,0.12)] text-[var(--rs-accent)] [&_svg]:text-[var(--rs-accent)]'
      : 'border-transparent text-[var(--rs-muted)] hover:border-[var(--rs-border)] hover:bg-[var(--rs-surface2)] hover:text-[var(--rs-text)] [&_svg]:text-current'
  }`
}

/**
 * Full-viewport shell: desktop sidebar + fluid main; mobile keeps top bar + pill nav.
 * No max-width cap — content uses horizontal padding that scales with viewport.
 */
export function Layout() {
  const { toggleTheme, apiReady, syncError, clearSyncError } = useRide()
  const { user, logout } = useAuth()

  return (
    <div className="flex h-svh min-h-0 w-full min-w-0 overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className="sticky top-0 z-[100] hidden h-svh min-h-0 w-[min(17rem,22vw)] shrink-0 flex-col border-r border-[var(--rs-border)] bg-[var(--rs-surface)] lg:flex"
        aria-label="Main navigation"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--rs-border)] px-3 py-3.5 sm:px-4 sm:py-4">
          <div className="min-w-0 pr-1">
            <div className="font-[family-name:var(--rs-font-head)] text-[clamp(1.05rem,2.5vw,1.25rem)] font-extrabold leading-tight tracking-tight text-[var(--rs-text)]">
              Ride<span className="text-[var(--rs-accent)]">IQ</span>
            </div>
            <p className="mt-1 max-w-[12rem] text-[10px] leading-snug text-[var(--rs-muted)] sm:text-[11px]">Bike workspace</p>
          </div>
          <ThemeBikeToggle onClick={toggleTheme} />
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2 py-3" aria-label="Sections">
          {APP_NAV_TABS.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === '/dashboard'} className={({ isActive }) => navLinkClass(isActive, 'sidebar')}>
              <Icon className="h-5 w-5 shrink-0 opacity-90" />
              <span className="min-w-0 leading-snug">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-[var(--rs-border)] bg-[var(--rs-bg)]/50 p-3">
          <div className="min-w-0 rounded-lg border border-[var(--rs-border)] bg-[var(--rs-surface2)] px-2.5 py-2">
            <p className="truncate text-[11px] font-medium text-[var(--rs-text)]" title={user?.email}>
              {user?.name ?? 'Rider'}
            </p>
            <p className="truncate text-[10px] text-[var(--rs-muted)]" title={user?.email}>
              {user?.email}
            </p>
            <button
              type="button"
              className="mt-2 w-full rounded-md border border-[var(--rs-border)] bg-[var(--rs-surface)] px-2 py-1.5 text-[11px] font-medium text-[var(--rs-text)] hover:bg-[var(--rs-surface2)]"
              onClick={() => void logout()}
            >
              Sign out
            </button>
          </div>
          <BikeSwitcher orientation="vertical" />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile: single sticky chrome (no chained top offsets). */}
        <div className="sticky top-0 z-[100] shrink-0 border-b border-[var(--rs-border)] bg-[var(--rs-bg)] lg:hidden">
          <header className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5 sm:py-3">
            <div className="min-w-0">
              <div className="font-[family-name:var(--rs-font-head)] text-[clamp(1.1rem,4.2vw,1.4rem)] font-extrabold leading-tight tracking-tight text-[var(--rs-text)]">
                Ride<span className="text-[var(--rs-accent)]">IQ</span>
              </div>
              <p className="mt-0.5 text-[10px] leading-snug text-[var(--rs-muted)] sm:text-[11px]">Bike workspace</p>
            </div>
            <ThemeBikeToggle onClick={toggleTheme} />
          </header>

          <nav
            className="flex gap-1.5 overflow-x-auto border-t border-[var(--rs-border)] px-3 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden"
            aria-label="Primary"
          >
            {APP_NAV_TABS.map(({ to, label, shortLabel, Icon }) => (
              <NavLink
                key={to}
                to={to}
                title={label}
                end={to === '/dashboard'}
                className={({ isActive }) => navLinkClass(isActive, 'pill')}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{shortLabel ?? label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--rs-border)] px-3 py-2 sm:px-4">
            <div className="min-w-0 flex-1 truncate text-[10px] text-[var(--rs-muted)]">
              <span className="font-medium text-[var(--rs-text)]">{user?.name}</span>
              {user?.email ? <span className="hidden sm:inline"> · {user.email}</span> : null}
            </div>
            <button
              type="button"
              className="shrink-0 rounded-full border border-[var(--rs-border)] px-2.5 py-1 text-[10px] font-medium text-[var(--rs-text)]"
              onClick={() => void logout()}
            >
              Out
            </button>
          </div>
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
            <Suspense fallback={<LottieBikeLoading label="Loading page…" />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
