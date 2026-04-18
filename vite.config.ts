import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const LONG_AI_MS = 20 * 60 * 1000

function isClientDisconnect(err: NodeJS.ErrnoException) {
  return err.code === 'ECONNABORTED' || err.code === 'ECONNRESET' || err.code === 'EPIPE'
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget =
    (env.VITE_PROXY_TARGET || 'http://127.0.0.1:5001').replace(/\/$/, '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          /** Help browsers keep Set-Cookie for the dev UI host when proxying. */
          cookieDomainRewrite: '',
          cookiePathRewrite: '/',
          proxyTimeout: LONG_AI_MS,
          timeout: LONG_AI_MS,
          configure(proxy) {
            proxy.on('error', (err: NodeJS.ErrnoException) => {
              if (isClientDisconnect(err)) {
                console.warn('[vite proxy] Client disconnected during /api (long Ollama run?).')
                return
              }
              if (err.code === 'ECONNREFUSED') {
                console.error(
                  `[vite proxy] Backend not reachable at ${proxyTarget} — start the RideIQ backend (set VITE_PROXY_TARGET in .env if needed).`,
                )
                return
              }
              console.error('[vite proxy]', err.message)
            })
          },
        },
      },
    },
  }
})
