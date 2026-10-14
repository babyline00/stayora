'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Listing } from '@/lib/types'
import { formatPrice, formatRating, formatNumber } from '@/lib/format'
import { Heart, Star, MapPin, Users, Bed, Bath, ShieldCheck, Zap } from 'lucide-react'
import { addWishlist, removeWishlist } from '@/lib/api'

interface Props {
  listing: Listing
}

export function PropertyCard({ listing }: Props) {
  const { selectListing, openBooking, user, openAuth, showToast, filters } = useAppStore()
  const [saved, setSaved] = useState(false)
  const [wishlistId, setWishlistId] = useState<string | null>(null)
  const [imgIdx, setImgIdx] = useState(0)
  const [saving, setSaving] = useState(false)

  const photos = listing.photos?.length ? listing.photos : (listing.coverImage ? [{ url: listing.coverImage, isCover: true }] : [])

  const toggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) { openAuth('login'); return }
    setSaving(true)
    try {
      if (saved && wishlistId) {
        await removeWishlist(listing.id, wishlistId)
        setSaved(false)
        showToast('Removed from wishlist', listing.title, 'default')
      } else {
        const r = await addWishlist(listing.id, wishlistId || undefined)
        setWishlistId(r.wishlistId)
        setSaved(true)
        showToast('Saved to wishlist', listing.title, 'success')
      }
    } catch (err: any) {
      showToast('Could not update wishlist', err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const open = () => selectListing(listing.id)
  const book = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) { openAuth('login'); return }
    openBooking(listing.id, { checkIn: filters.checkIn, checkOut: filters.checkOut })
  }

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation()
    setImgIdx(i => (i + 1) % photos.length)
  }

  return (
    <article
      onClick={open}
      className="group cursor-pointer rounded-2xl bg-white stayora-card-shadow transition hover:stayora-card-shadow-hover"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-muted">
        {photos[imgIdx]?.url ? (
          <img
            src={photos[imgIdx].url}
            alt={listing.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-peach-light to-peach">
            <span className="text-navy/40">No image</span>
          </div>
        )}

        {photos.length > 1 && (
          <>
            <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 grid h-7 w-7 place-items-center rounded-full bg-white/90 shadow hover:bg-white">
              <span className="text-navy">›</span>
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {photos.slice(0, 5).map((_, i) => (
                <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === imgIdx ? 'bg-white' : 'bg-white/60'}`} />
              ))}
            </div>
          </>
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {listing.instantBook && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-navy shadow-sm">
              <Zap className="h-3 w-3 text-orange" /> Instant Book
            </span>
          )}
          {listing.host?.isSuperhost && (
            <span className="inline-flex items-center gap-1 rounded-full bg-navy/95 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              <ShieldCheck className="h-3 w-3" /> Superhost
            </span>
          )}
        </div>

        <button
          onClick={toggleSave}
          disabled={saving}
          className={`absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full backdrop-blur transition disabled:opacity-50 ${
            saved ? 'bg-white text-orange' : 'bg-black/30 text-white hover:bg-black/40'
          }`}
          aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`h-5 w-5 ${saved ? 'fill-orange' : ''}`} />
        </button>
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-navy stayora-line-clamp-2 text-sm">
            {listing.title}
          </h3>
          {listing.rating > 0 && (
            <div className="flex shrink-0 items-center gap-1 text-xs font-semibold text-navy">
              <Star className="h-3.5 w-3.5 fill-orange text-orange" />
              {formatRating(listing.rating)}
              <span className="font-normal text-muted-foreground">({formatNumber(listing.reviewCount)})</span>
            </div>
          )}
        </div>

        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {listing.neighborhood ? `${listing.neighborhood}, ` : ''}{listing.city}, {listing.country}
        </p>

        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {listing.maxGuests}</span>
          <span className="flex items-center gap-1"><Bed className="h-3 w-3" /> {listing.bedrooms} bed{listing.bedrooms === 1 ? '' : 's'}</span>
          <span className="flex items-center gap-1"><Bath className="h-3 w-3" /> {listing.bathrooms} bath{listing.bathrooms === 1 ? '' : 's'}</span>
        </div>

        <div className="mt-2 flex items-end justify-between">
          <div>
            <span className="font-bold text-navy">{formatPrice(listing.basePrice)}</span>
            <span className="text-xs text-muted-foreground"> / night</span>
          </div>
          <button
            onClick={book}
            className="rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white transition hover:bg-navy-light"
          >
            Book
          </button>
        </div>
      </div>
    </article>
  )
}
