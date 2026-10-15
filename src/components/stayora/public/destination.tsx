'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { fetchDestination, fetchMapMarkers } from '@/lib/api'
import { useDestinations, useCategories } from '@/hooks/use-content'
import { resolveIcon } from '@/lib/icon-resolver'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { PropertyCard } from '@/components/stayora/shared/property-card'
import { OpenStreetMap } from '@/components/stayora/shared/open-street-map'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Compass, ArrowLeft, Home as HomeIcon, Star, TrendingUp, Sparkles } from 'lucide-react'
import { formatPrice, formatNumber } from '@/lib/format'

export function DestinationView() {
  const { selectedCity, setView, setFilters, selectListing } = useAppStore()
  const [data, setData] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // DB-driven: look up destination info + categories from content tables
  const { destinations: allDestinations } = useDestinations()
  const { categories: propertyCategories } = useCategories()
  const info = allDestinations.find((d: any) => d.city === selectedCity) as any | undefined

  useEffect(() => {
    if (!selectedCity) { setView('home'); return }
    let cancelled = false
    Promise.resolve().then(() => { if (!cancelled) setLoading(true) })
    Promise.all([
      fetchDestination(selectedCity),
      fetchMapMarkers({ destination: selectedCity }),
    ]).then(([d, m]) => {
      if (cancelled) return
      setData(d)
      setMarkers(m.markers || [])
      setLoading(false)
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedCity, setView])

  if (!selectedCity) return null

  // Fallback to dynamic defaults if not in DB
  const fallback = {
    tagline: `Discover ${selectedCity}`,
    description: `Find your next stay in ${selectedCity}.`,
    bestTime: 'Year-round',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1c6c4d6e7f?w=1600&q=80',
  }

  // Category labels from DB
  const categoryLabel = (key: string) => propertyCategories.find((c: any) => c.key === key)?.label || key

  return (
    <div>
      {/* Hero — uses DB image + tagline + description + bestTime */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <img src={info?.image || fallback.image} alt={selectedCity} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="mx-auto w-full max-w-7xl px-6 pb-8 text-white">
            <button onClick={() => setView('home')} className="mb-3 flex items-center gap-1 text-sm text-white/80 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </button>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
              <MapPin className="h-3 w-3" /> {info?.tagline || fallback.tagline}
            </div>
            <h1 className="text-4xl font-bold md:text-5xl">{selectedCity}</h1>
            <p className="mt-2 max-w-2xl text-white/85">{info?.description || fallback.description}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-orange text-orange" /> Best time: {info?.bestTime || fallback.bestTime}</div>
              {data?.avgPrice && (
                <div className="flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Avg: {formatPrice(data.avgPrice)}/night</div>
              )}
              {data?.totalListings !== undefined && (
                <div className="flex items-center gap-1"><HomeIcon className="h-4 w-4" /> {formatNumber(data.totalListings)} stays</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="border-b border-border py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-navy">Where to stay in {selectedCity}</h2>
              <p className="text-sm text-muted-foreground">Click a marker to view the listing.</p>
            </div>
            <Button variant="outline" onClick={() => { setFilters({ destination: selectedCity }); setView('search') }} className="rounded-full">
              Browse all <ArrowLeft className="rotate-180 h-4 w-4" />
            </Button>
          </div>
          <OpenStreetMap
            markers={markers.map(m => ({
              id: m.id,
              lat: m.lat,
              lng: m.lng,
              title: m.title,
              price: formatPrice(m.basePrice).replace('.00', ''),
              rating: m.rating,
              coverImage: m.coverImage || undefined,
              onClick: (id) => selectListing(id),
            }))}
            height={420}
          />
        </div>
      </section>

      {/* Listings */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-navy">Top-rated stays in {selectedCity}</h2>
          <p className="text-sm text-muted-foreground">Handpicked by rating and reviews.</p>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />)}
          </div>
        ) : data?.listings?.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.listings.map((l: any) => <PropertyCard key={l.id} listing={l} />)}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No listings in {selectedCity} yet.
            </CardContent>
          </Card>
        )}
      </section>

      {/* Categories — uses DB-driven property categories */}
      {data?.categories?.length > 0 && (
        <section className="bg-peach-light/40 py-12">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-4 text-2xl font-bold text-navy">Browse by property type</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {data.categories.map((c: string) => {
                const cat = propertyCategories.find((pc: any) => pc.key === c)
                const Icon = resolveIcon((cat as any)?.icon) || Compass
                return (
                  <button
                    key={c}
                    onClick={() => { setFilters({ destination: selectedCity, category: c }); setView('search') }}
                    className="rounded-2xl border border-border bg-white p-4 text-left transition hover:shadow-md"
                  >
                    <Icon className="mb-2 h-6 w-6 text-orange" />
                    <p className="font-semibold text-navy">{categoryLabel(c)}</p>
                    <p className="text-xs text-muted-foreground">Browse {selectedCity} {categoryLabel(c)}s</p>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* AI CTA */}
      <section className="mx-auto max-w-7xl px-6 py-12 text-center">
        <Card className="bg-navy text-white">
          <CardContent className="p-8">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-orange" />
            <h2 className="text-xl font-bold">Not sure where to stay?</h2>
            <p className="mt-1 text-sm text-white/70">Ask our AI travel assistant for personalized recommendations.</p>
            <Button onClick={() => setView('ai-assistant')} className="mt-4 rounded-full bg-orange text-white">
              Ask the AI assistant
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
