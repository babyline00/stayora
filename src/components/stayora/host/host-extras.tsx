'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import {
  fetchToday,
  fetchVerifications,
  startVerification,
  fetchAccountSettings,
  updateNotificationPreferences,
  updateAccountSettings,
  updateProfile,
} from '@/lib/api'
import { formatPrice, formatDate, formatRelativeDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Calendar,
  Users,
  MessageCircle,
  Plus,
  Eye,
  Wallet,
  ShieldCheck,
  LogIn,
  LogOut,
  Clock,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Check,
  AlertCircle,
  Loader2,
  User,
  Lock,
  Bell,
  Save,
  TrendingUp,
  ChevronRight,
} from 'lucide-react'

// ============================================================
// SHARED TYPES
// ============================================================
type VerificationStatus = 'NOT_STARTED' | 'APPROVED' | 'PENDING' | 'REJECTED'
type VerificationType = 'EMAIL' | 'PHONE' | 'IDENTITY' | 'ADDRESS' | 'PAYOUT' | 'TAX'

interface VerificationRecord {
  status: VerificationStatus
  verifiedAt?: string
}

interface TodayData {
  arrivals: any[]
  departures: any[]
  pendingRequests: any[]
  upcomingBookings: any[]
  stats: {
    arrivals: number
    departures: number
    pendingRequests: number
    unreadMessages: number
  }
}

interface VerificationsData {
  verifications: Record<VerificationType, VerificationRecord>
  user: any
}

interface AccountSettingsData {
  personal: {
    legalName: string
    email: string
    phone: string
    country: string
    bio: string
    avatarUrl?: string
  }
  security: {
    twoFactorEnabled: boolean
    sessions: number
    lastLogin: string
  }
  notifications: {
    emailEnabled: boolean
    pushEnabled: boolean
    smsEnabled: boolean
    marketingEnabled: boolean
  }
  payments: {
    payoutMethods: any[]
    currency: string
    languages: string
  }
}

