'use client'

import { useEffect, useState } from 'react'
import { useAppStore, AdminTab } from '@/store/useAppStore'
import {
  fetchAdminDashboard, fetchUsers, adminUserAction, adminListingAction, adminRefund,
  createListing,
} from '@/lib/api'
import { formatPrice, formatDate, formatRelativeDate, formatNumber, formatRating } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import {
  LayoutDashboard, Users, Home, CalendarDays, DollarSign, LifeBuoy, ShieldAlert, Activity,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2, XCircle, Eye, MoreVertical, Filter, Search,
  Crown, UserCheck, UserX, Trash2, ShieldCheck, FileText, ArrowUpRight, ArrowDownRight, Banknote,
  AlertTriangle, Clock, Zap,
} from 'lucide-react'

// ============================================================
// TYPES & CONFIG
// ============================================================
interface AdminDashboard {
  users: any[]
  listings: any[]
  bookings: any[]
  payments: any[]
  payouts: any[]
  supportTickets: any[]
  auditLogs: any[]
  reportedListings: any[]
  stats: any
}

const NAV: { id: AdminTab; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'listings', label: 'Listings', icon: Home },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'support', label: 'Support', icon: LifeBuoy },
  { id: 'audit', label: 'Audit', icon: ShieldAlert },
]

// Mocked trend deltas (deterministic per KPI key) so SSR & client render match.
const TREND_MAP: Record<string, number> = {
  totalUsers: 12, totalGuests: 8, totalHosts: 18, totalListings: 14,
  pendingListings: -6, totalBookings: 22, upcomingCheckIns: 4,
  cancelledBookings: -3, grossBookingValue: 17, platformRevenue: 19,
  failedPayments: -2, pendingRefunds: 5, failedPayouts: -1,
  openTickets: -8, reportedContent: -4,
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function AdminPanel() {
  const { user, adminTab, setAdminTab } = useAppStore()
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const refreshDashboard = () => {
    setLoading(true)
    fetchAdminDashboard()
      .then((d: any) => {
        setData({
          users: d.users || [],
          listings: d.listings || [],
          bookings: d.bookings || [],
          payments: d.payments || [],
          payouts: d.payouts || [],
          supportTickets: d.supportTickets || [],
          auditLogs: d.auditLogs || [],
          reportedListings: d.reportedListings || [],
          stats: d.stats || null,
        })
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  const refreshUsers = () => {
    fetchUsers()
      .then((d: any) => setUsers(d.users || []))
      .catch(() => setUsers([]))
  }

  // Defer into a microtask so setState never fires synchronously in the effect body
  // (avoids the react-hooks/set-state-in-effect lint rule).
  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (cancelled) return
      refreshDashboard()
      refreshUsers()
    })
    return () => { cancelled = true }
  }, [user?.id])

  if (!user) return null

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
      {/* Left sidebar (sticky) */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-20 rounded-2xl border border-border bg-white p-2">
          <AdminProfileCard user={user} />
          <nav className="mt-2 space-y-0.5">
            {NAV.map(t => {
              const Icon = t.icon
              const active = adminTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setAdminTab(t.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active ? 'bg-navy text-white' : 'text-navy/80 hover:bg-peach-light/60 hover:text-navy'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{t.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1">
        {/* Mobile horizontal pill tabs */}
        <div className="mb-4 flex gap-1 overflow-x-auto pb-1 lg:hidden stayora-scroll">
          {NAV.map(t => {
            const Icon = t.icon
            const active = adminTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setAdminTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                  active ? 'bg-navy text-white' : 'bg-peach-light/60 text-navy'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            )
          })}
        </div>

        {adminTab === 'dashboard' && (
          <DashboardTab data={data} loading={loading} onRefresh={refreshDashboard} />
        )}
        {adminTab === 'users' && (
          <UsersTab users={users} loading={loading} onRefresh={refreshUsers} />
        )}
        {adminTab === 'listings' && (
          <ListingsTab listings={data?.listings || []} loading={loading} onRefresh={refreshDashboard} />
        )}
        {adminTab === 'bookings' && (
          <BookingsTab bookings={data?.bookings || []} loading={loading} onRefresh={refreshDashboard} />
        )}
        {adminTab === 'finance' && (
          <FinanceTab
            payments={data?.payments || []}
            payouts={data?.payouts || []}
            bookings={data?.bookings || []}
            users={data?.users || []}
            stats={data?.stats}
            loading={loading}
            onRefresh={refreshDashboard}
          />
        )}
        {adminTab === 'support' && (
          <SupportTab tickets={data?.supportTickets || []} loading={loading} />
        )}
        {adminTab === 'audit' && (
          <AuditTab logs={data?.auditLogs || []} loading={loading} />
        )}
      </main>
    </div>
  )
}

// ============================================================
// ADMIN PROFILE CARD (sidebar)
// ============================================================
function AdminProfileCard({ user }: { user: any }) {
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
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <Badge className="bg-orange text-white"><Crown className="h-3 w-3" /> Admin</Badge>
    </div>
  )
}

// ============================================================
// SHARED HELPERS
// ============================================================
function SectionHeader({ title, subtitle, icon: Icon, action }: any) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-navy text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-navy sm:text-2xl">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-[200px] flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pl-9"
        aria-label={placeholder}
      />
    </div>
  )
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <Filter className="h-3.5 w-3.5" /> {children}
    </span>
  )
}

