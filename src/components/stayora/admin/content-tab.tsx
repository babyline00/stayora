'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  fetchAdminAmenities, fetchAdminDestinations, fetchAdminWizardSteps, fetchAdminCategories,
  upsertContent, deleteContent,
  fetchAdminCoupons, upsertCoupon, deleteCoupon,
  fetchEmailTemplates, upsertEmailTemplate, deleteEmailTemplate,
} from '@/lib/api'
import { invalidateContentCache } from '@/hooks/use-content'
import { resolveIcon } from '@/lib/icon-resolver'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Edit3, Trash2, Star, Check, X, Loader2, Save, GripVertical, Settings2, Ticket, Mail } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/format'

type Amenity = { id: string; key: string; label: string; icon: string; category: string; sortOrder: number; active: boolean }
type Destination = { id: string; city: string; country: string; countryCode?: string | null; lat: number; lng: number; neighborhood?: string | null; image?: string | null; tagline?: string | null; description?: string | null; bestTime?: string | null; popular: boolean; sortOrder: number }
type WizardStep = { id: string; stepKey: string; label: string; icon: string; order: number; active: boolean }
type Category = { id: string; key: string; label: string; icon: string; sortOrder: number; active: boolean }

const TABLE_MAP = {
  amenities: 'amenity' as const,
  destinations: 'destination' as const,
  'wizard-steps': 'wizardStep' as const,
  categories: 'propertyCategory' as const,
}

export function ContentTab() {
  const [tab, setTab] = useState('amenities')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Content management</h1>
          <p className="text-sm text-muted-foreground">Edit amenities, destinations, wizard steps, and property categories that appear across the site.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="rounded-full bg-peach-light/60 p-1 flex-wrap h-auto">
          <TabsTrigger value="amenities" className="rounded-full data-[state=active]:bg-navy data-[state=active]:text-white">Amenities</TabsTrigger>
          <TabsTrigger value="destinations" className="rounded-full data-[state=active]:bg-navy data-[state=active]:text-white">Destinations</TabsTrigger>
          <TabsTrigger value="wizard-steps" className="rounded-full data-[state=active]:bg-navy data-[state=active]:text-white">Wizard steps</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-full data-[state=active]:bg-navy data-[state=active]:text-white">Categories</TabsTrigger>
          <TabsTrigger value="coupons" className="rounded-full data-[state=active]:bg-navy data-[state=active]:text-white">Coupons</TabsTrigger>
          <TabsTrigger value="email-templates" className="rounded-full data-[state=active]:bg-navy data-[state=active]:text-white">Email</TabsTrigger>
        </TabsList>

        <TabsContent value="amenities"><AmenitiesManager /></TabsContent>
        <TabsContent value="destinations"><DestinationsManager /></TabsContent>
        <TabsContent value="wizard-steps"><WizardStepsManager /></TabsContent>
        <TabsContent value="categories"><CategoriesManager /></TabsContent>
        <TabsContent value="coupons"><CouponsManager /></TabsContent>
        <TabsContent value="email-templates"><EmailTemplatesManager /></TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================
// AMENITIES MANAGER
// ============================================================
function AmenitiesManager() {
  const { showToast } = useAppStore()
  const [items, setItems] = useState<Amenity[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Amenity | null>(null)
  const [creating, setCreating] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const r: any = await fetchAdminAmenities()
      setItems(r.amenities || [])
    } catch (e: any) { showToast('Load failed', e.message, 'error') }
    finally { setLoading(false) }
  }, [showToast])

  useEffect(() => { Promise.resolve().then(refresh) }, [refresh])

  const handleSave = async (data: Partial<Amenity>, id?: string) => {
    try {
      await upsertContent('amenity', data, id)
      invalidateContentCache()
      await refresh()
      showToast(id ? 'Amenity updated' : 'Amenity created', data.label, 'success')
      setEditing(null); setCreating(false)
    } catch (e: any) { showToast('Save failed', e.message, 'error') }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteContent('amenity', id)
      invalidateContentCache()
      await refresh()
      showToast('Amenity deleted', undefined, 'default')
    } catch (e: any) { showToast('Delete failed', e.message, 'error') }
  }

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-navy">Amenities ({items?.length || 0})</CardTitle>
        <Button onClick={() => setCreating(true)} className="rounded-full bg-orange text-white">
          <Plus className="mr-1 h-4 w-4" /> New amenity
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {items?.map((a) => {
            const Icon = resolveIcon(a.icon) as any
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-peach-light">
                  <Icon className="h-4 w-4 text-navy" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy">{a.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{a.key}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{a.category}</Badge>
                <Badge variant="secondary" className={a.active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}>
                  {a.active ? 'active' : 'hidden'}
                </Badge>
                <span className="text-xs text-muted-foreground">#{a.sortOrder}</span>
                <Button variant="ghost" size="sm" onClick={() => setEditing(a)}><Edit3 className="h-4 w-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete amenity?</AlertDialogTitle>
                      <AlertDialogDescription>This will remove "{a.label}" from all filters and listing editors. Existing listings with this amenity will still show the key as a plain string.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(a.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )
          })}
          {items?.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No amenities yet. Create your first one.</p>}
        </div>
      </CardContent>

      {(editing || creating) && (
        <AmenityEditor
          amenity={editing}
          onClose={() => { setEditing(null); setCreating(false) }}
          onSave={handleSave}
        />
      )}
    </Card>
  )
}

