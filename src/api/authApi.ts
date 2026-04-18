import { api, ApiError } from './http'
import { setStoredAccessToken } from './authSession'

export type AuthUser = {
  id: string
  name: string
  email: string
}

type ApiEnvelope<T> = { success: boolean; data: T }

export type AuthPayload = { user: AuthUser; token: string }

export async function fetchSession(): Promise<AuthUser | null> {
  try {
    const { data: envelope } = await api.get<ApiEnvelope<{ user: AuthUser }>>('/api/auth/me')
    return envelope.data?.user ?? null
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      setStoredAccessToken(null)
    }
    return null
  }
}

export async function loginApi(email: string, password: string): Promise<AuthPayload> {
  const { data: envelope } = await api.post<ApiEnvelope<AuthPayload>>('/api/auth/login', {
    email,
    password,
  })
  if (!envelope.data?.user || !envelope.data?.token) throw new Error('Login failed')
  return envelope.data
}

export async function registerApi(name: string, email: string, password: string): Promise<AuthPayload> {
  const { data: envelope } = await api.post<ApiEnvelope<AuthPayload>>('/api/auth/register', {
    name,
    email,
    password,
  })
  if (!envelope.data?.user || !envelope.data?.token) throw new Error('Registration failed')
  return envelope.data
}

export async function logoutApi(): Promise<void> {
  await api.post('/api/auth/logout')
}
