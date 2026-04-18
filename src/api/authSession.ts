const KEY = 'rideiq_jwt'

export function getStoredAccessToken(): string | null {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setStoredAccessToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(KEY, token)
    else sessionStorage.removeItem(KEY)
  } catch {
    /* ignore quota / private mode */
  }
}
