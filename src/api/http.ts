/** Base URL for API (production). In dev, Vite proxies `/api` to the backend. */
export function apiBase(): string {
  const v = import.meta.env.VITE_API_URL
  return typeof v === 'string' ? v.replace(/\/$/, '') : ''
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

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  const text = await res.text()
  let json: unknown = null
  if (text) {
    try {
      json = JSON.parse(text) as unknown
    } catch {
      json = { raw: text }
    }
  }
  if (!res.ok) {
    const msg =
      json && typeof json === 'object' && json !== null && 'message' in json
        ? String((json as { message: unknown }).message)
        : res.statusText
    throw new ApiError(msg || 'Request failed', res.status, json)
  }
  return json as T
}
