import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from '@/App'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/AuthContext'
import { ExperienceProvider } from '@/contexts/ExperienceContext'
import { AchievementsProvider } from '@/contexts/AchievementsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <ExperienceProvider>
          <AchievementsProvider>
            <App />
          </AchievementsProvider>
        </ExperienceProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