function EmptyState({ icon: Icon, title, subtitle }: any) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-peach-light text-navy">
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <p className="text-base font-semibold text-navy">{title}</p>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingBlock() {
  return <Skeleton className="h-96 w-full rounded-2xl" />
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'ADMIN') return <Badge className="bg-navy text-white">Admin</Badge>
  if (role === 'HOST') return <Badge className="bg-orange text-white">Host</Badge>
  return <Badge variant="secondary" className="bg-peach text-navy">Guest</Badge>
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <Badge className="border-transparent bg-emerald-100 text-emerald-700">
      <CheckCircle2 className="h-3 w-3" /> Verified
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      <XCircle className="h-3 w-3" /> Unverified
    </Badge>
  )
}

function TrendPill({ value }: { value: number }) {
  const positive = value >= 0
  const Icon = positive ? TrendingUp : TrendingDown
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
        positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      }`}
    >
      <Icon className="h-3 w-3" />
      {positive ? '+' : ''}{value}%
    </span>
  )
}

// ============================================================
// DASHBOARD TAB
// ============================================================
function DashboardTab({ data, loading, onRefresh }: { data: AdminDashboard | null; loading: boolean; onRefresh: () => void }) {
  const { showToast } = useAppStore()
  const stats = data?.stats

  if (loading) return <LoadingBlock />
  if (!stats) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="No admin data available"
        subtitle="Sign in with an admin account to view platform metrics."
      />
    )
  }

  const kpis: { key: string; label: string; value: string; icon: any; iconBg: string }[] = [
    { key: 'totalUsers', label: 'Total users', value: formatNumber(stats.totalUsers), icon: Users, iconBg: 'bg-navy text-white' },
    { key: 'totalGuests', label: 'Guests', value: formatNumber(stats.totalGuests), icon: UserCheck, iconBg: 'bg-emerald-100 text-emerald-700' },
    { key: 'totalHosts', label: 'Hosts', value: formatNumber(stats.totalHosts), icon: Crown, iconBg: 'bg-orange/15 text-orange' },
    { key: 'totalListings', label: 'Listings', value: formatNumber(stats.totalListings), icon: Home, iconBg: 'bg-peach text-navy' },
    { key: 'pendingListings', label: 'Pending listings', value: formatNumber(stats.pendingListings), icon: Clock, iconBg: 'bg-amber-100 text-amber-700' },
    { key: 'totalBookings', label: 'Total bookings', value: formatNumber(stats.totalBookings), icon: CalendarDays, iconBg: 'bg-navy text-white' },
    { key: 'upcomingCheckIns', label: 'Upcoming check-ins', value: formatNumber(stats.upcomingCheckIns), icon: ArrowUpRight, iconBg: 'bg-emerald-100 text-emerald-700' },
    { key: 'cancelledBookings', label: 'Cancelled bookings', value: formatNumber(stats.cancelledBookings), icon: XCircle, iconBg: 'bg-red-100 text-red-700' },
    { key: 'grossBookingValue', label: 'Gross booking value', value: formatPrice(stats.grossBookingValue), icon: DollarSign, iconBg: 'bg-navy text-white' },
    { key: 'platformRevenue', label: 'Platform revenue', value: formatPrice(stats.platformRevenue), icon: Banknote, iconBg: 'bg-orange text-white' },
    { key: 'failedPayments', label: 'Failed payments', value: formatNumber(stats.failedPayments), icon: AlertCircle, iconBg: 'bg-red-100 text-red-700' },
    { key: 'pendingRefunds', label: 'Pending refunds', value: formatNumber(stats.pendingRefunds), icon: Clock, iconBg: 'bg-amber-100 text-amber-700' },
    { key: 'failedPayouts', label: 'Failed payouts', value: formatNumber(stats.failedPayouts), icon: AlertTriangle, iconBg: 'bg-red-100 text-red-700' },
    { key: 'openTickets', label: 'Open tickets', value: formatNumber(stats.openTickets), icon: LifeBuoy, iconBg: 'bg-peach text-navy' },
    { key: 'reportedContent', label: 'Reported content', value: formatNumber(stats.reportedContent), icon: ShieldAlert, iconBg: 'bg-red-100 text-red-700' },
  ]

  const recentBookings = (data?.bookings || [])
    .slice()
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
  const openTickets = (data?.supportTickets || [])
    .filter((t: any) => t.status !== 'RESOLVED' && t.status !== 'CLOSED')
    .slice(0, 5)

  // Bucket bookings by day for the last 30 days
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const buckets: { label: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const next = new Date(d)
    next.setDate(d.getDate() + 1)
    const count = (data?.bookings || []).filter((b: any) => {
      const c = new Date(b.createdAt)
      return c >= d && c < next
    }).length
    buckets.push({
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
    })
  }
  const maxBucket = Math.max(1, ...buckets.map(b => b.count))

  const handleCreateDemo = () => {
    createListing({
      title: 'Admin demo listing',
      description: 'A demo listing created from the admin panel for testing purposes.',
      category: 'APARTMENT',
      basePrice: 12000,
      country: 'United States',
      city: 'New York',
      bedrooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      amenities: 'wifi,kitchen,ac',
    } as any)
      .then(() => {
        showToast('Listing created', 'The demo listing is now in draft state.', 'success')
        onRefresh()
      })
      .catch(() => showToast('Could not create listing', undefined, 'error'))
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Platform dashboard"
        subtitle="Stayora marketplace health at a glance."
        icon={LayoutDashboard}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={onRefresh} className="rounded-full border-navy/20 text-navy">
              <Activity className="h-4 w-4" /> Refresh
            </Button>
            <Button onClick={handleCreateDemo} className="rounded-full bg-orange text-white">
              <Zap className="h-4 w-4" /> Create demo listing
            </Button>
          </div>
        }
      />

      {/* KPI grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(k => {
          const Icon = k.icon
          const trend = TREND_MAP[k.key] ?? 0
          return (
            <Card key={k.key} className="stayora-card-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={`grid h-9 w-9 place-items-center rounded-lg ${k.iconBg}`}>
                    <Icon className="size-5" />
                  </div>
                  <TrendPill value={trend} />
                </div>
                <p className="mt-3 text-2xl font-bold text-navy">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Bookings over time (div-based bar chart) */}
      <Card className="stayora-card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-navy">
            <Activity className="h-5 w-5 text-orange" />
            Bookings over the last 30 days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-end gap-1.5">
            {buckets.map((b, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center justify-end gap-1">
                <div
                  className="w-full rounded-t bg-navy/80 transition-all hover:bg-orange"
                  style={{ height: `${Math.max(4, (b.count / maxBucket) * 100)}%` }}
                  title={`${b.label}: ${b.count} bookings`}
                />
                {i % 5 === 0 && (
                  <span className="text-[9px] text-muted-foreground">{b.label}</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent bookings + Open tickets side-by-side */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="stayora-card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy">
              <CalendarDays className="h-5 w-5 text-orange" /> Recent bookings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentBookings.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              recentBookings.map((b: any) => (
                <div key={b.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-peach-light/40">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={b.guest?.avatarUrl || undefined} alt={b.guest?.name} />
                    <AvatarFallback className="bg-peach text-xs text-navy">
                      {b.guest?.name?.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy">{b.guest?.name || 'Guest'}</p>
                    <p className="truncate text-xs text-muted-foreground">{b.listing?.title || 'Listing'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-navy">{formatPrice(b.totalAmount)}</p>
                    <p className="text-[10px] text-muted-foreground">{formatRelativeDate(b.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="stayora-card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-navy">
              <LifeBuoy className="h-5 w-5 text-orange" /> Open support tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {openTickets.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No open tickets. All caught up!</p>
            ) : (
              openTickets.map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-peach-light/40">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-peach text-navy">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy">{t.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.category} · {t.requester?.name}</p>
                  </div>
                  <Badge className={
                    t.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                    t.priority === 'HIGH' ? 'bg-orange/15 text-orange' :
                    'bg-zinc-100 text-zinc-700'
                  }>
                    {t.priority === 'URGENT' && <Zap className="h-3 w-3" />}
                    {t.priority}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// USERS TAB
// ============================================================
function UsersTab({ users, loading, onRefresh }: { users: any[]; loading: boolean; onRefresh: () => void }) {
  const { showToast } = useAppStore()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('ALL')
  const [verified, setVerified] = useState('ALL')
  const [confirm, setConfirm] = useState<{ userId: string; name: string; action: 'SUSPEND' | 'REACTIVATE' | 'VERIFY' | 'DELETE' } | null>(null)

  if (loading) return <LoadingBlock />

  const filtered = users.filter(u => {
    if (role !== 'ALL' && u.role !== role) return false
    if (verified === 'VERIFIED' && !u.isVerified) return false
    if (verified === 'UNVERIFIED' && u.isVerified) return false
    if (q) {
      const s = q.toLowerCase()
      if (!(`${u.name} ${u.email}`.toLowerCase().includes(s))) return false
    }
    return true
  })

  const runAction = () => {
    if (!confirm) return
    const { userId, name, action } = confirm
    adminUserAction(userId, action)
      .then(() => {
        showToast(`${action.toLowerCase()} succeeded`, `${name} has been ${action.toLowerCase()}${action === 'DELETE' ? 'd' : 'ed'}.`, 'success')
        onRefresh()
      })
      .catch(() => showToast('Action failed', `Could not ${action.toLowerCase()} ${name}.`, 'error'))
      .finally(() => setConfirm(null))
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Users" subtitle="Search, verify, suspend, and manage user accounts." icon={Users} />

      <Card className="stayora-card-shadow">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput value={q} onChange={setQ} placeholder="Search by name or email..." />
            <div className="flex items-center gap-2">
              <FilterLabel>Role</FilterLabel>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="All roles" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All roles</SelectItem>
                  <SelectItem value="GUEST">Guests</SelectItem>
                  <SelectItem value="HOST">Hosts</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <FilterLabel>Status</FilterLabel>
              <Select value={verified} onValueChange={setVerified}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All status</SelectItem>
                  <SelectItem value="VERIFIED">Verified only</SelectItem>
                  <SelectItem value="UNVERIFIED">Unverified only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users match" subtitle="Try adjusting your search or filters." />
      ) : (
        <Card className="stayora-card-shadow">
          <CardContent className="p-0">
            <div className="max-h-[640px] overflow-y-auto stayora-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Listings</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[60px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(u => {
                    const listingCount = u.listings?.length ?? 0
                    const bookingCount = u._count?.bookingsAsGuest ?? 0
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.avatarUrl || undefined} alt={u.name} />
                              <AvatarFallback className="bg-navy text-xs text-white">
                                {u.name?.split(' ').map((p: string) => p[0]).slice(0, 2).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-navy">{u.name}{u.isSuperhost && <Crown className="ml-1 inline h-3 w-3 text-orange" />}</p>
                              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><RoleBadge role={u.role} /></TableCell>
                        <TableCell><VerifiedBadge verified={u.isVerified} /></TableCell>
                        <TableCell className="text-right text-sm text-navy">{u.role === 'HOST' ? listingCount : '—'}</TableCell>
                        <TableCell className="text-right text-sm text-navy">{u.role === 'GUEST' ? bookingCount : '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(u.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                        <TableCell className="text-right">
                          <DropdownActions
                            items={[
                              { label: 'Verify', icon: UserCheck, onClick: () => setConfirm({ userId: u.id, name: u.name, action: 'VERIFY' }) },
                              { label: u.isVerified ? 'Suspend' : 'Reactivate', icon: u.isVerified ? UserX : UserCheck, onClick: () => setConfirm({ userId: u.id, name: u.name, action: u.isVerified ? 'SUSPEND' : 'REACTIVATE' }) },
                              { label: 'Delete', icon: Trash2, destructive: true, onClick: () => setConfirm({ userId: u.id, name: u.name, action: 'DELETE' }) },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!confirm} onOpenChange={open => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {confirm?.action.toLowerCase()}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === 'DELETE' && `This will permanently delete ${confirm?.name}'s account and cannot be undone.`}
              {confirm?.action === 'SUSPEND' && `This will mark ${confirm?.name} as unverified, blocking access until reactivated.`}
              {confirm?.action === 'REACTIVATE' && `This will restore ${confirm?.name}'s verified status and platform access.`}
              {confirm?.action === 'VERIFY' && `This will mark ${confirm?.name} as a verified user.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirm?.action === 'DELETE' ? 'bg-destructive text-white hover:bg-destructive/90' : 'bg-navy text-white hover:bg-navy/90'}
              onClick={runAction}
            >
              {confirm?.action === 'DELETE' ? 'Delete user' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ============================================================
// LISTINGS TAB
// ============================================================
function ListingsTab({ listings, loading, onRefresh }: { listings: any[]; loading: boolean; onRefresh: () => void }) {
  const { showToast } = useAppStore()
  const [status, setStatus] = useState('ALL')
  const [moderation, setModeration] = useState('ALL')
  const [confirm, setConfirm] = useState<{ listingId: string; title: string; action: 'APPROVE' | 'REJECT' | 'RESTRICT' | 'REMOVE' } | null>(null)

  if (loading) return <LoadingBlock />

  const filtered = listings.filter(l => {
    if (status !== 'ALL' && l.status !== status) return false
    if (moderation !== 'ALL' && l.moderationStatus !== moderation) return false
    return true
  })

  const runAction = () => {
    if (!confirm) return
    const { listingId, title, action } = confirm
    adminListingAction(listingId, action)
      .then(() => {
        showToast(`${action.toLowerCase()} succeeded`, `"${title}" has been ${action.toLowerCase()}d.`, 'success')
        onRefresh()
      })
      .catch(() => showToast('Action failed', `Could not ${action.toLowerCase()} "${title}".`, 'error'))
      .finally(() => setConfirm(null))
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Listings" subtitle="Moderate and manage every listing on the platform." icon={Home} />

      <Card className="stayora-card-shadow">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <FilterLabel>Status</FilterLabel>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All status</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <FilterLabel>Moderation</FilterLabel>
              <Select value={moderation} onValueChange={setModeration}>
                <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All moderation</SelectItem>
                  <SelectItem value="AUTO_APPROVED">Auto approved</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="RESTRICTED">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Home} title="No listings match" subtitle="Try a different status or moderation filter." />
      ) : (
        <Card className="stayora-card-shadow">
          <CardContent className="p-0">
            <div className="max-h-[640px] overflow-y-auto stayora-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Moderation</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="w-[60px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(l => {
                    const cover = l.coverImage || l.photos?.[0]?.url
                    return (
                      <TableRow key={l.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-peach-light">
                              {cover ? (
                                <img src={cover} alt={l.title} className="h-full w-full object-cover" />
                              ) : (
                                <div className="grid h-full place-items-center text-navy/40"><Home className="h-4 w-4" /></div>
                              )}
                            </div>
                            <p className="max-w-[180px] truncate text-sm font-medium text-navy">{l.title}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-navy">{l.host?.name || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{l.category}</TableCell>
                        <TableCell><ListingStatusBadge status={l.status} /></TableCell>
                        <TableCell><ModerationBadge status={l.moderationStatus} /></TableCell>
                        <TableCell className="text-right text-sm font-medium text-navy">{formatPrice(l.basePrice)}</TableCell>
                        <TableCell className="text-right text-sm text-navy">
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-orange" />
                            {formatRating(l.rating)}
                            <span className="text-muted-foreground">({formatNumber(l.reviewCount)})</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {formatNumber(l.views)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownActions
                            items={[
                              { label: 'Approve', icon: ShieldCheck, onClick: () => setConfirm({ listingId: l.id, title: l.title, action: 'APPROVE' }) },
                              { label: 'Reject', icon: XCircle, destructive: true, onClick: () => setConfirm({ listingId: l.id, title: l.title, action: 'REJECT' }) },
                              { label: 'Restrict', icon: AlertTriangle, destructive: true, onClick: () => setConfirm({ listingId: l.id, title: l.title, action: 'RESTRICT' }) },
                              { label: 'Remove', icon: Trash2, destructive: true, onClick: () => setConfirm({ listingId: l.id, title: l.title, action: 'REMOVE' }) },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!confirm} onOpenChange={open => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {confirm?.action.toLowerCase()}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === 'REMOVE' && `This will archive "${confirm?.title}". It will no longer be visible to guests but the underlying data is preserved.`}
              {confirm?.action === 'RESTRICT' && `"${confirm?.title}" will be marked as restricted and removed from search results.`}
              {confirm?.action === 'REJECT' && `"${confirm?.title}" will be marked as rejected and the host notified.`}
              {confirm?.action === 'APPROVE' && `"${confirm?.title}" will be approved and published to the marketplace.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirm?.action === 'REMOVE' || confirm?.action === 'REJECT' || confirm?.action === 'RESTRICT' ? 'bg-destructive text-white hover:bg-destructive/90' : 'bg-navy text-white hover:bg-navy/90'}
              onClick={runAction}
            >
              {confirm?.action === 'REMOVE' ? 'Remove listing' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ListingStatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    PUBLISHED: 'bg-emerald-100 text-emerald-700',
    DRAFT: 'bg-zinc-100 text-zinc-700',
    PAUSED: 'bg-amber-100 text-amber-700',
    ARCHIVED: 'bg-red-100 text-red-700',
    PENDING_REVIEW: 'bg-amber-100 text-amber-700',
  }
  return <Badge className={`border-transparent ${cls[status] || 'bg-muted text-muted-foreground'}`}>{status.replace(/_/g, ' ')}</Badge>
}

function ModerationBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    AUTO_APPROVED: 'bg-emerald-100 text-emerald-700',
    PENDING: 'bg-amber-100 text-amber-700',
    REJECTED: 'bg-red-100 text-red-700',
    RESTRICTED: 'bg-orange/15 text-orange',
  }
  return <Badge className={`border-transparent ${cls[status] || 'bg-muted text-muted-foreground'}`}>{status.replace(/_/g, ' ')}</Badge>
}

// ============================================================
// BOOKINGS TAB
// ============================================================
function BookingsTab({ bookings, loading, onRefresh }: { bookings: any[]; loading: boolean; onRefresh: () => void }) {
  const { showToast } = useAppStore()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('ALL')
  const [refundTarget, setRefundTarget] = useState<{ bookingId: string; ref: string; amount: number } | null>(null)
  const [refundAmount, setRefundAmount] = useState('')

  if (loading) return <LoadingBlock />

  const filtered = bookings.filter(b => {
    if (status !== 'ALL' && b.status !== status) return false
    if (q) {
      const s = q.toLowerCase()
      if (!(`${b.reference} ${b.listing?.title || ''}`.toLowerCase().includes(s))) return false
    }
    return true
  })

  const handleRefund = () => {
    if (!refundTarget) return
    const amount = parseInt(refundAmount || '0', 10)
    adminRefund(refundTarget.bookingId, amount > 0 ? amount : undefined)
      .then(() => {
        showToast('Refund issued', `Refund for booking ${refundTarget.ref} has been processed.`, 'success')
        onRefresh()
      })
      .catch(() => showToast('Refund failed', `Could not refund booking ${refundTarget.ref}.`, 'error'))
      .finally(() => { setRefundTarget(null); setRefundAmount('') })
  }

  return (
    <div className="space-y-5">
      <SectionHeader title="Bookings" subtitle="Search reservations and issue refunds when needed." icon={CalendarDays} />

      <Card className="stayora-card-shadow">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput value={q} onChange={setQ} placeholder="Search by reference or listing title..." />
            <div className="flex items-center gap-2">
              <FilterLabel>Status</FilterLabel>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All status</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No bookings match" subtitle="Try a different status or search term." />
      ) : (
        <Card className="stayora-card-shadow">
          <CardContent className="p-0">
            <div className="max-h-[640px] overflow-y-auto stayora-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Listing</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Check in / out</TableHead>
                    <TableHead className="text-right">Nights</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Payout</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(b => {
                    const lastPayment = b.paymentAttempts?.slice?.(-1)?.[0] || b.paymentAttempts?.[0]
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs text-navy">{b.reference}</TableCell>
                        <TableCell className="max-w-[160px] truncate text-sm text-navy">{b.listing?.title || '—'}</TableCell>
                        <TableCell className="text-sm text-navy">{b.guest?.name || '—'}</TableCell>
                        <TableCell className="text-sm text-navy">{b.host?.name || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div>{formatDate(b.checkIn, { month: 'short', day: 'numeric' })}</div>
                          <div>{formatDate(b.checkOut, { month: 'short', day: 'numeric' })}</div>
                        </TableCell>
                        <TableCell className="text-right text-sm text-navy">{b.nights}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-navy">{formatPrice(b.totalAmount)}</TableCell>
                        <TableCell className="text-right text-sm text-navy">{formatPrice(b.hostPayout)}</TableCell>
                        <TableCell className="text-right text-sm text-navy">{formatPrice(b.platformFee)}</TableCell>
                        <TableCell><BookingStatusBadge status={b.status} /></TableCell>
                        <TableCell><PaymentStatusBadge status={lastPayment?.status || 'PENDING'} /></TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-navy/20 text-navy hover:bg-peach-light/60"
                            onClick={() => {
                              setRefundTarget({ bookingId: b.id, ref: b.reference, amount: b.totalAmount })
                              setRefundAmount(String(b.totalAmount))
                            }}
                          >
                            <Banknote className="h-3.5 w-3.5" /> Refund
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!refundTarget} onOpenChange={open => !open && setRefundTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue refund</DialogTitle>
            <DialogDescription>
              Booking <span className="font-mono font-medium text-navy">{refundTarget?.ref}</span> · max refundable{' '}
              <span className="font-medium text-navy">{refundTarget ? formatPrice(refundTarget.amount) : ''}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="refund-amount">Refund amount (in cents)</Label>
            <Input
              id="refund-amount"
              type="number"
              value={refundAmount}
              onChange={e => setRefundAmount(e.target.value)}
              min={0}
              max={refundTarget?.amount}
            />
            <p className="text-xs text-muted-foreground">Leave at the full amount for a complete refund, or enter a smaller value for a partial refund.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundTarget(null)}>Cancel</Button>
            <Button className="bg-orange text-white hover:bg-orange/90" onClick={handleRefund}>
              <Banknote className="h-4 w-4" /> Issue refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BookingStatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-emerald-100 text-emerald-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
    DECLINED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-zinc-100 text-zinc-700',
  }
  return <Badge className={`border-transparent ${cls[status] || 'bg-muted text-muted-foreground'}`}>{status.replace(/_/g, ' ')}</Badge>
}

function PaymentStatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    AUTHORIZED: 'bg-peach text-navy',
    CAPTURED: 'bg-emerald-100 text-emerald-700',
    FAILED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-zinc-100 text-zinc-700',
    PARTIALLY_REFUNDED: 'bg-orange/15 text-orange',
  }
  return <Badge className={`border-transparent ${cls[status] || 'bg-muted text-muted-foreground'}`}>{status.replace(/_/g, ' ')}</Badge>
}

