import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { AppRoot } from '@/AppRoot'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/AuthContext'
import { ExperienceProvider } from '@/contexts/ExperienceContext'
import { AchievementsProvider } from '@/contexts/AchievementsContext'
import { GoalsProvider } from '@/contexts/GoalsContext'
import { ChangelogProvider } from '@/contexts/ChangelogContext'
import { SolveSessionProvider } from '@/contexts/SolveSessionContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ErrorBoundary } from '@/components/error-boundary'
import { ChangelogModal } from '@/components/changelog-modal'
import { preloadNextScramble } from '@/lib/cube-state'

preloadNextScramble()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider defaultTheme="dark">
          <ToastProvider>
            <NotificationProvider>
              <AuthProvider>
                <ExperienceProvider>
                  <AchievementsProvider>
                    <GoalsProvider>
                      <ChangelogProvider>
                        <SolveSessionProvider>
                          <AppRoot />
                          <ChangelogModal />
                        </SolveSessionProvider>
                      </ChangelogProvider>
                    </GoalsProvider>
                  </AchievementsProvider>
                </ExperienceProvider>
              </AuthProvider>
            </NotificationProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
