import { type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import TaskFlowLanding from './pages/LandingPage'
import CheckoutPage from './pages/CheckoutPage'
import CompanyCreatePage from './pages/CompanyCreatePage'
import LoginPage from './pages/LoginPage'
import WorkspacePage from './pages/WorkspacePage'

const parseJwtExp = (token: string): number | null => {
  try {
    const segments = token.split('.')
    if (segments.length < 2) return null

    const payloadBase64 = segments[1].replace(/-/g, '+').replace(/_/g, '/')
    const padding = '='.repeat((4 - (payloadBase64.length % 4)) % 4)
    const payloadJson = atob(`${payloadBase64}${padding}`)
    const payload = JSON.parse(payloadJson) as { exp?: unknown }

    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

const isAuthenticated = () => {
  const accessToken = window.localStorage.getItem('taskflow_access_token')
  const refreshToken = window.localStorage.getItem('taskflow_refresh_token')
  if (!accessToken || !refreshToken) return false

  const exp = parseJwtExp(accessToken)
  if (exp === null) return false

  const nowInSeconds = Math.floor(Date.now() / 1000)
  if (exp <= nowInSeconds) {
    window.localStorage.removeItem('taskflow_access_token')
    window.localStorage.removeItem('taskflow_refresh_token')
    return false
  }

  return true
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<TaskFlowLanding />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/company/create" element={<CompanyCreatePage />} />
      <Route
        path="/auth/login"
        element={isAuthenticated() ? <Navigate to="/workspace" replace /> : <LoginPage />}
      />
      <Route
        path="/workspace"
        element={
          <ProtectedRoute>
            <WorkspacePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
