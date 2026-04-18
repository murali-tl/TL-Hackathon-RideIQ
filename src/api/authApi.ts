import { api } from './http'

export type AuthUser = {
  id: string
  name: string
  email: string
}

type ApiEnvelope<T> = { success: boolean; data: T }

export async function fetchSession(): Promise<AuthUser | null> {
  try {
    const { data: envelope } = await api.get<ApiEnvelope<{ user: AuthUser }>>('/api/auth/me')
    return envelope.data?.user ?? null
  } catch {
    return null
  }
}

export async function loginApi(email: string, password: string): Promise<AuthUser> {
  const { data: envelope } = await api.post<ApiEnvelope<{ user: AuthUser }>>('/api/auth/login', {
    email,
    password,
  })
  if (!envelope.data?.user) throw new Error('Login failed')
  return envelope.data.user
}

export async function registerApi(
  name: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  const { data: envelope } = await api.post<ApiEnvelope<{ user: AuthUser }>>('/api/auth/register', {
    name,
    email,
    password,
  })
  if (!envelope.data?.user) throw new Error('Registration failed')
  return envelope.data.user
}

export async function logoutApi(): Promise<void> {
  await api.post('/api/auth/logout')
}
