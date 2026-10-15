'use client'

import { useEffect, useState, useCallback } from 'react'
import { fetchAmenities, fetchDestinations, fetchWizardSteps, fetchCategories } from '@/lib/api'

// Module-level cache (shared across all components)
const cache: {
  amenities: any[] | null
  destinations: any[] | null
  wizardSteps: any[] | null
  categories: any[] | null
} = {
  amenities: null,
  destinations: null,
  wizardSteps: null,
  categories: null,
}

// Subscribers for cache invalidation
const subscribers: Set<() => void> = new Set()

function notify() { subscribers.forEach(fn => fn()) }

/** Invalidate the cache so next access refetches from server */
export function invalidateContentCache() {
  cache.amenities = null
  cache.destinations = null
  cache.wizardSteps = null
  cache.categories = null
  notify()
}

// Map hook table name to the JSON response key returned by the API
const RESPONSE_KEY: Record<string, string> = {
  amenities: 'amenities',
  destinations: 'destinations',
  wizardSteps: 'steps', // API returns { steps: [...] }
  categories: 'categories',
}

export function useContentTable<T = any>(table: 'amenities' | 'destinations' | 'wizardSteps' | 'categories') {
  const fetcher = table === 'amenities' ? fetchAmenities
    : table === 'destinations' ? () => fetchDestinations(false)
    : table === 'wizardSteps' ? fetchWizardSteps
    : fetchCategories
  const responseKey = RESPONSE_KEY[table] || table
  const [data, setData] = useState<T[] | null>(cache[table])
  const [loading, setLoading] = useState(!cache[table])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Subscribe to invalidations
    const sub = () => { setData(null); setLoading(true) }
    subscribers.add(sub)
    return () => { subscribers.delete(sub) }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (cache[table]) {
      setData(cache[table])
      setLoading(false)
      return
    }
    Promise.resolve().then(() => { if (!cancelled) setLoading(true) })
    fetcher()
      .then((r: any) => {
        if (cancelled) return
        const arr = r[responseKey] || []
        cache[table] = arr
        setData(arr)
        setLoading(false)
      })
      .catch((e: any) => { if (!cancelled) { setError(e.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [table, responseKey])

  const refresh = useCallback(async () => {
    cache[table] = null
    setLoading(true)
    try {
      const r: any = await fetcher()
      cache[table] = r[responseKey] || []
      setData(cache[table])
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }, [table, responseKey, fetcher])

  return { data, loading, error, refresh }
}

// Convenience hooks
export function useAmenities() {
  const { data, loading, refresh } = useContentTable('amenities')
  return { amenities: data || [], loading, refresh }
}

export function useDestinations() {
  const { data, loading, refresh } = useContentTable('destinations')
  return { destinations: data || [], loading, refresh }
}

export function useWizardSteps() {
  const { data, loading, refresh } = useContentTable('wizardSteps')
  return { steps: data || [], loading, refresh }
}

export function useCategories() {
  const { data, loading, refresh } = useContentTable('categories')
  return { categories: data || [], loading, refresh }
}
