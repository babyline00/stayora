'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { fetchListing } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Calendar } from '@/components/ui/calendar'
import { Separator } from '@/components/ui/separator'
import { Star, MapPin, Users, Bed, Bath, Heart, Share2, ShieldCheck, Zap, Clock, ChevronLeft, ChevronRight, X, Wifi, Car, Snowflake, Dumbbell, Waves, Flame, Tv, TreePalm, Mountain, Utensils, Briefcase } from 'lucide-react'
import { formatPrice, formatRating, formatNumber, AMENITY_LABELS, CATEGORY_LABELS, CANCELLATION_LABELS, toISODate, addDays } from '@/lib/format'
import { OpenStreetMap } from '@/components/stayora/shared/open-street-map'

export function PropertyDetail() {
  const { selectedListingId, setView, openBooking, user, openAuth, filters, showToast } = useAppStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIdx, setGalleryIdx] = useState(0)
  const [saved, setSaved] = useState(false)
  const [checkIn, setCheckIn] = useState<Date | undefined>(filters.checkIn ? new Date(filters.checkIn) : undefined)
  const [checkOut, setCheckOut] = useState<Date | undefined>(filters.checkOut ? new Date(filters.checkOut) : undefined)
  const [guests, setGuests] = useState({ adults: filters.adults || 1, children: filters.children || 0 })

  useEffect(() => {
    if (!selectedListingId) { setView('home'); return }
    setLoading(true)
    fetchListing(selectedListingId)
      .then(d => setData(d))
      .catch(() => showToast('Failed to load', undefined, 'error'))
      .finally(() => setLoading(false))
  }, [selectedListingId, setView, showToast])

  // Keyboard nav for lightbox
  useEffect(() => {
    if (!galleryOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGalleryOpen(false)
      else if (e.key === 'ArrowLeft') setGalleryIdx(i => (i - 1 + (data?.listing?.photos?.length || 1)) % (data?.listing?.photos?.length || 1))
      else if (e.key === 'ArrowRight') setGalleryIdx(i => (i + 1) % (data?.listing?.photos?.length || 1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [galleryOpen, data?.listing?.photos])

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-6">
        <Skeleton className="mb-3 h-5 w-32" />
        <Skeleton className="mb-3 h-9 w-3/4" />
        <Skeleton className="mb-6 aspect-[16/9] w-full rounded-2xl" />
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-6 w-full" />)}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  const listing = data.listing
  const photos = listing.photos || []
  const reviews = listing.reviews || []
  const host = listing.host
  const availability = data.availability || []

  const nights = checkIn && checkOut ? Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000)) : 0
  const nightlySubtotal = nights * listing.basePrice
  const cleaningFee = listing.cleaningFee
  const serviceFee = Math.round(nightlySubtotal * 0.12)
  const taxes = Math.round(nightlySubtotal * 0.08)
  const total = nightlySubtotal + cleaningFee + serviceFee + taxes

  const amenitiesList = listing.amenities ? listing.amenities.split(',').filter(Boolean) : []

  const handleBook = () => {
    if (!user) { openAuth('login'); return }
    if (!checkIn || !checkOut) {
      showToast('Select dates', 'Choose your check-in and check-out dates.', 'error')
      return
    }
    openBooking(listing.id,
      { checkIn: toISODate(checkIn), checkOut: toISODate(checkOut) },
      { ...guests, infants: 0, pets: 0 }
    )
  }

  // Check if a date is available
  const isDateBlocked = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return true
    const match = availability.find((a: any) => {
      const ad = new Date(a.date)
      ad.setHours(0, 0, 0, 0)
      return ad.getTime() === date.getTime()
    })
    return match ? !match.isAvailable : false
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <button onClick={() => setView('search')} className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-navy">
        <ChevronLeft className="h-4 w-4" /> Back to search
      </button>

      {/* Title */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy md:text-3xl">{listing.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {listing.rating > 0 && (
              <span className="flex items-center gap-1 font-semibold text-navy">
                <Star className="h-4 w-4 fill-orange text-orange" />
                {formatRating(listing.rating)} · {formatNumber(listing.reviewCount)} reviews
              </span>
            )}
            {listing.host?.isSuperhost && (
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" /> Superhost
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city}, {listing.country}
            </span>
          </div>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => { navigator.clipboard?.writeText(window.location.href); showToast('Link copied', undefined, 'success') }}>
            <Share2 className="mr-1 h-4 w-4" /> Share
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setSaved(s => !s)}>
            <Heart className={`mr-1 h-4 w-4 ${saved ? 'fill-orange text-orange' : ''}`} /> Save
          </Button>
        </div>
      </div>

      {/* Photo gallery */}
      <div className="mb-6 grid gap-2 md:grid-cols-4 md:grid-rows-2 md:[&>*:first-child]:col-span-2 md:[&>*:first-child]:row-span-2">
        {photos.slice(0, 5).map((p: any, idx: number) => (
          <button
            key={p.id}
            onClick={() => { setGalleryIdx(idx); setGalleryOpen(true) }}
            className={`group relative overflow-hidden rounded-xl bg-muted ${idx === 0 ? 'aspect-[16/9] md:aspect-auto' : 'aspect-[4/3] md:aspect-auto'}`}
          >
            <img src={p.url} alt={p.caption || listing.title} className="h-full w-full object-cover transition group-hover:scale-105 group-hover:opacity-90" loading={idx === 0 ? 'eager' : 'lazy'} />
            {p.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/70 to-transparent px-3 py-2 text-white opacity-0 transition group-hover:opacity-100">
                <p className="text-xs font-medium stayora-line-clamp-2">{p.caption}</p>
              </div>
            )}
            {photos.length > 5 && idx === 4 && (
              <div className="absolute inset-0 grid place-items-center bg-navy/50 text-white">
                <span className="text-sm font-semibold">+{photos.length - 5} more</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Fullscreen lightbox */}
      {galleryOpen && photos[galleryIdx] && (
        <div className="fixed inset-0 z-50 flex flex-col bg-navy/95" onClick={() => setGalleryOpen(false)}>
          {/* Top bar */}
          <div className="flex items-center justify-between p-4 text-white">
            <span className="text-sm font-medium">Photo {galleryIdx + 1} of {photos.length}{photos[galleryIdx]?.caption ? ` · ${photos[galleryIdx].caption}` : ''}</span>
            <button onClick={() => setGalleryOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close gallery">
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Image with prev/next */}
          <div className="relative flex flex-1 items-center justify-center px-4">
            <button
              onClick={(e) => { e.stopPropagation(); setGalleryIdx(i => (i - 1 + photos.length) % photos.length) }}
              className="absolute left-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <img
              src={photos[galleryIdx].url}
              alt={photos[galleryIdx]?.caption || listing.title}
              className="max-h-[70vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => { e.stopPropagation(); setGalleryIdx(i => (i + 1) % photos.length) }}
              className="absolute right-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
          {/* Thumbnail strip */}
          <div className="flex justify-center gap-2 overflow-x-auto p-4 stayora-scroll">
            {photos.map((p: any, i: number) => (
              <button
                key={p.id}
                onClick={(e) => { e.stopPropagation(); setGalleryIdx(i) }}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 transition ${i === galleryIdx ? 'border-orange' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={p.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left content */}
        <div className="space-y-8">
          {/* Overview */}
          <section>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="secondary" className="rounded-full">{CATEGORY_LABELS[listing.category] || listing.category}</Badge>
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {listing.maxGuests} guests</span>
              <span className="flex items-center gap-1"><Bed className="h-4 w-4" /> {listing.bedrooms} bedrooms</span>
              <span className="flex items-center gap-1"><Bed className="h-4 w-4" /> {listing.beds} beds</span>
              <span className="flex items-center gap-1"><Bath className="h-4 w-4" /> {listing.bathrooms} baths</span>
            </div>

            {host && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-border p-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={host.avatarUrl || undefined} alt={host.name} />
                  <AvatarFallback className="bg-navy text-white">{host.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-navy">
                    Hosted by{' '}
                    <button onClick={() => useAppStore.getState().selectHost(host.id)} className="text-orange hover:underline">
                      {host.name}
                    </button>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {host.isSuperhost ? 'Superhost · ' : ''}Joined {new Date(host.createdAt).getFullYear()} · Response rate {host.responseRate}%
                  </p>
                </div>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => user ? (async () => {
                  const { sendMessage } = await import('@/lib/api')
                  try {
                    const r = await sendMessage({ recipientId: host.id, body: `Hi! I'm interested in ${listing.title}.` })
                    useAppStore.setState({ selectedConversationId: r.conversationId, view: 'guest', guestTab: 'messages' })
                    showToast('Conversation started', 'Message your host from the inbox.', 'success')
                  } catch (e: any) { showToast('Could not start conversation', e.message, 'error') }
                })() : openAuth('login')}>
                  Message host
                </Button>
              </div>
            )}
          </section>

          <Separator />

          {/* Description */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-navy">About this place</h2>
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-line stayora-line-clamp-3">
              {listing.description}
            </p>
            <button className="mt-2 text-sm font-semibold text-orange hover:underline">Show more</button>
          </section>

          <Separator />

          {/* Amenities */}
          <section>
            <h2 className="mb-3 text-lg font-bold text-navy">What this place offers</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {amenitiesList.map(a => (
                <div key={a} className="flex items-center gap-2 text-sm text-foreground">
                  {amenityIcon(a)}
                  <span>{AMENITY_LABELS[a] || a}</span>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* Availability calendar */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-navy">Select dates</h2>
            <p className="mb-3 text-sm text-muted-foreground">7 nights minimum · Cancellation policy: {CANCELLATION_LABELS[listing.cancellationPolicy]}</p>
            <div className="rounded-xl border border-border p-3">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={checkIn && checkOut ? { from: checkIn, to: checkOut } : undefined}
                onSelect={(range: any) => {
                  setCheckIn(range?.from)
                  setCheckOut(range?.to)
                }}
                disabled={[{ before: new Date() }, { dayOfWeek: listing.checkInTime === '15:00' ? 99 : 99 }]}
                modifiers={{ unavailable: (date) => isDateBlocked(date) }}
                modifiersStyles={{ unavailable: { background: '#fce8d8', color: '#a0a0a0', textDecoration: 'line-through' } }}
                className="rounded-lg"
              />
            </div>
          </section>

          <Separator />

          {/* Reviews */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy">
                <Star className="mr-1 inline h-4 w-4 fill-orange text-orange" />
                {formatRating(listing.rating)} · {formatNumber(listing.reviewCount)} reviews
              </h2>
            </div>

            {reviews.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {reviews.map((r: any) => (
                  <div key={r.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={r.author?.avatarUrl || undefined} alt={r.author?.name} />
                        <AvatarFallback className="bg-peach text-navy text-xs">
                          {r.author?.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-navy">{r.author?.name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1 text-xs font-semibold text-navy">
                        <Star className="h-3 w-3 fill-orange text-orange" />
                        {r.rating}.0
                      </div>
                    </div>
                    {r.body && <p className="mt-2 text-sm text-foreground stayora-line-clamp-3">{r.body}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review after your stay.</p>
            )}
          </section>

          <Separator />

          {/* Map */}
          <section>
            <h2 className="mb-2 text-lg font-bold text-navy">Where you'll be</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              {listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city}, {listing.country} — exact address shared after booking
            </p>
            {listing.lat && listing.lng && (
              <OpenStreetMap
                singleLocation={{
                  lat: listing.lat,
                  lng: listing.lng,
                  label: `<div style="font-weight: 600; padding: 4px 8px;">${listing.title}</div><div style="font-size: 11px; color: #666;">${listing.neighborhood || ''} ${listing.city}</div>`,
                }}
                height={350}
                zoom={13}
              />
            )}
            {!listing.lat && (
              <div className="aspect-[16/8] rounded-xl bg-peach-light grid place-items-center">
                <div className="text-center">
                  <MapPin className="mx-auto h-8 w-8 text-orange" />
                  <p className="mt-1 text-sm font-semibold text-navy">{listing.neighborhood || listing.city}</p>
                  <p className="text-xs text-muted-foreground">{listing.city}, {listing.country}</p>
                </div>
              </div>
            )}
          </section>

          <Separator />

          {/* House rules */}
          <section>
            <h2 className="mb-3 text-lg font-bold text-navy">House rules</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> Check-in: {listing.checkInTime}</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> Check-out: {listing.checkOutTime}</div>
              <div className="flex items-center gap-2">{listing.allowsPets ? '✅' : '🚫'} Pets {listing.allowsPets ? 'allowed' : 'not allowed'}</div>
              <div className="flex items-center gap-2">{listing.allowsSmoking ? '✅' : '🚫'} Smoking {listing.allowsSmoking ? 'allowed' : 'not allowed'}</div>
              <div className="flex items-center gap-2">{listing.allowsParties ? '✅' : '🚫'} {listing.allowsParties ? 'Events allowed' : 'No parties'}</div>
              <div className="flex items-center gap-2">Min nights: {listing.minNights}</div>
            </div>
          </section>
        </div>

        {/* Right: Booking widget */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border bg-white p-5 stayora-card-shadow">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-navy">{formatPrice(listing.basePrice)}</span>
              <span className="text-sm text-muted-foreground">/ night</span>
              {listing.rating > 0 && (
                <span className="ml-auto flex items-center gap-1 text-sm font-semibold text-navy">
                  <Star className="h-4 w-4 fill-orange text-orange" />
                  {formatRating(listing.rating)}
                </span>
              )}
            </div>

            <div className="mt-3 rounded-xl border border-border">
              <div className="grid grid-cols-2 divide-x divide-border">
                <div className="p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Check-in</p>
                  <p className="text-sm text-navy">{checkIn ? checkIn.toLocaleDateString() : 'Add date'}</p>
                </div>
                <div className="p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Check-out</p>
                  <p className="text-sm text-navy">{checkOut ? checkOut.toLocaleDateString() : 'Add date'}</p>
                </div>
              </div>
              <div className="border-t border-border p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Guests</p>
                <div className="mt-1 flex items-center gap-2">
                  <button onClick={() => setGuests(g => ({ ...g, adults: Math.max(1, g.adults - 1) }))} className="grid h-6 w-6 place-items-center rounded-full border border-border text-sm hover:bg-muted">−</button>
                  <span className="text-sm">{guests.adults} adults, {guests.children} children</span>
                  <button onClick={() => setGuests(g => ({ ...g, adults: Math.min(listing.maxGuests, g.adults + 1) }))} className="grid h-6 w-6 place-items-center rounded-full border border-border text-sm hover:bg-muted">+</button>
                </div>
              </div>
            </div>

            <Button onClick={handleBook} className="mt-3 w-full rounded-full bg-orange text-white hover:bg-orange/90">
              {listing.instantBook ? (
                <span className="flex items-center gap-1"><Zap className="h-4 w-4" /> Instant Book</span>
              ) : 'Check availability'}
            </Button>

            {nights > 0 ? (
              <div className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{formatPrice(listing.basePrice)} × {nights} nights</span><span className="text-navy">{formatPrice(nightlySubtotal)}</span></div>
                {cleaningFee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Cleaning fee</span><span className="text-navy">{formatPrice(cleaningFee)}</span></div>}
                {serviceFee > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Service fee</span><span className="text-navy">{formatPrice(serviceFee)}</span></div>}
                {taxes > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Taxes</span><span className="text-navy">{formatPrice(taxes)}</span></div>}
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><span className="text-navy">Total</span><span className="text-navy">{formatPrice(total)}</span></div>
              </div>
            ) : (
              <p className="mt-3 text-center text-xs text-muted-foreground">Select dates to see total price</p>
            )}

            <p className="mt-3 text-center text-[11px] text-muted-foreground">You won't be charged yet</p>
          </div>

          <div className="mt-3 rounded-xl bg-peach-light/50 p-3 text-xs text-navy">
            <ShieldCheck className="mr-1 inline h-4 w-4 text-orange" />
            This is a demo booking flow. No real payment is processed.
          </div>
        </aside>
      </div>
    </div>
  )
}

function amenityIcon(a: string) {
  switch (a) {
    case 'wifi': return <Wifi className="h-4 w-4 text-navy/70" />
    case 'parking': return <Car className="h-4 w-4 text-navy/70" />
    case 'ac': return <Snowflake className="h-4 w-4 text-navy/70" />
    case 'gym': return <Dumbbell className="h-4 w-4 text-navy/70" />
    case 'pool': return <Waves className="h-4 w-4 text-navy/70" />
    case 'hot_tub': return <Waves className="h-4 w-4 text-navy/70" />
    case 'fireplace': return <Flame className="h-4 w-4 text-navy/70" />
    case 'tv': return <Tv className="h-4 w-4 text-navy/70" />
    case 'kitchen': return <Utensils className="h-4 w-4 text-navy/70" />
    case 'workspace': return <Briefcase className="h-4 w-4 text-navy/70" />
    case 'garden': return <TreePalm className="h-4 w-4 text-navy/70" />
    case 'beach_access': return <TreePalm className="h-4 w-4 text-navy/70" />
    case 'ski_storage': return <Mountain className="h-4 w-4 text-navy/70" />
    default: return <span className="text-navy/70">•</span>
  }
}
