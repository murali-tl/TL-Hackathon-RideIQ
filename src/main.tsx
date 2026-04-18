import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { loadTheme } from './utils/storage'
import App from './App.tsx'

const initialTheme = loadTheme()
const root = document.documentElement
if (initialTheme === 'dark') {
  root.classList.add('dark')
  root.classList.remove('light')
} else {
  root.classList.add('light')
  root.classList.remove('dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
