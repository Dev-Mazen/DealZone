import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App'

// Initialize language from localStorage
const savedLanguage = localStorage.getItem('dz_lang') || 'en'
if (savedLanguage === 'ar') {
  document.documentElement.lang = 'ar'
  document.documentElement.dir = 'rtl'
} else {
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