function AmenityEditor({ amenity, onClose, onSave }: { amenity: Amenity | null; onClose: () => void; onSave: (data: Partial<Amenity>, id?: string) => void }) {
  const [key, setKey] = useState(amenity?.key || '')
  const [label, setLabel] = useState(amenity?.label || '')
  const [icon, setIcon] = useState(amenity?.icon || 'check')
  const [category, setCategory] = useState(amenity?.category || 'general')
  const [sortOrder, setSortOrder] = useState(amenity?.sortOrder || 99)
  const [active, setActive] = useState(amenity?.active ?? true)
  const [saving, setSaving] = useState(false)
  const Icon = resolveIcon(icon) as any

  const submit = () => {
    setSaving(true)
    onSave({ key, label, icon, category, sortOrder, active }, amenity?.id)
    setSaving(false)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{amenity ? 'Edit amenity' : 'New amenity'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-peach-light">
              <Icon className="h-6 w-6 text-navy" />
            </div>
            <div className="grid gap-1 flex-1">
              <Label className="text-xs">Icon name (kebab-case Lucide)</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="wifi, pool, building-2" className="rounded-lg" />
              <p className="text-[10px] text-muted-foreground">Visit <a className="underline" href="https://lucide.dev/icons" target="_blank" rel="noreferrer">lucide.dev/icons</a> for names.</p>
            </div>
          </div>
          <div>
            <Label>Key (machine)</Label>
            <Input value={key} onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} placeholder="wifi, pool, hot_tub" className="rounded-lg font-mono" disabled={!!amenity} />
          </div>
          <div>
            <Label>Label (human)</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Wi-Fi, Pool, Hot tub" className="rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm">
                <option value="general">general</option>
                <option value="kitchen">kitchen</option>
                <option value="bathroom">bathroom</option>
                <option value="outdoor">outdoor</option>
                <option value="safety">safety</option>
                <option value="accessibility">accessibility</option>
              </select>
            </div>
            <div>
              <Label>Sort order</Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className="rounded-lg" />
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border p-2">
            <Switch checked={active} onCheckedChange={setActive} />
            <span className="text-sm">{active ? 'Active (visible in UI)' : 'Hidden (not shown)'}</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button onClick={submit} disabled={saving || !key || !label} className="rounded-full bg-orange text-white">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// DESTINATIONS MANAGER
// ============================================================
function DestinationsManager() {
  const { showToast } = useAppStore()
  const [items, setItems] = useState<Destination[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Destination | null>(null)
  const [creating, setCreating] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const r: any = await fetchAdminDestinations()
      setItems(r.destinations || [])
    } catch (e: any) { showToast('Load failed', e.message, 'error') }
    finally { setLoading(false) }
  }, [showToast])

  useEffect(() => { Promise.resolve().then(refresh) }, [refresh])

  const handleSave = async (data: Partial<Destination>, id?: string) => {
    try {
      await upsertContent('destination', data, id)
      invalidateContentCache()
      await refresh()
      showToast(id ? 'Destination updated' : 'Destination created', data.city, 'success')
      setEditing(null); setCreating(false)
    } catch (e: any) { showToast('Save failed', e.message, 'error') }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteContent('destination', id)
      invalidateContentCache()
      await refresh()
      showToast('Destination deleted', undefined, 'default')
    } catch (e: any) { showToast('Delete failed', e.message, 'error') }
  }

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-navy">Destinations ({items?.length || 0})</CardTitle>
        <Button onClick={() => setCreating(true)} className="rounded-full bg-orange text-white">
          <Plus className="mr-1 h-4 w-4" /> New destination
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {items?.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <img src={d.image || ''} alt={d.city} className="h-12 w-12 rounded-lg object-cover bg-muted" />
              <div className="flex-1">
                <p className="text-sm font-medium text-navy">{d.city}, {d.country}</p>
                <p className="text-xs text-muted-foreground">{d.tagline || '— no tagline —'}</p>
                <p className="text-[10px] text-muted-foreground font-mono">lat {d.lat}, lng {d.lng}</p>
              </div>
              <Badge variant="secondary" className={d.popular ? 'bg-orange-100 text-orange-700' : ''}>{d.popular ? 'popular' : 'regular'}</Badge>
              <span className="text-xs text-muted-foreground">#{d.sortOrder}</span>
              <Button variant="ghost" size="sm" onClick={() => setEditing(d)}><Edit3 className="h-4 w-4" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete destination?</AlertDialogTitle>
                    <AlertDialogDescription>This removes {d.city} from the trending destinations on the homepage and the auto-fill coordinates list.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(d.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {items?.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No destinations yet.</p>}
        </div>
      </CardContent>

      {(editing || creating) && (
        <DestinationEditor destination={editing} onClose={() => { setEditing(null); setCreating(false) }} onSave={handleSave} />
      )}
    </Card>
  )
}

