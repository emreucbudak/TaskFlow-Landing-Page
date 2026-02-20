import { Navigate, Route, Routes } from 'react-router-dom'
import TaskFlowLanding from './pages/LandingPage'
import CheckoutPage from './pages/CheckoutPage'
import CompanyCreatePage from './pages/CompanyCreatePage'
import LoginPage from './pages/LoginPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<TaskFlowLanding />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/company/create" element={<CompanyCreatePage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
