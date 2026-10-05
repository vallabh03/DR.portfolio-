import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { MotionConfig } from 'framer-motion'
import '@fontsource-variable/manrope/wght.css'
import '@fontsource-variable/inter/wght.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import './styles/globals.css'
import { ThemeProvider } from './hooks/useTheme'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <App />
        </MotionConfig>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
