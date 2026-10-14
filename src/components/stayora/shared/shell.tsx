'use client'

import { useEffect, useState } from 'react'
import { useAppStore, ViewName } from '@/store/useAppStore'
import {
  Home, Search, Compass, Wrench, User, Crown, Shield, Menu, X, Bell, Heart, MessageCircle, LogOut, ChevronDown, Sparkles,
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fetchNotifications, fetchConversations, fetchWishlists } from '@/lib/api'

const NAV_ITEMS: { view: ViewName; label: string; icon: any }[] = [
  { view: 'home', label: 'Explore', icon: Home },
  { view: 'search', label: 'Search', icon: Search },
  { view: 'experiences', label: 'Experiences', icon: Compass },
  { view: 'services', label: 'Services', icon: Wrench },
  { view: 'ai-assistant', label: 'AI Assistant', icon: Sparkles },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const { view, setView, user, setUser, openAuth, setSidebarOpen, sidebarOpen } = useAppStore()
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)

  // Refresh session + notification counts
  const refreshSession = () => {
    fetch('/api/stayora?op=me', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (data?.user) setUser(data.user) })
      .catch(() => {})
  }

  useEffect(() => {
    refreshSession()
  }, [setUser])

  useEffect(() => {
    if (!user) return
    fetchNotifications().then(d => setUnreadNotifs(d?.unreadCount ?? 0)).catch(() => {})
    fetchConversations().then(d => {
      const convs = d?.conversations || []
      // Approximate unread: conversations with last message not from me
      setUnreadMsgs(convs.filter((c: any) => c.messages?.[0] && c.messages[0].senderId !== user.id && !c.messages[0].isRead).length)
    }).catch(() => {})
  }, [user, view])

  const handleLogout = async () => {
    await fetch('/api/stayora?op=logout', { method: 'POST', credentials: 'include' })
    setUser(null)
    setView('home')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-16 items-center justify-between gap-4 px-4 md:px-6">
          {/* Logo */}
          <button
            onClick={() => setView('home')}
            className="flex items-center gap-2 transition hover:opacity-80"
            aria-label="Stayora home"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-navy text-white font-bold text-lg">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-navy">Stayora</span>
          </button>

          {/* Center nav (desktop) */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              const active = view === item.view
              return (
                <button
                  key={item.view}
                  onClick={() => setView(item.view)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-navy text-white'
                      : 'text-navy/80 hover:bg-peach-light hover:text-navy'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {user && (user.role === 'HOST' || user.role === 'ADMIN') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView(user.role === 'ADMIN' ? 'admin' : 'host')}
                className="hidden rounded-full text-navy hover:bg-peach-light sm:flex"
              >
                <Crown className="mr-2 h-4 w-4" />
                {user.role === 'ADMIN' ? 'Admin' : 'Host dashboard'}
              </Button>
            )}
            {user && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setView('guest')}
                  className="relative rounded-full text-navy hover:bg-peach-light"
                  aria-label="Messages"
                >
                  <MessageCircle className="h-5 w-5" />
                  {unreadMsgs > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-orange text-[10px] font-bold text-white">
                      {unreadMsgs}
                    </span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => useAppStore.setState({ guestTab: 'notifications' }) || setView('guest')}
                  className="relative rounded-full text-navy hover:bg-peach-light"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-orange text-[10px] font-bold text-white">
                      {unreadNotifs}
                    </span>
                  )}
                </Button>
              </>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2 transition hover:shadow-sm">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                      <AvatarFallback className="bg-navy text-white text-xs">
                        {user.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-navy">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                      {user.isSuperhost && <Badge variant="secondary" className="w-fit text-[10px]">Superhost</Badge>}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setView('guest')}>
                    <User className="mr-2 h-4 w-4" /> Guest dashboard
                  </DropdownMenuItem>
                  {(user.role === 'HOST' || user.role === 'ADMIN') && (
                    <DropdownMenuItem onClick={() => setView(user.role === 'ADMIN' ? 'admin' : 'host')}>
                      <Crown className="mr-2 h-4 w-4" /> {user.role === 'ADMIN' ? 'Admin panel' : 'Host dashboard'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => useAppStore.setState({ guestTab: 'wishlists' }) || setView('guest')}>
                    <Heart className="mr-2 h-4 w-4" /> Wishlists
                  </DropdownMenuItem>
                  {user.role !== 'HOST' && (
                    <DropdownMenuItem onClick={() => useAppStore.setState({ view: 'create-listing' })}>
                      <Crown className="mr-2 h-4 w-4" /> Become a host
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openAuth('login')}
                  className="rounded-full text-navy hover:bg-peach-light"
                >
                  Sign in
                </Button>
                <Button
                  size="sm"
                  onClick={() => openAuth('register')}
                  className="rounded-full bg-orange text-white hover:bg-orange/90"
                >
                  Sign up
                </Button>
              </>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-navy md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {sidebarOpen && (
          <div className="border-t border-border bg-white px-4 py-3 md:hidden">
            <div className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon
                const active = view === item.view
                return (
                  <button
                    key={item.view}
                    onClick={() => { setView(item.view); setSidebarOpen(false) }}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                      active ? 'bg-navy text-white' : 'text-navy/80 hover:bg-peach-light'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-navy text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-orange font-bold">S</div>
              <span className="text-xl font-bold">Stayora</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-white/70">
              A marketplace for unique stays, hosted experiences, and trusted local services across 50+ destinations.
            </p>
            <p className="mt-4 text-xs text-white/50">
              © {new Date().getFullYear()} Stayora. All rights reserved. A demo project.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">Support</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li>Help Center</li>
              <li>Safety information</li>
              <li>Cancellation options</li>
              <li>Report a concern</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">Hosting</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li>Become a host</li>
              <li>Host resources</li>
              <li>Community forum</li>
              <li>Responsible hosting</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">Stayora</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/80">
              <li>Newsroom</li>
              <li>Careers</li>
              <li>Investors</li>
              <li>Privacy &amp; terms</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
