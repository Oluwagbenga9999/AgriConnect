import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import Navbar from '@/components/layout/Navbar'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import Dashboard from '@/pages/home/Dashboard'

function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="bg-gray-50 min-h-screen">
        <ProtectedRoute />
      </main>
    </>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* More routes go here as you build them */}
      </Route>
    </Routes>
  )
}