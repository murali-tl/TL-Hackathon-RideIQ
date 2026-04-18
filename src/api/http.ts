import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios'
import { getStoredAccessToken } from './authSession'

/**
 * Backend API base URL from env (`VITE_API_URL`).
 *
 * - **Production:** set at build time, e.g. `https://api.yourdomain.com` (no trailing slash).
 *   Backend must allow this UI origin in CORS if it differs from the API host.
 * - **Dev:** leave unset to use relative `/api/...` (same origin as Vite); configure
 *   `VITE_PROXY_TARGET` in `.env` so Vite forwards `/api` to your local backend.
 * - **Dev direct:** set `VITE_API_URL=http://127.0.0.1:5001` to call the API without the proxy
 *   (CORS must allow the Vite dev origin).
 */
export function apiBase(): string {
  const v = import.meta.env.VITE_API_URL
  return typeof v === 'string' ? v.trim().replace(/\/$/, '') : ''
}

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

/** Shared Axios client for all RideIQ API modules. */
export const api = axios.create({
  baseURL: apiBase(),
  headers: {
    Accept: 'application/json',
  },
  /** Large JSON bodies (Base64 documents / bike photos). */
  timeout: 120_000,
  withCredentials: true,
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const t = getStoredAccessToken()?.trim()
  if (t) {
    config.headers.set('Authorization', `Bearer ${t}`)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (!isAxiosError(error)) {
      return Promise.reject(error)
    }
    const status = error.response?.status ?? 0
    if (status === 401) {
      const path = String(error.config?.url ?? '')
      const full = `${String(error.config?.baseURL ?? '')}${path}`
      const isAuthCall =
        full.includes('/api/auth/me') ||
        full.includes('/api/auth/login') ||
        full.includes('/api/auth/register') ||
        full.includes('/api/auth/logout')
      if (!isAuthCall) {
        window.dispatchEvent(new CustomEvent('rideiq:session-expired'))
      }
    }
    const body: unknown = error.response?.data ?? { detail: error.message }
    let message = error.message
    if (body && typeof body === 'object' && body !== null && 'message' in body) {
      message = String((body as { message: unknown }).message)
    }
    return Promise.reject(new ApiError(message || 'Request failed', status, body))
  },
)
