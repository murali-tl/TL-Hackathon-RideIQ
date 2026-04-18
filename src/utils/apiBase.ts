/**
 * Optional full API origin (e.g. `http://localhost:5001`). Leave unset in dev to use
 * Vite’s `/api` proxy to the local backend.
 */
export function getApiOrigin(): string {
  return (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''
}

/** Absolute or same-origin path under `/api/...`. */
export function apiPath(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  const o = getApiOrigin()
  return o ? `${o}${p}` : p
}
