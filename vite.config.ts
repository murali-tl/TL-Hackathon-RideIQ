import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget =
    (env.VITE_PROXY_TARGET || 'http://127.0.0.1:5001').replace(/\/$/, '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        /** When `VITE_API_URL` is unset, the app calls `/api/*` same-origin; forward to your backend. */
        '/api': { target: proxyTarget, changeOrigin: true },
      },
    },
  }
})
