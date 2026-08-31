import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import EditProfile from '@/pages/profile/EditProfile'
import PublicProfile from '@/pages/profile/PublicProfile'
import Navbar from '@/components/layout/Navbar'
import Landing from '@/pages/home/Landing'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import Dashboard from '@/pages/home/Dashboard'
import BrowseListings from '@/components/listings/BrowseListings'
import CreateListing from '@/components/listings/CreateListing'
import MyListings from '@/components/listings/MyListings'
import Inbox from '@/pages/messages/Inbox'
import Conversation from '@/pages/messages/Conversation'
import ListingDetail from '@/pages/listings/ListingDetail'
import OrderHistory from '@/pages/orders/OrderHistory'

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
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<PublicProfile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/:id" element={<PublicProfile />} />
        <Route path="/listings" element={<BrowseListings />} />
        <Route element={<ProtectedRoute role="farmer" />}>
          <Route path="/listings/create" element={<CreateListing />} />
          <Route path="/listings/mine" element={<MyListings />} />
        </Route>
        <Route path="/messages" element={<Inbox />} />
        <Route path="/messages/:id" element={<Conversation />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/orders" element={<OrderHistory mode="active" />} />
        <Route path="/orders/completed" element={<OrderHistory mode="completed" />} />
      </Route>
    </Routes>
  )
}