function DestinationEditor({ destination, onClose, onSave }: { destination: Destination | null; onClose: () => void; onSave: (data: Partial<Destination>, id?: string) => void }) {
  const [d, setD] = useState<Partial<Destination>>(destination || { popular: true, sortOrder: 99, lat: 0, lng: 0 })
  const [saving, setSaving] = useState(false)

  const submit = () => {
    setSaving(true)
    onSave(d, destination?.id)
    setSaving(false)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{destination ? 'Edit destination' : 'New destination'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2 max-h-[60vh] overflow-y-auto stayora-scroll">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>City</Label>
              <Input value={d.city || ''} onChange={(e) => setD({ ...d, city: e.target.value })} className="rounded-lg" />
            </div>
            <div>
              <Label>Country</Label>
              <Input value={d.country || ''} onChange={(e) => setD({ ...d, country: e.target.value })} className="rounded-lg" />
            </div>
            <div>
              <Label>Country code</Label>
              <Input value={d.countryCode || ''} onChange={(e) => setD({ ...d, countryCode: e.target.value })} placeholder="PT, JP" className="rounded-lg" />
            </div>
            <div>
              <Label>Default neighborhood</Label>
              <Input value={d.neighborhood || ''} onChange={(e) => setD({ ...d, neighborhood: e.target.value })} className="rounded-lg" />
            </div>
            <div>
              <Label>Latitude</Label>
              <Input type="number" step="0.0001" value={d.lat ?? 0} onChange={(e) => setD({ ...d, lat: parseFloat(e.target.value) || 0 })} className="rounded-lg" />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input type="number" step="0.0001" value={d.lng ?? 0} onChange={(e) => setD({ ...d, lng: parseFloat(e.target.value) || 0 })} className="rounded-lg" />
            </div>
          </div>
          <div>
            <Label>Hero image URL</Label>
            <Input value={d.image || ''} onChange={(e) => setD({ ...d, image: e.target.value })} placeholder="https://images.unsplash.com/…" className="rounded-lg" />
          </div>
          <div>
            <Label>Tagline</Label>
            <Input value={d.tagline || ''} onChange={(e) => setD({ ...d, tagline: e.target.value })} placeholder="The city of seven hills" className="rounded-lg" />
          </div>
          <div>
            <Label>Best time to visit</Label>
            <Input value={d.bestTime || ''} onChange={(e) => setD({ ...d, bestTime: e.target.value })} placeholder="April – October" className="rounded-lg" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={d.description || ''} onChange={(e) => setD({ ...d, description: e.target.value })} rows={3} className="rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Sort order</Label>
              <Input type="number" value={d.sortOrder ?? 99} onChange={(e) => setD({ ...d, sortOrder: parseInt(e.target.value) || 0 })} className="rounded-lg" />
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-border p-2 mt-6">
              <Switch checked={!!d.popular} onCheckedChange={(v) => setD({ ...d, popular: v })} />
              <span className="text-sm">{d.popular ? 'Popular (homepage trending)' : 'Not popular'}</span>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button onClick={submit} disabled={saving || !d.city || !d.country} className="rounded-full bg-orange text-white">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// WIZARD STEPS MANAGER
// ============================================================
function WizardStepsManager() {
  const { showToast } = useAppStore()
  const [items, setItems] = useState<WizardStep[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<WizardStep | null>(null)
  const [creating, setCreating] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const r: any = await fetchAdminWizardSteps()
      setItems(r.steps || [])
    } catch (e: any) { showToast('Load failed', e.message, 'error') }
    finally { setLoading(false) }
  }, [showToast])

  useEffect(() => { Promise.resolve().then(refresh) }, [refresh])

  const handleSave = async (data: Partial<WizardStep>, id?: string) => {
    try {
      await upsertContent('wizardStep', data, id)
      invalidateContentCache()
      await refresh()
      showToast(id ? 'Step updated' : 'Step created', data.label, 'success')
      setEditing(null); setCreating(false)
    } catch (e: any) { showToast('Save failed', e.message, 'error') }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteContent('wizardStep', id)
      invalidateContentCache()
      await refresh()
      showToast('Step deleted', undefined, 'default')
    } catch (e: any) { showToast('Delete failed', e.message, 'error') }
  }

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-navy">Wizard steps ({items?.length || 0})</CardTitle>
        <Button onClick={() => setCreating(true)} className="rounded-full bg-orange text-white">
          <Plus className="mr-1 h-4 w-4" /> New step
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {items?.map((s) => {
            const Icon = resolveIcon(s.icon) as any
            return (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-peach-light">
                  <Icon className="h-4 w-4 text-navy" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy">{s.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{s.stepKey}</p>
                </div>
                <Badge variant="secondary" className={s.active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}>
                  {s.active ? 'active' : 'hidden'}
                </Badge>
                <span className="text-xs text-muted-foreground">order: {s.order}</span>
                <Button variant="ghost" size="sm" onClick={() => setEditing(s)}><Edit3 className="h-4 w-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete wizard step?</AlertDialogTitle>
                      <AlertDialogDescription>This affects the host listing wizard. Active steps appear in order on the create-listing page.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(s.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )
          })}
        </div>
      </CardContent>
      {(editing || creating) && (
        <WizardStepEditor step={editing} onClose={() => { setEditing(null); setCreating(false) }} onSave={handleSave} />
      )}
    </Card>
  )
}

