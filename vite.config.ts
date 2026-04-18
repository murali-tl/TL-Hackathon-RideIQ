import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const LONG_AI_MS = 20 * 60 * 1000

function isClientDisconnect(err: NodeJS.ErrnoException) {
  return err.code === 'ECONNABORTED' || err.code === 'ECONNRESET' || err.code === 'EPIPE'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
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
                '[vite proxy] Backend not reachable at http://127.0.0.1:5001 — start TL-Hackathon-RideIQ-backend',
              )
              return
            }
            console.error('[vite proxy]', err.message)
          })
        },
      },
    },
  },
})
