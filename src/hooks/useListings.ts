// src/hooks/useListings.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Listing } from '@/types'

interface ListingFilters {
  crop?:   string
  state?:  string
  search?: string
}

export function useListings(filters: ListingFilters = {}) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select('*, farmer:profiles!farmer_id(id,full_name,avatar_url,state,location,crop_types)')
      .eq('status', 'available')
      .order('created_at', { ascending: false })

    if (filters.crop)   query = query.eq('crop', filters.crop)
    if (filters.state)  query = query.eq('state', filters.state)
    if (filters.search) query = query.ilike('crop', `%${filters.search}%`)

    const { data, error } = await query
    if (error) setError(error.message)
    else setListings((data as Listing[]) ?? [])
    setLoading(false)
  }, [filters.crop, filters.state, filters.search])

  useEffect(() => { fetch() }, [fetch])
  return { listings, loading, error, refetch: fetch }
}

export function useMyListings(farmerId: string | undefined) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!farmerId) return
    setLoading(true)
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false })
    setListings((data as Listing[]) ?? [])
    setLoading(false)
  }, [farmerId])

  useEffect(() => { fetch() }, [fetch])
  return { listings, loading, refetch: fetch }
}

export interface CreateListingPayload {
  farmer_id:    string
  crop:         string
  quantity_kg:  number
  price_per_kg: number
  location:     string
  state:        string
  description:  string
  photos:       string[]
}

export async function createListing(payload: CreateListingPayload): Promise<Listing> {
  const { data, error } = await supabase
    .from('listings')
    .insert(payload)
    .select()
    .single<Listing>()
  if (error) throw error
  return data!
}

export async function updateListingStatus(
  id: string,
  status: Listing['status']
): Promise<void> {
  const { error } = await supabase
    .from('listings').update({ status }).eq('id', id)
  if (error) throw error
}

export async function deleteListing(id: string): Promise<void> {
  const { error } = await supabase
    .from('listings').delete().eq('id', id)
  if (error) throw error
}

export async function uploadListingPhotos(farmerId: string, files: File[]): Promise<string[]> {
  const urls: string[] = []
  for (const file of files) {
    const ext  = file.name.split('.').pop()
    const path = `${farmerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('listing-photos').upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('listing-photos').getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return urls
}