function WizardStepEditor({ step, onClose, onSave }: { step: WizardStep | null; onClose: () => void; onSave: (data: Partial<WizardStep>, id?: string) => void }) {
  const [stepKey, setStepKey] = useState(step?.stepKey || '')
  const [label, setLabel] = useState(step?.label || '')
  const [icon, setIcon] = useState(step?.icon || 'check')
  const [order, setOrder] = useState(step?.order || 99)
  const [active, setActive] = useState(step?.active ?? true)
  const [saving, setSaving] = useState(false)
  const Icon = resolveIcon(icon) as any

  const submit = () => {
    setSaving(true)
    onSave({ stepKey, label, icon, order, active }, step?.id)
    setSaving(false)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{step ? 'Edit step' : 'New step'}</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-peach-light">
              <Icon className="h-6 w-6 text-navy" />
            </div>
            <div className="flex-1">
              <Label className="text-xs">Icon name (kebab-case Lucide)</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="home, map-pin, calendar" className="rounded-lg" />
            </div>
          </div>
          <div>
            <Label>Step key (machine)</Label>
            <Input value={stepKey} onChange={(e) => setStepKey(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))} placeholder="type, location, photos" className="rounded-lg font-mono" disabled={!!step} />
          </div>
          <div>
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Property type, Photos, Pricing" className="rounded-lg" />
          </div>
          <div>
            <Label>Order</Label>
            <Input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} className="rounded-lg" />
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border p-2">
            <Switch checked={active} onCheckedChange={setActive} />
            <span className="text-sm">{active ? 'Active' : 'Hidden'}</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button onClick={submit} disabled={saving || !stepKey || !label} className="rounded-full bg-orange text-white">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// CATEGORIES MANAGER
