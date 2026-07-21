// src/types/index.ts

export type Role = 'farmer' | 'buyer'

export interface Profile {
  id:          string
  role:        Role
  full_name:   string | null
  phone:       string | null
  location:    string | null
  avatar_url:  string | null
  created_at:  string
}

export interface Listing {
  id:           string
  farmer_id:    string
  crop:         string
  quantity_kg:  number
  price_per_kg: number
  location:     string
  description:  string | null
  photos:       string[]
  status:       'available' | 'sold' | 'expired'
  created_at:   string
  farmer?:      Profile
}

export interface Message {
  id:          string
  listing_id:  string
  sender_id:   string
  receiver_id: string
  content:     string
  read:        boolean
  created_at:  string
}

export interface Order {
  id:           string
  listing_id:   string
  buyer_id:     string
  farmer_id:    string
  amount_paid:  number
  status:       'pending' | 'confirmed' | 'completed'
  paystack_ref: string
  created_at:   string
}

export interface AuthContextType {
  user:      import('@supabase/supabase-js').User | null
  profile:   Profile | null
  role:      Role | null
  isFarmer:  boolean
  isBuyer:   boolean
  isLoggedIn: boolean
  loading:   boolean
  signUp:    (args: SignUpArgs) => Promise<void>
  signIn:    (args: SignInArgs) => Promise<void>
  signOut:   () => Promise<void>
}

export interface SignUpArgs {
  email:    string
  password: string
  role:     Role
  fullName: string
  phone:    string
}

export interface SignInArgs {
  email:    string
  password: string
}
