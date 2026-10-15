'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { login, register } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { X } from 'lucide-react'

export function AuthModal() {
  const { authMode, closeAuth, setUser, setView, showToast } = useAppStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'GUEST' | 'HOST'>('GUEST')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isLogin = authMode === 'login'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = isLogin
        ? await login(email, password)
        : await register({ email, password, name, role })
      setUser(user.user)
      closeAuth()
      showToast(isLogin ? `Welcome back, ${user.user.name}!` : 'Account created', isLogin ? 'You are now signed in.' : 'Check your email for next steps.', 'success')
      // Open appropriate dashboard
      if (user.user.role === 'HOST') {
        setView('host')
      } else if (user.user.role === 'ADMIN') {
        setView('admin')
      } else {
        setView('home')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (kind: 'guest' | 'host' | 'admin') => {
    setEmail(`${kind}1@stayora.com`)
    setPassword('stayora123')
  }

  return (
    <Dialog open onOpenChange={(open) => !open && closeAuth()}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="text-xl font-bold text-navy">
            {isLogin ? 'Welcome back to Stayora' : 'Create your Stayora account'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isLogin ? 'Sign in to continue to your dashboard.' : 'Join Stayora to book stays and experiences.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="flex flex-col gap-4 px-6 py-6">
          {!isLogin && (
            <div className="grid gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                autoFocus
                className="rounded-lg"
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="rounded-lg"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="rounded-lg"
            />
            {!isLogin && (
              <p className="text-xs text-muted-foreground">Minimum 6 characters.</p>
            )}
          </div>

          {!isLogin && (
            <div className="grid gap-2">
              <Label>I want to</Label>
              <RadioGroup
                value={role}
                onValueChange={(v) => setRole(v as 'GUEST' | 'HOST')}
                className="grid grid-cols-2 gap-2"
              >
                <Label htmlFor="role-guest" className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer has-[:checked]:border-orange has-[:checked]:bg-peach-light">
                  <RadioGroupItem id="role-guest" value="GUEST" />
                  <span className="text-sm font-medium">Book stays</span>
                </Label>
                <Label htmlFor="role-host" className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer has-[:checked]:border-orange has-[:checked]:bg-peach-light">
                  <RadioGroupItem id="role-host" value="HOST" />
                  <span className="text-sm font-medium">Host my place</span>
                </Label>
              </RadioGroup>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full rounded-lg bg-orange text-white hover:bg-orange/90">
            {loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            {isLogin ? (
              <>
                New here?{' '}
                <button type="button" onClick={() => useAppStore.setState({ authMode: 'register' })} className="font-medium text-orange hover:underline">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button type="button" onClick={() => useAppStore.setState({ authMode: 'login' })} className="font-medium text-orange hover:underline">
                  Sign in
                </button>
              </>
            )}
          </div>

          {/* Demo logins */}
          <div className="mt-2 rounded-lg bg-peach-light/60 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Demo accounts (one tap)
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => fillDemo('guest')} className="rounded-md bg-white px-2 py-1 text-xs border border-border hover:bg-peach-light/50">guest1@stayora.com</button>
              <button type="button" onClick={() => fillDemo('host')} className="rounded-md bg-white px-2 py-1 text-xs border border-border hover:bg-peach-light/50">host1@stayora.com</button>
              <button type="button" onClick={() => fillDemo('admin')} className="rounded-md bg-white px-2 py-1 text-xs border border-border hover:bg-peach-light/50">admin@stayora.com</button>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">Password for all: <code>stayora123</code></p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
