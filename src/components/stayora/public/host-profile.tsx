'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { fetchHostProfile } from '@/lib/api'
import { PropertyCard } from '@/components/stayora/shared/property-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, MapPin, Calendar, MessageCircle, ShieldCheck, Crown, ArrowLeft, Home as HomeIcon, Heart, TrendingUp } from 'lucide-react'
import { formatPrice, formatRating, formatNumber, formatRelativeDate } from '@/lib/format'

export function HostProfileView() {
  const { selectedHostId, setView, selectListing, user, openAuth, showToast } = useAppStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedHostId) { setView('home'); return }
    let cancelled = false
    Promise.resolve().then(() => { if (!cancelled) setLoading(true) })
    fetchHostProfile(selectedHostId)
      .then(d => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch(() => { if (!cancelled) { showToast('Failed to load host profile', undefined, 'error'); setLoading(false) } })
    return () => { cancelled = true }
  }, [selectedHostId, setView, showToast])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { host, listings, reviews, stats } = data
  const isOwnProfile = user?.id === host.id

  const messageHost = () => {
    if (!user) { openAuth('login'); return }
    // Reuse the messaging flow from the property detail page
    import('@/lib/api').then(({ sendMessage }) => {
      sendMessage({ recipientId: host.id, body: `Hi! I'm interested in your listings.` })
        .then(r => {
          useAppStore.setState({ selectedConversationId: r.conversationId, view: 'guest', guestTab: 'messages' })
          showToast('Conversation started', 'Message your host from the inbox.', 'success')
        })
        .catch(e => showToast('Could not start conversation', e.message, 'error'))
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <button onClick={() => setView('home')} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Hero card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="h-24 w-24 shrink-0">
              <AvatarImage src={host.avatarUrl || undefined} alt={host.name} />
              <AvatarFallback className="bg-navy text-white text-2xl">
                {host.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-navy">{host.name}</h1>
                {host.isSuperhost && <Badge variant="secondary" className="bg-orange-100 text-orange-700 gap-1"><Crown className="h-3 w-3" /> Superhost</Badge>}
                {host.isVerified && <Badge variant="secondary" className="bg-green-100 text-green-700 gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>}
              </div>
              {host.bio && <p className="mt-2 text-sm text-foreground max-w-2xl">{host.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {host.country || 'Worldwide'}</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Joined {new Date(host.createdAt).getFullYear()}</span>
                <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-orange text-orange" /> {stats.avgRating || 0} · {stats.totalReviews} reviews</span>
                <span className="flex items-center gap-1"><HomeIcon className="h-4 w-4" /> {stats.totalListings} listings</span>
                <span className="flex items-center gap-1"><TrendingUp className="h-4 w-4" /> {host.responseRate}% response rate</span>
              </div>
            </div>
            {!isOwnProfile && (
              <Button onClick={messageHost} className="rounded-full bg-orange text-white hover:bg-orange/90">
                <MessageCircle className="mr-2 h-4 w-4" /> Message {host.name.split(' ')[0]}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={HomeIcon} label="Listings" value={stats.totalListings} />
        <StatCard icon={Star} label="Avg rating" value={stats.avgRating} />
        <StatCard icon={Heart} label="Reviews" value={stats.totalReviews} />
        <StatCard icon={TrendingUp} label="Response rate" value={`${host.responseRate}%`} />
      </div>

      {/* Listings grid */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-navy mb-4">Stays by {host.name.split(' ')[0]}</h2>
        {listings.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No listings yet.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((l: any) => <PropertyCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>

      {/* Reviews with host replies */}
      <section>
        <h2 className="text-2xl font-bold text-navy mb-4">Reviews about {host.name.split(' ')[0]}</h2>
        {reviews.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No reviews yet.</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((r: any) => (
              <Card key={r.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={r.author?.avatarUrl || undefined} alt={r.author?.name} />
                      <AvatarFallback className="bg-peach text-navy text-xs">{r.author?.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-navy">{r.author?.name}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeDate(r.createdAt)} · {r.listing?.city}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-navy">
                      <Star className="h-3.5 w-3.5 fill-orange text-orange" /> {r.rating}.0
                    </div>
                  </div>
                  {r.body && <p className="text-sm text-foreground">{r.body}</p>}
                  {r.hostReply ? (
                    <div className="rounded-lg bg-peach-light/50 p-3">
                      <p className="mb-1 text-xs font-semibold text-navy">Response from {host.name.split(' ')[0]}:</p>
                      <p className="text-sm text-foreground">{r.hostReply}</p>
                      {r.hostReplyAt && <p className="mt-1 text-[10px] text-muted-foreground">{formatRelativeDate(r.hostReplyAt)}</p>}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <Icon className="mx-auto mb-2 h-6 w-6 text-orange" />
        <p className="text-2xl font-bold text-navy">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
