'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { createListing } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { ArrowLeft, ArrowRight, Check, Home, MapPin, Users, Sparkles, ImageIcon, FileText, Shield, Calendar, DollarSign, Rocket, X } from 'lucide-react'
import { CATEGORY_LABELS, CANCELLATION_LABELS } from '@/lib/format'

const STEPS = [
  { id: 'type', label: 'Property type', icon: Home },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'capacity', label: 'Capacity', icon: Users },
  { id: 'amenities', label: 'Amenities', icon: Sparkles },
  { id: 'photos', label: 'Photos', icon: ImageIcon },
  { id: 'description', label: 'Description', icon: FileText },
  { id: 'rules', label: 'House rules', icon: Shield },
  { id: 'availability', label: 'Availability', icon: Calendar },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'review', label: 'Review', icon: Rocket },
]

const ALL_AMENITIES = ['wifi', 'kitchen', 'pool', 'parking', 'ac', 'workspace', 'washer', 'dryer', 'tv', 'heating', 'hot_tub', 'gym', 'fireplace', 'bbq', 'balcony', 'garden', 'beach_access', 'ski_storage', 'ev_charger', 'security', 'first_aid', 'smoke_alarm']

const AMENITY_LABELS: Record<string, string> = {
  wifi: 'Wi-Fi', kitchen: 'Kitchen', pool: 'Pool', parking: 'Free parking', ac: 'Air conditioning',
  workspace: 'Dedicated workspace', washer: 'Washer', dryer: 'Dryer', tv: 'TV', heating: 'Heating',
  hot_tub: 'Hot tub', gym: 'Gym', fireplace: 'Fireplace', bbq: 'BBQ grill', balcony: 'Balcony',
  garden: 'Garden', beach_access: 'Beach access', ski_storage: 'Ski storage', ev_charger: 'EV charger',
  security: 'Security system', first_aid: 'First aid kit', smoke_alarm: 'Smoke alarm',
}

interface FormData {
  category: string
  roomType: string
  country: string
  city: string
  neighborhood: string
  address: string
  postalCode: string
  maxGuests: number
  bedrooms: number
  beds: number
  bathrooms: number
  amenities: string[]
  photoUrls: string[]
  title: string
  description: string
  highlights: string
  checkInTime: string
  checkOutTime: string
  allowsPets: boolean
  allowsSmoking: boolean
  allowsParties: boolean
  allowsChildren: boolean
  minNights: number
  maxNights: number
  advanceBookingDays: number
  basePrice: number
  cleaningFee: number
  weekendPrice: number
  weeklyDiscountPct: number
  monthlyDiscountPct: number
  cancellationPolicy: string
  instantBook: boolean
}

const DEFAULTS: FormData = {
  category: 'APARTMENT',
  roomType: 'ENTIRE',
  country: 'Portugal',
  city: 'Lisbon',
  neighborhood: '',
  address: '',
  postalCode: '',
  maxGuests: 2,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  amenities: ['wifi', 'kitchen'],
  photoUrls: [],
  title: '',
  description: '',
  highlights: '',
  checkInTime: '15:00',
  checkOutTime: '11:00',
  allowsPets: false,
  allowsSmoking: false,
  allowsParties: false,
  allowsChildren: true,
  minNights: 1,
  maxNights: 365,
  advanceBookingDays: 365,
  basePrice: 5000,
  cleaningFee: 2500,
  weekendPrice: 6000,
  weeklyDiscountPct: 5,
  monthlyDiscountPct: 10,
  cancellationPolicy: 'FLEXIBLE',
  instantBook: false,
}

