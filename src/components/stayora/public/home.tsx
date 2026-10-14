'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { fetchListings, searchListings, fetchRecentlyViewed } from '@/lib/api'
import { useDestinations, useCategories } from '@/hooks/use-content'
import { resolveIcon } from '@/lib/icon-resolver'
import { PropertyCard } from '@/components/stayora/shared/property-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, MapPin, Users, ArrowRight, Sparkles, ShieldCheck, Globe, Heart, Star, TrendingUp, Crown, Compass, Clock } from 'lucide-react'

export function HomeView() {
  const { filters, setFilters, setView, openAuth, user, recentlyViewed, selectCity } = useAppStore()
  const [featured, setFeatured] = useState<any[]>([])
  const [trending, setTrending] = useState<any[]>([])
  const [recent, setRecent] = useState<any[]>([])
  const [recentlyViewedListings, setRecentlyViewedListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // DB-driven content (popular destinations + property categories for quick-filter chips)
  const { destinations: trendingDestinations, loading: destinationsLoading } = useDestinations()
  const { categories: propertyCategories } = useCategories()

  useEffect(() => {
    Promise.all([
      fetchListings({ limit: 8 }),
      fetchListings({ limit: 6 }).then(d => d.listings.slice(0, 6).reverse()),
      searchListings({ sortBy: 'recent' }),
    ]).then(([f, , r]) => {
      setFeatured(f.listings || [])
      setTrending(f.listings?.slice(0, 6) || [])
      setRecent(r.listings || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Fetch recently viewed listings (when the list changes)
  useEffect(() => {
    if (recentlyViewed.length === 0) {
      Promise.resolve().then(() => setRecentlyViewedListings([]))
      return
    }
    fetchRecentlyViewed(recentlyViewed).then(d => setRecentlyViewedListings(d.listings || [])).catch(() => {})
  }, [recentlyViewed])

  const submitSearch = () => {
    setView('search')
  }

  return (
    <div>
      {/* Hero with search */}
      <section className="relative overflow-hidden stayora-gradient-hero">
        <div className="absolute inset-0 bg-grid-white/[0.06] [background-size:48px_48px]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center text-white">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm backdrop-blur">
              <Sparkles className="h-4 w-4" /> 32 stays across 10 destinations
            </div>
            <h1 className="stayora-text-balance text-4xl font-bold tracking-tight md:text-6xl">
              Find your next stay, experience, and service.
            </h1>
            <p className="mt-4 text-lg text-white/85">
              Curated villas, cabins, and lofts — with hosted experiences and trusted local services in 50+ cities.
            </p>
          </div>

          {/* Search bar */}
          <div className="mx-auto mt-8 max-w-4xl rounded-3xl bg-white p-3 shadow-2xl md:p-4">
            <div className="grid gap-3 md:grid-cols-12 md:gap-2">
              <div className="md:col-span-4">
                <Label htmlFor="dest" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Where</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dest"
                    value={filters.destination}
                    onChange={(e) => setFilters({ destination: e.target.value })}
                    placeholder="Search destinations"
                    className="rounded-xl border-0 pl-9 focus-visible:ring-1 focus-visible:ring-orange"
                  />
                </div>
              </div>
              <div className="md:col-span-3">
                <Label htmlFor="ci" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Check in</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ci"
                    type="date"
                    value={filters.checkIn || ''}
                    onChange={(e) => setFilters({ checkIn: e.target.value })}
                    className="rounded-xl border-0 pl-9 focus-visible:ring-1 focus-visible:ring-orange"
                  />
                </div>
              </div>
              <div className="md:col-span-3">
                <Label htmlFor="co" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Check out</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="co"
                    type="date"
                    value={filters.checkOut || ''}
                    onChange={(e) => setFilters({ checkOut: e.target.value })}
                    className="rounded-xl border-0 pl-9 focus-visible:ring-1 focus-visible:ring-orange"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="g" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Guests</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    id="g"
                    value={filters.adults + filters.children}
                    onChange={(e) => {
                      const total = parseInt(e.target.value)
                      setFilters({ adults: Math.max(1, total - filters.children), children: Math.max(0, total - filters.adults) })
                    }}
                    className="w-full rounded-xl border-0 bg-white pl-9 pr-2 py-2 text-sm focus-visible:ring-1 focus-visible:ring-orange"
                  >
                    {Array.from({ length: 16 }, (_, i) => (
                      <option key={i} value={i + 1}>{i + 1} guest{i === 0 ? '' : 's'}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button onClick={submitSearch} className="rounded-full bg-orange px-6 text-white hover:bg-orange/90">
                <Sparkles className="mr-1 h-4 w-4" /> Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Category quick filters */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {propertyCategories.map(c => {
              const Icon = resolveIcon((c as any).icon)
              const active = filters.category === (c as any).key
              return (
                <button
                  key={(c as any).id}
                  onClick={() => {
                    setFilters({ category: active ? undefined : (c as any).key })
                    setView('search')
                  }}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'border-navy bg-navy text-white'
                      : 'border-border bg-white text-navy hover:border-navy/40 hover:bg-peach-light/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {(c as any).label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured stays */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-navy">Featured stays</h2>
            <p className="text-sm text-muted-foreground">Handpicked homes for every kind of trip.</p>
          </div>
          <button onClick={() => setView('search')} className="flex items-center gap-1 text-sm font-semibold text-orange hover:underline">
            See all <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />)
          ) : (
            featured.map(l => <PropertyCard key={l.id} listing={l} />)
          )}
        </div>
      </section>

      {/* Trending destinations */}
      <section className="bg-peach-light/40 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-navy">Trending destinations</h2>
            <p className="text-sm text-muted-foreground">Where Stayora guests are traveling this season. Managed by admins.</p>
          </div>
          {destinationsLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-square w-full rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {trendingDestinations.filter((d: any) => d.popular).slice(0, 6).map((d: any) => (
                <button
                  key={d.id}
                  onClick={() => selectCity(d.city)}
                  className="group relative aspect-square overflow-hidden rounded-2xl bg-navy text-left"
                >
                  <img src={d.image || ''} alt={d.city} className="absolute inset-0 h-full w-full object-cover opacity-90 transition group-hover:scale-105 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <div className="text-sm font-bold">{d.city}</div>
                    <div className="text-xs text-white/80">{d.country}</div>
                  </div>
                </button>
              ))}
              {trendingDestinations.filter((d: any) => d.popular).length === 0 && (
                <p className="text-sm text-muted-foreground col-span-6">No trending destinations configured. Add some from the admin panel.</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Recently added */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-navy">Recently added</h2>
            <p className="text-sm text-muted-foreground">Fresh listings from our host community.</p>
          </div>
          <button onClick={() => setView('search')} className="flex items-center gap-1 text-sm font-semibold text-orange hover:underline">
            Browse all <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />)
          ) : (
            recent.slice(0, 4).map(l => <PropertyCard key={l.id} listing={l} />)
          )}
        </div>
      </section>

      {/* Recently viewed */}
      {recentlyViewedListings.length > 0 && (
        <section className="bg-peach-light/30 py-12">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-bold text-navy">
                  <Clock className="h-6 w-6 text-orange" /> Recently viewed
                </h2>
                <p className="text-sm text-muted-foreground">Pick up where you left off.</p>
              </div>
              <button
                onClick={() => useAppStore.getState().clearRecentlyViewed()}
                className="text-xs text-muted-foreground hover:text-navy"
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recentlyViewedListings.slice(0, 4).map(l => <PropertyCard key={l.id} listing={l} />)}
            </div>
          </div>
        </section>
      )}

      {/* AI assistant CTA */}
      <section className="bg-navy py-12 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange/20 px-3 py-1 text-sm">
                <Sparkles className="h-4 w-4 text-orange" /> New
              </div>
              <h2 className="text-3xl font-bold">Meet your AI travel assistant</h2>
              <p className="mt-2 text-white/80">
                Describe your dream trip in plain English — "two weeks in Portugal, beach + city, under $200/night" — and our AI searches all of Stayora to recommend the perfect stays.
              </p>
              <div className="mt-4 flex gap-3">
                <Button onClick={() => setView('ai-assistant')} className="rounded-full bg-orange text-white hover:bg-orange/90">
                  <Sparkles className="mr-2 h-4 w-4" /> Try the assistant
                </Button>
                <Button variant="outline" onClick={() => setView('search')} className="rounded-full border-white/30 text-white hover:bg-white/10">
                  Browse stays
                </Button>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <div className="mb-3 flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-orange text-white"><Sparkles className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-semibold">Stayora AI</p>
                  <p className="text-[10px] text-white/60">Travel planning assistant</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl bg-orange px-3 py-2 text-white">
                  Find me a romantic cabin for two near a beach under $200/night
                </div>
                <div className="max-w-[85%] rounded-2xl bg-white/15 px-3 py-2">
                  I found 3 stays that match — a beachfront cabin in Bali at $184/night (4.9★), a lakeside A-frame in Cape Town at $176/night (4.8★), and a private cabana in Tulum at $192/night (4.7★). All have private bathrooms, sea views, and free cancellation.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <TrustItem
              icon={ShieldCheck}
              title="Verified hosts, trusted stays"
              body="Every Stayora host is identity-verified. Listings go through moderation before they appear in search."
            />
            <TrustItem
              icon={Heart}
              title="Free cancellation"
              body="Most listings offer flexible cancellation. Get a full refund if your plans change within the policy window."
            />
            <TrustItem
              icon={Globe}
              title="50+ destinations worldwide"
              body="From Lisbon to Kyoto, Bali to Cape Town — explore handpicked stays across six continents."
            />
          </div>
        </div>
      </section>

      {/* Host CTA */}
      {!user && (
        <section className="bg-peach-light/60 py-16">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <Crown className="mx-auto mb-4 h-10 w-10 text-orange" />
            <h2 className="text-3xl font-bold text-navy">Open your door to the world</h2>
            <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
              Hosting on Stayora is free. List your space, manage availability, message guests, and grow your earnings with a powerful host dashboard.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={() => openAuth('register')} className="rounded-full bg-orange px-6 text-white hover:bg-orange/90">
                Become a host
              </Button>
              <Button onClick={() => openAuth('login')} variant="outline" className="rounded-full border-navy text-navy hover:bg-white">
                Sign in
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function TrustItem({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="text-center md:text-left">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-orange/20 md:mx-0">
        <Icon className="h-6 w-6 text-orange" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-white/80">{body}</p>
    </div>
  )
}
