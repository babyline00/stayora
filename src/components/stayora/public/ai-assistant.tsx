'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { askTravelAssistant } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sparkles, Send, ArrowRight, MapPin, Star, Users, Bed, Lightbulb, MessageSquare, X } from 'lucide-react'
import { formatPrice, formatRating } from '@/lib/format'
import { PropertyCard } from '@/components/stayora/shared/property-card'

interface AssistantResult {
  greeting?: string
  summary?: string
  recommendations?: Array<{ listingId: string; reason: string; listing?: any }>
  tips?: string[]
  followups?: string[]
  raw?: boolean
  error?: string
}

const STARTER_PROMPTS = [
  'Find me a romantic cabin for two near a beach under $200/night',
  'I need a 2-week stay in Lisbon with fast Wi-Fi for remote work',
  'Family trip to Marrakech — 4 guests, pool, kid-friendly',
  'Looking for a luxury villa in Bali with a private pool',
  'Show me unique stays: boats, tiny houses, or lofts',
]

export function AiAssistantView() {
  const { user, selectListing, setFilters, setView, showToast } = useAppStore()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AssistantResult | null>(null)
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])

  const ask = async (q?: string) => {
    const finalQuery = q || query
    if (!finalQuery.trim()) return
    setLoading(true)
    setHistory(h => [...h, { role: 'user', content: finalQuery }])
    setQuery('')
    try {
      const r = await askTravelAssistant(finalQuery, {
        name: user?.name,
        role: user?.role,
      })
      setResult(r)
      if (r.error) {
        setHistory(h => [...h, { role: 'assistant', content: r.error! }])
        showToast('AI unavailable', r.error, 'error')
      } else if (r.raw) {
        setHistory(h => [...h, { role: 'assistant', content: r.summary || 'Got it.' }])
      } else {
        setHistory(h => [...h, { role: 'assistant', content: r.summary || '' }])
      }
    } catch (e: any) {
      setResult({ error: e.message })
      showToast('AI request failed', e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-peach-light px-4 py-1.5 text-sm font-medium text-navy">
          <Sparkles className="h-4 w-4 text-orange" /> AI Travel Assistant
        </div>
        <h1 className="text-3xl font-bold text-navy">Plan your perfect trip in plain English</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tell me where, when, and what you're looking for — I'll search all of Stayora and recommend stays that match.</p>
      </div>

      {/* Input */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), ask())}
                placeholder="Ask anything — '2 weeks in Bali with a pool, beach access, under $300/night'"
                className="rounded-xl pl-10 text-sm"
                disabled={loading}
              />
            </div>
            <Button onClick={() => ask()} disabled={loading || !query.trim()} className="rounded-xl bg-orange text-white">
              {loading ? <><span className="animate-pulse">Thinking…</span></> : <><Send className="mr-2 h-4 w-4" /> Ask</>}
            </Button>
          </div>
          {/* Starter prompts */}
          {!result && !history.length && (
            <div className="mt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Try one of these:</p>
              <div className="flex flex-wrap gap-2">
                {STARTER_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => { setQuery(p); ask(p) }}
                    className="rounded-full bg-peach-light/60 px-3 py-1.5 text-xs text-navy hover:bg-peach-light"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation history */}
      {history.length > 0 && (
        <div className="mb-6 space-y-3">
          {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-navy text-white' : 'bg-peach-light/60 text-navy'}`}>
                {msg.role === 'assistant' && (
                  <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-orange">
                    <Sparkles className="h-3 w-3" /> Stayora AI
                  </div>
                )}
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !result && (
        <Card>
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-3">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton className="aspect-[4/3] rounded-xl" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && !result.error && !result.raw && (
        <div className="space-y-6">
          {/* Tips */}
          {result.tips && result.tips.length > 0 && (
            <Card className="bg-peach-light/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-navy text-base">
                  <Lightbulb className="h-5 w-5 text-orange" /> Travel tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-navy">
                {result.tips.map((t, i) => <p key={i}>• {t}</p>)}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 ? (
            <div>
              <h2 className="mb-3 text-lg font-bold text-navy">Recommended stays ({result.recommendations.length})</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {result.recommendations.map((r, i) => (
                  <div key={r.listingId} className="space-y-2">
                    {r.listing && <PropertyCard listing={r.listing} />}
                    <div className="rounded-xl bg-peach-light/60 p-3 text-xs text-navy">
                      <p className="font-semibold mb-1">Why this matches:</p>
                      <p>{r.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No specific recommendations yet — try rephrasing your request.
              </CardContent>
            </Card>
          )}

          {/* Followup questions */}
          {result.followups && result.followups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-navy">Keep planning</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {result.followups.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(q); ask(q) }}
                    className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-navy hover:bg-peach-light/60"
                  >
                    {q} <ArrowRight className="h-3 w-3" />
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {result?.error && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-destructive">
            {result.error}
          </CardContent>
        </Card>
      )}

      {/* Reset button */}
      {history.length > 0 && !loading && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => { setHistory([]); setResult(null); setQuery('') }} className="rounded-full">
            Start new conversation
          </Button>
        </div>
      )}
    </div>
  )
}
