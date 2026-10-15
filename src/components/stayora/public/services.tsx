'use client'

import { useEffect, useState } from 'react'
import { fetchServices } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Clock, MapPin, Star, Wrench, ShieldCheck, Calendar } from 'lucide-react'
import { formatPrice, formatRating, formatNumber } from '@/lib/format'
import { useAppStore } from '@/store/useAppStore'

const CATEGORIES: Record<string, string> = {
  CLEANING: 'Turnover cleaning',
  MAINTENANCE: 'Maintenance',
  PHOTOGRAPHY: 'Photography',
  CONCIERGE: 'Concierge',
  TRANSPORT: 'Transport',
}

export function ServicesView() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('')
  const { showToast, setView } = useAppStore()

  useEffect(() => {
    fetchServices().then(d => { setData(d.services || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = category ? data.filter((s: any) => s.category === category) : data

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy">Services</h1>
        <p className="mt-1 text-muted-foreground">Trusted local professionals for hosts and guests — cleaning, maintenance, photography, and more.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('')}
          className={`rounded-full border px-4 py-2 text-sm font-medium ${!category ? 'border-navy bg-navy text-white' : 'border-border text-navy hover:bg-peach-light/50'}`}
        >
          All services
        </button>
        {Object.entries(CATEGORIES).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setCategory(k)}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${category === k ? 'border-navy bg-navy text-white' : 'border-border text-navy hover:bg-peach-light/50'}`}
          >
            {v}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[4/5] w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Wrench className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No services in this category yet.</p>
          <Button variant="outline" onClick={() => setCategory('')} className="mt-3 rounded-full">View all</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((svc: any) => (
            <article key={svc.id} className="group overflow-hidden rounded-2xl bg-white stayora-card-shadow transition hover:stayora-card-shadow-hover">
              <div className="relative aspect-[4/3] overflow-hidden">
                {svc.coverImage ? (
                  <img src={svc.coverImage} alt={svc.title} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="grid h-full place-items-center bg-peach-light"><Wrench className="h-10 w-10 text-navy/40" /></div>
                )}
                <Badge variant="secondary" className="absolute left-2 top-2 bg-white/95">{CATEGORIES[svc.category] || svc.category}</Badge>
                {svc.rating > 0 && (
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-xs font-semibold text-navy shadow-sm">
                    <Star className="h-3 w-3 fill-orange text-orange" />
                    {formatRating(svc.rating)} <span className="font-normal text-muted-foreground">({formatNumber(svc.reviewCount)})</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-navy">{svc.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground stayora-line-clamp-2">{svc.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {svc.serviceArea || 'Greater metro'}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {svc.duration >= 60 ? `${Math.floor(svc.duration / 60)}h` : `${svc.duration}m`}</span>
                </div>
                {svc.slots?.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Next slot: {new Date(svc.slots[0].startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(svc.slots[0].startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-navy">{formatPrice(svc.basePrice)}</span>
                    <span className="text-xs text-muted-foreground"> / service</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => showToast('Demo only', 'Service booking is not enabled in this demo.', 'default')}
                    className="rounded-full bg-navy text-white hover:bg-navy-light"
                  >
                    Book
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-12 rounded-2xl bg-peach-light/50 p-6 text-center">
        <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-orange" />
        <h2 className="text-xl font-bold text-navy">Background-checked &amp; insured</h2>
        <p className="mt-1 text-sm text-muted-foreground">Every Stayora service provider is verified, insured, and rated by our community.</p>
        <Button onClick={() => setView('home')} className="mt-3 rounded-full bg-navy text-white hover:bg-navy-light">Learn more</Button>
      </div>
    </div>
  )
}
