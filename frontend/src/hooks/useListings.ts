// src/hooks/useListings.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Listing } from '@/types'

interface ListingFilters {
  crop?:   string
  state?:  string
  search?: string
}

const LISTINGS_PAGE_SIZE = 12

export function useListings(filters: ListingFilters = {}, page: number = 1, pageSize: number = LISTINGS_PAGE_SIZE) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetch = useCallback(async () => {
    setLoading(true)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('listings')
      .select('*', { count: 'exact' })
      .or('status.eq.available,status.is.null')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (filters.crop)   query = query.eq('crop', filters.crop)
    if (filters.state)  query = query.eq('state', filters.state)
    if (filters.search) query = query.ilike('crop', `%${filters.search}%`)

    const { data, error, count } = await query
    if (error) setError(error.message)
    else {
      setListings((data as Listing[]) ?? [])
      setTotalCount(count ?? 0)
    }
    setLoading(false)
  }, [filters.crop, filters.state, filters.search, page, pageSize])

  useEffect(() => { fetch() }, [fetch])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return { listings, loading, error, refetch: fetch, totalCount, totalPages, page, pageSize }
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
    .insert({ ...payload, status: 'available' })
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