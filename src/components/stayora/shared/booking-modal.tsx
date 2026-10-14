'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { fetchListing, createBooking, validateCoupon } from '@/lib/api'
import { formatPrice } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'

type Step = 'form' | 'confirm' | 'processing' | 'done' | 'error'

export function BookingModal() {
  const {
    bookingListingId, bookingDates, bookingGuests, closeBooking, user, setView, selectBooking,
    showToast, setGuestTab,
  } = useAppStore()
  const [listing, setListing] = useState<any>(null)
  const [dates, setDates] = useState<{ from?: Date; to?: Date }>({})
  const [guests, setGuests] = useState(bookingGuests)
  const [coupon, setCoupon] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponMsg, setCouponMsg] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!bookingListingId) return
    fetchListing(bookingListingId).then(d => {
      setListing(d.listing)
      if (bookingDates.checkIn) setDates(prev => ({ ...prev, from: new Date(bookingDates.checkIn) }))
      if (bookingDates.checkOut) setDates(prev => ({ ...prev, to: new Date(bookingDates.checkOut!) }))
    }).catch(() => {})
  }, [bookingListingId, bookingDates.checkIn, bookingDates.checkOut])

  // Reset on close — defer to avoid synchronous setState-in-effect
  useEffect(() => {
    if (!useAppStore.getState().bookingModalOpen) {
      Promise.resolve().then(() => {
        setStep('form'); setReference(''); setError(''); setDiscount(0); setCoupon(''); setCouponMsg('')
      })
    }
  }, [bookingListingId])

  const nights = dates.from && dates.to
    ? Math.max(1, Math.round((dates.to.getTime() - dates.from.getTime()) / 86400000))
    : 0

  const nightlySubtotal = listing ? listing.basePrice * nights : 0
  const cleaningFee = listing?.cleaningFee || 0
  const serviceFee = Math.round(nightlySubtotal * 0.12)
  const taxes = Math.round(nightlySubtotal * 0.08)
  const totalAmount = nightlySubtotal + cleaningFee + serviceFee + taxes - discount

  const applyCoupon = async () => {
    if (!coupon) return
    setCouponMsg('Checking…')
    try {
      const r = await validateCoupon(coupon, nightlySubtotal)
      if (r.valid) {
        setDiscount(r.discount)
        setCouponMsg(`✓ $${(r.discount / 100).toFixed(2)} discount applied`)
      } else {
        setDiscount(0)
        setCouponMsg(`✗ ${r.message}`)
      }
    } catch (err: any) {
      setCouponMsg(`✗ ${err.message}`)
    }
  }

  const submit = async () => {
    if (!listing || !dates.from || !dates.to) return
    setStep('processing')
    setError('')
    try {
      const result: any = await createBooking({
        listingId: listing.id,
        checkIn: dates.from.toISOString().split('T')[0],
        checkOut: dates.to.toISOString().split('T')[0],
        adults: guests.adults, children: guests.children,
        infants: guests.infants, pets: guests.pets,
        couponCode: discount > 0 ? coupon : undefined,
      })
      setReference(result.booking.reference)
      // If the booking was created as PENDING (non-instant book), we need to collect payment to confirm it
      if (result.booking.status === 'PENDING' || listing.instantBook) {
        showToast('Pay to confirm', `Reservation ${result.booking.reference} held — complete payment to confirm.`, 'default')
        // Close booking modal first, then open payment modal after a delay to avoid focus conflict
        setTimeout(() => {
          closeBooking()
          setTimeout(() => {
            useAppStore.getState().openPayment({
              amount: totalAmount,
              currency: 'usd',
              bookingId: result.booking.id,
              listingId: listing.id,
              metadata: {
                listingTitle: listing.title,
                checkIn: dates.from?.toLocaleDateString(),
                checkOut: dates.to?.toLocaleDateString(),
                nights,
              },
            })
          }, 200)
        }, 1200)
        setStep('done')
      } else {
        setStep('done')
        showToast('Booking confirmed', result.booking.reference, 'success')
      }
    } catch (err: any) {
      setError(err.message || 'Booking failed')
      setStep('error')
    }
  }

  if (!listing) {
    return (
      <Dialog open onOpenChange={(o) => !o && closeBooking()}>
        <DialogContent className="flex flex-col items-center justify-center gap-4 py-12">
          <DialogTitle className="sr-only">Loading</DialogTitle>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading property…</p>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={(o) => !o && closeBooking()}>
      <DialogContent className="max-w-lg gap-0 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <DialogTitle className="text-lg font-bold text-navy">Book your stay</DialogTitle>
            <p className="text-sm text-muted-foreground">{listing.title}</p>
          </div>
          <button onClick={closeBooking} className="rounded-full p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'form' && (
          <div className="px-6 py-5">
            {/* Dates */}
            <Label className="mb-2 block">Dates</Label>
            <div className="rounded-xl border border-border p-3">
              <Calendar
                mode="range"
                numberOfMonths={1}
                selected={dates as any}
                onSelect={(range: any) => setDates(range || {})}
                disabled={{ before: new Date() }}
                className="rounded-lg"
              />
            </div>

            {/* Guests */}
            <div className="mt-4">
              <Label className="mb-2 block">Guests</Label>
              <div className="grid grid-cols-2 gap-3">
                <GuestCounter label="Adults" value={guests.adults} min={1} max={listing.maxGuests}
                  onChange={(v) => setGuests(g => ({ ...g, adults: v }))} />
                <GuestCounter label="Children" value={guests.children} min={0} max={listing.maxGuests - 1}
                  onChange={(v) => setGuests(g => ({ ...g, children: v }))} />
                <GuestCounter label="Infants" value={guests.infants} min={0} max={5}
                  onChange={(v) => setGuests(g => ({ ...g, infants: v }))} />
                <GuestCounter label="Pets" value={guests.pets} min={0} max={3}
                  onChange={(v) => setGuests(g => ({ ...g, pets: v }))} />
              </div>
            </div>

            {/* Coupon */}
            <div className="mt-4">
              <Label className="mb-2 block">Coupon code</Label>
              <div className="flex gap-2">
                <Input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="WELCOME10" className="rounded-lg" />
                <Button type="button" variant="secondary" onClick={applyCoupon} className="rounded-lg">Apply</Button>
              </div>
              {couponMsg && <p className="mt-1 text-xs text-muted-foreground">{couponMsg}</p>}
            </div>

            {/* Price summary */}
            {nights > 0 && (
              <div className="mt-5 rounded-xl bg-peach-light/60 p-4">
                <h4 className="mb-2 text-sm font-semibold text-navy">Price breakdown</h4>
                <dl className="space-y-1.5 text-sm">
                  <Row label={`$${(listing.basePrice / 100).toFixed(0)} × ${nights} ${nights === 1 ? 'night' : 'nights'}`} value={formatPrice(nightlySubtotal)} />
                  {cleaningFee > 0 && <Row label="Cleaning fee" value={formatPrice(cleaningFee)} />}
                  {serviceFee > 0 && <Row label="Service fee" value={formatPrice(serviceFee)} />}
                  {taxes > 0 && <Row label="Taxes" value={formatPrice(taxes)} />}
                  {discount > 0 && <Row label="Coupon discount" value={`−${formatPrice(discount)}`} accent />}
                  <div className="mt-2 border-t border-peach pt-2">
                    <Row label="Total (USD)" value={formatPrice(totalAmount)} bold />
                  </div>
                </dl>
              </div>
            )}

            {listing.instantBook ? (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-green-600" /> Instant Book — no host approval needed
              </div>
            ) : (
              <div className="mt-3 text-xs text-muted-foreground">
                Request to book — the host will respond within 24 hours.
              </div>
            )}

            <Button
              onClick={submit}
              disabled={!dates.from || !dates.to}
              className="mt-4 w-full rounded-full bg-orange text-white hover:bg-orange/90"
            >
              {listing.instantBook ? 'Confirm & pay' : 'Send request'}
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              You won't be charged yet. Free cancellation until 48 hours before check-in.
            </p>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <DialogTitle className="sr-only">Processing</DialogTitle>
            <Loader2 className="h-8 w-8 animate-spin text-orange" />
            <p className="text-sm font-medium text-navy">Processing your booking…</p>
            <p className="text-xs text-muted-foreground">Securing dates, payment, and notifications.</p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-green-100">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-navy">
              {listing.instantBook ? 'Your booking is confirmed!' : 'Request sent!'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Confirmation reference <span className="font-mono font-bold text-navy">{reference}</span>
            </p>
            <div className="mt-2 w-full rounded-xl bg-peach-light/70 p-4 text-left text-sm">
              <div className="font-medium text-navy">{listing.title}</div>
              <div className="text-muted-foreground">{listing.city}, {listing.country}</div>
              <div className="mt-1 text-muted-foreground">
                {dates.from?.toLocaleDateString()} → {dates.to?.toLocaleDateString()} · {nights} {nights === 1 ? 'night' : 'nights'}
              </div>
              <div className="mt-1 font-semibold text-navy">{formatPrice(totalAmount)}</div>
            </div>
            <Button
              onClick={() => { closeBooking(); setView('guest'); setGuestTab('trips') }}
              className="w-full rounded-full bg-orange text-white hover:bg-orange/90"
            >
              View trip in dashboard
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-destructive/10">
              <X className="h-7 w-7 text-destructive" />
            </div>
            <DialogTitle className="text-lg font-bold text-destructive">Booking failed</DialogTitle>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => setStep('form')} className="rounded-full">Try again</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function GuestCounter({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className="grid h-7 w-7 place-items-center rounded-full border border-border disabled:opacity-40 hover:bg-muted">−</button>
        <span className="w-4 text-center text-sm font-medium">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} className="grid h-7 w-7 place-items-center rounded-full border border-border disabled:opacity-40 hover:bg-muted">+</button>
      </div>
    </div>
  )
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={bold ? 'font-semibold text-navy' : 'text-muted-foreground'}>{label}</dt>
      <dd className={bold ? 'font-bold text-navy' : accent ? 'font-medium text-green-700' : 'text-foreground'}>{value}</dd>
    </div>
  )
}
