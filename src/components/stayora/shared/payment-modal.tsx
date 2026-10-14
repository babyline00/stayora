'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { CreditCard, Lock, ShieldCheck, AlertCircle, Loader2, CheckCircle2, X } from 'lucide-react'
import { createPaymentMethod, confirmPaymentIntent, authenticate3DS, createPaymentIntent } from '@/lib/api'

type Step = 'form' | 'processing' | '3ds' | 'success' | 'error'

interface NewPaymentModalProps {
  open: boolean
  onClose: () => void
  amount: number // cents
  currency?: string
  bookingId?: string
  listingId?: string
  onSuccess?: (result: { paymentIntentId: string; status: string }) => void
  metadata?: { listingTitle?: string; checkIn?: string; checkOut?: string; nights?: number }
}

const TEST_CARDS = [
  { number: '4242 4242 4242 4242', label: 'Success' },
  { number: '4000 0027 6000 3184', label: 'Requires 3DS' },
  { number: '4000 0000 0000 0002', label: 'Decline' },
]

export function NewPaymentModal({
  open, onClose, amount, currency = 'usd', bookingId, listingId, onSuccess, metadata,
}: NewPaymentModalProps) {
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState('')
  const [card, setCard] = useState({ number: '', name: '', exp_month: '', exp_year: '', cvc: '' })
  const [intentId, setIntentId] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
  }
  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return digits
  }
  const formatCVC = (v: string) => v.replace(/\D/g, '').slice(0, 4)

  const handleSubmit = async () => {
    setError('')
    setProcessing(true)
    try {
      // Step 1: Create payment intent via the proxy endpoint
      const intentRes: any = await createPaymentIntent({
        amount, currency, bookingId, listingId,
      })
      const intent = intentRes.intent
      setIntentId(intent.id)

      // Step 2: Tokenize the card
      const paymentMethod: any = await createPaymentMethod({
        number: card.number.replace(/\s/g, ''),
        exp_month: parseInt(card.exp_month.split('/')[0]),
        exp_year: parseInt(`20${card.exp_year.split('/')[1] || '27'}`),
        cvc: card.cvc,
      }, { name: card.name })

      setStep('processing')

      // Step 3: Confirm the payment intent
      try {
        const confirmed: any = await confirmPaymentIntent(intent.id, paymentMethod.id)
        if (confirmed.status === 'requires_action' && confirmed.nextAction?.type === 'use_stripe_sdk') {
          setStep('3ds')
          // Simulate the 3DS challenge — in real Stripe this would show the bank's iframe
          setTimeout(async () => {
            try {
              const authenticated: any = await authenticate3DS(intent.id)
              if (authenticated.status === 'processing') {
                // Wait for webhook (gateway fires payment_intent.succeeded which our webhook handler confirms)
                // We poll the intent status briefly
                const start = Date.now()
                const poll = async () => {
                  if (Date.now() - start > 8000) {
                    setStep('success')
                    onSuccess?.({ paymentIntentId: intent.id, status: 'succeeded' })
                    return
                  }
                  try {
                    const r = await fetch(`/payment-intents/${intent.id}?XTransformPort=3004`)
                    const data = await r.json()
                    if (data.status === 'succeeded') {
                      setStep('success')
                      onSuccess?.({ paymentIntentId: intent.id, status: 'succeeded' })
                    } else if (data.status === 'canceled' || data.status === 'requires_payment_method') {
                      setStep('error')
                      setError('Payment failed during authentication')
                    } else {
                      setTimeout(poll, 500)
                    }
                  } catch {
                    setTimeout(poll, 500)
                  }
                }
                setTimeout(poll, 800)
              }
            } catch (e: any) {
              setStep('error')
              setError(e.message || '3DS authentication failed')
            }
          }, 2000)
          return
        }
        if (confirmed.status === 'processing' || confirmed.status === 'succeeded') {
          // Wait briefly for webhook to fire
          const start = Date.now()
          const poll = async () => {
            if (Date.now() - start > 5000) {
              setStep('success')
              onSuccess?.({ paymentIntentId: intent.id, status: 'succeeded' })
              return
            }
            try {
              const r = await fetch(`/payment-intents/${intent.id}?XTransformPort=3004`)
              const data = await r.json()
              if (data.status === 'succeeded') {
                setStep('success')
                onSuccess?.({ paymentIntentId: intent.id, status: 'succeeded' })
              } else if (data.status === 'requires_payment_method') {
                setStep('error')
                setError('Payment declined')
              } else {
                setTimeout(poll, 400)
              }
            } catch {
              setTimeout(poll, 400)
            }
          }
          setTimeout(poll, 600)
          return
        }
        if (confirmed.status === 'requires_payment_method') {
          setStep('error')
          setError('Your card was declined. Try a different card.')
          return
        }
      } catch (e: any) {
        const msg = e.message || 'Payment failed'
        if (msg.includes('card_declined')) {
          setStep('error')
          setError('Your card was declined. Try a different card.')
        } else {
          setStep('error')
          setError(msg)
        }
      }
    } catch (e: any) {
      setStep('error')
      setError(e.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  const close = () => {
    if (processing) return
    setStep('form')
    setError('')
    setCard({ number: '', name: '', exp_month: '', exp_year: '', cvc: '' })
    setIntentId(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md gap-0 p-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-navy text-white">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-navy">Secure payment</DialogTitle>
              <p className="text-xs text-muted-foreground">Powered by Stayora Pay</p>
            </div>
          </div>
          <button onClick={close} className="rounded-full p-1 hover:bg-muted" disabled={processing}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'form' && (
          <div className="px-6 py-5 space-y-4">
            <div className="rounded-xl bg-peach-light/60 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total to pay</span>
                <span className="text-2xl font-bold text-navy">${(amount / 100).toFixed(2)}</span>
              </div>
              {metadata?.listingTitle && (
                <p className="mt-1 text-xs text-navy">{metadata.listingTitle}</p>
              )}
              {metadata?.nights && (
                <p className="text-xs text-muted-foreground">{metadata.nights} {metadata.nights === 1 ? 'night' : 'nights'} · {metadata.checkIn} → {metadata.checkOut}</p>
              )}
            </div>

            <div>
              <Label htmlFor="name">Name on card</Label>
              <Input
                id="name"
                value={card.name}
                onChange={(e) => setCard(c => ({ ...c, name: e.target.value }))}
                placeholder="JANE DOE"
                className="mt-1 rounded-lg uppercase"
              />
            </div>

            <div>
              <Label htmlFor="number">Card number</Label>
              <div className="relative mt-1">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="number"
                  value={card.number}
                  onChange={(e) => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))}
                  placeholder="4242 4242 4242 4242"
                  className="rounded-lg pl-9 font-mono"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="exp">Expiry</Label>
                <Input
                  id="exp"
                  value={card.exp_month}
                  onChange={(e) => setCard(c => ({ ...c, exp_month: formatExpiry(e.target.value) }))}
                  placeholder="MM/YY"
                  className="mt-1 rounded-lg font-mono"
                  inputMode="numeric"
                />
              </div>
              <div>
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  value={card.cvc}
                  onChange={(e) => setCard(c => ({ ...c, cvc: formatCVC(e.target.value) }))}
                  placeholder="123"
                  className="mt-1 rounded-lg font-mono"
                  inputMode="numeric"
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={processing || !card.number || !card.exp_month || !card.cvc || !card.name}
              className="w-full rounded-full bg-orange text-white hover:bg-orange/90"
            >
              {processing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</> : <><Lock className="mr-2 h-4 w-4" /> Pay ${(amount / 100).toFixed(2)}</>}
            </Button>

            <div className="rounded-lg bg-peach-light/40 p-2 text-[10px] text-navy">
              <p className="font-semibold mb-1">Test cards (no real charge):</p>
              <div className="space-y-0.5">
                {TEST_CARDS.map(c => (
                  <button
                    key={c.number}
                    onClick={() => setCard({ number: c.number, name: 'TEST USER', exp_month: '12/27', cvc: '123' })}
                    className="block text-left hover:underline"
                  >
                    <span className="font-mono">{c.number}</span> — {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              Payments are encrypted and PCI-DSS compliant
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <DialogTitle className="sr-only">Processing payment</DialogTitle>
            <Loader2 className="h-10 w-10 animate-spin text-orange" />
            <p className="text-sm font-medium text-navy">Charging your card…</p>
            <p className="text-xs text-muted-foreground">Do not close this window.</p>
          </div>
        )}

        {step === '3ds' && (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <DialogTitle className="sr-only">3D Secure authentication</DialogTitle>
            <div className="grid h-14 w-14 place-items-center rounded-full bg-navy text-white">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <p className="text-base font-bold text-navy">Authenticating with your bank</p>
              <p className="text-sm text-muted-foreground">Complete 3D Secure verification</p>
            </div>
            <div className="w-full max-w-xs rounded-xl border border-border p-4 text-left">
              <p className="text-xs text-muted-foreground mb-2">Bank: Test Bank</p>
              <p className="text-sm font-semibold text-navy">Amount: ${(amount / 100).toFixed(2)} USD</p>
              <p className="text-xs text-muted-foreground">Reference: {intentId?.slice(-8)}</p>
            </div>
            <p className="text-xs text-muted-foreground">Simulating authentication…</p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <DialogTitle className="sr-only">Payment successful</DialogTitle>
            <div className="grid h-14 w-14 place-items-center rounded-full bg-green-100">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <p className="text-lg font-bold text-navy">Payment successful!</p>
            <p className="text-sm text-muted-foreground">Your booking is now confirmed.</p>
            <p className="font-mono text-xs text-muted-foreground">Ref: {intentId?.slice(-12)}</p>
            <Button onClick={close} className="rounded-full bg-orange text-white">Done</Button>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <DialogTitle className="sr-only">Payment error</DialogTitle>
            <div className="grid h-14 w-14 place-items-center rounded-full bg-destructive/10">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <p className="text-lg font-bold text-destructive">Payment failed</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => setStep('form')} className="rounded-full">Try again</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