// ============================================================
function CategoriesManager() {
  const { showToast } = useAppStore()
  const [items, setItems] = useState<Category[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const r: any = await fetchAdminCategories()
      setItems(r.categories || [])
    } catch (e: any) { showToast('Load failed', e.message, 'error') }
    finally { setLoading(false) }
  }, [showToast])

  useEffect(() => { Promise.resolve().then(refresh) }, [refresh])

  const handleSave = async (data: Partial<Category>, id?: string) => {
    try {
      await upsertContent('propertyCategory', data, id)
      invalidateContentCache()
      await refresh()
      showToast(id ? 'Category updated' : 'Category created', data.label, 'success')
      setEditing(null); setCreating(false)
    } catch (e: any) { showToast('Save failed', e.message, 'error') }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteContent('propertyCategory', id)
      invalidateContentCache()
      await refresh()
      showToast('Category deleted', undefined, 'default')
    } catch (e: any) { showToast('Delete failed', e.message, 'error') }
  }

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-navy">Property categories ({items?.length || 0})</CardTitle>
        <Button onClick={() => setCreating(true)} className="rounded-full bg-orange text-white">
          <Plus className="mr-1 h-4 w-4" /> New category
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {items?.map((c) => {
            const Icon = resolveIcon(c.icon) as any
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-peach-light">
                  <Icon className="h-4 w-4 text-navy" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy">{c.label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{c.key}</p>
                </div>
                <Badge variant="secondary" className={c.active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}>
                  {c.active ? 'active' : 'hidden'}
                </Badge>
                <span className="text-xs text-muted-foreground">#{c.sortOrder}</span>
                <Button variant="ghost" size="sm" onClick={() => setEditing(c)}><Edit3 className="h-4 w-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete category?</AlertDialogTitle>
                      <AlertDialogDescription>Existing listings with this category will still show the raw key. Be careful.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(c.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )
          })}
        </div>
      </CardContent>
      {(editing || creating) && (
        <CategoryEditor category={editing} onClose={() => { setEditing(null); setCreating(false) }} onSave={handleSave} />
      )}
    </Card>
  )
}

function CategoryEditor({ category, onClose, onSave }: { category: Category | null; onClose: () => void; onSave: (data: Partial<Category>, id?: string) => void }) {
  const [key, setKey] = useState(category?.key || '')
  const [label, setLabel] = useState(category?.label || '')
  const [icon, setIcon] = useState(category?.icon || 'home')
  const [sortOrder, setSortOrder] = useState(category?.sortOrder || 99)
  const [active, setActive] = useState(category?.active ?? true)
  const [saving, setSaving] = useState(false)
  const Icon = resolveIcon(icon) as any

  const submit = () => {
    setSaving(true)
    onSave({ key, label, icon, sortOrder, active }, category?.id)
    setSaving(false)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{category ? 'Edit category' : 'New category'}</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-peach-light">
              <Icon className="h-6 w-6 text-navy" />
            </div>
            <div className="flex-1">
              <Label className="text-xs">Icon name (kebab-case Lucide)</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="home, building-2, ship" className="rounded-lg" />
            </div>
          </div>
          <div>
            <Label>Key (machine)</Label>
            <Input value={key} onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))} placeholder="VILLA, APARTMENT, TINYHOUSE" className="rounded-lg font-mono" disabled={!!category} />
          </div>
          <div>
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Villa, Apartment, Tiny house" className="rounded-lg" />
          </div>
          <div>
            <Label>Sort order</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className="rounded-lg" />
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border p-2">
            <Switch checked={active} onCheckedChange={setActive} />
            <span className="text-sm">{active ? 'Active' : 'Hidden'}</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button onClick={submit} disabled={saving || !key || !label} className="rounded-full bg-orange text-white">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// COUPONS MANAGER
// ============================================================
type Coupon = {
  id: string
  code: string
  type: 'PERCENT' | 'FLAT'
  value: number
  validFrom: string
  validTo: string
  maxRedemptions?: number | null
  redeemed: number
  minAmount: number
  active: boolean
  createdAt: string
}

