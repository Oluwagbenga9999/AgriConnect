import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import EditProfile from '@/pages/profile/EditProfile'
import PublicProfile from '@/pages/profile/PublicProfile'
import Navbar from '@/components/layout/Navbar'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import Dashboard from '@/pages/home/Dashboard'
import BrowseListings from '@/components/listings/BrowseListings'
import CreateListing  from '@/components/listings/CreateListing'
import MyListings     from '@/components/listings/MyListings'

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
        <Route path="/profile" element={<PublicProfile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/:id" element={<PublicProfile />} />
        <Route path="/listings"        element={<BrowseListings />} />
        <Route path="/listings/create" element={<CreateListing />}  />
        <Route path="/listings/mine"   element={<MyListings />}     />
      </Route>
    </Routes>
  )
}