import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Field, TextInput } from '../components/Form'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/http'

export default function Register() {
  const { register, user } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await register(name.trim(), email.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Could not register'
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
            Create account
          </h1>
          <p className="mt-1 text-xs text-[var(--rs-muted)]">Password must be at least 8 characters</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-1">
          <Field label="Name" htmlFor="reg-name">
            <TextInput
              id="reg-name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <Field label="Email" htmlFor="reg-email">
            <TextInput
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password" htmlFor="reg-password">
            <TextInput
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </Field>

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
            {pending ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--rs-muted)]">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[var(--rs-accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
