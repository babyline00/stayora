'use client'

import { useEffect, useState } from 'react'
import { fetchExperiences } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Clock, Users, MapPin, Calendar, Star, Compass } from 'lucide-react'
import { formatPrice, formatRating, formatNumber } from '@/lib/format'
import { useAppStore } from '@/store/useAppStore'

const CATEGORIES = ['FOOD', 'CULTURE', 'NATURE', 'PHOTOGRAPHY', 'WELLNESS']

export function ExperiencesView() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('')
  const { setView, showToast } = useAppStore()

  useEffect(() => {
    fetchExperiences().then(d => { setData(d.experiences || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = category ? data.filter((e: any) => e.category === category) : data

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy">Experiences</h1>
        <p className="mt-1 text-muted-foreground">Curated activities hosted by locals — from sunrise photo walks to private cooking classes.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('')}
          className={`rounded-full border px-4 py-2 text-sm font-medium ${!category ? 'border-navy bg-navy text-white' : 'border-border text-navy hover:bg-peach-light/50'}`}
        >
          All categories
        </button>
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${category === c ? 'border-navy bg-navy text-white' : 'border-border text-navy hover:bg-peach-light/50'}`}
          >
            {c.charAt(0) + c.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[4/5] w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Compass className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No experiences in this category yet.</p>
          <Button variant="outline" onClick={() => setCategory('')} className="mt-3 rounded-full">View all</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exp: any) => (
            <article key={exp.id} className="group overflow-hidden rounded-2xl bg-white stayora-card-shadow transition hover:stayora-card-shadow-hover">
              <div className="relative aspect-[4/3] overflow-hidden">
                {exp.coverImage ? (
                  <img src={exp.coverImage} alt={exp.title} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                ) : (
                  <div className="grid h-full place-items-center bg-peach-light"><Compass className="h-10 w-10 text-navy/40" /></div>
                )}
                <Badge variant="secondary" className="absolute left-2 top-2 bg-white/95 capitalize">{exp.category.toLowerCase()}</Badge>
                <div className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-xs font-semibold text-navy shadow-sm">
                  {exp.capacity} spots
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-navy">{exp.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground stayora-line-clamp-2">{exp.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {exp.destination}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {Math.floor(exp.durationMinutes / 60)}h {exp.durationMinutes % 60}m</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Max {exp.capacity}</span>
                </div>
                {exp.sessions?.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Next session: {new Date(exp.sessions[0].startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(exp.sessions[0].startsAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-navy">{formatPrice(exp.pricePerPerson)}</span>
                    <span className="text-xs text-muted-foreground"> / person</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => showToast('Demo only', 'Experience booking is not enabled in this demo.', 'default')}
                    className="rounded-full bg-orange text-white hover:bg-orange/90"
                  >
                    Reserve
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-12 rounded-2xl bg-peach-light/50 p-6 text-center">
        <h2 className="text-xl font-bold text-navy">Want to host your own experience?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Share your craft, your city, and your stories with travelers from around the world.</p>
        <Button onClick={() => setView('home')} className="mt-3 rounded-full bg-orange text-white hover:bg-orange/90">Become an experience host</Button>
      </div>
    </div>
  )
}
