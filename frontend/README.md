# 🎨 AgriConnect Frontend

React + Vite frontend application for AgriConnect marketplace.

## What's included

- **React 18** with TypeScript
- **Vite** for blazing fast dev experience
- **React Router v7** for navigation
- **Tailwind CSS v4** for styling
- **Supabase JS client** for auth, realtime, and storage
- **React Paystack** for payment processing
- **React Hot Toast** for notifications

## Project structure

```
src/
  components/
    layout/            # Navbar, ProtectedRoute
    listings/          # Browse, create, my listings, listing card
    orders/            # Order tracking UI
  hooks/
    useAuth.ts         # Auth context + Supabase integration
    useListings.ts     # Listings CRUD operations
    useOrders.ts       # Order management
    useMessages.ts     # Realtime messaging
    useProfile.ts      # User profile management
  pages/
    auth/              # Login, Register
    home/              # Landing, Dashboard
    listings/          # ListingDetail
    messages/          # Inbox, Conversation
    orders/            # OrderHistory
    profile/           # EditProfile, PublicProfile
  store/
    AuthContext.tsx    # Global auth state
  types/
    index.ts           # Shared TypeScript types
  lib/
    supabase.ts        # Supabase client setup
```

## Getting started

### Prerequisites
- Node.js 20+

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxx
   ```

3. Run dev server:
   ```bash
   npm run dev
   ```
   Opens at http://localhost:5173

## Commands

- `npm run dev` - Start dev server with hot reload
- `npm run build` - Production build to `dist/`
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Building for production

```bash
npm run build
```

This creates an optimized `dist/` folder ready for deployment.

### Docker

```bash
docker build -f Dockerfile -t agriconnect-frontend .
docker run -p 80:80 agriconnect-frontend
```

## Key dependencies

- `@supabase/supabase-js` - Backend integration
- `react-router-dom` - Client-side routing
- `react-paystack` - Paystack payment integration
- `tailwindcss` - CSS framework
- `lucide-react` - Icon library
