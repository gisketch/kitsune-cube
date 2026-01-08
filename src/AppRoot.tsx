import { Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { InProgressPage } from '@/pages/InProgressPage'
import { TimerApp } from '@/App'

function SolveRedirect() {
  const path = window.location.pathname.replace(/^\/solve/, '/app/solve')
  return <Navigate to={path} replace />
}

function ShortLinkRedirect() {
  const shortId = window.location.pathname.split('/')[2]
  return <Navigate to={`/app/s/${shortId}`} replace />
}

export function AppRoot() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/privacy" element={<InProgressPage />} />
      <Route path="/terms" element={<InProgressPage />} />
      <Route path="/changelog" element={<InProgressPage />} />
      <Route path="/docs" element={<InProgressPage />} />
      <Route path="/s/:shortId" element={<ShortLinkRedirect />} />
      <Route path="/solve/*" element={<SolveRedirect />} />
      <Route path="/app/*" element={<TimerApp />} />
    </Routes>
  )
}
