'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { searchListings, fetchDestinations } from '@/lib/api'
import { PropertyCard } from '@/components/stayora/shared/property-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Star, SlidersHorizontal, X, MapPin, Compass } from 'lucide-react'
import { AMENITY_LABELS, CATEGORY_LABELS, formatNumber } from '@/lib/format'

const ALL_AMENITIES = Object.keys(AMENITY_LABELS)
const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS)

export function SearchView() {
  const { filters, setFilters, resetFilters } = useAppStore()
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(true)
  const [destinations, setDestinations] = useState<any[]>([])

  // Convert filters to query params
  const queryParams = useMemo(() => ({
    destination: filters.destination,
    checkIn: filters.checkIn || undefined,
    checkOut: filters.checkOut || undefined,
    adults: filters.adults,
    children: filters.children,
    category: filters.category || undefined,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minBedrooms: filters.minBedrooms,
    minBathrooms: filters.minBathrooms,
    amenities: filters.amenities.join(','),
    instantBookOnly: filters.instantBookOnly,
    minRating: filters.minRating,
    sortBy: filters.sortBy,
  }), [filters])

  // Re-search whenever filters change (debounced)
  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => { if (!cancelled) setLoading(true) })
    const t = setTimeout(() => {
      searchListings(queryParams)
        .then(d => { if (!cancelled) setListings(d.listings || []); if (!cancelled) setLoading(false) })
        .catch(() => { if (!cancelled) setListings([]); if (!cancelled) setLoading(false) })
    }, 200)
    return () => { cancelled = true; clearTimeout(t) }
  }, [queryParams])

  useEffect(() => { fetchDestinations().then(d => setDestinations(d.destinations || [])).catch(() => {}) }, [])

  const toggleAmenity = (a: string) => {
    setFilters({
      amenities: filters.amenities.includes(a)
        ? filters.amenities.filter(x => x !== a)
        : [...filters.amenities, a],
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      {/* Search summary header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-navy">
            {filters.destination ? <>Stays in <span className="text-orange">{filters.destination}</span></> : 'All stays'}
            {filters.checkIn && filters.checkOut && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                · {new Date(filters.checkIn).toLocaleDateString()} → {new Date(filters.checkOut).toLocaleDateString()}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {loading ? 'Searching…' : <>{formatNumber(listings.length)} {listings.length === 1 ? 'stay' : 'stays'} available</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ sortBy: e.target.value as any })}
            className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium hover:border-navy/40"
          >
            <option value="recommended">Recommended</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="rating">Top rated</option>
            <option value="reviews">Most reviewed</option>
            <option value="recent">Recently added</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-full"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filter sidebar */}
        {showFilters && (
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-navy">Filters</h3>
                <button onClick={resetFilters} className="text-xs text-orange hover:underline">Reset all</button>
              </div>

              <FilterBlock title="Destination">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={filters.destination}
                    onChange={(e) => setFilters({ destination: e.target.value })}
                    placeholder="Where to?"
                    className="rounded-lg pl-9"
                  />
                </div>
                {destinations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {destinations.slice(0, 8).map(d => (
                      <button
                        key={d.city}
                        onClick={() => setFilters({ destination: d.city })}
                        className="rounded-full bg-peach-light/60 px-2 py-1 text-xs text-navy hover:bg-peach-light"
                      >
                        {d.city}
                      </button>
                    ))}
                  </div>
                )}
              </FilterBlock>

              <FilterBlock title="Dates">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Check in</Label>
                    <Input type="date" value={filters.checkIn || ''} onChange={(e) => setFilters({ checkIn: e.target.value })} className="rounded-lg" />
                  </div>
                  <div>
                    <Label className="text-xs">Check out</Label>
                    <Input type="date" value={filters.checkOut || ''} onChange={(e) => setFilters({ checkOut: e.target.value })} className="rounded-lg" />
                  </div>
                </div>
              </FilterBlock>

              <FilterBlock title="Price range (per night)">
                <div className="px-1">
                  <Slider
                    value={[filters.minPrice || 0, filters.maxPrice || 50000]}
                    min={0}
                    max={50000}
                    step={1000}
                    onValueChange={(v) => setFilters({ minPrice: v[0], maxPrice: v[1] })}
                    className="my-3"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>${((filters.minPrice || 0) / 100).toFixed(0)}</span>
                    <span>${((filters.maxPrice || 50000) / 100).toFixed(0)}+</span>
                  </div>
                </div>
              </FilterBlock>

              <FilterBlock title="Property type">
                <div className="grid grid-cols-2 gap-2">
                  {ALL_CATEGORIES.map(c => (
                    <button
                      key={c}
                      onClick={() => setFilters({ category: filters.category === c ? undefined : c })}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                        filters.category === c ? 'border-orange bg-peach-light text-navy' : 'border-border text-navy/80 hover:bg-peach-light/50'
                      }`}
                    >
                      {CATEGORY_LABELS[c]}
                    </button>
                  ))}
                </div>
              </FilterBlock>

              <FilterBlock title="Bedrooms & bathrooms">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Min beds</Label>
                    <select
                      value={filters.minBedrooms || 0}
                      onChange={(e) => setFilters({ minBedrooms: parseInt(e.target.value) || undefined })}
                      className="w-full rounded-lg border border-border px-2 py-2 text-sm"
                    >
                      <option value={0}>Any</option>
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Min baths</Label>
                    <select
                      value={filters.minBathrooms || 0}
                      onChange={(e) => setFilters({ minBathrooms: parseInt(e.target.value) || undefined })}
                      className="w-full rounded-lg border border-border px-2 py-2 text-sm"
                    >
                      <option value={0}>Any</option>
                      {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}+</option>)}
                    </select>
                  </div>
                </div>
              </FilterBlock>

              <FilterBlock title="Amenities">
                <div className="grid grid-cols-2 gap-2">
                  {ALL_AMENITIES.map(a => (
                    <label key={a} className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={filters.amenities.includes(a)}
                        onCheckedChange={() => toggleAmenity(a)}
                      />
                      {AMENITY_LABELS[a]}
                    </label>
                  ))}
                </div>
              </FilterBlock>

              <FilterBlock title="More">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={filters.instantBookOnly}
                    onCheckedChange={(v) => setFilters({ instantBookOnly: !!v })}
                  />
                  Instant Book only
                </label>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={!!filters.minRating}
                    onCheckedChange={(v) => setFilters({ minRating: v ? 4.5 : undefined })}
                  />
                  4.5+ star rating
                </label>
              </FilterBlock>

              {/* Active filters */}
              {(filters.amenities.length > 0 || filters.category || filters.instantBookOnly || filters.minRating) && (
                <div className="mt-4 border-t border-border pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active filters</p>
                  <div className="flex flex-wrap gap-1">
                    {filters.category && (
                      <Badge variant="secondary" className="gap-1">{CATEGORY_LABELS[filters.category]} <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({ category: undefined })} /></Badge>
                    )}
                    {filters.amenities.map(a => (
                      <Badge key={a} variant="secondary" className="gap-1">{AMENITY_LABELS[a]} <X className="h-3 w-3 cursor-pointer" onClick={() => toggleAmenity(a)} /></Badge>
                    ))}
                    {filters.instantBookOnly && (
                      <Badge variant="secondary" className="gap-1">Instant Book <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({ instantBookOnly: false })} /></Badge>
                    )}
                    {filters.minRating && (
                      <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3" /> 4.5+ <X className="h-3 w-3 cursor-pointer" onClick={() => setFilters({ minRating: undefined })} /></Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Results grid */}
        <div>
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border py-20 text-center">
              <Compass className="mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-navy">No stays match your filters</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try widening your search or removing filters.</p>
              <Button onClick={resetFilters} variant="outline" className="mt-4 rounded-full">Reset filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map(l => <PropertyCard key={l.id} listing={l} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border py-4 last:border-0">
      <h4 className="mb-2 text-sm font-semibold text-navy">{title}</h4>
      {children}
    </div>
  )
}