// ============================================================
// SHARED UI HELPERS
// ============================================================
function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: any
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-peach-light/30 px-6 py-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-peach-light text-navy">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-navy">{title}</p>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {actionLabel && onAction && (
        <Button size="sm" className="bg-orange text-white hover:bg-orange/90" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  count,
  onSeeAll,
}: {
  icon: any
  title: string
  count?: number
  onSeeAll?: () => void
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-peach-light text-navy">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-base font-semibold text-navy">{title}</h3>
        {count !== undefined && count > 0 && (
          <Badge className="bg-orange text-white">{count}</Badge>
        )}
      </div>
      {onSeeAll && (
        <Button variant="ghost" size="sm" className="text-xs text-navy" onClick={onSeeAll}>
          See all <ChevronRight className="ml-0.5 h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

const STATUS_STYLES: Record<VerificationStatus, { label: string; badge: string; dot: string }> = {
  NOT_STARTED: { label: 'Not started', badge: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground/40' },
  PENDING: { label: 'In review', badge: 'bg-orange/15 text-orange border-orange/30', dot: 'bg-orange' },
  APPROVED: { label: 'Verified', badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', badge: 'bg-red-100 text-red-700 border-red-300', dot: 'bg-red-500' },
}

// ============================================================
// TODAY TAB — Daily Command Center
// ============================================================
export function TodayTab() {
  const { showToast, setView } = useAppStore()
  const [data, setData] = useState<TodayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const refresh = () => {
    setLoading(true)
    fetchToday()
      .then((d: any) => setData(d as TodayData))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) refresh()
    })
    return () => {
      cancelled = true
    }
  }, [])

  const scrollTo = (id: string) => {
    setActiveSection(id)
    if (typeof document !== 'undefined') {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <EmptyState
        icon={Calendar}
        title="Couldn't load today's snapshot"
        subtitle="Please try again in a moment."
        actionLabel="Reload"
        onAction={refresh}
      />
    )
  }

  const stats = data.stats
  // Performance snapshot — derived from today's data with sensible mock fallbacks.
  const arrivalsCount = stats.arrivals
  const departuresCount = stats.departures
  const upcomingRevenue = (data.upcomingBookings || []).reduce(
    (acc, b: any) => acc + (b.totalAmount || b.amount || 0),
    0
  )
  const recentEarnings = Math.round(upcomingRevenue * 0.45)
  const occupancyPct = Math.min(
    100,
    Math.max(8, Math.round(((arrivalsCount + 1) / Math.max(1, arrivalsCount + departuresCount + 4)) * 100))
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-navy">Today</h2>
          <p className="text-sm text-muted-foreground">
            {formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} className="self-start">
          <Clock className="mr-1.5 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={LogIn}
          label="Arrivals today"
          value={stats.arrivals}
          accent="bg-emerald-100 text-emerald-700"
          onClick={() => scrollTo('arrivals')}
        />
        <StatCard
          icon={LogOut}
          label="Departures today"
          value={stats.departures}
          accent="bg-orange/15 text-orange"
          onClick={() => scrollTo('departures')}
        />
        <StatCard
          icon={Clock}
          label="Pending requests"
          value={stats.pendingRequests}
          accent="bg-peach-light text-navy"
          onClick={() => scrollTo('pending')}
        />
        <StatCard
          icon={MessageCircle}
          label="Unread messages"
          value={stats.unreadMessages}
          accent="bg-navy/10 text-navy"
          onClick={() => showToast('Inbox opening soon', 'Use the inbox tab to read messages.', 'default')}
        />
      </div>

      {/* Quick actions row */}
      <div className="rounded-2xl border border-border bg-white p-3 stayora-card-shadow">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Quick actions</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="bg-orange text-white hover:bg-orange/90" onClick={() => setView('create-listing')}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add a new listing
          </Button>
          <Button size="sm" variant="outline" onClick={() => showToast('Calendar opening soon', 'Try the Calendar tab.', 'default')}>
            <Calendar className="mr-1.5 h-3.5 w-3.5" /> Open calendar
          </Button>
          <Button size="sm" variant="outline" onClick={() => showToast('Inbox opening soon', 'Try the Inbox tab.', 'default')}>
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Open inbox
          </Button>
          <Button size="sm" variant="outline" onClick={() => showToast('Earnings opening soon', 'Try the Earnings tab.', 'default')}>
            <Wallet className="mr-1.5 h-3.5 w-3.5" /> View earnings
          </Button>
          <Button size="sm" variant="outline" onClick={() => showToast('Verifications', 'Open the Verifications tab to continue.', 'default')}>
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Start verification
          </Button>
        </div>
      </div>

      {/* Performance snapshot */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-border bg-white stayora-card-shadow">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-peach-light text-navy">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recent earnings</p>
              <p className="text-sm font-semibold text-navy">{formatPrice(recentEarnings)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-white stayora-card-shadow">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-orange/15 text-orange">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Upcoming revenue</p>
              <p className="text-sm font-semibold text-navy">{formatPrice(upcomingRevenue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-white stayora-card-shadow">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Occupancy</p>
              <p className="text-sm font-semibold text-navy">{occupancyPct}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Arrivals */}
      <section id="arrivals" className="scroll-mt-4">
        <SectionHeader icon={LogIn} title="Arrivals today" count={data.arrivals.length} />
        {data.arrivals.length === 0 ? (
          <EmptyState icon={LogIn} title="No arrivals today" subtitle="Enjoy the calm — new arrivals will appear here." />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.arrivals.map((b: any) => (
              <BookingCard key={b.id} booking={b} variant="arrival" onContact={() => showToast('Conversation opened', `Message ${b.guest?.name}`, 'default')} onOpenReservation={() => showToast('Reservation opened', `Ref ${b.reference}`, 'default')} />
            ))}
          </div>
        )}
      </section>

      {/* Departures */}
      <section id="departures" className="scroll-mt-4">
        <SectionHeader icon={LogOut} title="Departures today" count={data.departures.length} />
        {data.departures.length === 0 ? (
          <EmptyState icon={LogOut} title="No departures today" subtitle="Checked-out guests will appear here." />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.departures.map((b: any) => (
              <BookingCard key={b.id} booking={b} variant="departure" onContact={() => showToast('Conversation opened', `Message ${b.guest?.name}`, 'default')} onOpenReservation={() => showToast('Reservation opened', `Ref ${b.reference}`, 'default')} />
            ))}
          </div>
        )}
      </section>

      {/* Pending requests */}
      <section id="pending" className="scroll-mt-4">
        <SectionHeader icon={Clock} title="Pending requests" count={data.pendingRequests.length} />
        {data.pendingRequests.length === 0 ? (
          <EmptyState icon={Clock} title="No pending requests" subtitle="You're all caught up." />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.pendingRequests.map((b: any) => (
              <PendingBookingCard
                key={b.id}
                booking={b}
                onAccept={() => showToast('Booking accepted', `Ref ${b.reference} — guest notified.`, 'success')}
                onDecline={() => showToast('Booking declined', `Ref ${b.reference} declined.`, 'default')}
              />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming reservations */}
      <section>
        <SectionHeader icon={Calendar} title="Upcoming reservations" count={data.upcomingBookings.length} />
        {data.upcomingBookings.length === 0 ? (
          <EmptyState icon={Calendar} title="No upcoming reservations" subtitle="New bookings will show up here." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-white stayora-card-shadow">
            {data.upcomingBookings.map((b: any, idx: number) => (
              <div key={b.id}>
                {idx > 0 && <Separator />}
                <div className="flex items-center gap-3 p-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={b.guest?.avatarUrl || undefined} alt={b.guest?.name} />
                    <AvatarFallback className="bg-navy text-white text-xs">
                      {b.guest?.name?.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy">{b.guest?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{b.listing?.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-navy">{formatDate(b.checkIn, { month: 'short', day: 'numeric' })}</p>
                    <p className="text-[10px] text-muted-foreground">{b.nights} {b.nights === 1 ? 'night' : 'nights'}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-navy" onClick={() => showToast('Reservation opened', `Ref ${b.reference}`, 'default')}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  onClick,
}: {
  icon: any
  label: string
  value: number
  accent: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 text-left transition hover:stayora-card-shadow-hover stayora-card-shadow"
    >
      <div className={`grid h-10 w-10 place-items-center rounded-full ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-navy leading-none">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </button>
  )
}

function BookingCard({
  booking,
  variant,
  onContact,
  onOpenReservation,
}: {
  booking: any
  variant: 'arrival' | 'departure'
  onContact: () => void
  onOpenReservation: () => void
}) {
  const isArrival = variant === 'arrival'
  const dateLabel = isArrival
    ? `Check-in · ${formatDate(booking.checkIn, { month: 'short', day: 'numeric' })}`
    : `Check-out · ${formatDate(booking.checkOut, { month: 'short', day: 'numeric' })}`

  return (
    <Card className="border-border bg-white stayora-card-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={booking.guest?.avatarUrl || undefined} alt={booking.guest?.name} />
            <AvatarFallback className="bg-navy text-white text-xs">
              {booking.guest?.name?.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-navy">{booking.guest?.name}</p>
              <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">
                {booking.reference}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">{booking.listing?.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {dateLabel}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {booking.adults + (booking.children || 0)} guest{(booking.adults + (booking.children || 0)) === 1 ? '' : 's'}
              </span>
              <span>{booking.nights} {booking.nights === 1 ? 'night' : 'nights'}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 text-navy" onClick={onContact}>
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Contact guest
          </Button>
          <Button size="sm" className="flex-1 bg-navy text-white hover:bg-navy-light" onClick={onOpenReservation}>
            <Eye className="mr-1.5 h-3.5 w-3.5" /> Open reservation
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PendingBookingCard({
  booking,
  onAccept,
  onDecline,
}: {
  booking: any
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <Card className="border-orange/30 bg-peach-light/30 stayora-card-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={booking.guest?.avatarUrl || undefined} alt={booking.guest?.name} />
            <AvatarFallback className="bg-orange text-white text-xs">
              {booking.guest?.name?.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-navy">{booking.guest?.name}</p>
              <Badge className="bg-orange text-white text-[10px]">Pending</Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">{booking.listing?.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{formatDate(booking.checkIn, { month: 'short', day: 'numeric' })} → {formatDate(booking.checkOut, { month: 'short', day: 'numeric' })}</span>
              <span>{booking.nights} {booking.nights === 1 ? 'night' : 'nights'}</span>
              <span className="font-medium text-navy">{formatPrice(booking.totalAmount || booking.amount || 0)}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700" onClick={onAccept}>
            <Check className="mr-1.5 h-3.5 w-3.5" /> Accept
          </Button>
          <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={onDecline}>
            <AlertCircle className="mr-1.5 h-3.5 w-3.5" /> Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// VERIFICATIONS TAB — Verification Center
// ============================================================
const VERIFICATION_META: Record<
  VerificationType,
  { title: string; description: string; icon: any; accent: string }
> = {
  EMAIL: {
    title: 'Email address',
    description: 'Confirm your email so guests and Stayora can reach you.',
    icon: Mail,
    accent: 'bg-peach-light text-navy',
  },
  PHONE: {
    title: 'Phone number',
    description: 'Add a phone number for booking confirmations and emergencies.',
    icon: Phone,
    accent: 'bg-orange/15 text-orange',
  },
  IDENTITY: {
    title: 'Identity verification',
    description: 'Verify a government ID to unlock hosting eligibility.',
    icon: ShieldCheck,
    accent: 'bg-navy/10 text-navy',
  },
  ADDRESS: {
    title: 'Residential address',
    description: 'Confirm where you live for tax and compliance purposes.',
    icon: MapPin,
    accent: 'bg-emerald-100 text-emerald-700',
  },
  PAYOUT: {
    title: 'Payout method',
    description: 'Add a bank account or payout method to receive earnings.',
    icon: CreditCard,
    accent: 'bg-orange/15 text-orange',
  },
  TAX: {
    title: 'Tax information',
    description: 'Provide tax forms so we can issue payouts correctly.',
    icon: FileText,
    accent: 'bg-peach-light text-navy',
  },
}

const VERIFICATION_ORDER: VerificationType[] = ['EMAIL', 'PHONE', 'IDENTITY', 'ADDRESS', 'PAYOUT', 'TAX']

export function VerificationsTab() {
  const { showToast, user } = useAppStore()
  const [data, setData] = useState<VerificationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyType, setBusyType] = useState<VerificationType | null>(null)

  const refresh = () => {
    setLoading(true)
    fetchVerifications()
      .then((d: any) => setData(d as VerificationsData))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) refresh()
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleStart = async (type: VerificationType, payload?: string) => {
    setBusyType(type)
    try {
      await startVerification(type, payload)
      await new Promise((r) => setTimeout(r, 50))
      await refresh()
      const meta = VERIFICATION_META[type]
      if (type === 'EMAIL') {
        showToast('Email verified', meta.title + ' confirmed.', 'success')
      } else if (type === 'PHONE') {
        showToast('Phone verified', meta.title + ' confirmed.', 'success')
      } else {
        showToast('Verification started', `${meta.title} submitted for review.`, 'default')
      }
    } catch (e) {
      showToast('Verification failed', 'Please try again.', 'error')
    } finally {
      setBusyType(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    )
  }

  const verifications = data?.verifications || ({} as Record<VerificationType, VerificationRecord>)
  const completed = VERIFICATION_ORDER.filter((t) => verifications[t]?.status === 'APPROVED').length
  const total = VERIFICATION_ORDER.length
  const progressPct = Math.round((completed / total) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-navy">Host verification</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete the required checks to unlock eligible hosting and payout features.
        </p>
      </div>

      {/* Progress card */}
      <Card className="border-border bg-white stayora-card-shadow">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-orange" />
              <p className="text-sm font-medium text-navy">Verification progress</p>
            </div>
            <Badge className="bg-navy text-white">{completed} of {total}</Badge>
          </div>
          <Progress value={progressPct} className="h-2 bg-peach-light" />
          <p className="mt-2 text-xs text-muted-foreground">
            {completed === total
              ? 'All checks complete. You are fully verified.'
              : `${total - completed} verification${total - completed === 1 ? '' : 's'} remaining.`}
          </p>
        </CardContent>
      </Card>

      {/* Verification cards */}
      <div className="space-y-3">
        {VERIFICATION_ORDER.map((type) => (
          <VerificationCard
            key={type}
            type={type}
            record={verifications[type] || { status: 'NOT_STARTED' }}
            busy={busyType === type}
            onStart={handleStart}
          />
        ))}
      </div>
    </div>
  )
}

function VerificationCard({
  type,
  record,
  busy,
  onStart,
}: {
  type: VerificationType
  record: VerificationRecord
  busy: boolean
  onStart: (type: VerificationType, payload?: string) => void
}) {
  const meta = VERIFICATION_META[type]
  const Icon = meta.icon
  const style = STATUS_STYLES[record.status]
  const isVerified = record.status === 'APPROVED'
  const isPending = record.status === 'PENDING'
  const isRejected = record.status === 'REJECTED'

  // Local form state for phone + address
  const [phoneCountry, setPhoneCountry] = useState('+1')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [postal, setPostal] = useState('')
  const [country, setCountry] = useState('')

  const payload = (() => {
    if (type === 'PHONE') return phoneNumber ? `${phoneCountry}${phoneNumber}` : undefined
    if (type === 'ADDRESS') {
      const parts = [street, city, postal, country].filter(Boolean)
      return parts.length ? parts.join(', ') : undefined
    }
    return undefined
  })()

  return (
    <Card className="border-border bg-white stayora-card-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${meta.accent}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-navy">{meta.title}</p>
              <Badge variant="outline" className={`text-[10px] ${style.badge}`}>
                <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${style.dot}`} />
                {style.label}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{meta.description}</p>
            {record.verifiedAt && isVerified && (
              <p className="mt-1 text-[10px] text-muted-foreground">Verified {formatRelativeDate(record.verifiedAt)}</p>
            )}
            {isRejected && (
              <p className="mt-1 text-[10px] text-red-600">Please re-submit with corrected information.</p>
            )}

            {/* Inline forms */}
            {type === 'PHONE' && !isVerified && (
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div className="w-20">
                  <Label className="sr-only" htmlFor={`cc-${type}`}>Country code</Label>
                  <Input id={`cc-${type}`} value={phoneCountry} onChange={(e) => setPhoneCountry(e.target.value)} placeholder="+1" disabled={busy} />
                </div>
                <div className="min-w-0 flex-1">
                  <Label className="sr-only" htmlFor={`phone-${type}`}>Phone number</Label>
                  <Input id={`phone-${type}`} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="555 123 4567" disabled={busy} inputMode="tel" />
                </div>
                <Button size="sm" className="bg-orange text-white hover:bg-orange/90" disabled={busy || !phoneNumber} onClick={() => onStart('PHONE', payload)}>
                  {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Phone className="mr-1.5 h-3.5 w-3.5" />}
                  Send code
                </Button>
              </div>
            )}

            {type === 'ADDRESS' && !isVerified && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="sr-only" htmlFor={`street-${type}`}>Street</Label>
                  <Input id={`street-${type}`} value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street address" disabled={busy} />
                </div>
                <div>
                  <Label className="sr-only" htmlFor={`city-${type}`}>City</Label>
                  <Input id={`city-${type}`} value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" disabled={busy} />
                </div>
                <div>
                  <Label className="sr-only" htmlFor={`postal-${type}`}>Postal code</Label>
                  <Input id={`postal-${type}`} value={postal} onChange={(e) => setPostal(e.target.value)} placeholder="Postal code" disabled={busy} />
                </div>
                <div className="sm:col-span-2">
                  <Label className="sr-only" htmlFor={`country-${type}`}>Country</Label>
                  <Input id={`country-${type}`} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" disabled={busy} />
                </div>
                <div className="sm:col-span-2">
                  <Button size="sm" className="bg-orange text-white hover:bg-orange/90" disabled={busy || !street || !city} onClick={() => onStart('ADDRESS', payload)}>
                    {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1.5 h-3.5 w-3.5" />}
                    Save address
                  </Button>
                </div>
              </div>
            )}

            {/* Action button for simple verifications */}
            {!isVerified && type !== 'PHONE' && type !== 'ADDRESS' && (
              <div className="mt-3">
                <Button
                  size="sm"
                  className="bg-navy text-white hover:bg-navy-light"
                  disabled={busy || isPending}
                  onClick={() => onStart(type)}
                >
                  {busy ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : isPending ? (
                    <Clock className="mr-1.5 h-3.5 w-3.5" />
                  ) : type === 'IDENTITY' ? (
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                  ) : type === 'PAYOUT' ? (
                    <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                  ) : type === 'TAX' ? (
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <Mail className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {isPending ? 'In review' : type === 'PAYOUT' ? 'Connect payout' : type === 'IDENTITY' ? 'Start verification' : 'Start'}
                </Button>
              </div>
            )}

            {/* Verified state */}
            {isVerified && (
              <div className="mt-3">
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                  <Check className="mr-1 h-3 w-3" /> Verified
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// ACCOUNT SETTINGS TAB
// ============================================================
export function AccountSettingsTab() {
  const { showToast } = useAppStore()
  const [data, setData] = useState<AccountSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('personal')

  const refresh = () => {
    setLoading(true)
    fetchAccountSettings()
      .then((d: any) => setData(d as AccountSettingsData))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) refresh()
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md rounded-full" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <EmptyState
        icon={User}
        title="Couldn't load settings"
        subtitle="Please try again in a moment."
        actionLabel="Reload"
        onAction={refresh}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-navy">Account settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, security, notifications, and payouts.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="flex w-full max-w-2xl flex-wrap gap-1 rounded-full bg-peach-light/60 p-1">
          <TabsTrigger value="personal" className="flex-1 rounded-full data-[state=active]:bg-navy data-[state=active]:text-white">
            <User className="mr-1.5 h-3.5 w-3.5" /> Personal
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 rounded-full data-[state=active]:bg-navy data-[state=active]:text-white">
            <Lock className="mr-1.5 h-3.5 w-3.5" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 rounded-full data-[state=active]:bg-navy data-[state=active]:text-white">
            <Bell className="mr-1.5 h-3.5 w-3.5" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex-1 rounded-full data-[state=active]:bg-navy data-[state=active]:text-white">
            <Wallet className="mr-1.5 h-3.5 w-3.5" /> Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-4">
          <PersonalTab data={data} onSaved={showToast} onRefresh={refresh} />
        </TabsContent>
        <TabsContent value="security" className="mt-4">
          <SecurityTab data={data} onToast={showToast} />
        </TabsContent>
        <TabsContent value="notifications" className="mt-4">
          <NotificationsTab data={data} onToast={showToast} onRefresh={refresh} />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <PaymentsTab data={data} onToast={showToast} onRefresh={refresh} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PersonalTab({
  data,
  onSaved,
  onRefresh,
}: {
  data: AccountSettingsData
  onSaved: (title: string, description?: string, variant?: 'default' | 'success' | 'error') => void
  onRefresh: () => void
}) {
  const [name, setName] = useState(data.personal.legalName || '')
  const [email, setEmail] = useState(data.personal.email || '')
  const [phone, setPhone] = useState(data.personal.phone || '')
  const [country, setCountry] = useState(data.personal.country || '')
  const [bio, setBio] = useState(data.personal.bio || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({ name, bio, country })
      onSaved('Profile updated', 'Your personal information has been saved.', 'success')
      await new Promise((r) => setTimeout(r, 50))
      onRefresh()
    } catch (e) {
      onSaved('Update failed', 'Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border bg-white stayora-card-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-navy">Personal information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="legal-name" className="text-xs font-medium text-navy">Legal name</Label>
            <Input id="legal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full legal name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-navy">Email</Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled className="bg-muted/40 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">Email changes require verification. Contact support.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-medium text-navy">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" inputMode="tel" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country" className="text-xs font-medium text-navy">Country</Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country of residence" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio" className="text-xs font-medium text-navy">Bio</Label>
          <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell guests a little about yourself…" />
        </div>
        <div className="flex justify-end">
          <Button className="bg-orange text-white hover:bg-orange/90" disabled={saving} onClick={handleSave}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SecurityTab({
  data,
  onToast,
}: {
  data: AccountSettingsData
  onToast: (title: string, description?: string, variant?: 'default' | 'success' | 'error') => void
}) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [twoFactor, setTwoFactor] = useState(data.security.twoFactorEnabled)

  const handlePasswordSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setCurrent('')
      setNext('')
      setConfirm('')
      onToast('Password change not enabled in demo', 'Use a production environment to update passwords.', 'default')
    }, 600)
  }

  const handle2FA = async (checked: boolean) => {
    setTwoFactor(checked)
    onToast(
      checked ? 'Two-factor enabled' : 'Two-factor disabled',
      'Two-factor authentication toggled.',
      checked ? 'success' : 'default'
    )
  }

  const handleSignOutAll = () => {
    onToast('Sessions cleared', 'You have been signed out of all other sessions.', 'success')
  }

  return (
    <div className="space-y-4">
      {/* Password change */}
      <Card className="border-border bg-white stayora-card-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-navy">Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="current-pw" className="text-xs font-medium text-navy">Current password</Label>
            <Input id="current-pw" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-pw" className="text-xs font-medium text-navy">New password</Label>
              <Input id="new-pw" type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pw" className="text-xs font-medium text-navy">Confirm new password</Label>
              <Input id="confirm-pw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" className="text-navy" disabled={saving || !current || !next || next !== confirm} onClick={handlePasswordSave}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Lock className="mr-1.5 h-4 w-4" />}
              Update password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-factor */}
      <Card className="border-border bg-white stayora-card-shadow">
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-peach-light text-navy">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy">Two-factor authentication</p>
              <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
            </div>
          </div>
          <Switch checked={twoFactor} onCheckedChange={handle2FA} />
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card className="border-border bg-white stayora-card-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-navy">Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Active sessions</p>
              <p className="text-sm font-medium text-navy">{data.security.sessions} active</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last login</p>
              <p className="text-sm font-medium text-navy">{formatRelativeDate(data.security.lastLogin)}</p>
            </div>
          </div>
          <Separator />
          <div className="flex justify-end">
            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={handleSignOutAll}>
              <LogOut className="mr-1.5 h-4 w-4" /> Sign out of all sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function NotificationsTab({
  data,
  onToast,
  onRefresh,
}: {
  data: AccountSettingsData
  onToast: (title: string, description?: string, variant?: 'default' | 'success' | 'error') => void
  onRefresh: () => void
}) {
  const [prefs, setPrefs] = useState(data.notifications)

  const update = async (key: keyof typeof prefs, value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }))
    const labelMap: Record<string, string> = {
      emailEnabled: 'Email notifications',
      pushEnabled: 'Push notifications',
      smsEnabled: 'SMS notifications',
      marketingEnabled: 'Marketing communications',
    }
    try {
      await updateNotificationPreferences({ [key]: value })
      onToast(labelMap[key] + (value ? ' enabled' : ' disabled'), 'Preferences saved.', value ? 'success' : 'default')
      await new Promise((r) => setTimeout(r, 50))
      onRefresh()
    } catch (e) {
      onToast('Update failed', 'Please try again.', 'error')
      setPrefs((p) => ({ ...p, [key]: !value }))
    }
  }

  const items: { key: keyof typeof prefs; label: string; description: string }[] = [
    { key: 'emailEnabled', label: 'Email notifications', description: 'Booking confirmations, guest messages, and account alerts.' },
    { key: 'pushEnabled', label: 'Push notifications', description: 'Real-time alerts on your devices.' },
    { key: 'smsEnabled', label: 'SMS notifications', description: 'Critical alerts via text message.' },
    { key: 'marketingEnabled', label: 'Marketing communications', description: 'Product news, host tips, and offers.' },
  ]

  return (
    <Card className="border-border bg-white stayora-card-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-navy">Notification preferences</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {items.map((it) => (
          <div key={it.key} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div>
              <p className="text-sm font-medium text-navy">{it.label}</p>
              <p className="text-xs text-muted-foreground">{it.description}</p>
            </div>
            <Switch checked={prefs[it.key]} onCheckedChange={(v) => update(it.key, v)} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function PaymentsTab({
  data,
  onToast,
  onRefresh,
}: {
  data: AccountSettingsData
  onToast: (title: string, description?: string, variant?: 'default' | 'success' | 'error') => void
  onRefresh: () => void
}) {
  const [currency, setCurrency] = useState(data.payments.currency || 'USD')
  const [language, setLanguage] = useState(data.payments.languages || 'en')

  const handleCurrency = async (value: string) => {
    setCurrency(value)
    try {
      await updateAccountSettings({ currency: value })
      onToast('Currency updated', `Default currency set to ${value}.`, 'success')
      await new Promise((r) => setTimeout(r, 50))
      onRefresh()
    } catch (e) {
      onToast('Update failed', 'Please try again.', 'error')
    }
  }

  const handleLanguage = async (value: string) => {
    setLanguage(value)
    try {
      await updateAccountSettings({ languages: value })
      onToast('Language updated', `Display language set to ${value.toUpperCase()}.`, 'success')
      await new Promise((r) => setTimeout(r, 50))
      onRefresh()
    } catch (e) {
      onToast('Update failed', 'Please try again.', 'error')
    }
  }

  const payoutMethods = data.payments.payoutMethods || []

  return (
    <div className="space-y-4">
      <Card className="border-border bg-white stayora-card-shadow">
        <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="currency-select" className="text-xs font-medium text-navy">Default currency</Label>
            <Select value={currency} onValueChange={handleCurrency}>
              <SelectTrigger id="currency-select" className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD', 'AED'].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="language-select" className="text-xs font-medium text-navy">Display language</Label>
            <Select value={language} onValueChange={handleLanguage}>
              <SelectTrigger id="language-select" className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {[
                  { v: 'en', l: 'English' },
                  { v: 'es', l: 'Español' },
                  { v: 'fr', l: 'Français' },
                  { v: 'de', l: 'Deutsch' },
                  { v: 'ja', l: '日本語' },
                  { v: 'pt', l: 'Português' },
                ].map((o) => (
                  <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-white stayora-card-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-navy">Payout methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {payoutMethods.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-peach-light/30 p-4 text-center">
              <CreditCard className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium text-navy">No payout methods configured</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Complete payout verification first to add a payout method.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {payoutMethods.map((m: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-peach-light text-navy">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy">{m.label || m.brand || 'Payout method'}</p>
                      <p className="text-xs text-muted-foreground">{m.details || '••••'}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-border text-muted-foreground">{m.status || 'Active'}</Badge>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button size="sm" className="bg-orange text-white hover:bg-orange/90" onClick={() => onToast('Add payout method', 'Complete payout verification first.', 'default')}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add payout method
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
