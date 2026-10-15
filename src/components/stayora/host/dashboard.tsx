'use client'

import { useEffect, useState } from 'react'
import { useAppStore, HostTab } from '@/store/useAppStore'
import {
  fetchHostDashboard, updateListingStatus, sendMessage, fetchConversations, fetchMessages,
  markRead, fetchNotifications, createListing, fetchListingQuality,
} from '@/lib/api'
import { formatPrice, formatDate, formatRelativeDate, formatNumber, CATEGORY_LABELS, CANCELLATION_LABELS } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar } from '@/components/ui/calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import {
  LayoutDashboard, Home, Calendar as CalendarIcon, Inbox, Wallet, BarChart3, Star, Users,
  MessageCircle, Crown, TrendingUp, DollarSign, Eye, Heart, Plus, Edit3, Eye as EyeIcon,
  MoreVertical, ArrowRight, Check, X, Clock, Zap, ShieldCheck, Settings2,
} from 'lucide-react'
import { TodayTab, VerificationsTab, AccountSettingsTab } from '@/components/stayora/host/host-extras'

// ============================================================
// NAV CONFIG
// ============================================================
const TABS: { id: HostTab; label: string; icon: any }[] = [
  { id: 'today', label: 'Today', icon: CalendarIcon },
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'listings', label: 'Listings', icon: Home },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'reservations', label: 'Reservations', icon: Clock },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'earnings', label: 'Earnings', icon: Wallet },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'cohosts', label: 'Co-hosts', icon: Users },
  { id: 'verifications', label: 'Verifications', icon: ShieldCheck },
  { id: 'account-settings', label: 'Settings', icon: Settings2 },
  { id: 'create', label: 'Create listing', icon: Plus },
]

// ============================================================
// SAVED REPLY TEMPLATES for host inbox
// ============================================================
const SAVED_REPLIES = [
  { label: 'Check-in info', text: 'Hi! Check-in is from 3:00 PM. The door code is ****. I\'ll send detailed instructions 24 hours before your arrival. Let me know if you have any questions!' },
  { label: 'Wi-Fi', text: 'The Wi-Fi network is Stayora-Guest and the password is welcometoourhome. Enjoy!' },
  { label: 'Parking', text: 'Free parking is available in the driveway. There\'s space for one vehicle. If you need street parking, look for spots on the north side of the street.' },
  { label: 'House rules', text: 'Quick reminder of our house rules: no smoking indoors, no parties, quiet hours after 10 PM, and please respect the neighbors. Pets are welcome with prior notice!' },
  { label: 'Check-out', text: 'Check-out is by 11:00 AM. Please leave the keys in the lockbox, turn off all lights and AC, and dispose of trash in the bins by the garage. Thanks for being a great guest!' },
  { label: 'Directions', text: 'The property is a 10-minute walk from the metro station. Exit the station, turn left on Main Street, and continue for 500 meters. The building is on the right with a blue door.' },
  { label: 'Not available', text: 'Unfortunately, those dates are not available. I\'d be happy to help you find alternative dates or recommend a similar property. Let me know what works for you!' },
  { label: 'Thanks for booking', text: 'Thank you for your booking! I\'m here to make your stay as comfortable as possible. Feel free to reach out with any questions before or during your stay.' },
]

