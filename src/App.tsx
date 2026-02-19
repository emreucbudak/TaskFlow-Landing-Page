import TaskFlowLanding from './pages/LandingPage'
import CheckoutPage from './pages/CheckoutPage'
import CompanyCreatePage from './pages/CompanyCreatePage'
import RegisterPage from './features/auth/register/RegisterPage'

function App() {
  const pathname =
    typeof window !== "undefined"
      ? (window.location.pathname.replace(/\/+$/, "") || "/")
      : "/";

  if (pathname === "/checkout") {
    return <CheckoutPage />;
  }

  if (pathname === "/company/create") {
    return <CompanyCreatePage />;
  }

  if (pathname === "/auth/register") {
    return <RegisterPage />;
  }

  return <TaskFlowLanding />
}

export default App