function CouponsManager() {
  const { showToast } = useAppStore()
  const [items, setItems] = useState<Coupon[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [creating, setCreating] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const r: any = await fetchAdminCoupons()
      setItems(r.coupons || [])
    } catch (e: any) { showToast('Load failed', e.message, 'error') }
    finally { setLoading(false) }
  }, [showToast])

  useEffect(() => { Promise.resolve().then(refresh) }, [refresh])

  const handleSave = async (data: any, id?: string) => {
    try {
      await upsertCoupon(data, id)
      await refresh()
      showToast(id ? 'Coupon updated' : 'Coupon created', data.code, 'success')
      setEditing(null); setCreating(false)
    } catch (e: any) { showToast('Save failed', e.message, 'error') }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteCoupon(id)
      await refresh()
      showToast('Coupon deleted', undefined, 'default')
    } catch (e: any) { showToast('Delete failed', e.message, 'error') }
  }

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-navy">Coupons ({items?.length || 0})</CardTitle>
        <Button onClick={() => setCreating(true)} className="rounded-full bg-orange text-white">
          <Plus className="mr-1 h-4 w-4" /> New coupon
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {items?.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Ticket className="h-5 w-5 text-orange" />
              <div className="flex-1">
                <p className="text-sm font-bold text-navy font-mono">{c.code}</p>
                <p className="text-xs text-muted-foreground">
                  {c.type === 'PERCENT' ? `${c.value}% off` : `${formatPrice(c.value)} off`} · Min: {formatPrice(c.minAmount)} ·
                  {' '}{c.redeemed}{c.maxRedemptions ? `/${c.maxRedemptions}` : ''} redeemed
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatDate(c.validFrom)} → {formatDate(c.validTo)}
                </p>
              </div>
              <Badge variant="secondary" className={c.active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}>
                {c.active ? 'active' : 'inactive'}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setEditing(c)}><Edit3 className="h-4 w-4" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete coupon {c.code}?</AlertDialogTitle>
                    <AlertDialogDescription>This will remove the coupon from all future bookings.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(c.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {items?.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No coupons yet.</p>}
        </div>
      </CardContent>

      {(editing || creating) && (
        <CouponEditor coupon={editing} onClose={() => { setEditing(null); setCreating(false) }} onSave={handleSave} />
      )}
    </Card>
  )
}

function CouponEditor({ coupon, onClose, onSave }: { coupon: Coupon | null; onClose: () => void; onSave: (data: any, id?: string) => void }) {
  const [code, setCode] = useState(coupon?.code || '')
  const [type, setType] = useState(coupon?.type || 'PERCENT')
  const [value, setValue] = useState(coupon?.value || 10)
  const [validFrom, setValidFrom] = useState(coupon?.validFrom?.split('T')[0] || new Date().toISOString().split('T')[0])
  const [validTo, setValidTo] = useState(coupon?.validTo?.split('T')[0] || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0])
  const [maxRedemptions, setMaxRedemptions] = useState<number | ''>(coupon?.maxRedemptions ?? '')
  const [minAmount, setMinAmount] = useState(coupon?.minAmount || 5000)
  const [active, setActive] = useState(coupon?.active ?? true)
  const [saving, setSaving] = useState(false)

  const submit = () => {
    setSaving(true)
    onSave({
      code: code.toUpperCase(),
      type, value,
      validFrom, validTo,
      maxRedemptions: maxRedemptions === '' ? null : maxRedemptions,
      minAmount, active,
    }, coupon?.id)
    setSaving(false)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{coupon ? 'Edit coupon' : 'New coupon'}</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2">
          <div>
            <Label>Code (uppercase)</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))} placeholder="SUMMER20" className="rounded-lg font-mono" disabled={!!coupon} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm">
                <option value="PERCENT">Percentage off</option>
                <option value="FLAT">Flat amount off</option>
              </select>
            </div>
            <div>
              <Label>Value ({type === 'PERCENT' ? '%' : 'cents'})</Label>
              <Input type="number" value={value} onChange={(e) => setValue(parseInt(e.target.value) || 0)} className="rounded-lg" />
              {type === 'FLAT' && <p className="text-[10px] text-muted-foreground mt-1">e.g. 5000 = $50</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valid from</Label>
              <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className="rounded-lg" />
            </div>
            <div>
              <Label>Valid to</Label>
              <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} className="rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Max redemptions (blank = unlimited)</Label>
              <Input type="number" value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value === '' ? '' : parseInt(e.target.value))} className="rounded-lg" />
            </div>
            <div>
              <Label>Minimum spend (cents)</Label>
              <Input type="number" value={minAmount} onChange={(e) => setMinAmount(parseInt(e.target.value) || 0)} className="rounded-lg" />
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border p-2">
            <Switch checked={active} onCheckedChange={setActive} />
            <span className="text-sm">{active ? 'Active' : 'Inactive'}</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button onClick={submit} disabled={saving || !code} className="rounded-full bg-orange text-white">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// EMAIL TEMPLATES MANAGER
