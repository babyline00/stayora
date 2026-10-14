'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { fetchDestination, fetchMapMarkers } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { PropertyCard } from '@/components/stayora/shared/property-card'
import { OpenStreetMap } from '@/components/stayora/shared/open-street-map'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Compass, ArrowLeft, Home as HomeIcon, Star, TrendingUp, Sparkles } from 'lucide-react'
import { formatPrice, formatNumber, CATEGORY_LABELS } from '@/lib/format'

const DESTINATION_INFO: Record<string, { tagline: string; description: string; bestTime: string; img: string }> = {
  Lisbon: {
    tagline: 'The city of seven hills',
    description: 'Sun-drenched pastel buildings, fado in narrow lanes, and the best custard tarts you\'ll ever taste. Lisbon blends old-world charm with a thriving creative scene.',
    bestTime: 'April – October',
    img: 'https://images.unsplash.com/photo-1513735492236-0aaa1cd7d6f8?w=1600&q=80',
  },
  Kyoto: {
    tagline: 'Ancient temples, slow tea',
    description: 'Bamboo groves, golden pavilions, geisha in Gion. Kyoto is where Japan\'s imperial past still walks the streets.',
    bestTime: 'March – May (cherry blossom)',
    img: 'https://images.unsplash.com/photo-1493976040374-85c547cb7b64?w=1600&q=80',
  },
  Marrakech: {
    tagline: 'Spices, souks, and riads',
    description: 'A maze of color and noise in the medina, calm inner courtyards in the riads, and the High Atlas shimmering on the horizon.',
    bestTime: 'October – April',
    img: 'https://images.unsplash.com/photo-1539020157-029a4a9c4d6b?w=1600&q=80',
  },
  Bali: {
    tagline: 'Rice terraces and surf breaks',
    description: 'From the yoga studios of Ubud to the beach clubs of Seminyak, Bali blends spirituality, nature, and barefoot luxury.',
    bestTime: 'April – October',
    img: 'https://images.unsplash.com/photo-1518544801934-22e750781aaf?w=1600&q=80',
  },
  Barcelona: {
    tagline: 'Gaudí, tapas, beach',
    description: 'Catalan modernism, late-night vermouth, and Mediterranean beaches all in one walkable city.',
    bestTime: 'May – September',
    img: 'https://images.unsplash.com/photo-1583422409516-2895d8c5fc1f?w=1600&q=80',
  },
  'Cape Town': {
    tagline: 'Mountain meets ocean',
    description: 'Table Mountain looms over a city ringed by beaches, wineries, and the windswept Cape of Good Hope.',
    bestTime: 'November – March',
    img: 'https://images.unsplash.com/photo-1568838-pound150449-2c7a8e54cc?w=1600&q=80',
  },
  'Mexico City': {
    tagline: 'Tacos, murals, mezcals',
    description: 'A megacity of neighborhoods — Roma, Condesa, Coyoacán — each with its own culinary and artistic rhythm.',
    bestTime: 'March – May',
    img: 'https://images.unsplash.com/photo-1518444028531-1c6f3d6c3c7c?w=1600&q=80',
  },
  Reykjavik: {
    tagline: 'Geothermal nights, aurora skies',
    description: 'A tiny capital with big skies. Soak in hot springs by day, chase the northern lights by night.',
    bestTime: 'September – March (aurora)',
    img: 'https://images.unsplash.com/photo-1504541994902-91c3b8c3c3e0?w=1600&q=80',
  },
  'Buenos Aires': {
    tagline: 'Tango and asado',
    description: 'Paris of South America — wide boulevards, steak houses, milongas, and football on every corner.',
    bestTime: 'March – May, September – November',
    img: 'https://images.unsplash.com/photo-1506440908997-2e8d6e49e7c4?w=1600&q=80',
  },
  Queenstown: {
    tagline: 'Adventure capital',
    description: 'Bungee, ski, hike, jet boat — or just sit by Lake Wakatipu and admire the Remarkables.',
    bestTime: 'December – February (summer)',
    img: 'https://images.unsplash.com/photo-1469854523086-1c6f3c7e0cd6?w=1600&q=80',
  },
}

export function DestinationView() {
  const { selectedCity, setView, setFilters, selectListing } = useAppStore()
  const [data, setData] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedCity) { setView('home'); return }
    let cancelled = false
    Promise.resolve().then(() => { if (!cancelled) setLoading(true) })
    Promise.all([
      fetchDestination(selectedCity),
      fetchMapMarkers(selectedCity),
    ]).then(([d, m]) => {
      if (cancelled) return
      setData(d)
      setMarkers(m.markers || [])
      setLoading(false)
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedCity, setView])

  if (!selectedCity) return null
  const info = DESTINATION_INFO[selectedCity] || {
    tagline: `Discover ${selectedCity}`,
    description: `Find your next stay in ${selectedCity}.`,
    bestTime: 'Year-round',
    img: 'https://images.unsplash.com/photo-1502672260266-1c1c6c4d6e7f?w=1600&q=80',
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <img src={info.img} alt={selectedCity} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="mx-auto w-full max-w-7xl px-6 pb-8 text-white">
            <button onClick={() => setView('home')} className="mb-3 flex items-center gap-1 text-sm text-white/80 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </button>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
              <MapPin className="h-3 w-3" /> {info.tagline}
            </div>
            <h1 className="text-4xl font-bold md:text-5xl">{selectedCity}</h1>
            <p className="mt-2 max-w-2xl text-white/85">{info.description}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-orange text-orange" /> Best time: {info.bestTime}</div>
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

      {/* Categories */}
      {data?.categories?.length > 0 && (
        <section className="bg-peach-light/40 py-12">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-4 text-2xl font-bold text-navy">Browse by property type</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {data.categories.map((c: string) => (
                <button
                  key={c}
                  onClick={() => { setFilters({ destination: selectedCity, category: c }); setView('search') }}
                  className="rounded-2xl border border-border bg-white p-4 text-left transition hover:shadow-md"
                >
                  <Compass className="mb-2 h-6 w-6 text-orange" />
                  <p className="font-semibold text-navy">{CATEGORY_LABELS[c] || c}</p>
                  <p className="text-xs text-muted-foreground">Browse {selectedCity} {CATEGORY_LABELS[c] || c}s</p>
                </button>
              ))}
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
