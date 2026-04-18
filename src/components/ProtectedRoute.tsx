import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() {
  const { user, authReady } = useAuth()
  const location = useLocation()

  if (!authReady) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--rs-bg)] px-4">
        <p className="text-sm text-[var(--rs-muted)]">Checking session…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
