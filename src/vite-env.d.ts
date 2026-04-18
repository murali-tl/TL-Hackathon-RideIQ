/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Backend API origin for Axios (no trailing slash).
   * Example: `https://api.example.com` or `http://127.0.0.1:5001`.
   * Leave unset in dev to use same-origin `/api` + Vite proxy (`VITE_PROXY_TARGET`).
   */
  readonly VITE_API_URL?: string
  /**
   * Dev only: backend origin Vite should proxy `/api` to when `VITE_API_URL` is unset.
   * Default in `vite.config.ts`: `http://127.0.0.1:5001`.
   */
  readonly VITE_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
