import { type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import TaskFlowLanding from './pages/LandingPage'
import CheckoutPage from './pages/CheckoutPage'
import CompanyCreatePage from './pages/CompanyCreatePage'
import LoginPage from './pages/LoginPage'
import WorkspacePage from './pages/WorkspacePage'

const isAuthenticated = () =>
  Boolean(window.localStorage.getItem('taskflow_access_token'))

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
      <Route path="/auth/login" element={<LoginPage />} />
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
