import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthUser } from '../api/authApi'
import * as authApi from '../api/authApi'
import { setStoredAccessToken } from '../api/authSession'

type AuthContextValue = {
  user: AuthUser | null
  authReady: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const session = await authApi.fetchSession()
      if (!cancelled) {
        setUser(session)
        setAuthReady(true)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onExpired = () => {
      setStoredAccessToken(null)
      setUser(null)
    }
    window.addEventListener('rideiq:session-expired', onExpired)
    return () => window.removeEventListener('rideiq:session-expired', onExpired)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await authApi.loginApi(email, password)
    setStoredAccessToken(token)
    setUser(u)
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { user: u, token } = await authApi.registerApi(name, email, password)
    setStoredAccessToken(token)
    setUser(u)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logoutApi()
    } finally {
      setStoredAccessToken(null)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      authReady,
      login,
      register,
      logout,
    }),
    [user, authReady, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
