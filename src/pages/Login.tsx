import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Field, PasswordField, TextInput } from '../components/Form'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/http'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, from, navigate])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Sign in failed'
      setError(msg)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[var(--rs-bg)] px-4 py-10">
      <div className="w-full max-w-md rounded-[var(--rs-radius)] border border-[var(--rs-border)] bg-[var(--rs-surface)] p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-[family-name:var(--rs-font-head)] text-2xl font-extrabold text-[var(--rs-text)]">
            Ride<span className="text-[var(--rs-accent)]">IQ</span>
          </h1>
          <p className="mt-1 text-xs text-[var(--rs-muted)]">Sign in to sync your garage</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-1">
          <Field label="Email" htmlFor="login-email">
            <TextInput
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <PasswordField
            id="login-password"
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error ? (
            <p className="pt-2 text-xs text-[rgba(220,50,50,0.95)]" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-4 w-full rounded-lg bg-[var(--rs-accent)] py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--rs-muted)]">
          No account?{' '}
          <Link to="/register" className="font-medium text-[var(--rs-accent)] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
