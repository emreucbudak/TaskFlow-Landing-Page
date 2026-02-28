import { Navigate, Route, Routes } from 'react-router-dom'
import TaskFlowLanding from './pages/LandingPage'
import CheckoutPage from './pages/CheckoutPage'
import CompanyCreatePage from './pages/CompanyCreatePage'
import PlanPaymentSuccessPage from './pages/PlanPaymentSuccessPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<TaskFlowLanding />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/company/create" element={<CompanyCreatePage />} />
      <Route path="/subscription/payment-success" element={<PlanPaymentSuccessPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
