'use client'

import { useEffect, useState } from 'react'
import { useAppStore, GuestTab } from '@/store/useAppStore'
import {
  fetchBookings, fetchWishlists, fetchConversations, fetchMessages,
  fetchNotifications, sendMessage, markRead, createReview,
  cancelBooking, createSupportTicket, markNotificationRead,
} from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  LayoutDashboard, Plane, Heart, MessageCircle, Star, CreditCard, Bell, User, LifeBuoy,
  Send, ArrowRight, Calendar, MapPin, CheckCircle2, AlertCircle, Filter, Search,
} from 'lucide-react'
import { formatPrice, formatDate, formatRelativeDate, formatRating, CATEGORY_LABELS, CANCELLATION_LABELS } from '@/lib/format'

const TABS: { id: GuestTab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'trips', label: 'My Trips', icon: Plane },
  { id: 'wishlists', label: 'Wishlists', icon: Heart },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'support', label: 'Support', icon: LifeBuoy },
]

export function GuestDashboard() {
  const { user, guestTab, setGuestTab, selectListing, openBooking, setView } = useAppStore()
  const [bookings, setBookings] = useState<any[]>([])
  const [wishlists, setWishlists] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const refreshAll = () => {
    setLoading(true)
    Promise.all([
      fetchBookings('guest').then(d => setBookings(d.bookings || [])).catch(() => setBookings([])),
      fetchWishlists().then(d => setWishlists(d.wishlists || [])).catch(() => setWishlists([])),
      fetchConversations().then(d => setConversations(d.conversations || [])).catch(() => setConversations([])),
      fetchNotifications().then(d => setNotifications(d.notifications || [])).catch(() => setNotifications([])),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => { Promise.resolve().then(refreshAll) }, [user?.id])

  if (!user) return null

  const upcoming = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING')
  const past = bookings.filter(b => b.status === 'COMPLETED')
  const cancelled = bookings.filter(b => b.status === 'CANCELLED')
  const unreadNotifs = notifications.filter(n => !n.isRead)

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
      {/* Left sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-20 rounded-2xl border border-border bg-white p-2">
          <div className="mb-2 flex items-center gap-3 border-b border-border p-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
              <AvatarFallback className="bg-navy text-white">{user.name.split(' ').map(p => p[0]).slice(0, 2).join('')}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-navy">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">Guest</p>
            </div>
          </div>
          <nav className="space-y-0.5">
            {TABS.map(t => {
              const Icon = t.icon
              const active = guestTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setGuestTab(t.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active ? 'bg-navy text-white' : 'text-navy/80 hover:bg-peach-light/60 hover:text-navy'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{t.label}</span>
                  {t.id === 'trips' && upcoming.length > 0 && (
                    <Badge variant="secondary" className={`text-[10px] ${active ? 'bg-white/20 text-white' : ''}`}>{upcoming.length}</Badge>
                  )}
                  {t.id === 'notifications' && unreadNotifs.length > 0 && (
                    <Badge variant="secondary" className={`text-[10px] ${active ? 'bg-white/20 text-white' : ''}`}>{unreadNotifs.length}</Badge>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1">
        {/* Mobile tab pills */}
        <div className="mb-4 flex gap-1 overflow-x-auto lg:hidden">
          {TABS.map(t => {
            const Icon = t.icon
            const active = guestTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setGuestTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${active ? 'bg-navy text-white' : 'bg-peach-light/60 text-navy'}`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            )
          })}
        </div>

        {guestTab === 'overview' && <OverviewTab bookings={bookings} wishlists={wishlists} conversations={conversations} notifications={notifications} loading={loading} onGoToTab={setGuestTab} />}
        {guestTab === 'trips' && <TripsTab bookings={bookings} loading={loading} onRefresh={refreshAll} />}
        {guestTab === 'wishlists' && <WishlistsTab wishlists={wishlists} loading={loading} />}
        {guestTab === 'messages' && <MessagesTab conversations={conversations} loading={loading} onRefresh={refreshAll} />}
        {guestTab === 'reviews' && <ReviewsTab bookings={bookings} loading={loading} onRefresh={refreshAll} />}
        {guestTab === 'payments' && <PaymentsTab bookings={bookings} loading={loading} />}
        {guestTab === 'notifications' && <NotificationsTab notifications={notifications} loading={loading} onRefresh={refreshAll} />}
        {guestTab === 'profile' && <ProfileTab />}
        {guestTab === 'support' && <SupportTab bookings={bookings} loading={loading} onRefresh={refreshAll} />}
      </main>
    </div>
  )
}

// ============================================================
// OVERVIEW TAB
// ============================================================
function OverviewTab({ bookings, wishlists, conversations, notifications, loading, onGoToTab }: any) {
  const upcoming = bookings.filter((b: any) => b.status === 'CONFIRMED' || b.status === 'PENDING')
  const next = upcoming[0]
  const unreadMsgs = conversations.filter((c: any) => c.messages?.[0] && !c.messages[0].isRead && c.messages[0].senderId !== useAppStore.getState().user?.id)
  const recentNotifs = notifications.slice(0, 5)

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Here's what's happening with your trips and account.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Plane} label="Upcoming trips" value={upcoming.length} onClick={() => onGoToTab('trips')} />
        <StatCard icon={Heart} label="Saved properties" value={wishlists.reduce((acc: number, w: any) => acc + (w.listings?.length || 0), 0)} onClick={() => onGoToTab('wishlists')} />
        <StatCard icon={MessageCircle} label="Unread messages" value={unreadMsgs.length} onClick={() => onGoToTab('messages')} />
        <StatCard icon={Bell} label="New notifications" value={notifications.filter((n: any) => !n.isRead).length} onClick={() => onGoToTab('notifications')} />
      </div>

      {next ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy"><Plane className="h-5 w-5 text-orange" /> Your next trip</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {next.listing?.photos?.[0]?.url && (
                <img src={next.listing.photos[0].url} alt={next.listing.title} className="h-20 w-20 rounded-xl object-cover" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-navy">{next.listing?.title}</h3>
                <p className="text-sm text-muted-foreground">{next.listing?.city}, {next.listing?.country}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(next.checkIn)} → {formatDate(next.checkOut)}</span>
                  <span>Ref: {next.reference}</span>
                </div>
              </div>
              <Badge variant="secondary" className={next.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                {next.status === 'CONFIRMED' ? '✓ Confirmed' : '⏳ Pending'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Plane className="h-10 w-10 text-muted-foreground" />
            <h3 className="font-semibold text-navy">No upcoming trips yet</h3>
            <p className="text-sm text-muted-foreground">Find your next stay and start planning.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy"><MessageCircle className="h-5 w-5 text-orange" /> Recent messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {conversations.slice(0, 3).map((c: any) => {
              const other = c.userAId === useAppStore.getState().user?.id ? c.userB : c.userA
              const last = c.messages?.[0]
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-peach-light/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={other?.avatarUrl || undefined} alt={other?.name} />
                    <AvatarFallback className="bg-peach text-navy text-xs">{other?.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy">{other?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{last?.body || 'No messages yet'}</p>
                  </div>
                  {last && <span className="text-[10px] text-muted-foreground">{formatRelativeDate(last.sentAt)}</span>}
                </div>
              )
            })}
            {conversations.length === 0 && <p className="text-sm text-muted-foreground">No conversations yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy"><Bell className="h-5 w-5 text-orange" /> Recent notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentNotifs.map((n: any) => (
              <div key={n.id} className={`flex items-start gap-2 rounded-lg p-2 ${!n.isRead ? 'bg-peach-light/60' : ''}`}>
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{formatRelativeDate(n.createdAt)}</p>
                </div>
              </div>
            ))}
            {notifications.length === 0 && <p className="text-sm text-muted-foreground">No notifications yet.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, onClick }: any) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-border bg-white p-4 text-left transition hover:shadow-md">
      <div className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-peach-light">
        <Icon className="h-4 w-4 text-navy" />
      </div>
      <p className="text-2xl font-bold text-navy">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </button>
  )
}

// ============================================================
// TRIPS TAB
// ============================================================
function TripsTab({ bookings, loading, onRefresh }: any) {
  const { showToast, selectListing, setView } = useAppStore()
  const [cancelling, setCancelling] = useState<string | null>(null)

  const upcoming = bookings.filter((b: any) => b.status === 'CONFIRMED' || b.status === 'PENDING')
  const past = bookings.filter((b: any) => b.status === 'COMPLETED')
  const cancelled = bookings.filter((b: any) => b.status === 'CANCELLED')

  const handleCancel = async (bookingId: string) => {
    setCancelling(bookingId)
    try {
      await cancelBooking(bookingId, 'Plans changed')
      showToast('Booking cancelled', 'Your refund is processing.', 'success')
      onRefresh()
    } catch (e: any) {
      showToast('Could not cancel', e.message, 'error')
    } finally {
      setCancelling(null)
    }
  }

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">My Trips</h1>
        <p className="text-sm text-muted-foreground">Manage your upcoming and past reservations.</p>
      </div>

      <TripSection title="Upcoming" bookings={upcoming} cancelling={cancelling} onCancel={handleCancel} onGoToListing={(id: string) => { selectListing(id); setView('property') }} />
      <TripSection title="Past" bookings={past} onGoToListing={(id: string) => { selectListing(id); setView('property') }} />
      {cancelled.length > 0 && <TripSection title="Cancelled" bookings={cancelled} onGoToListing={(id: string) => { selectListing(id); setView('property') }} />}
    </div>
  )
}

function TripSection({ title, bookings, cancelling, onCancel, onGoToListing }: any) {
  if (bookings.length === 0) return null
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-navy">{title} ({bookings.length})</h2>
      <div className="space-y-3">
        {bookings.map((b: any) => (
          <Card key={b.id}>
            <CardContent className="flex items-center gap-4 p-4">
              {b.listing?.photos?.[0]?.url && (
                <img src={b.listing.photos[0].url} alt="" className="h-16 w-16 rounded-lg object-cover cursor-pointer" onClick={() => onGoToListing(b.listingId)} />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-navy truncate cursor-pointer hover:underline" onClick={() => onGoToListing(b.listingId)}>{b.listing?.title}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {b.listing?.city}, {b.listing?.country}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(b.checkIn)} → {formatDate(b.checkOut)}</span>
                  <span>· {b.nights} {b.nights === 1 ? 'night' : 'nights'}</span>
                  <span>· {b.adults + b.children} guest{(b.adults + b.children) === 1 ? '' : 's'}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-navy">{formatPrice(b.totalAmount)}</p>
                <Badge variant="secondary" className={
                  b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                  b.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                  b.status === 'COMPLETED' ? 'bg-navy/10 text-navy' :
                  'bg-destructive/10 text-destructive'
                }>
                  {b.status}
                </Badge>
                {(b.status === 'CONFIRMED' || b.status === 'PENDING') && onCancel && (
                  <Button variant="ghost" size="sm" className="mt-1 text-destructive" disabled={cancelling === b.id} onClick={() => onCancel(b.id)}>
                    {cancelling === b.id ? 'Cancelling…' : 'Cancel'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

// ============================================================
// WISHLISTS TAB
// ============================================================
function WishlistsTab({ wishlists, loading }: any) {
  const { selectListing, setView, showToast, user } = useAppStore()
  const [saving, setSaving] = useState<string | null>(null)

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Wishlists</h1>
        <p className="text-sm text-muted-foreground">Properties you've saved for later.</p>
      </div>

      {wishlists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Heart className="h-10 w-10 text-muted-foreground" />
            <h3 className="font-semibold text-navy">No saved properties yet</h3>
            <p className="text-sm text-muted-foreground">Tap the heart on any property card to save it.</p>
            <Button onClick={() => setView('search')} className="rounded-full bg-orange text-white">Browse stays</Button>
          </CardContent>
        </Card>
      ) : (
        wishlists.map((w: any) => (
          <Card key={w.id}>
            <CardHeader>
              <CardTitle className="text-navy flex items-center gap-2"><Heart className="h-5 w-5 text-orange" /> {w.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {w.listings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No properties in this wishlist.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {w.listings.map((l: any) => (
                    <div key={l.id} className="group cursor-pointer rounded-xl border border-border overflow-hidden" onClick={() => { selectListing(l.id); setView('property') }}>
                      {l.photos?.[0]?.url && (
                        <img src={l.photos[0].url} alt={l.title} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                      )}
                      <div className="p-3">
                        <p className="font-medium text-navy text-sm truncate">{l.title}</p>
                        <p className="text-xs text-muted-foreground">{l.city}, {l.country}</p>
                        <p className="mt-1 font-bold text-navy text-sm">{formatPrice(l.basePrice)}<span className="font-normal text-muted-foreground"> / night</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

// ============================================================
// MESSAGES TAB
// ============================================================
function MessagesTab({ conversations, loading, onRefresh }: any) {
  const { user } = useAppStore()
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)

  useEffect(() => {
    if (!activeConv) return
    setLoadingMsgs(true)
    fetchMessages(activeConv).then(d => {
      setMessages(d.messages || [])
      markRead(activeConv).then(() => onRefresh()).catch(() => {})
    }).finally(() => setLoadingMsgs(false))
  }, [activeConv])

  const send = async () => {
    if (!input.trim() || !activeConv) return
    setSending(true)
    try {
      const r = await sendMessage({ conversationId: activeConv, body: input })
      setMessages(m => [...m, r.message])
      setInput('')
      onRefresh()
    } catch (e: any) {
      // ignored
    } finally {
      setSending(false)
    }
  }

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-navy">Messages</h1>
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        {/* Conversations list */}
        <div className="rounded-2xl border border-border bg-white overflow-hidden">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search messages" className="rounded-lg pl-8" />
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto stayora-scroll">
            {conversations.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">No conversations</p>
            ) : conversations.map((c: any) => {
              const other = c.userAId === user?.id ? c.userB : c.userA
              const last = c.messages?.[0]
              const isUnread = last && last.senderId !== user?.id && !last.isRead
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveConv(c.id)}
                  className={`flex w-full items-start gap-3 border-b border-border p-3 text-left transition hover:bg-peach-light/50 ${activeConv === c.id ? 'bg-peach-light' : ''}`}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={other?.avatarUrl || undefined} alt={other?.name} />
                    <AvatarFallback className="bg-peach text-navy text-xs">{other?.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${isUnread ? 'font-bold text-navy' : 'font-medium text-navy/80'}`}>{other?.name}</p>
                      {last && <span className="text-[10px] text-muted-foreground">{formatRelativeDate(last.sentAt)}</span>}
                    </div>
                    <p className={`truncate text-xs ${isUnread ? 'text-navy font-semibold' : 'text-muted-foreground'}`}>{last?.body || 'Start a conversation'}</p>
                  </div>
                  {isUnread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Conversation view */}
        <div className="rounded-2xl border border-border bg-white flex flex-col h-[60vh]">
          {!activeConv ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <MessageCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Select a conversation to start chatting</p>
              </div>
            </div>
          ) : loadingMsgs ? (
            <div className="grid h-full place-items-center"><Skeleton className="h-12 w-12 rounded-full" /></div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto stayora-scroll p-4 space-y-3">
                {messages.map((m: any) => {
                  const mine = m.senderId === user?.id
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${mine ? 'bg-navy text-white' : 'bg-peach-light text-navy'}`}>
                        <p>{m.body}</p>
                        <p className={`mt-0.5 text-[10px] ${mine ? 'text-white/70' : 'text-muted-foreground'}`}>{formatRelativeDate(m.sentAt)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-border p-3 flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Type a message…"
                  className="rounded-full"
                />
                <Button onClick={send} disabled={!input.trim() || sending} className="rounded-full bg-orange text-white">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// REVIEWS TAB
// ============================================================
function ReviewsTab({ bookings, loading, onRefresh }: any) {
  const { showToast } = useAppStore()
  const [active, setActive] = useState<any | null>(null)
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [subratings, setSubratings] = useState<any>({ accuracy: 5, cleanliness: 5, communication: 5, location: 5, checkIn: 5, value: 5 })

  const eligible = bookings.filter((b: any) => b.status === 'COMPLETED' && (!b.reviews || b.reviews.length === 0))

  const submit = async () => {
    if (!active) return
    setSubmitting(true)
    try {
      await createReview({ bookingId: active.id, rating, body, subratings })
      showToast('Review submitted', 'Thanks for sharing your experience!', 'success')
      setActive(null)
      setBody('')
      setRating(5)
      onRefresh()
    } catch (e: any) {
      showToast('Could not submit review', e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Reviews</h1>
        <p className="text-sm text-muted-foreground">Share your experience with hosts and the community.</p>
      </div>

      {eligible.length === 0 && !active ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Star className="h-10 w-10 text-muted-foreground" />
            <h3 className="font-semibold text-navy">No reviews to write</h3>
            <p className="text-sm text-muted-foreground">You'll be able to review a property after completing a stay.</p>
          </CardContent>
        </Card>
      ) : active ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-navy">Review {active.listing?.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Overall rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRating(n)} type="button">
                    <Star className={`h-8 w-8 ${n <= rating ? 'fill-orange text-orange' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Detailed ratings</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {['accuracy', 'cleanliness', 'communication', 'location', 'checkIn', 'value'].map((k) => (
                  <div key={k} className="flex items-center justify-between rounded-lg border border-border p-2">
                    <span className="text-xs capitalize text-navy">{k}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setSubratings((s: any) => ({ ...s, [k]: n }))} type="button">
                          <Star className={`h-4 w-4 ${n <= (subratings[k] || 0) ? 'fill-orange text-orange' : 'text-muted-foreground'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Your review</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share what you loved about this stay…"
                rows={5}
                className="rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={submit} disabled={submitting} className="rounded-full bg-orange text-white">
                {submitting ? 'Submitting…' : 'Submit review'}
              </Button>
              <Button variant="outline" onClick={() => setActive(null)} className="rounded-full">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {eligible.map((b: any) => (
            <Card key={b.id}>
              <CardContent className="flex items-center gap-4 p-4">
                {b.listing?.photos?.[0]?.url && (
                  <img src={b.listing.photos[0].url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-navy truncate">{b.listing?.title}</h3>
                  <p className="text-xs text-muted-foreground">{b.listing?.city} · Completed {formatDate(b.checkOut)}</p>
                </div>
                <Button onClick={() => setActive(b)} className="rounded-full bg-orange text-white">Write review</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// PAYMENTS TAB
// ============================================================
function PaymentsTab({ bookings, loading }: any) {
  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  const paid = bookings.filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
  const refunded = bookings.filter((b: any) => b.status === 'CANCELLED')
  const totalSpent = paid.reduce((s: number, b: any) => s + b.totalAmount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Payments</h1>
        <p className="text-sm text-muted-foreground">Your payment history and receipts.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total spent</p><p className="mt-1 text-2xl font-bold text-navy">{formatPrice(totalSpent)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Successful payments</p><p className="mt-1 text-2xl font-bold text-navy">{paid.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Refunds</p><p className="mt-1 text-2xl font-bold text-navy">{refunded.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-navy">Transaction history</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : bookings.map((b: any) => {
              const isRefund = b.status === 'CANCELLED'
              return (
                <div key={b.id} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                  <div className="flex items-center gap-3">
                    {b.listing?.photos?.[0]?.url && <img src={b.listing.photos[0].url} className="h-10 w-10 rounded-lg object-cover" alt="" />}
                    <div>
                      <p className="text-sm font-medium text-navy">{b.listing?.title}</p>
                      <p className="text-xs text-muted-foreground">{b.reference} · {formatDate(b.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${isRefund ? 'text-green-700' : 'text-navy'}`}>
                      {isRefund ? `+${formatPrice(b.totalAmount)}` : `−${formatPrice(b.totalAmount)}`}
                    </p>
                    <Badge variant="secondary" className={
                      b.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                      b.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                      b.status === 'CANCELLED' ? 'bg-blue-100 text-blue-700' :
                      'bg-navy/10 text-navy'
                    }>
                      {isRefund ? 'Refunded' : b.status}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// NOTIFICATIONS TAB
// ============================================================
function NotificationsTab({ notifications, loading, onRefresh }: any) {
  const { showToast } = useAppStore()

  const markAll = async () => {
    try {
      await markNotificationRead(undefined, true)
      onRefresh()
      showToast('All notifications marked as read', undefined, 'success')
    } catch (e: any) {
      showToast('Could not mark all read', e.message, 'error')
    }
  }

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay updated on your bookings, messages, and payouts.</p>
        </div>
        {notifications.some((n: any) => !n.isRead) && (
          <Button variant="outline" onClick={markAll} className="rounded-full">Mark all read</Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Bell className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            </CardContent>
          </Card>
        ) : notifications.map((n: any) => (
          <div key={n.id} className={`flex items-start gap-3 rounded-xl border border-border p-4 ${!n.isRead ? 'bg-peach-light/50' : 'bg-white'}`}>
            <div className={`mt-0.5 grid h-8 w-8 place-items-center rounded-full ${!n.isRead ? 'bg-orange text-white' : 'bg-muted text-muted-foreground'}`}>
              {n.type === 'BOOKING_CONFIRMED' ? <CheckCircle2 className="h-4 w-4" /> :
               n.type === 'MESSAGE_RECEIVED' ? <MessageCircle className="h-4 w-4" /> :
               n.type === 'RESERVATION_CANCELLED' ? <AlertCircle className="h-4 w-4" /> :
               <Bell className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <p className={`text-sm ${!n.isRead ? 'font-semibold text-navy' : 'font-medium text-navy/80'}`}>{n.title}</p>
              {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
              <p className="mt-1 text-[10px] text-muted-foreground">{formatRelativeDate(n.createdAt)}</p>
            </div>
            {!n.isRead && <span className="mt-1 h-2 w-2 rounded-full bg-orange" />}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// PROFILE TAB
// ============================================================
function ProfileTab() {
  const { user, showToast } = useAppStore()
  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal information and preferences.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
              <AvatarFallback className="bg-navy text-white text-xl">{user.name.split(' ').map(p => p[0]).slice(0, 2).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-navy">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-1 flex gap-2">
                <Badge variant="secondary" className="bg-peach-light text-navy">{user.role}</Badge>
                {user.isVerified && <Badge variant="secondary" className="bg-green-100 text-green-700">✓ Verified</Badge>}
                {user.isSuperhost && <Badge variant="secondary" className="bg-orange-100 text-orange-700">★ Superhost</Badge>}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Display name</Label>
              <Input defaultValue={user.name} className="mt-1 rounded-lg" />
            </div>
            <div>
              <Label>Email</Label>
              <Input defaultValue={user.email} disabled className="mt-1 rounded-lg" />
            </div>
            <div>
              <Label>Country</Label>
              <Input defaultValue={user.country || ''} placeholder="Add country" className="mt-1 rounded-lg" />
            </div>
            <div>
              <Label>Languages</Label>
              <Input defaultValue={user.role} disabled className="mt-1 rounded-lg" />
            </div>
            <div className="sm:col-span-2">
              <Label>Bio</Label>
              <Textarea defaultValue={user.bio || ''} placeholder="Tell hosts and guests about yourself…" rows={3} className="mt-1 rounded-lg" />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={() => showToast('Profile updates are read-only in this demo', undefined, 'default')} className="rounded-full bg-orange text-white">Save changes</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-navy">Account & security</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-navy">Two-factor authentication</p>
              <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => showToast('2FA not enabled in demo', undefined, 'default')}>Enable</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-navy">Login history</p>
              <p className="text-xs text-muted-foreground">See recent sign-ins to your account.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => showToast('No recent logins', undefined, 'default')}>View</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-navy">Delete account</p>
              <p className="text-xs text-muted-foreground">Permanently remove your account and data.</p>
            </div>
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => showToast('Account deletion not enabled in demo', undefined, 'default')}>Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// SUPPORT TAB
// ============================================================
function SupportTab({ bookings, loading, onRefresh }: any) {
  const { showToast } = useAppStore()
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('GENERAL')
  const [priority, setPriority] = useState('NORMAL')
  const [bookingId, setBookingId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!subject) { showToast('Subject required', undefined, 'error'); return }
    setSubmitting(true)
    try {
      await createSupportTicket({ subject, description, category, priority, bookingId: bookingId || undefined })
      showToast('Ticket created', 'Our team will respond within 24 hours.', 'success')
      setSubject(''); setDescription(''); setCategory('GENERAL'); setPriority('NORMAL'); setBookingId('')
      onRefresh()
    } catch (e: any) {
      showToast('Could not create ticket', e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Support</h1>
        <p className="text-sm text-muted-foreground">Get help with your bookings, payments, or account.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-navy">Open a support ticket</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Briefly describe your issue" className="mt-1 rounded-lg" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="BOOKING">Booking</SelectItem>
                  <SelectItem value="PAYMENT">Payment</SelectItem>
                  <SelectItem value="LISTING">Listing</SelectItem>
                  <SelectItem value="TRUST_SAFETY">Trust &amp; safety</SelectItem>
                  <SelectItem value="ACCOUNT">Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Related booking (optional)</Label>
              <Select value={bookingId} onValueChange={setBookingId}>
                <SelectTrigger className="mt-1 rounded-lg"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {bookings.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.reference} — {b.listing?.title?.slice(0, 30)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide as much detail as possible…" rows={5} className="mt-1 rounded-lg" />
          </div>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={submitting} className="rounded-full bg-orange text-white">
              {submitting ? 'Submitting…' : 'Submit ticket'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-navy">Quick help topics</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <HelpTopic q="How do I cancel a booking?" a="Open the Trips tab, find your booking, and tap Cancel. Refunds are processed based on the cancellation policy." />
          <HelpTopic q="When will I get my refund?" a="Refunds typically appear in your account within 5-10 business days, depending on your payment method." />
          <HelpTopic q="How do I message my host?" a="Open the Messages tab, select a conversation, and start chatting in real-time." />
          <HelpTopic q="Can I modify my dates?" a="Modifications require host approval. Open your booking details to request a change." />
        </CardContent>
      </Card>
    </div>
  )
}

function HelpTopic({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-border pb-2 last:border-0">
      <p className="font-medium text-navy">{q}</p>
      <p className="mt-1 text-muted-foreground">{a}</p>
    </div>
  )
}
