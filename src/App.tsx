import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import Register from '@/pages/auth/Register'
import Login from '@/pages/auth/Login'

const Home = () => <div className="p-8 text-xl">🌱 AgriConnect Home</div>
const Login = () => <div className="p-8 text-xl">Login page</div>
const Register = () => <div className="p-8 text-xl">Register page</div>
const Dashboard = () => <div className="p-8 text-xl">🔒 Dashboard (logged in only)</div>

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}