export function CreateListingWizard() {
  const { user, setView, showToast } = useAppStore()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<FormData>(DEFAULTS)
  const [submitting, setSubmitting] = useState(false)

  if (!user || (user.role !== 'HOST' && user.role !== 'ADMIN')) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">You need a host account to create listings.</p>
        <Button onClick={() => setView('home')} className="mt-4 rounded-full bg-orange text-white">Go home</Button>
      </div>
    )
  }

  const update = (patch: Partial<FormData>) => setData(d => ({ ...d, ...patch }))
  const toggleAmenity = (a: string) =>
    update({ amenities: data.amenities.includes(a) ? data.amenities.filter(x => x !== a) : [...data.amenities, a] })

  const next = () => setStep(s => Math.min(STEPS.length - 1, s + 1))
  const prev = () => setStep(s => Math.max(0, s - 1))

  const submit = async (publish = true) => {
    setSubmitting(true)
    try {
      const cover = data.photoUrls[0] || 'https://images.unsplash.com/photo-1502672260266-1c0e6d6f3a9b?w=1200&q=80'
      await createListing({
        title: data.title || 'Untitled Listing',
        description: data.description,
        category: data.category,
        roomType: data.roomType,
        country: data.country,
        city: data.city,
        neighborhood: data.neighborhood || null,
        maxGuests: data.maxGuests,
        bedrooms: data.bedrooms,
        beds: data.beds,
        bathrooms: data.bathrooms,
        amenities: data.amenities.join(','),
        coverImage: cover,
        basePrice: data.basePrice,
        cleaningFee: data.cleaningFee,
        minNights: data.minNights,
        maxNights: data.maxNights,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        allowsPets: data.allowsPets,
        allowsSmoking: data.allowsSmoking,
        allowsParties: data.allowsParties,
        allowsChildren: data.allowsChildren,
        cancellationPolicy: data.cancellationPolicy,
        instantBook: data.instantBook,
        status: publish ? 'PUBLISHED' : 'DRAFT',
      })
      showToast(publish ? 'Listing published!' : 'Draft saved', data.title || 'Your listing', 'success')
      setView('host')
    } catch (e: any) {
      showToast('Could not save listing', e.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <button onClick={() => setView('host')} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Back to host dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy">Create a new listing</h1>
        <p className="text-sm text-muted-foreground">Complete each step. Your progress is saved automatically as a draft.</p>
      </div>

      {/* Stepper */}
      <div className="mb-8 overflow-x-auto">
        <ol className="flex items-center gap-2 min-w-max">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done = i < step
            const active = i === step
            return (
              <li key={s.id} className="flex items-center">
                <button
                  onClick={() => setStep(i)}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    active ? 'bg-navy text-white' :
                    done ? 'bg-peach-light text-navy' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  <span>{i + 1}. {s.label}</span>
                </button>
                {i < STEPS.length - 1 && <span className="mx-1 text-muted-foreground">→</span>}
              </li>
            )
          })}
        </ol>
      </div>

      {/* Step content */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-navy">What kind of place are you listing?</h2>
              <div>
                <Label className="mb-2 block">Property type</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => update({ category: k })}
                      className={`rounded-lg border p-3 text-left text-sm font-medium transition ${
                        data.category === k ? 'border-orange bg-peach-light text-navy' : 'border-border hover:bg-peach-light/50'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Space type</Label>
                <RadioGroup value={data.roomType} onValueChange={(v) => update({ roomType: v })} className="grid grid-cols-3 gap-2">
                  <Label htmlFor="rt-entire" className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-orange has-[:checked]:bg-peach-light">
                    <RadioGroupItem id="rt-entire" value="ENTIRE" />
                    <span className="text-sm">Entire place</span>
                  </Label>
                  <Label htmlFor="rt-private" className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-orange has-[:checked]:bg-peach-light">
                    <RadioGroupItem id="rt-private" value="PRIVATE" />
                    <span className="text-sm">Private room</span>
                  </Label>
                  <Label htmlFor="rt-shared" className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer has-[:checked]:border-orange has-[:checked]:bg-peach-light">
                    <RadioGroupItem id="rt-shared" value="SHARED" />
                    <span className="text-sm">Shared room</span>
                  </Label>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-navy">Where is your place located?</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Country</Label>
                  <Input value={data.country} onChange={(e) => update({ country: e.target.value })} className="mt-1 rounded-lg" />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={data.city} onChange={(e) => update({ city: e.target.value })} className="mt-1 rounded-lg" />
                </div>
                <div>
                  <Label>Neighborhood</Label>
                  <Input value={data.neighborhood} onChange={(e) => update({ neighborhood: e.target.value })} placeholder="e.g. Alfama" className="mt-1 rounded-lg" />
                </div>
                <div>
                  <Label>Postal code</Label>
                  <Input value={data.postalCode} onChange={(e) => update({ postalCode: e.target.value })} className="mt-1 rounded-lg" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Street address (optional, kept private)</Label>
                  <Input value={data.address} onChange={(e) => update({ address: e.target.value })} className="mt-1 rounded-lg" />
                </div>
              </div>
              <div className="rounded-xl bg-peach-light/60 p-3 text-xs text-navy">
                <MapPin className="mr-1 inline h-3 w-3" /> Exact location is only shared with guests after a booking is confirmed.
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-navy">How many guests can your place accommodate?</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Counter label="Max guests" value={data.maxGuests} min={1} max={20} onChange={(v) => update({ maxGuests: v })} />
                <Counter label="Bedrooms" value={data.bedrooms} min={0} max={15} onChange={(v) => update({ bedrooms: v })} />
                <Counter label="Beds" value={data.beds} min={1} max={30} onChange={(v) => update({ beds: v })} />
                <Counter label="Bathrooms" value={data.bathrooms} min={1} max={15} onChange={(v) => update({ bathrooms: v })} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-navy">What amenities do you offer?</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ALL_AMENITIES.map(a => (
                  <label key={a} className="flex items-center gap-2 rounded-lg border border-border p-2 cursor-pointer has-[:checked]:border-orange has-[:checked]:bg-peach-light">
                    <Checkbox checked={data.amenities.includes(a)} onCheckedChange={() => toggleAmenity(a)} />
                    <span className="text-sm">{AMENITY_LABELS[a]}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-navy">Add photos</h2>
              <p className="text-sm text-muted-foreground">Demo mode: paste image URLs. The first image will be the cover.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i}>
                    <Label className="text-xs">Photo {i + 1}{i === 0 ? ' (cover)' : ''}</Label>
                    <Input
                      value={data.photoUrls[i] || ''}
                      onChange={(e) => {
                        const urls = [...data.photoUrls]
                        urls[i] = e.target.value
                        update({ photoUrls: urls.filter(Boolean) })
                      }}
                      placeholder="https://…"
                      className="mt-1 rounded-lg"
                    />
                    {data.photoUrls[i] && (
                      <img src={data.photoUrls[i]} alt="" className="mt-2 aspect-video w-full rounded-lg object-cover" />
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => update({ photoUrls: ['https://images.unsplash.com/photo-1564013799929-1c0e9c74b3c6?w=1200&q=80&auto=format&fit=crop', 'https://images.unsplash.com/photo-1568605114984-50efff9414d2?w=1200&q=80&auto=format&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c0e6d6f3a9b?w=1200&q=80&auto=format&fit=crop'] })}>
                Use sample photos
              </Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-navy">Describe your place</h2>
              <div>
                <Label>Title</Label>
                <Input value={data.title} onChange={(e) => update({ title: e.target.value })} placeholder="Sunny Loft in the Heart of the City" className="mt-1 rounded-lg" maxLength={50} />
                <p className="text-xs text-muted-foreground">{data.title.length}/50 characters</p>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={data.description} onChange={(e) => update({ description: e.target.value })} placeholder="Tell guests what makes your place special…" rows={6} className="mt-1 rounded-lg" />
              </div>
              <div>
                <Label>Highlights (comma-separated)</Label>
                <Input value={data.highlights} onChange={(e) => update({ highlights: e.target.value })} placeholder="Rooftop terrace, bikes included, walking distance to beach" className="mt-1 rounded-lg" />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-navy">Set your house rules</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Check-in time</Label>
                  <Input type="time" value={data.checkInTime} onChange={(e) => update({ checkInTime: e.target.value })} className="mt-1 rounded-lg" />
                </div>
                <div>
                  <Label>Check-out time</Label>
                  <Input type="time" value={data.checkOutTime} onChange={(e) => update({ checkOutTime: e.target.value })} className="mt-1 rounded-lg" />
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { key: 'allowsPets', label: 'Pets allowed' },
                  { key: 'allowsSmoking', label: 'Smoking allowed' },
                  { key: 'allowsParties', label: 'Events/parties allowed' },
                  { key: 'allowsChildren', label: 'Children allowed' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border border-border p-2 cursor-pointer has-[:checked]:border-orange has-[:checked]:bg-peach-light">
                    <Checkbox
                      checked={(data as any)[key]}
                      onCheckedChange={(v) => update({ [key]: !!v } as any)}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-navy">Availability settings</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <Counter label="Minimum nights per stay" value={data.minNights} min={1} max={30} onChange={(v) => update({ minNights: v })} />
                <Counter label="Maximum nights per stay" value={data.maxNights} min={1} max={365} onChange={(v) => update({ maxNights: v })} />
                <Counter label="Advance booking window (days)" value={data.advanceBookingDays} min={30} max={730} onChange={(v) => update({ advanceBookingDays: v })} />
              </div>
              <div className="rounded-xl bg-peach-light/60 p-3 text-xs text-navy">
                <Calendar className="mr-1 inline h-3 w-3" /> After publishing, you'll be able to block specific dates from the calendar view in your host dashboard.
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-navy">Pricing & cancellation</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Base nightly rate (USD)</Label>
                  <Input type="number" value={data.basePrice / 100} onChange={(e) => update({ basePrice: Math.max(0, parseFloat(e.target.value) * 100) })} className="mt-1 rounded-lg" />
                </div>
                <div>
                  <Label>Weekend nightly rate (USD)</Label>
                  <Input type="number" value={data.weekendPrice / 100} onChange={(e) => update({ weekendPrice: Math.max(0, parseFloat(e.target.value) * 100) })} className="mt-1 rounded-lg" />
                </div>
                <div>
                  <Label>Cleaning fee (USD)</Label>
                  <Input type="number" value={data.cleaningFee / 100} onChange={(e) => update({ cleaningFee: Math.max(0, parseFloat(e.target.value) * 100) })} className="mt-1 rounded-lg" />
                </div>
                <div>
                  <Label>Cancellation policy</Label>
                  <select
                    value={data.cancellationPolicy}
                    onChange={(e) => update({ cancellationPolicy: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
                  >
                    <option value="FLEXIBLE">Flexible — full refund up to 24h before</option>
                    <option value="MODERATE">Moderate — full refund up to 5 days before</option>
                    <option value="STRICT">Strict — 50% refund up to 1 week before</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Weekly discount ({data.weeklyDiscountPct}%)</Label>
                  <Slider value={[data.weeklyDiscountPct]} min={0} max={50} step={5} onValueChange={(v) => update({ weeklyDiscountPct: v[0] })} className="mt-2" />
                </div>
                <div>
                  <Label>Monthly discount ({data.monthlyDiscountPct}%)</Label>
                  <Slider value={[data.monthlyDiscountPct]} min={0} max={50} step={5} onValueChange={(v) => update({ monthlyDiscountPct: v[0] })} className="mt-2" />
                </div>
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-border p-3 cursor-pointer has-[:checked]:border-orange has-[:checked]:bg-peach-light">
                <Checkbox checked={data.instantBook} onCheckedChange={(v) => update({ instantBook: !!v })} />
                <div>
                  <p className="text-sm font-medium text-navy">Allow Instant Book</p>
                  <p className="text-xs text-muted-foreground">Guests can book without waiting for your approval.</p>
                </div>
              </label>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-navy">Review and publish</h2>
              <div className="rounded-xl border border-border p-4">
                <h3 className="mb-3 font-semibold text-navy">{data.title || 'Untitled listing'}</h3>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <Review label="Type" value={`${CATEGORY_LABELS[data.category]} · ${data.roomType.toLowerCase()}`} />
                  <Review label="Location" value={`${data.neighborhood ? data.neighborhood + ', ' : ''}${data.city}, ${data.country}`} />
                  <Review label="Capacity" value={`${data.maxGuests} guests · ${data.bedrooms} beds · ${data.bathrooms} baths`} />
                  <Review label="Amenities" value={`${data.amenities.length} selected`} />
                  <Review label="Photos" value={`${data.photoUrls.length} added`} />
                  <Review label="Min nights" value={String(data.minNights)} />
                  <Review label="Base price" value={`$${(data.basePrice / 100).toFixed(0)}/night`} />
                  <Review label="Cleaning fee" value={`$${(data.cleaningFee / 100).toFixed(0)}`} />
                  <Review label="Cancellation" value={CANCELLATION_LABELS[data.cancellationPolicy]} />
                  <Review label="Instant book" value={data.instantBook ? 'Yes' : 'No'} />
                </div>
              </div>
              <div className="rounded-xl bg-peach-light/60 p-3 text-xs text-navy">
                <Check className="mr-1 inline h-3 w-3" /> All set! Publish now to make your listing live, or save as draft to keep editing later.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer nav */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={prev} disabled={step === 0} className="rounded-full">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} className="rounded-full bg-orange text-white hover:bg-orange/90">
            Next <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => submit(false)} disabled={submitting} className="rounded-full">
              Save as draft
            </Button>
            <Button onClick={() => submit(true)} disabled={submitting} className="rounded-full bg-orange text-white hover:bg-orange/90">
              {submitting ? 'Publishing…' : 'Publish listing'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function Counter({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <span className="text-sm font-medium text-navy">{label}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className="grid h-7 w-7 place-items-center rounded-full border border-border disabled:opacity-40 hover:bg-muted">−</button>
        <span className="w-6 text-center text-sm font-semibold">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} className="grid h-7 w-7 place-items-center rounded-full border border-border disabled:opacity-40 hover:bg-muted">+</button>
      </div>
    </div>
  )
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-navy">{value}</span>
    </div>
  )
}