// ============================================================
type EmailTemplate = {
  id: string
  key: string
  subject: string
  body: string
  variables?: string | null
  active: boolean
  updatedAt: string
}

function EmailTemplatesManager() {
  const { showToast } = useAppStore()
  const [items, setItems] = useState<EmailTemplate[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const [creating, setCreating] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const r: any = await fetchEmailTemplates()
      setItems(r.templates || [])
    } catch (e: any) { showToast('Load failed', e.message, 'error') }
    finally { setLoading(false) }
  }, [showToast])

  useEffect(() => { Promise.resolve().then(refresh) }, [refresh])

  const handleSave = async (data: any, id?: string) => {
    try {
      await upsertEmailTemplate(data, id)
      await refresh()
      showToast(id ? 'Template updated' : 'Template created', data.key, 'success')
      setEditing(null); setCreating(false)
    } catch (e: any) { showToast('Save failed', e.message, 'error') }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteEmailTemplate(id)
      await refresh()
      showToast('Template deleted', undefined, 'default')
    } catch (e: any) { showToast('Delete failed', e.message, 'error') }
  }

  if (loading) return <Skeleton className="h-96 w-full rounded-2xl" />

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-navy">Email templates ({items?.length || 0})</CardTitle>
        <Button onClick={() => setCreating(true)} className="rounded-full bg-orange text-white">
          <Plus className="mr-1 h-4 w-4" /> New template
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {items?.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Mail className="h-5 w-5 text-orange" />
              <div className="flex-1">
                <p className="text-sm font-mono font-bold text-navy">{t.key}</p>
                <p className="text-xs text-muted-foreground truncate">{t.subject}</p>
              </div>
              <Badge variant="secondary" className={t.active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}>
                {t.active ? 'active' : 'inactive'}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setEditing(t)}><Edit3 className="h-4 w-4" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete template {t.key}?</AlertDialogTitle>
                    <AlertDialogDescription>This will remove the template — Stayora will fall back to the default subject/body.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(t.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {items?.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No email templates yet.</p>}
        </div>
      </CardContent>

      {(editing || creating) && (
        <EmailTemplateEditor template={editing} onClose={() => { setEditing(null); setCreating(false) }} onSave={handleSave} />
      )}
    </Card>
  )
}

function EmailTemplateEditor({ template, onClose, onSave }: { template: EmailTemplate | null; onClose: () => void; onSave: (data: any, id?: string) => void }) {
  const [key, setKey] = useState(template?.key || '')
  const [subject, setSubject] = useState(template?.subject || '')
  const [body, setBody] = useState(template?.body || '')
  const [variables, setVariables] = useState(template?.variables || '')
  const [active, setActive] = useState(template?.active ?? true)
  const [saving, setSaving] = useState(false)

  const submit = () => {
    setSaving(true)
    onSave({ key, subject, body, variables, active }, template?.id)
    setSaving(false)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{template ? 'Edit email template' : 'New email template'}</DialogTitle></DialogHeader>
        <div className="grid gap-3 py-2 max-h-[60vh] overflow-y-auto stayora-scroll">
          <div>
            <Label>Key (machine)</Label>
            <Input value={key} onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="booking-confirmation, message-received" className="rounded-lg font-mono" disabled={!!template} />
          </div>
          <div>
            <Label>Subject line</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Your booking at {{listingTitle}} is confirmed" className="rounded-lg" />
            <p className="text-[10px] text-muted-foreground mt-1">Use {'{{variable}}'} placeholders.</p>
          </div>
          <div>
            <Label>Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="rounded-lg font-mono text-xs" />
          </div>
          <div>
            <Label>Variables (JSON array, optional)</Label>
            <Input value={variables} onChange={(e) => setVariables(e.target.value)} placeholder='["name","listingTitle","reference"]' className="rounded-lg font-mono text-xs" />
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-border p-2">
            <Switch checked={active} onCheckedChange={setActive} />
            <span className="text-sm">{active ? 'Active' : 'Inactive'}</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button onClick={submit} disabled={saving || !key || !subject} className="rounded-full bg-orange text-white">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