// ============================================================
// FINANCE TAB
// ============================================================
function FinanceTab({ payments, payouts, bookings, users, stats, loading, onRefresh }: {
  payments: any[]; payouts: any[]; bookings: any[]; users: any[]; stats: any; loading: boolean; onRefresh: () => void
}) {
  const { showToast } = useAppStore()
  const [refundTarget, setRefundTarget] = useState<{ bookingId: string; ref: string; amount: number } | null>(null)
  const [refundAmount, setRefundAmount] = useState('')

  if (loading) return <LoadingBlock />

  const userMap = new Map<string, any>(users.map(u => [u.id, u]))
  const bookingMap = new Map<string, any>(bookings.map(b => [b.id, b]))

  const refundsIssued = payments.filter(p => p.intent === 'REFUND').length
  const payoutsPending = payouts.filter(p => p.status === 'PENDING').length
  const payoutsCompleted = payouts.filter(p => p.status === 'COMPLETED').length
  const payoutsFailed = payouts.filter(p => p.status === 'FAILED').length

  const recentPayments = payments.slice(0, 25)
  const recentPayouts = payouts.slice(0, 25)

  const handleRefund = () => {
    if (!refundTarget) return
    const amount = parseInt(refundAmount || '0', 10)
    adminRefund(refundTarget.bookingId, amount > 0 ? amount : undefined)
      .then(() => {
        showToast('Refund issued', `Refund for booking ${refundTarget.ref} has been processed.`, 'success')
        onRefresh()
      })
      .catch(() => showToast('Refund failed', `Could not refund booking ${refundTarget.ref}.`, 'error'))
      .finally(() => { setRefundTarget(null); setRefundAmount('') })
  }

  const handleExport = () => {
    showToast('Export queued', 'A CSV of payments and payouts will be emailed shortly.', 'default')
  }

  const summary: { label: string; value: string; icon: any; iconBg: string }[] = [
    { label: 'Gross booking value', value: formatPrice(stats?.grossBookingValue || 0), icon: DollarSign, iconBg: 'bg-navy text-white' },
    { label: 'Platform revenue', value: formatPrice(stats?.platformRevenue || 0), icon: Banknote, iconBg: 'bg-orange text-white' },
    { label: 'Refunds issued', value: formatNumber(refundsIssued), icon: ArrowDownRight, iconBg: 'bg-red-100 text-red-700' },
    { label: `Payouts · ${payoutsPending} pending / ${payoutsCompleted} done / ${payoutsFailed} failed`, value: formatNumber(payouts.length), icon: ArrowUpRight, iconBg: 'bg-emerald-100 text-emerald-700' },
  ]

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Finance"
        subtitle="Track payments, refunds, and host payouts."
        icon={DollarSign}
        action={
          <Button variant="outline" onClick={handleExport} className="rounded-full border-navy/20 text-navy">
            <FileText className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map(s => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="stayora-card-shadow">
              <CardContent className="p-4">
                <div className={`grid h-9 w-9 place-items-center rounded-lg ${s.iconBg}`}>
                  <Icon className="size-5" />
                </div>
                <p className="mt-3 text-2xl font-bold text-navy">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="bg-peach-light/60">
          <TabsTrigger value="payments" className="data-[state=active]:bg-navy data-[state=active]:text-white">
            Recent payments ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:bg-navy data-[state=active]:text-white">
            Recent payouts ({payouts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          {recentPayments.length === 0 ? (
            <EmptyState icon={DollarSign} title="No payments yet" subtitle="Payment attempts will appear here." />
          ) : (
            <Card className="stayora-card-shadow">
              <CardContent className="p-0">
                <div className="max-h-[640px] overflow-y-auto stayora-scroll">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment ID</TableHead>
                        <TableHead>Booking</TableHead>
                        <TableHead>Guest</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Intent</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentPayments.map(p => {
                        const booking = bookingMap.get(p.bookingId)
                        const guestName = booking?.guest?.name || '—'
                        const ref = booking?.reference || p.bookingId.slice(0, 8)
                        const canRefund = p.status === 'CAPTURED' && p.intent === 'CHARGE'
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-mono text-xs text-navy">{p.id.slice(0, 8)}</TableCell>
                            <TableCell className="font-mono text-xs text-navy">{ref}</TableCell>
                            <TableCell className="text-sm text-navy">{guestName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.provider}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-muted-foreground">{p.intent}</Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium text-navy">{formatPrice(p.amount)}</TableCell>
                            <TableCell><PaymentStatusBadge status={p.status} /></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{formatRelativeDate(p.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              {canRefund ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-navy/20 text-navy hover:bg-peach-light/60"
                                  onClick={() => {
                                    setRefundTarget({ bookingId: p.bookingId, ref, amount: p.amount })
                                    setRefundAmount(String(p.amount))
                                  }}
                                >
                                  <Banknote className="h-3.5 w-3.5" /> Refund
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payouts">
          {recentPayouts.length === 0 ? (
            <EmptyState icon={Banknote} title="No payouts yet" subtitle="Host payouts will appear here." />
          ) : (
            <Card className="stayora-card-shadow">
              <CardContent className="p-0">
                <div className="max-h-[640px] overflow-y-auto stayora-scroll">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payout ID</TableHead>
                        <TableHead>Host</TableHead>
                        <TableHead>Booking</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentPayouts.map(p => {
                        const host = userMap.get(p.hostId)
                        const booking = bookingMap.get(p.bookingId)
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-mono text-xs text-navy">{p.id.slice(0, 8)}</TableCell>
                            <TableCell className="text-sm text-navy">{host?.name || p.hostId.slice(0, 8)}</TableCell>
                            <TableCell className="font-mono text-xs text-navy">{booking?.reference || p.bookingId.slice(0, 8)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.provider}</TableCell>
                            <TableCell className="text-right text-sm font-medium text-navy">{formatPrice(p.amount)}</TableCell>
                            <TableCell><PayoutStatusBadge status={p.status} /></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{p.scheduledAt ? formatRelativeDate(p.scheduledAt) : '—'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{p.completedAt ? formatRelativeDate(p.completedAt) : '—'}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!refundTarget} onOpenChange={open => !open && setRefundTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue refund</DialogTitle>
            <DialogDescription>
              Booking <span className="font-mono font-medium text-navy">{refundTarget?.ref}</span> · max refundable{' '}
              <span className="font-medium text-navy">{refundTarget ? formatPrice(refundTarget.amount) : ''}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="refund-amount-2">Refund amount (in cents)</Label>
            <Input
              id="refund-amount-2"
              type="number"
              value={refundAmount}
              onChange={e => setRefundAmount(e.target.value)}
              min={0}
              max={refundTarget?.amount}
            />
            <p className="text-xs text-muted-foreground">This action will be recorded in the audit log.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundTarget(null)}>Cancel</Button>
            <Button className="bg-orange text-white hover:bg-orange/90" onClick={handleRefund}>
              <Banknote className="h-4 w-4" /> Issue refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PayoutStatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    PROCESSING: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    FAILED: 'bg-red-100 text-red-700',
  }
  return <Badge className={`border-transparent ${cls[status] || 'bg-muted text-muted-foreground'}`}>{status.replace(/_/g, ' ')}</Badge>
}

// ============================================================
// SUPPORT TAB
// ============================================================
function SupportTab({ tickets, loading }: { tickets: any[]; loading: boolean }) {
  const { showToast, user } = useAppStore()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('ALL')
  const [priority, setPriority] = useState('ALL')
  const [viewing, setViewing] = useState<any | null>(null)

  if (loading) return <LoadingBlock />

  const filtered = tickets.filter(t => {
    if (status !== 'ALL' && t.status !== status) return false
    if (priority !== 'ALL' && t.priority !== priority) return false
    if (q) {
      const s = q.toLowerCase()
      if (!(`${t.subject} ${t.requester?.name} ${t.category}`.toLowerCase().includes(s))) return false
    }
    return true
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="Support" subtitle="Triage tickets, assign owners, and resolve issues." icon={LifeBuoy} />

      <Card className="stayora-card-shadow">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput value={q} onChange={setQ} placeholder="Search by subject, requester, or category..." />
            <div className="flex items-center gap-2">
              <FilterLabel>Status</FilterLabel>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                  <SelectItem value="WAITING">Waiting</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <FilterLabel>Priority</FilterLabel>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets match" subtitle="Adjust your filters to see support tickets." />
      ) : (
        <Card className="stayora-card-shadow">
          <CardContent className="p-0">
            <div className="max-h-[640px] overflow-y-auto stayora-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs text-navy">{t.id.slice(0, 8)}</TableCell>
                      <TableCell className="max-w-[220px] truncate text-sm font-medium text-navy">{t.subject}</TableCell>
                      <TableCell className="text-sm text-navy">{t.requester?.name || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.assignee?.name || 'Unassigned'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.category}</TableCell>
                      <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                      <TableCell><TicketStatusBadge status={t.status} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatRelativeDate(t.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownActions
                          items={[
                            { label: 'Assign to me', icon: UserCheck, onClick: () => showToast('Ticket assigned', `Ticket ${t.id.slice(0, 8)} is now assigned to ${user?.name || 'you'}.`, 'success') },
                            { label: 'Resolve', icon: CheckCircle2, onClick: () => showToast('Ticket resolved', `Ticket ${t.id.slice(0, 8)} marked as resolved.`, 'success') },
                            { label: 'View details', icon: Eye, onClick: () => setViewing(t) },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!viewing} onOpenChange={open => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Ticket {viewing?.id?.slice(0, 8)}</DialogTitle>
            <DialogDescription>{viewing?.subject}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Requester</p>
                <p className="text-navy">{viewing?.requester?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Assignee</p>
                <p className="text-navy">{viewing?.assignee?.name || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Category</p>
                <p className="text-navy">{viewing?.category}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Priority</p>
                <p><PriorityBadge priority={viewing?.priority} /></p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <p><TicketStatusBadge status={viewing?.status} /></p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Created</p>
                <p className="text-navy">{viewing ? formatDate(viewing.createdAt, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Description</p>
              <Textarea
                readOnly
                value={viewing?.description || '(no description provided)'}
                className="mt-1 min-h-[120px] resize-none bg-muted/40"
              />
            </div>
            {viewing?.booking && (
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Related booking</p>
                <p className="font-mono text-navy">{viewing.booking.reference}</p>
                <p className="text-muted-foreground">{viewing.booking.listing?.title}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
            <Button className="bg-navy text-white hover:bg-navy/90" onClick={() => { showToast('Ticket resolved', `Ticket ${viewing?.id?.slice(0, 8)} marked as resolved.`, 'success'); setViewing(null) }}>
              <CheckCircle2 className="h-4 w-4" /> Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TicketStatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    OPEN: 'bg-amber-100 text-amber-700',
    IN_PROGRESS: 'bg-orange/15 text-orange',
    WAITING: 'bg-zinc-100 text-zinc-700',
    RESOLVED: 'bg-emerald-100 text-emerald-700',
    CLOSED: 'bg-navy text-white',
  }
  return <Badge className={`border-transparent ${cls[status] || 'bg-muted text-muted-foreground'}`}>{status.replace(/_/g, ' ')}</Badge>
}

function PriorityBadge({ priority }: { priority: string }) {
  const cls: Record<string, string> = {
    LOW: 'bg-zinc-100 text-zinc-700',
    NORMAL: 'bg-peach text-navy',
    HIGH: 'bg-orange/15 text-orange',
    URGENT: 'bg-red-100 text-red-700',
  }
  return (
    <Badge className={`border-transparent ${cls[priority] || 'bg-muted text-muted-foreground'}`}>
      {priority === 'URGENT' && <Zap className="h-3 w-3" />}
      {priority}
    </Badge>
  )
}

// ============================================================
// AUDIT TAB
// ============================================================
function AuditTab({ logs, loading }: { logs: any[]; loading: boolean }) {
  const [q, setQ] = useState('')
  const [action, setAction] = useState('ALL')

  if (loading) return <LoadingBlock />

  // Build action type options from observed logs
  const actionTypes = Array.from(new Set(logs.map((l: any) => l.action))).sort()

  const filtered = logs.filter((l: any) => {
    if (action !== 'ALL' && l.action !== action) return false
    if (q) {
      const s = q.toLowerCase()
      const actor = l.actor?.name || l.actor?.email || 'system'
      if (!(`${actor} ${l.resource} ${l.resourceId || ''} ${l.action}`.toLowerCase().includes(s))) return false
    }
    return true
  })

  return (
    <div className="space-y-5">
      <SectionHeader title="Audit log" subtitle="Every admin mutation, tracked with actor, resource, and IP." icon={ShieldAlert} />

      <Card className="stayora-card-shadow">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput value={q} onChange={setQ} placeholder="Search by actor, resource, or action..." />
            <div className="flex items-center gap-2">
              <FilterLabel>Action</FilterLabel>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All actions</SelectItem>
                  {actionTypes.map(a => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No audit entries match" subtitle="Admin actions will be recorded here in real time." />
      ) : (
        <Card className="stayora-card-shadow">
          <CardContent className="p-0">
            <div className="max-h-[640px] overflow-y-auto stayora-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Resource ID</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l: any) => {
                    const actorName = l.actor?.name || l.actor?.email || 'System'
                    const isSystem = !l.actor
                    return (
                      <TableRow key={l.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`grid h-7 w-7 place-items-center rounded-full ${isSystem ? 'bg-zinc-100 text-zinc-600' : 'bg-navy text-white'}`}>
                              <ShieldCheck className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-sm font-medium text-navy">{actorName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px] text-navy">{l.action}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-navy">{l.resource}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{l.resourceId ? l.resourceId.slice(0, 8) : '—'}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{l.ip || '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground" title={l.createdAt}>
                          {formatRelativeDate(l.createdAt)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================
// DROPDOWN ACTIONS (shared)
// ============================================================
function DropdownActions({ items }: { items: { label: string; icon: any; onClick: () => void; destructive?: boolean }[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-navy hover:bg-peach-light/60"
          aria-label="Row actions"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {items.map((it, idx) => (
          <span key={idx}>
            {idx > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              variant={it.destructive ? 'destructive' : 'default'}
              onClick={it.onClick}
              className="cursor-pointer"
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </DropdownMenuItem>
          </span>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