// ============================================================
// MAIN COMPONENT
// ============================================================
export function HostDashboard() {
  const { user, hostTab, setHostTab, setView } = useAppStore()
  const [listings, setListings] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const refreshAll = () => {
    setLoading(true)
    fetchHostDashboard()
      .then((d: any) => {
        setListings(d.listings || [])
        setBookings(d.bookings || [])
        setPayouts(d.payouts || [])
        setStats(d.stats || null)
      })
      .catch(() => {
        setListings([])
        setBookings([])
        setPayouts([])
        setStats(null)
      })
      .finally(() => setLoading(false))
  }

  // Initial data fetch when the host user changes. Defers setState to a microtask
  // so we never call setState synchronously in the effect body (avoids cascading renders).
  useEffect(() => {
    let cancelled = false
    Promise.resolve()
      .then(() => { if (!cancelled) refreshAll() })
    return () => { cancelled = true }
  }, [user?.id])

  if (!user) return null

  const handleNav = (tab: HostTab) => {
    if (tab === 'create') {
      // Create-listing wizard lives in the parent app — switch views.
      setView('create-listing')
      return
    }
    setHostTab(tab)
  }

  // Pending reservations count badge
  const pendingReservations = bookings.filter((b: any) => b.status === 'PENDING').length

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
      {/* Left sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-20 rounded-2xl border border-border bg-white p-2">
          <HostProfileCard user={user} />
          <nav className="mt-2 space-y-0.5">
            {TABS.map(t => {
              const Icon = t.icon
              const active = hostTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => handleNav(t.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active ? 'bg-navy text-white' : 'text-navy/80 hover:bg-peach-light/60 hover:text-navy'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{t.label}</span>
                  {t.id === 'reservations' && pendingReservations > 0 && (
                    <Badge variant="secondary" className={`text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-orange text-white'}`}>{pendingReservations}</Badge>
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
        <div className="mb-4 flex gap-1 overflow-x-auto pb-1 lg:hidden stayora-scroll">
          {TABS.map(t => {
            const Icon = t.icon
            const active = hostTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => handleNav(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                  active ? 'bg-navy text-white' : 'bg-peach-light/60 text-navy'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            )
          })}
        </div>

        {hostTab === 'today' && <TodayTab />}
        {hostTab === 'overview' && (
          <OverviewTab listings={listings} bookings={bookings} payouts={payouts} stats={stats} loading={loading} onGoToTab={setHostTab} onCreateListing={() => setView('create-listing')} />
        )}
        {hostTab === 'listings' && (
          <ListingsTab listings={listings} loading={loading} onRefresh={refreshAll} onCreateListing={() => setView('create-listing')} />
        )}
        {hostTab === 'calendar' && <CalendarTab listings={listings} bookings={bookings} loading={loading} />}
        {hostTab === 'reservations' && <ReservationsTab bookings={bookings} loading={loading} onRefresh={refreshAll} />}
        {hostTab === 'inbox' && <InboxTab loading={loading} />}
        {hostTab === 'earnings' && <EarningsTab bookings={bookings} payouts={payouts} stats={stats} loading={loading} />}
        {hostTab === 'analytics' && <AnalyticsTab listings={listings} bookings={bookings} loading={loading} />}
        {hostTab === 'reviews' && <ReviewsTab bookings={bookings} loading={loading} />}
        {hostTab === 'cohosts' && <CoHostsTab listings={listings} />}
        {hostTab === 'create' && <CreateListingPlaceholder onCreateListing={() => setView('create-listing')} />}
        {hostTab === 'verifications' && <VerificationsTab />}
        {hostTab === 'account-settings' && <AccountSettingsTab />}
      </main>
    </div>
  )
}

// ============================================================
// HOST PROFILE CARD (sidebar)
// ============================================================
function HostProfileCard({ user }: { user: any }) {
  return (
    <div className="mb-2 flex items-center gap-3 border-b border-border p-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
        <AvatarFallback className="bg-navy text-white">
          {user.name?.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-navy">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">Host</p>
      </div>
      {user.isSuperhost && (
        <span title="Superhost" className="grid h-6 w-6 place-items-center rounded-full bg-orange text-white">
          <Crown className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  )
}

// ============================================================
// OVERVIEW TAB
// ============================================================
function OverviewTab({ listings, bookings, payouts, stats, loading, onGoToTab, onCreateListing }: any) {
  const { showToast } = useAppStore()
  const [notifications, setNotifications] = useState<any[]>([])

  // Load recent notifications on mount (setState runs inside the .then callback,
  // so it never fires synchronously in the effect body).
  useEffect(() => {
    let cancelled = false
    fetchNotifications()
      .then(d => { if (!cancelled) setNotifications(d.notifications || []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />
  if (!stats) {
    return <EmptyState icon={LayoutDashboard} title="No host data yet" subtitle="Create a listing to start earning." actionLabel="Create listing" onAction={onCreateListing} />
  }

  const upcomingBookings = bookings
    .filter((b: any) => b.status === 'CONFIRMED' && new Date(b.checkIn) >= new Date())
    .sort((a: any, b: any) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
    .slice(0, 5)

  const allReviews = bookings
    .flatMap((b: any) => (b.reviews || []).map((r: any) => ({ ...r, listing: b.listing, booking: b })))
    .filter((r: any) => r.authorId !== useAppStore.getState().user?.id)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  const pendingCount = bookings.filter((b: any) => b.status === 'PENDING').length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Host dashboard</h1>
          <p className="text-sm text-muted-foreground">Your performance, reservations, and earnings at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onGoToTab('reservations')} className="rounded-full border-navy/20 text-navy">
            View reservations {pendingCount > 0 && <Badge variant="secondary" className="ml-1 bg-orange text-white">{pendingCount}</Badge>}
          </Button>
          <Button onClick={onCreateListing} className="rounded-full bg-orange text-white">
            <Plus className="h-4 w-4" /> Add listing
          </Button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={DollarSign} label="Total revenue" value={formatPrice(stats.grossRevenue)} hint="gross" />
        <KpiCard icon={Wallet} label="Net earnings" value={formatPrice(stats.netEarnings)} hint="paid out" />
        <KpiCard icon={Clock} label="Upcoming check-ins" value={String(stats.upcomingCheckIns)} hint="confirmed" />
        <KpiCard icon={BarChart3} label="Occupancy" value={`${stats.occupancyRate}%`} hint="last 30d" />
        <KpiCard icon={DollarSign} label="Avg nightly rate" value={formatPrice(stats.avgNightlyRate)} hint="across listings" />
        <KpiCard icon={Home} label="Total listings" value={String(stats.totalListings)} hint="active" />
        <KpiCard icon={Check} label="Total bookings" value={String(stats.totalBookings)} hint="all time" />
        <KpiCard icon={Wallet} label="Pending payouts" value={formatPrice(stats.pendingPayouts)} hint="processing" />
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader><CardTitle className="text-navy">Quick actions</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction icon={Plus} label="Add listing" onClick={onCreateListing} />
          <QuickAction icon={Clock} label="View reservations" onClick={() => onGoToTab('reservations')} />
          <QuickAction icon={Inbox} label="Open inbox" onClick={() => onGoToTab('inbox')} />
          <QuickAction icon={Wallet} label="Track earnings" onClick={() => onGoToTab('earnings')} />
        </CardContent>
      </Card>

      {/* Recent reservations + reviews + notifications */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-navy">
              <span className="flex items-center gap-2"><Clock className="h-5 w-5 text-orange" /> Recent reservations</span>
              <Button variant="ghost" size="sm" onClick={() => onGoToTab('reservations')} className="text-orange">View all <ArrowRight className="h-3 w-3" /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingBookings.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No upcoming check-ins.</p>
            ) : upcomingBookings.map((b: any) => (
              <div key={b.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-peach-light/40">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={b.guest?.avatarUrl || undefined} alt={b.guest?.name} />
                  <AvatarFallback className="bg-peach text-navy text-xs">{b.guest?.name?.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-navy">{b.guest?.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.listing?.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-navy">{formatDate(b.checkIn, { month: 'short', day: 'numeric' })}</p>
                  <p className="text-[10px] text-muted-foreground">{b.nights}n · {formatPrice(b.totalAmount)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-navy">
              <span className="flex items-center gap-2"><Star className="h-5 w-5 text-orange" /> Recent reviews</span>
              <Button variant="ghost" size="sm" onClick={() => onGoToTab('reviews')} className="text-orange">View all <ArrowRight className="h-3 w-3" /></Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {allReviews.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No reviews yet.</p>
            ) : allReviews.map((r: any) => (
              <div key={r.id} className="flex items-start gap-3 rounded-lg p-2 hover:bg-peach-light/40">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={r.author?.avatarUrl || undefined} alt={r.author?.name} />
                  <AvatarFallback className="bg-peach text-navy text-xs">{r.author?.name?.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-navy">{r.author?.name}</p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-orange text-orange' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="stayora-line-clamp-2 text-xs text-muted-foreground">{r.body || 'No written review.'}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{formatRelativeDate(r.createdAt)} · {r.listing?.title}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy"><Inbox className="h-5 w-5 text-orange" /> Recent notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
            ) : notifications.slice(0, 4).map((n: any) => (
              <div key={n.id} className={`flex items-start gap-2 rounded-lg p-2 ${!n.isRead ? 'bg-peach-light/60' : ''}`}>
                <div className="flex-1">
                  <p className={`text-sm ${!n.isRead ? 'font-semibold text-navy' : 'font-medium text-navy/80'}`}>{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{formatRelativeDate(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, hint }: any) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 transition hover:shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-peach-light">
          <Icon className="h-4 w-4 text-navy" />
        </div>
        {hint && <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{hint}</span>}
      </div>
      <p className="text-2xl font-bold text-navy">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function QuickAction({ icon: Icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-xl border border-border bg-white p-3 text-left transition hover:border-orange/40 hover:shadow-sm">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-orange/10 text-orange">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-medium text-navy">{label}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </button>
  )
}

function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }: any) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Icon className="h-10 w-10 text-muted-foreground" />
        <h3 className="font-semibold text-navy">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{subtitle}</p>
        {actionLabel && (
          <Button onClick={onAction} className="mt-2 rounded-full bg-orange text-white">
            <Plus className="h-4 w-4" /> {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================
// LISTINGS TAB
// ============================================================
function ListingsTab({ listings, loading, onRefresh, onCreateListing }: any) {
  const { showToast } = useAppStore()
  const [filter, setFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'PAUSED'>('ALL')
  const [toggling, setToggling] = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  const filtered = filter === 'ALL' ? listings : listings.filter((l: any) => l.status === filter)

  const handleToggleStatus = async (listing: any) => {
    const next = listing.status === 'PUBLISHED' ? 'PAUSED' : 'PUBLISHED'
    setToggling(listing.id)
    try {
      await updateListingStatus(listing.id, next)
      showToast(
        next === 'PUBLISHED' ? 'Listing published' : 'Listing paused',
        next === 'PUBLISHED' ? 'Your listing is now live and bookable.' : 'Bookings are paused for this listing.',
        'success',
      )
      onRefresh()
    } catch (e: any) {
      showToast('Could not update status', e?.message, 'error')
    } finally {
      setToggling(null)
    }
  }

  const handleDuplicate = async (listing: any) => {
    setDuplicating(listing.id)
    try {
      await createListing({
        title: `${listing.title} (copy)`,
        description: listing.description,
        category: listing.category,
        roomType: listing.roomType,
        country: listing.country,
        city: listing.city,
        neighborhood: listing.neighborhood,
        maxGuests: listing.maxGuests,
        bedrooms: listing.bedrooms,
        beds: listing.beds,
        bathrooms: listing.bathrooms,
        basePrice: listing.basePrice,
        currency: listing.currency,
        cleaningFee: listing.cleaningFee,
        extraGuestFee: listing.extraGuestFee,
        weeklyDiscountPct: listing.weeklyDiscountPct,
        monthlyDiscountPct: listing.monthlyDiscountPct,
        minNights: listing.minNights,
        maxNights: listing.maxNights,
        checkInTime: listing.checkInTime,
        checkOutTime: listing.checkOutTime,
        instantBook: listing.instantBook,
        cancellationPolicy: listing.cancellationPolicy,
        allowsPets: listing.allowsPets,
        allowsSmoking: listing.allowsSmoking,
        allowsParties: listing.allowsParties,
        amenities: listing.amenities,
        status: 'DRAFT',
      })
      showToast('Listing duplicated', 'A draft copy has been created.', 'success')
      onRefresh()
    } catch (e: any) {
      showToast('Could not duplicate listing', e?.message, 'error')
    } finally {
      setDuplicating(null)
    }
  }

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Your listings</h1>
          <p className="text-sm text-muted-foreground">Manage availability, pricing, and live status for each property.</p>
        </div>
        <Button onClick={onCreateListing} className="rounded-full bg-orange text-white">
          <Plus className="h-4 w-4" /> Add new listing
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['ALL', 'PUBLISHED', 'DRAFT', 'PAUSED'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === s ? 'bg-navy text-white' : 'border border-border bg-white text-navy/70 hover:bg-peach-light/60'
            }`}
          >
            {s === 'ALL' ? `All (${listings.length})` : `${s.charAt(0) + s.slice(1).toLowerCase()} (${listings.filter((l: any) => l.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No listings here yet"
          subtitle={filter === 'ALL' ? 'Create your first listing to start welcoming guests.' : `You have no ${filter.toLowerCase()} listings.`}
          actionLabel={filter === 'ALL' ? 'Create listing' : undefined}
          onAction={onCreateListing}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((l: any) => (
            <ListingCard
              key={l.id}
              listing={l}
              toggling={toggling === l.id}
              duplicating={duplicating === l.id}
              onToggle={() => handleToggleStatus(l)}
              onDuplicate={() => handleDuplicate(l)}
              onEdit={() => showToast('Edit coming soon', 'The listing editor is not enabled in this demo.', 'default')}
              onPreview={() => showToast('Preview coming soon', 'Preview mode is read-only in this demo.', 'default')}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ListingCard({ listing, toggling, duplicating, onToggle, onDuplicate, onEdit, onPreview }: any) {
  const cover = listing.photos?.[0]?.url || listing.coverImage
  const statusVariant = listing.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : listing.status === 'DRAFT' ? 'bg-muted text-muted-foreground' : 'bg-orange-100 text-orange-700'
  const [qualityScore, setQualityScore] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchListingQuality(listing.id)
      .then((r: any) => { if (!cancelled) setQualityScore(r.score) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [listing.id])

  const qualityColor = qualityScore === null ? 'bg-muted text-muted-foreground' : qualityScore >= 80 ? 'bg-green-100 text-green-700' : qualityScore >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'

  return (
    <Card className="overflow-hidden transition hover:shadow-md">
      <div className="relative aspect-[4/3] w-full bg-muted">
        {cover ? (
          <img src={cover} alt={listing.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground"><Home className="h-8 w-8" /></div>
        )}
        <div className="absolute left-2 top-2 flex gap-1.5">
          <Badge variant="secondary" className={statusVariant}>{listing.status}</Badge>
          {listing.instantBook && (
            <Badge variant="secondary" className="bg-orange text-white"><Zap className="h-3 w-3" /> Instant</Badge>
          )}
        </div>
        {qualityScore !== null && (
          <div className="absolute right-2 top-2">
            <Badge variant="secondary" className={qualityColor} title="Listing completeness score">
              {qualityScore}% complete
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="truncate font-semibold text-navy">{listing.title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {listing.city}, {listing.country} · {CATEGORY_LABELS[listing.category] || listing.category}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Cancellation: {CANCELLATION_LABELS[listing.cancellationPolicy] || listing.cancellationPolicy}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5 text-navy" /> {formatPrice(listing.basePrice)}</span>
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-orange" /> {listing.rating?.toFixed(1) || '—'} ({listing.reviewCount})</span>
          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {formatNumber(listing.views || 0)}</span>
          <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {formatNumber(listing.wishlistSaves || 0)}</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            size="sm"
            onClick={onToggle}
            disabled={toggling}
            className={`rounded-full ${listing.status === 'PUBLISHED' ? 'bg-navy text-white' : 'bg-orange text-white'}`}
          >
            {toggling ? 'Updating…' : listing.status === 'PUBLISHED' ? 'Pause' : 'Publish'}
          </Button>

          <div className="flex items-center gap-1">
            <IconAction icon={Edit3} label="Edit" onClick={onEdit} />
            <IconAction icon={EyeIcon} label="Preview" onClick={onPreview} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-peach-light/60 hover:text-navy" aria-label="More actions">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDuplicate} disabled={duplicating}>
                  {duplicating ? 'Duplicating…' : 'Duplicate listing'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onEdit}>Edit details</DropdownMenuItem>
                <DropdownMenuItem onClick={onPreview}>Preview as guest</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function IconAction({ icon: Icon, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-peach-light/60 hover:text-navy"
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

// ============================================================
// CALENDAR TAB
// ============================================================
function CalendarTab({ listings, bookings, loading }: any) {
  const { showToast } = useAppStore()
  const [selectedListingId, setSelectedListingId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [blocked, setBlocked] = useState<Set<string>>(new Set())

  // Derive the effective listing without a setState-in-effect (avoids cascading renders).
  const effectiveListingId = selectedListingId || (listings[0]?.id ?? '')

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  if (listings.length === 0) {
    return <EmptyState icon={CalendarIcon} title="No listings to schedule" subtitle="Create a listing to manage its availability calendar." />
  }

  const selectedListing = listings.find((l: any) => l.id === effectiveListingId) || listings[0]

  // Compute reserved date set for the selected listing
  const reservedSet = new Set<string>()
  for (const b of bookings) {
    if (b.listingId !== selectedListing.id) continue
    if (b.status === 'CANCELLED') continue
    const start = new Date(b.checkIn)
    const end = new Date(b.checkOut)
    const cur = new Date(start)
    while (cur < end) {
      reservedSet.add(cur.toISOString().split('T')[0])
      cur.setDate(cur.getDate() + 1)
    }
  }
  // Merge blocked (host-blocked) into reserved view
  const allBlocked = new Set<string>([...reservedSet, ...blocked])

  const dayStatus = (date: Date): 'available' | 'reserved' | 'blocked' => {
    const key = date.toISOString().split('T')[0]
    if (reservedSet.has(key)) return 'reserved'
    if (blocked.has(key)) return 'blocked'
    return 'available'
  }

  const toggleBlock = () => {
    if (!selectedDate) {
      showToast('Pick a date first', undefined, 'error')
      return
    }
    const key = selectedDate.toISOString().split('T')[0]
    const next = new Set(blocked)
    if (next.has(key)) {
      next.delete(key)
      showToast('Date unblocked', 'Guests can now book this date.', 'success')
    } else {
      next.add(key)
      showToast('Date blocked', 'Guests cannot book this date.', 'default')
    }
    setBlocked(next)
  }

  const selectedStatus = selectedDate ? dayStatus(selectedDate) : 'available'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Calendar</h1>
        <p className="text-sm text-muted-foreground">Manage availability and block dates for individual listings.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-navy">
              <span className="flex items-center gap-2"><CalendarIcon className="h-5 w-5 text-orange" /> Availability</span>
              <Select value={effectiveListingId} onValueChange={setSelectedListingId}>
                <SelectTrigger className="h-8 w-[220px] rounded-lg"><SelectValue placeholder="Select listing" /></SelectTrigger>
                <SelectContent>
                  {listings.map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-lg"
              modifiers={{
                reserved: (date: Date) => {
                  const key = date.toISOString().split('T')[0]
                  return reservedSet.has(key)
                },
                blocked: (date: Date) => {
                  const key = date.toISOString().split('T')[0]
                  return blocked.has(key)
                },
              }}
              modifiersStyles={{
                reserved: { backgroundColor: '#1a2c4f', color: '#ffffff', borderRadius: '6px' },
                blocked: { backgroundColor: '#fce8d8', color: '#1a2c4f', textDecoration: 'line-through', borderRadius: '6px' },
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-navy">Selected date</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {selectedDate ? (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-semibold text-navy">{formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant="secondary" className={
                      selectedStatus === 'reserved' ? 'bg-navy text-white' :
                      selectedStatus === 'blocked' ? 'bg-orange text-white' :
                      'bg-green-100 text-green-700'
                    }>{selectedStatus}</Badge>
                  </div>
                  <Button onClick={toggleBlock} className="w-full rounded-full bg-orange text-white">
                    {selectedStatus === 'blocked' ? 'Unblock date' : 'Block date'}
                  </Button>
                  <p className="text-[10px] text-muted-foreground">Block dates to prevent new bookings (e.g., for personal use or maintenance).</p>
                </>
              ) : (
                <p className="text-muted-foreground">Select a date on the calendar.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-navy">Legend</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <LegendRow color="bg-green-500" label="Available" />
              <LegendRow color="bg-navy" label="Reserved / booked" />
              <LegendRow color="bg-peach-light" label="Blocked by host" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-4 w-4 rounded ${color}`} />
      <span className="text-navy/80">{label}</span>
    </div>
  )
}

// ============================================================
// RESERVATIONS TAB
// ============================================================
function ReservationsTab({ bookings, loading, onRefresh }: any) {
  const { showToast } = useAppStore()
  const [acting, setActing] = useState<string | null>(null)

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b: any) => b.status === 'PENDING').length,
    confirmed: bookings.filter((b: any) => b.status === 'CONFIRMED').length,
    completed: bookings.filter((b: any) => b.status === 'COMPLETED').length,
    cancelled: bookings.filter((b: any) => b.status === 'CANCELLED').length,
  }

  const handleAccept = async (bookingId: string) => {
    setActing(bookingId)
    try {
      // No backend endpoint for booking-status changes in this demo
      await new Promise(r => setTimeout(r, 350))
      showToast('Reservation accepted', 'The guest has been notified.', 'success')
      onRefresh()
    } finally {
      setActing(null)
    }
  }

  const handleDecline = async (bookingId: string) => {
    setActing(bookingId)
    try {
      await new Promise(r => setTimeout(r, 350))
      showToast('Reservation declined', 'The guest has been notified.', 'default')
      onRefresh()
    } finally {
      setActing(null)
    }
  }

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Reservations</h1>
        <p className="text-sm text-muted-foreground">Review booking requests and manage your guest roster.</p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState icon={Clock} title="No reservations yet" subtitle="Once guests book your listings, their reservations will appear here." />
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed ({counts.confirmed})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({counts.cancelled})</TabsTrigger>
          </TabsList>

          <TabsContent value="all"><ReservationsTable bookings={bookings} acting={acting} onAccept={handleAccept} onDecline={handleDecline} /></TabsContent>
          <TabsContent value="pending"><ReservationsTable bookings={bookings.filter((b: any) => b.status === 'PENDING')} acting={acting} onAccept={handleAccept} onDecline={handleDecline} /></TabsContent>
          <TabsContent value="confirmed"><ReservationsTable bookings={bookings.filter((b: any) => b.status === 'CONFIRMED')} acting={acting} onAccept={handleAccept} onDecline={handleDecline} /></TabsContent>
          <TabsContent value="completed"><ReservationsTable bookings={bookings.filter((b: any) => b.status === 'COMPLETED')} acting={acting} onAccept={handleAccept} onDecline={handleDecline} /></TabsContent>
          <TabsContent value="cancelled"><ReservationsTable bookings={bookings.filter((b: any) => b.status === 'CANCELLED')} acting={acting} onAccept={handleAccept} onDecline={handleDecline} /></TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function ReservationsTable({ bookings, acting, onAccept, onDecline }: any) {
  if (bookings.length === 0) {
    return <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No reservations in this category.</CardContent></Card>
  }
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Listing</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Nights</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={b.guest?.avatarUrl || undefined} alt={b.guest?.name} />
                        <AvatarFallback className="bg-peach text-navy text-[10px]">{b.guest?.name?.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-navy">{b.guest?.name}</p>
                        <p className="text-[10px] text-muted-foreground">{b.reference}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-sm text-navy">{b.listing?.title}</TableCell>
                  <TableCell className="text-sm text-navy">{formatDate(b.checkIn, { month: 'short', day: 'numeric' })}</TableCell>
                  <TableCell className="text-sm text-navy">{formatDate(b.checkOut, { month: 'short', day: 'numeric' })}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.nights}</TableCell>
                  <TableCell className="text-sm font-semibold text-navy">{formatPrice(b.totalAmount)}</TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {b.status === 'PENDING' ? (
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" onClick={() => onAccept(b.id)} disabled={acting === b.id} className="rounded-full bg-navy text-white">
                          <Check className="h-3 w-3" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onDecline(b.id)} disabled={acting === b.id} className="rounded-full">
                          <X className="h-3 w-3" /> Decline
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-orange-100 text-orange-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-navy/10 text-navy',
    CANCELLED: 'bg-destructive/10 text-destructive',
  }
  return <Badge variant="secondary" className={map[status] || 'bg-muted text-muted-foreground'}>{status}</Badge>
}

// ============================================================
// INBOX TAB
// ============================================================
function InboxTab({ loading }: any) {
  const { user, showToast } = useAppStore()
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [convLoading, setConvLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setConvLoading(loading)
    fetchConversations()
      .then(d => { if (!cancelled) setConversations(d.conversations || []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setConvLoading(false) })
    return () => { cancelled = true }
  }, [loading, user?.id])

  // Poll active conversation messages every 10s
  useEffect(() => {
    if (!activeConv) return
    let cancelled = false
    const load = () => {
      setLoadingMsgs(true)
      fetchMessages(activeConv)
        .then(d => {
          if (cancelled) return
          setMessages(d.messages || [])
          markRead(activeConv).then(() => {
            // refresh conversation list unread state
            fetchConversations().then(d2 => { if (!cancelled) setConversations(d2.conversations || []) }).catch(() => {})
          }).catch(() => {})
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoadingMsgs(false) })
    }
    load()
    const timer = setInterval(load, 10000)
    return () => { cancelled = true; clearInterval(timer) }
  }, [activeConv])

  const send = async () => {
    if (!input.trim() || !activeConv) return
    setSending(true)
    try {
      const r = await sendMessage({ conversationId: activeConv, body: input })
      setMessages(m => [...m, r.message])
      setInput('')
    } catch (e: any) {
      showToast('Could not send message', e?.message, 'error')
    } finally {
      setSending(false)
    }
  }

  if (convLoading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-navy">Inbox</h1>
        <p className="text-sm text-muted-foreground">Messages from guests and Stayora support. Auto-refreshes every 10s.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        {/* Conversations list */}
        <div className="rounded-2xl border border-border bg-white overflow-hidden">
          <div className="border-b border-border p-3">
            <p className="text-sm font-semibold text-navy">{conversations.length} conversation{conversations.length === 1 ? '' : 's'}</p>
          </div>
          <div className="max-h-[60vh] overflow-y-auto stayora-scroll">
            {conversations.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">No conversations yet.</p>
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
                    <AvatarFallback className="bg-peach text-navy text-xs">{other?.name?.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}</AvatarFallback>
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
        <div className="flex h-[60vh] flex-col rounded-2xl border border-border bg-white">
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
              <div className="flex-1 overflow-y-auto stayora-scroll space-y-3 p-4">
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
              <div className="border-t border-border p-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                    placeholder="Type a message…"
                    className="rounded-full"
                  />
                  <Button onClick={send} disabled={!input.trim() || sending} className="rounded-full bg-orange text-white shrink-0">
                    {sending ? 'Sending…' : 'Send'}
                  </Button>
                </div>
                {/* Saved replies */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground self-center">Quick replies:</span>
                  {SAVED_REPLIES.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(r.text)}
                      className="rounded-full bg-peach-light/60 px-2.5 py-1 text-[10px] font-medium text-navy hover:bg-peach-light transition"
                      title={r.text}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// EARNINGS TAB
// ============================================================
function EarningsTab({ bookings, payouts, stats, loading }: any) {
  const { showToast } = useAppStore()
  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  const completedPayouts = payouts.filter((p: any) => p.status === 'COMPLETED')
  const pendingPayouts = payouts.filter((p: any) => p.status === 'PENDING')
  const grossRevenue = stats?.grossRevenue ?? bookings.reduce((s: number, b: any) => s + b.totalAmount, 0)
  const netEarnings = stats?.netEarnings ?? completedPayouts.reduce((s: number, p: any) => s + p.amount, 0)
  const pendingTotal = stats?.pendingPayouts ?? pendingPayouts.reduce((s: number, p: any) => s + p.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Earnings</h1>
          <p className="text-sm text-muted-foreground">Track your revenue, payouts, and projected income.</p>
        </div>
        <Button variant="outline" onClick={() => showToast('Export started', 'Your CSV will download shortly.', 'default')} className="rounded-full">
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={DollarSign} label="Gross revenue" value={formatPrice(grossRevenue)} accent="bg-peach-light text-navy" />
        <SummaryCard icon={Wallet} label="Net earnings" value={formatPrice(netEarnings)} accent="bg-navy text-white" />
        <SummaryCard icon={Clock} label="Pending payouts" value={formatPrice(pendingTotal)} accent="bg-orange-100 text-orange-700" />
        <SummaryCard icon={Check} label="Completed payouts" value={String(completedPayouts.length)} accent="bg-green-100 text-green-700" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-navy">Payout history</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">No payouts yet.</TableCell>
                  </TableRow>
                ) : payouts.map((p: any) => {
                  const booking = bookings.find((b: any) => b.id === p.bookingId)
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm text-navy">{booking?.reference || p.bookingId.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm font-semibold text-navy">{formatPrice(p.amount)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.currency}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : p.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-destructive/10 text-destructive'}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground capitalize">{p.provider}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.scheduledAt ? formatDate(p.scheduledAt) : '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.completedAt ? formatDate(p.completedAt) : '—'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, accent }: any) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className={`grid h-9 w-9 place-items-center rounded-lg ${accent}`}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="text-2xl font-bold text-navy">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

// ============================================================
// ANALYTICS TAB
// ============================================================
function AnalyticsTab({ listings, bookings, loading }: any) {
  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />
  if (listings.length === 0) {
    return <EmptyState icon={BarChart3} title="No analytics yet" subtitle="Publish a listing to start seeing impression and conversion data." />
  }

  // Aggregate per-listing metrics
  const rows = listings.map((l: any) => {
    const listingBookings = bookings.filter((b: any) => b.listingId === l.id)
    const impressions = (l.views || 0) * 3 + 50 // mock lift
    const detailViews = l.views || 0
    const wishlistSaves = l.wishlistSaves || 0
    const bookingInquiries = listingBookings.length
    const bookingConfirmed = listingBookings.filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED').length
    const revenue = listingBookings.reduce((s: number, b: any) => s + b.totalAmount, 0)
    return {
      id: l.id,
      title: l.title,
      impressions,
      detailViews,
      wishlistSaves,
      bookingInquiries,
      bookingConfirmed,
      revenue,
    }
  })

  const totals = {
    impressions: rows.reduce((s, r) => s + r.impressions, 0),
    detailViews: rows.reduce((s, r) => s + r.detailViews, 0),
    wishlistSaves: rows.reduce((s, r) => s + r.wishlistSaves, 0),
    bookingInquiries: rows.reduce((s, r) => s + r.bookingInquiries, 0),
    bookingConfirmed: rows.reduce((s, r) => s + r.bookingConfirmed, 0),
    revenue: rows.reduce((s, r) => s + r.revenue, 0),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Analytics</h1>
        <p className="text-sm text-muted-foreground">Performance insights across all your listings.</p>
      </div>

      {/* Top metric cards with trend */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard icon={Eye} label="Impressions" value={formatNumber(totals.impressions)} delta={+12} />
        <MetricCard icon={EyeIcon} label="Detail views" value={formatNumber(totals.detailViews)} delta={+8} />
        <MetricCard icon={Heart} label="Wishlist saves" value={formatNumber(totals.wishlistSaves)} delta={+5} />
        <MetricCard icon={MessageCircle} label="Booking inquiries" value={formatNumber(totals.bookingInquiries)} delta={-3} />
        <MetricCard icon={Check} label="Bookings confirmed" value={formatNumber(totals.bookingConfirmed)} delta={+15} />
        <MetricCard icon={DollarSign} label="Revenue" value={formatPrice(totals.revenue)} delta={+22} />
      </div>

      {/* Per-listing bar charts */}
      <Card>
        <CardHeader><CardTitle className="text-navy">Performance by listing</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {rows.map((r) => {
            const maxRevenue = Math.max(...rows.map(x => x.revenue), 1)
            const maxImpressions = Math.max(...rows.map(x => x.impressions), 1)
            return (
              <div key={r.id} className="space-y-2 rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="truncate text-sm font-semibold text-navy">{r.title}</h4>
                  <span className="shrink-0 text-sm font-bold text-orange">{formatPrice(r.revenue)}</span>
                </div>
                <div className="space-y-2">
                  <BarRow label="Impressions" value={r.impressions} max={maxImpressions} color="bg-navy" />
                  <BarRow label="Detail views" value={r.detailViews} max={maxImpressions} color="bg-navy-light" />
                  <BarRow label="Wishlist saves" value={r.wishlistSaves} max={Math.max(...rows.map(x => x.wishlistSaves), 1)} color="bg-orange" />
                  <BarRow label="Bookings" value={r.bookingConfirmed} max={Math.max(...rows.map(x => x.bookingConfirmed), 1)} color="bg-orange-light" />
                  <BarRow label="Revenue" value={r.revenue} max={maxRevenue} color="bg-orange" format={(v: number) => formatPrice(v)} />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-navy">Conversion funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <FunnelRow label="Impressions" value={totals.impressions} max={totals.impressions} color="bg-navy" />
            <FunnelRow label="Detail views" value={totals.detailViews} max={totals.impressions} color="bg-navy-light" />
            <FunnelRow label="Inquiries" value={totals.bookingInquiries} max={totals.impressions} color="bg-orange-light" />
            <FunnelRow label="Confirmed" value={totals.bookingConfirmed} max={totals.impressions} color="bg-orange" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, delta }: any) {
  const positive = delta >= 0
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-peach-light">
            <Icon className="h-4 w-4 text-navy" />
          </span>
          <span className={`flex items-center gap-1 text-xs font-medium ${positive ? 'text-green-600' : 'text-destructive'}`}>
            <TrendingUp className={`h-3 w-3 ${positive ? '' : 'rotate-180'}`} />
            {positive ? '+' : ''}{delta}% <span className="text-muted-foreground">vs last period</span>
          </span>
        </div>
        <p className="mt-3 text-2xl font-bold text-navy">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

function BarRow({ label, value, max, color, format }: any) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-navy">{format ? format(value) : formatNumber(value)}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function FunnelRow({ label, value, max, color }: any) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const rate = max > 0 ? ((value / max) * 100).toFixed(1) : '0.0'
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-navy">{label}</span>
        <span className="text-muted-foreground">{formatNumber(value)} <span className="ml-2 text-xs">({rate}%)</span></span>
      </div>
      <div className="h-3 w-full rounded-full bg-muted">
        <div className={`h-3 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ============================================================
// REVIEWS TAB
// ============================================================
function ReviewsTab({ bookings, loading }: any) {
  const { showToast } = useAppStore()
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3'>('all')
  const [responding, setResponding] = useState<string | null>(null)
  const [responseBody, setResponseBody] = useState('')

  const allReviews = bookings
    .flatMap((b: any) => (b.reviews || []).map((r: any) => ({ ...r, listing: b.listing, booking: b })))
    .filter((r: any) => r.authorId !== useAppStore.getState().user?.id)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const filtered = allReviews.filter((r: any) => {
    if (filter === 'all') return true
    if (filter === '5') return r.rating === 5
    if (filter === '4') return r.rating === 4
    if (filter === '3') return r.rating <= 3
    return true
  })

  const avg = allReviews.length ? (allReviews.reduce((s: number, r: any) => s + r.rating, 0) / allReviews.length).toFixed(2) : '0.00'

  const submitResponse = async (reviewId: string) => {
    if (!responseBody.trim()) {
      showToast('Response cannot be empty', undefined, 'error')
      return
    }
    setResponding(reviewId)
    try {
      const { replyToReview } = await import('@/lib/api')
      await replyToReview(reviewId, responseBody.trim())
      // Update local state so the UI reflects the reply immediately
      const target = allReviews.find((r: any) => r.id === reviewId)
      if (target) {
        target.hostReply = responseBody.trim()
        target.hostReplyAt = new Date().toISOString()
      }
      showToast('Response published', 'Your reply is now visible to guests.', 'success')
      setResponding(null)
      setResponseBody('')
    } catch (e: any) {
      showToast('Could not post response', e?.message, 'error')
    }
  }

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Reviews</h1>
        <p className="text-sm text-muted-foreground">Read what guests say about your properties and respond publicly.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total reviews</p><p className="mt-1 text-2xl font-bold text-navy">{allReviews.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Average rating</p><p className="mt-1 flex items-center gap-1 text-2xl font-bold text-navy"><Star className="h-5 w-5 fill-orange text-orange" /> {avg}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Response rate</p><p className="mt-1 text-2xl font-bold text-navy">—</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', '5', '4', '3'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === s ? 'bg-navy text-white' : 'border border-border bg-white text-navy/70 hover:bg-peach-light/60'
            }`}
          >
            {s === 'all' ? 'All ratings' : s === '5' ? '5 ★' : s === '4' ? '4 ★' : '3 ★ and below'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Star} title="No reviews in this filter" subtitle="Try adjusting the rating filter to see more reviews." />
      ) : (
        <div className="space-y-3">
          {filtered.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={r.author?.avatarUrl || undefined} alt={r.author?.name} />
                    <AvatarFallback className="bg-peach text-navy text-xs">{r.author?.name?.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-navy">{r.author?.name}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-orange text-orange' : 'text-muted-foreground/30'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground">· {formatRelativeDate(r.createdAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.listing?.title}</p>
                    {r.body && <p className="mt-2 text-sm text-navy/90">{r.body}</p>}

                    {responding === r.id ? (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          autoFocus
                          value={responseBody}
                          onChange={(e) => setResponseBody(e.target.value)}
                          placeholder="Write your public response…"
                          rows={3}
                          className="rounded-lg"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => submitResponse(r.id)} disabled={!responseBody.trim()} className="rounded-full bg-orange text-white">
                            Publish response
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setResponding(null); setResponseBody('') }} className="rounded-full">Cancel</Button>
                        </div>
                      </div>
                    ) : r.hostReply ? (
                      <div className="mt-3 rounded-lg bg-peach-light/60 p-3">
                        <p className="mb-1 text-xs font-semibold text-navy">Your response:</p>
                        <p className="text-sm text-foreground">{r.hostReply}</p>
                        {r.hostReplyAt && <p className="mt-1 text-[10px] text-muted-foreground">{formatRelativeDate(r.hostReplyAt)}</p>}
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => { setResponding(r.id); setResponseBody('') }} className="mt-3 rounded-full">
                        Respond
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// CO-HOSTS TAB
// ============================================================
interface CoHost {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: 'OWNER' | 'CO_HOST' | 'CLEANER' | 'CONCIERGE'
  permissions: string[]
  listingIds: string[]
}

const MOCK_COHOSTS: CoHost[] = [
  { id: '1', name: 'Aisha Patel', email: 'aisha@example.com', role: 'CO_HOST', permissions: ['manage_calendar', 'respond_messages', 'view_earnings'], listingIds: ['all'] },
  { id: '2', name: 'Marco Rinaldi', email: 'marco@example.com', role: 'CLEANER', permissions: ['view_calendar'], listingIds: ['all'] },
  { id: '3', name: 'Sofia Chen', email: 'sofia@example.com', role: 'CONCIERGE', permissions: ['respond_messages', 'manage_bookings'], listingIds: ['all'] },
]

const ROLE_LABELS: Record<CoHost['role'], string> = {
  OWNER: 'Owner',
  CO_HOST: 'Co-host',
  CLEANER: 'Cleaner',
  CONCIERGE: 'Concierge',
}

const PERMISSION_LABELS: Record<string, string> = {
  manage_calendar: 'Manage calendar',
  respond_messages: 'Respond to messages',
  view_earnings: 'View earnings',
  manage_bookings: 'Manage bookings',
  edit_listing: 'Edit listing details',
}

function CoHostsTab({ listings }: { listings: any[] }) {
  const { showToast } = useAppStore()
  const [cohosts, setCohosts] = useState<CoHost[]>(MOCK_COHOSTS)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [perms, setPerms] = useState<Record<string, boolean>>({
    manage_calendar: true,
    respond_messages: true,
    view_earnings: false,
    manage_bookings: false,
    edit_listing: false,
  })

  const sendInvite = () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Enter a valid email', undefined, 'error')
      return
    }
    const selectedPerms = Object.keys(perms).filter(k => perms[k])
    showToast('Invitation sent', `Email sent to ${email} with ${selectedPerms.length} permission${selectedPerms.length === 1 ? '' : 's'}.`, 'success')
    setCohosts(c => [...c, { id: `${c.length + 1}`, name: email.split('@')[0], email, role: 'CO_HOST', permissions: selectedPerms, listingIds: ['all'] }])
    setEmail('')
    setInviteOpen(false)
  }

  const togglePerm = (key: string) => setPerms(p => ({ ...p, [key]: !p[key] }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Co-hosts</h1>
          <p className="text-sm text-muted-foreground">Invite teammates and delegate tasks for your listings.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="rounded-full bg-orange text-white">
          <Plus className="h-4 w-4" /> Invite co-host
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-navy">Team members</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {cohosts.map(ch => {
            const assignedListings = ch.listingIds.includes('all') ? listings : listings.filter(l => ch.listingIds.includes(l.id))
            return (
              <div key={ch.id} className="flex flex-wrap items-start gap-3 rounded-xl border border-border p-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={ch.avatarUrl || undefined} alt={ch.name} />
                  <AvatarFallback className="bg-navy text-white text-xs">{ch.name.split(' ').map(p => p[0]).slice(0, 2).join('')}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy">{ch.name}</p>
                    <Badge variant="secondary" className={
                      ch.role === 'OWNER' ? 'bg-orange text-white' :
                      ch.role === 'CO_HOST' ? 'bg-navy text-white' :
                      'bg-peach text-navy'
                    }>{ROLE_LABELS[ch.role]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{ch.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ch.permissions.map(p => (
                      <Badge key={p} variant="outline" className="text-[10px] font-normal text-navy/70">{PERMISSION_LABELS[p] || p}</Badge>
                    ))}
                    {ch.permissions.length === 0 && <span className="text-xs text-muted-foreground">No permissions</span>}
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Assigned to: {assignedListings.length === listings.length ? 'All listings' : assignedListings.length > 0 ? assignedListings.map(l => l.title).join(', ') : 'No listings'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => showToast('Edit permissions coming soon', undefined, 'default')} className="text-navy">
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => showToast('Removal coming soon', undefined, 'default')} className="text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-navy">Roles & permissions</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Calendar</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>Edit listing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <PermissionRow role="Owner" perms={[true, true, true, true, true]} />
              <PermissionRow role="Co-host" perms={[true, true, true, false, false]} />
              <PermissionRow role="Cleaner" perms={[true, false, false, false, false]} />
              <PermissionRow role="Concierge" perms={[false, true, true, false, false]} />
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-navy">Invite a co-host</DialogTitle>
            <DialogDescription>Send an invitation by email and pick the permissions you want to grant.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
                className="mt-1 rounded-lg"
              />
            </div>
            <div>
              <Label className="mb-2 block">Permissions</Label>
              <div className="space-y-2">
                {Object.keys(PERMISSION_LABELS).map(key => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2 hover:bg-peach-light/40">
                    <Checkbox checked={perms[key]} onCheckedChange={() => togglePerm(key)} />
                    <span className="text-sm text-navy">{PERMISSION_LABELS[key]}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} className="rounded-full">Cancel</Button>
            <Button onClick={sendInvite} className="rounded-full bg-orange text-white">Send invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PermissionRow({ role, perms }: { role: string; perms: boolean[] }) {
  return (
    <TableRow>
      <TableCell className="font-medium text-navy">{role}</TableCell>
      {perms.map((p, i) => (
        <TableCell key={i}>
          {p ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-muted-foreground/40" />}
        </TableCell>
      ))}
    </TableRow>
  )
}

// ============================================================
// CREATE LISTING PLACEHOLDER
// (HostTab='create' — user normally lands here via sidebar. Parent's view='create-listing' takes over.)
// ============================================================
function CreateListingPlaceholder({ onCreateListing }: { onCreateListing: () => void }) {
  return (
    <EmptyState
      icon={Plus}
      title="Create a new listing"
      subtitle="Launch our step-by-step wizard to publish a property in minutes."
      actionLabel="Open wizard"
      onAction={onCreateListing}
    />
  )
}
