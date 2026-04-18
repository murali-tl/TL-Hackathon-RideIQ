import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Align PORT with backend `.env` (default 5001 in backend/.env.example).
      '/api': { target: 'http://127.0.0.1:5001', changeOrigin: true },
    },
  },
})
