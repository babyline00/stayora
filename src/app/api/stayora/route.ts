import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

interface SafeUser {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  role: string
  bio?: string | null
  country?: string | null
  isVerified: boolean
  isSuperhost: boolean
  responseRate: number
  responseTimeMins: number
}

function toSafeUser(user: any): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    bio: user.bio,
    country: user.country,
    isVerified: user.isVerified,
    isSuperhost: user.isSuperhost,
    responseRate: user.responseRate,
    responseTimeMins: user.responseTimeMins,
  }
}

async function getSessionUser(): Promise<SafeUser | null> {
  const c = await cookies()
  const token = c.get('stayora-session')?.value
  if (!token) return null
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })
  if (!session || session.expiresAt < new Date()) return null
  return toSafeUser(session.user)
}

async function requireAuth(roles?: string[]): Promise<SafeUser | null> {
  const user = await getSessionUser()
  if (!user) return null
  if (roles && !roles.includes(user.role)) return null
  return user
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const op = url.searchParams.get('op') || ''

  try {
    switch (op) {
      case 'listings': {
        const status = url.searchParams.get('status')
        const category = url.searchParams.get('category')
        const city = url.searchParams.get('city')
        const hostId = url.searchParams.get('hostId')
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const where: any = { status: 'PUBLISHED' }
        if (status) where.status = status
        if (category) where.category = category
        if (city) where.city = city
        if (hostId) where.hostId = hostId
        const listings = await db.listing.findMany({
          where,
          include: { photos: { orderBy: { position: 'asc' } }, host: true },
          orderBy: { wishlistSaves: 'desc' },
          take: limit,
        })
        return NextResponse.json({ listings })
      }
      case 'listing': {
        const id = url.searchParams.get('id') || ''
        const slug = url.searchParams.get('slug') || ''
        const where: any = {}
        if (id) where.id = id
        else if (slug) where.slug = slug
        else return NextResponse.json({ error: 'id or slug required' }, { status: 400 })
        const listing = await db.listing.findUnique({
          where,
          include: {
            photos: { orderBy: { position: 'asc' } },
            rooms: true,
            host: true,
            reviews: { where: { status: 'PUBLISHED' }, include: { author: true }, orderBy: { createdAt: 'desc' }, take: 12 },
            seasonalRates: { orderBy: { startDate: 'asc' } },
          },
        })
        if (!listing) return NextResponse.json({ error: 'not found' }, { status: 404 })
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const end = new Date(today)
        end.setDate(end.getDate() + 90)
        const availability = await db.availability.findMany({
          where: { listingId: listing.id, date: { gte: today, lte: end } },
          orderBy: { date: 'asc' },
        })
        return NextResponse.json({ listing, availability })
      }
      case 'search': {
        const dest = url.searchParams.get('destination') || ''
        const checkInStr = url.searchParams.get('checkIn')
        const checkOutStr = url.searchParams.get('checkOut')
        const adults = parseInt(url.searchParams.get('adults') || '1')
        const children = parseInt(url.searchParams.get('children') || '0')
        const category = url.searchParams.get('category') || ''
        const minPrice = url.searchParams.get('minPrice')
        const maxPrice = url.searchParams.get('maxPrice')
        const minBedrooms = url.searchParams.get('minBedrooms')
        const minBathrooms = url.searchParams.get('minBathrooms')
        const amenities = url.searchParams.get('amenities')?.split(',').filter(Boolean) || []
        const instantBookOnly = url.searchParams.get('instantBookOnly') === 'true'
        const minRating = url.searchParams.get('minRating')
        const sortBy = url.searchParams.get('sortBy') || 'recommended'
        const where: any = { status: 'PUBLISHED' }
        if (category) where.category = category
        if (dest) {
          where.OR = [
            { city: { contains: dest } },
            { country: { contains: dest } },
            { neighborhood: { contains: dest } },
            { region: { contains: dest } },
          ]
        }
        if (minPrice || maxPrice) {
          where.basePrice = {}
          if (minPrice) where.basePrice.gte = parseInt(minPrice)
          if (maxPrice) where.basePrice.lte = parseInt(maxPrice)
        }
        if (minBedrooms) where.bedrooms = { gte: parseInt(minBedrooms) }
        if (minBathrooms) where.bathrooms = { gte: parseInt(minBathrooms) }
        if (minRating) where.rating = { gte: parseFloat(minRating) }
        if (instantBookOnly) where.instantBook = true
        if (amenities.length) {
          where.OR = where.OR
            ? [...where.OR, ...amenities.map(a => ({ amenities: { contains: a } }))]
            : amenities.map(a => ({ amenities: { contains: a } }))
        }
        const totalGuests = adults + children
        if (totalGuests > 1) where.maxGuests = { gte: totalGuests }
        let orderBy: any = { wishlistSaves: 'desc' }
        if (sortBy === 'price_asc') orderBy = { basePrice: 'asc' }
        else if (sortBy === 'price_desc') orderBy = { basePrice: 'desc' }
        else if (sortBy === 'rating') orderBy = { rating: 'desc' }
        else if (sortBy === 'reviews') orderBy = { reviewCount: 'desc' }
        else if (sortBy === 'recent') orderBy = { createdAt: 'desc' }
        const listings = await db.listing.findMany({
          where,
          include: { photos: { where: { isCover: true }, take: 1 }, host: true },
          orderBy,
          take: 100,
        })
        let filtered = listings
        if (checkInStr && checkOutStr) {
          const checkIn = new Date(checkInStr)
          const checkOut = new Date(checkOutStr)
          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000)
          if (nights > 0) {
            const blockedAvail = await db.availability.findMany({
              where: { listingId: { in: listings.map(l => l.id) }, date: { gte: checkIn, lt: checkOut }, isAvailable: false },
              select: { listingId: true },
            })
            const blockedIds = new Set(blockedAvail.map(b => b.listingId))
            filtered = listings.filter(l => !blockedIds.has(l.id))
          }
        }
        return NextResponse.json({ listings: filtered, count: filtered.length })
      }
      case 'availability': {
        const listingId = url.searchParams.get('listingId') || ''
        const startStr = url.searchParams.get('start')
        const endStr = url.searchParams.get('end')
        if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 })
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const start = startStr ? new Date(startStr) : today
        const end = endStr ? new Date(endStr) : new Date(today.getTime() + 90 * 86400000)
        const availability = await db.availability.findMany({
          where: { listingId, date: { gte: start, lte: end } },
          orderBy: { date: 'asc' },
        })
        return NextResponse.json({ availability })
      }
      case 'reviews': {
        const listingId = url.searchParams.get('listingId') || ''
        const reviews = await db.review.findMany({
          where: listingId ? { listingId } : {},
          include: { author: true, listing: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
        return NextResponse.json({ reviews })
      }
      case 'experiences': {
        const experiences = await db.experience.findMany({
          include: { sessions: true, host: true },
          orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json({ experiences })
      }
      case 'services': {
        const services = await db.service.findMany({
          include: { slots: true, provider: true },
          orderBy: { rating: 'desc' },
        })
        return NextResponse.json({ services })
      }
      case 'bookings': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const role = url.searchParams.get('role') || 'guest'
        const where: any = {}
        if (role === 'guest') where.guestId = me.id
        else if (role === 'host') where.hostId = me.id
        else if (me.role !== 'ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const bookings = await db.booking.findMany({
          where,
          include: { listing: { include: { photos: { where: { isCover: true }, take: 1 } } }, guest: true, host: true, paymentAttempts: true, payout: true, reviews: true },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
        return NextResponse.json({ bookings })
      }
      case 'all-bookings': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const bookings = await db.booking.findMany({
          include: { listing: true, guest: true, host: true, paymentAttempts: true, payout: true },
          orderBy: { createdAt: 'desc' },
          take: 200,
        })
        return NextResponse.json({ bookings })
      }
      case 'conversations': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const conversations = await db.conversation.findMany({
          where: { OR: [{ userAId: me.id }, { userBId: me.id }] },
          include: { userA: true, userB: true, messages: { orderBy: { sentAt: 'desc' }, take: 1 } },
          orderBy: { lastMessageAt: 'desc' },
        })
        return NextResponse.json({ conversations })
      }
      case 'messages': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const conversationId = url.searchParams.get('conversationId') || ''
        const conversation = await db.conversation.findUnique({
          where: { id: conversationId },
          include: { userA: true, userB: true },
        })
        if (!conversation || (conversation.userAId !== me.id && conversation.userBId !== me.id)) {
          return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        }
        const messages = await db.message.findMany({
          where: { conversationId },
          include: { sender: true },
          orderBy: { sentAt: 'asc' },
        })
        return NextResponse.json({ conversation, messages })
      }
      case 'wishlists': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const wishlists = await db.wishlist.findMany({
          where: { userId: me.id },
          include: { listings: { include: { photos: { where: { isCover: true }, take: 1 } } } },
          orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json({ wishlists })
      }
      case 'notifications': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const notifications = await db.notification.findMany({
          where: { userId: me.id },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
        const unreadCount = notifications.filter(n => !n.isRead).length
        return NextResponse.json({ notifications, unreadCount })
      }
      case 'host-dashboard': {
        const me = await requireAuth(['HOST', 'ADMIN'])
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const listings = await db.listing.findMany({
          where: { hostId: me.id },
          include: { photos: { where: { isCover: true }, take: 1 }, bookings: true },
        })
        const bookings = await db.booking.findMany({
          where: { hostId: me.id },
          include: {
            listing: true,
            guest: true,
            payout: true,
            // Include reviews so the host ReviewsTab can show + respond to them
            reviews: { include: { author: true } },
          },
          orderBy: { checkIn: 'desc' },
          take: 100,
        })
        const payouts = await db.payout.findMany({
          where: { hostId: me.id },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
        const grossRevenue = bookings.reduce((s, b) => s + b.totalAmount, 0)
        const netEarnings = payouts.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0)
        const pendingPayouts = payouts.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0)
        const upcomingCheckIns = bookings.filter(b => new Date(b.checkIn) >= new Date() && b.status === 'CONFIRMED').length
        const occupancyRate = listings.length ? Math.min(100, Math.round((bookings.length / Math.max(1, listings.length * 3)) * 100)) : 0
        return NextResponse.json({
          listings, bookings, payouts,
          stats: {
            totalListings: listings.length,
            totalBookings: bookings.length,
            grossRevenue, netEarnings, pendingPayouts,
            upcomingCheckIns, occupancyRate,
            avgNightlyRate: listings.length ? Math.round(listings.reduce((s, l) => s + l.basePrice, 0) / listings.length) : 0,
          },
        })
      }
      case 'admin-dashboard': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const [users, listings, bookings, payments, payouts, supportTickets, auditLogs, reportedListings] = await Promise.all([
          db.user.findMany({ include: { listings: { select: { id: true, title: true } } } }),
          db.listing.findMany({ include: { host: true, photos: { where: { isCover: true }, take: 1 } } }),
          db.booking.findMany({ include: { listing: true, guest: true, host: true, paymentAttempts: true } }),
          db.paymentAttempt.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
          db.payout.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
          db.supportTicket.findMany({ include: { requester: true, assignee: true, booking: { include: { listing: true } } }, orderBy: { createdAt: 'desc' } }),
          db.auditLog.findMany({ include: { actor: true }, orderBy: { createdAt: 'desc' }, take: 100 }),
          db.listing.findMany({ where: { moderationStatus: 'PENDING' }, take: 50 }),
        ])
        const grossBookingValue = bookings.reduce((s, b) => s + b.totalAmount, 0)
        const platformRevenue = bookings.reduce((s, b) => s + b.platformFee, 0)
        const failedPayments = payments.filter(p => p.status === 'FAILED').length
        const pendingRefunds = payments.filter(p => p.intent === 'REFUND' && p.status === 'PENDING').length
        const failedPayouts = payouts.filter(p => p.status === 'FAILED').length
        const openTickets = supportTickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length
        return NextResponse.json({
          users, listings, bookings, payments, payouts, supportTickets, auditLogs, reportedListings,
          stats: {
            totalUsers: users.length,
            totalGuests: users.filter(u => u.role === 'GUEST').length,
            totalHosts: users.filter(u => u.role === 'HOST').length,
            totalListings: listings.length,
            pendingListings: listings.filter(l => l.moderationStatus === 'PENDING').length,
            totalBookings: bookings.length,
            upcomingCheckIns: bookings.filter(b => new Date(b.checkIn) >= new Date() && b.status === 'CONFIRMED').length,
            cancelledBookings: bookings.filter(b => b.status === 'CANCELLED').length,
            grossBookingValue, platformRevenue, failedPayments, pendingRefunds, failedPayouts, openTickets, reportedContent: reportedListings.length,
          },
        })
      }
      case 'me': {
        const me = await getSessionUser()
        return NextResponse.json({ user: me })
      }
      case 'users': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const users = await db.user.findMany({
          include: { listings: { select: { id: true, title: true } }, _count: { select: { bookingsAsGuest: true, bookingsAsHost: true } } },
          orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json({ users })
      }
      case 'coupon': {
        const code = url.searchParams.get('code') || ''
        const subtotal = parseInt(url.searchParams.get('subtotal') || '0')
        const coupon = await db.coupon.findUnique({ where: { code } })
        if (!coupon || !coupon.active) return NextResponse.json({ valid: false, message: 'Invalid coupon code' })
        if (coupon.validTo < new Date()) return NextResponse.json({ valid: false, message: 'Coupon expired' })
        if (coupon.minAmount > subtotal) return NextResponse.json({ valid: false, message: `Minimum spend is $${(coupon.minAmount / 100).toFixed(2)}` })
        if (coupon.maxRedemptions && coupon.redeemed >= coupon.maxRedemptions) return NextResponse.json({ valid: false, message: 'Coupon fully redeemed' })
        let discount = 0
        if (coupon.type === 'PERCENT') discount = Math.round((subtotal * coupon.value) / 100)
        else discount = coupon.value
        return NextResponse.json({ valid: true, discount, coupon })
      }
      case 'destination': {
        // Single destination landing page — listings grouped + editorial content
        const city = url.searchParams.get('city') || ''
        if (!city) return NextResponse.json({ error: 'city required' }, { status: 400 })
        const listings = await db.listing.findMany({
          where: { status: 'PUBLISHED', city: { contains: city } },
          include: { photos: { where: { isCover: true }, take: 1 }, host: true },
          orderBy: { rating: 'desc' },
          take: 20,
        })
        const totalListings = await db.listing.count({
          where: { status: 'PUBLISHED', city: { contains: city } },
        })
        const avgPrice = listings.length ? Math.round(listings.reduce((s, l) => s + l.basePrice, 0) / listings.length) : 0
        const categories = Array.from(new Set(listings.map(l => l.category)))
        return NextResponse.json({
          city,
          listings,
          totalListings,
          avgPrice,
          categories,
        })
      }
      case 'recently-viewed': {
        const idsParam = url.searchParams.get('ids') || ''
        const ids = idsParam.split(',').filter(Boolean)
        if (!ids.length) return NextResponse.json({ listings: [] })
        const listings = await db.listing.findMany({
          where: { id: { in: ids }, status: 'PUBLISHED' },
          include: { photos: { where: { isCover: true }, take: 1 }, host: true },
        })
        // Preserve order from ids
        const ordered = ids.map(id => listings.find(l => l.id === id)).filter(Boolean)
        return NextResponse.json({ listings: ordered })
      }
      case 'map-markers': {
        // Lightweight listing IDs + coords for map rendering
        const dest = url.searchParams.get('destination') || ''
        // Optional bounding box filter (when "search as I move" is enabled)
        const north = url.searchParams.get('north')
        const south = url.searchParams.get('south')
        const east = url.searchParams.get('east')
        const west = url.searchParams.get('west')
        const where: any = { status: 'PUBLISHED' }
        if (dest) {
          where.OR = [
            { city: { contains: dest } },
            { country: { contains: dest } },
            { neighborhood: { contains: dest } },
          ]
        }
        if (north && south && east && west) {
          where.lat = { lte: parseFloat(north), gte: parseFloat(south) }
          where.lng = { lte: parseFloat(east), gte: parseFloat(west) }
        }
        const listings = await db.listing.findMany({
          where,
          select: {
            id: true, title: true, slug: true, basePrice: true, currency: true,
            lat: true, lng: true, city: true, country: true, neighborhood: true,
            rating: true, reviewCount: true, coverImage: true, maxGuests: true, bedrooms: true, instantBook: true,
          },
          take: 200,
        })
        return NextResponse.json({ markers: listings.filter(l => l.lat && l.lng) })
      }
      // -------- Content tables (public read) --------
      case 'amenities': {
        const amenities = await db.amenity.findMany({
          where: { active: true },
          orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
        })
        return NextResponse.json({ amenities })
      }
      case 'destinations': {
        const popularOnly = url.searchParams.get('popular') === 'true'
        const destinations = await db.destination.findMany({
          where: popularOnly ? { popular: true } : undefined,
          orderBy: { sortOrder: 'asc' },
        })
        return NextResponse.json({ destinations })
      }
      case 'wizard-steps': {
        const steps = await db.wizardStep.findMany({
          where: { active: true },
          orderBy: { order: 'asc' },
        })
        return NextResponse.json({ steps })
      }
      case 'categories': {
        const categories = await db.propertyCategory.findMany({
          where: { active: true },
          orderBy: { sortOrder: 'asc' },
        })
        return NextResponse.json({ categories })
      }
      // -------- Admin content management --------
      case 'admin-amenities': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const amenities = await db.amenity.findMany({ orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] })
        return NextResponse.json({ amenities })
      }
      case 'admin-destinations': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const destinations = await db.destination.findMany({ orderBy: { sortOrder: 'asc' } })
        return NextResponse.json({ destinations })
      }
      case 'admin-wizard-steps': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const steps = await db.wizardStep.findMany({ orderBy: { order: 'asc' } })
        return NextResponse.json({ steps })
      }
      case 'admin-categories': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const categories = await db.propertyCategory.findMany({ orderBy: { sortOrder: 'asc' } })
        return NextResponse.json({ categories })
      }
      // -------- Host public profile --------
      case 'host-profile': {
        const hostId = url.searchParams.get('id') || ''
        if (!hostId) return NextResponse.json({ error: 'id required' }, { status: 400 })
        const host = await db.user.findUnique({
          where: { id: hostId },
          include: {
            listings: {
              where: { status: 'PUBLISHED' },
              include: { photos: { where: { isCover: true }, take: 1 } },
              orderBy: { rating: 'desc' },
              take: 20,
            },
            reviewsReceived: {
              where: { status: 'PUBLISHED' },
              include: { author: true, listing: { select: { title: true, city: true, country: true } } },
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
          },
        })
        if (!host || (host.role !== 'HOST' && host.role !== 'ADMIN')) {
          return NextResponse.json({ error: 'host not found' }, { status: 404 })
        }
        // Aggregate rating
        const reviews = host.reviewsReceived || []
        const avgRating = reviews.length ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 0
        const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        for (const r of reviews) ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1
        return NextResponse.json({
          host: {
            id: host.id,
            name: host.name,
            avatarUrl: host.avatarUrl,
            bio: host.bio,
            country: host.country,
            isVerified: host.isVerified,
            isSuperhost: host.isSuperhost,
            responseRate: host.responseRate,
            responseTimeMins: host.responseTimeMins,
            createdAt: host.createdAt,
          },
          listings: host.listings,
          reviews,
          stats: {
            totalListings: host.listings.length,
            totalReviews: reviews.length,
            avgRating: Math.round(avgRating * 10) / 10,
            ratingCounts,
          },
        })
      }
      // -------- Saved searches --------
      case 'saved-searches': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const searches = await db.savedSearch.findMany({
          where: { userId: me.id },
          orderBy: { createdAt: 'desc' },
        })
        return NextResponse.json({ searches })
      }
      // -------- Admin coupons --------
      case 'admin-coupons': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const coupons = await db.coupon.findMany({ orderBy: { createdAt: 'desc' } })
        return NextResponse.json({ coupons })
      }
      // -------- Email templates --------
      case 'email-templates': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const templates = await db.emailTemplate.findMany({ orderBy: { key: 'asc' } })
        return NextResponse.json({ templates })
      }
      case 'email-template': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const key = url.searchParams.get('key') || ''
        const template = await db.emailTemplate.findUnique({ where: { key } })
        if (!template) return NextResponse.json({ error: 'not found' }, { status: 404 })
        return NextResponse.json({ template })
      }
      // -------- Listing quality score --------
      case 'listing-quality': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const id = url.searchParams.get('id') || ''
        const listing = await db.listing.findUnique({
          where: { id },
          include: { photos: true, rooms: true },
        })
        if (!listing) return NextResponse.json({ error: 'not found' }, { status: 404 })
        // Quality score calculation (max 100)
        const checks: { key: string; label: string; weight: number; passed: boolean; reason?: string }[] = []
        checks.push({ key: 'title', label: 'Title (min 5 chars)', weight: 10, passed: (listing.title?.length || 0) >= 5 })
        checks.push({ key: 'description', label: 'Description (min 100 chars)', weight: 15, passed: (listing.description?.length || 0) >= 100 })
        checks.push({ key: 'photos', label: 'Photos (min 5)', weight: 20, passed: listing.photos.length >= 5, reason: `${listing.photos.length}/5` })
        checks.push({ key: 'coverImage', label: 'Cover image set', weight: 5, passed: !!listing.coverImage })
        checks.push({ key: 'amenities', label: 'Amenities (min 5)', weight: 15, passed: (listing.amenities?.split(',').filter(Boolean).length || 0) >= 5 })
        checks.push({ key: 'price', label: 'Base price set', weight: 10, passed: listing.basePrice > 0 })
        checks.push({ key: 'location', label: 'Coordinates set', weight: 10, passed: !!listing.lat && !!listing.lng })
        checks.push({ key: 'houseRules', label: 'House rules configured', weight: 5, passed: listing.allowsPets !== undefined })
        checks.push({ key: 'cancellation', label: 'Cancellation policy', weight: 5, passed: !!listing.cancellationPolicy })
        checks.push({ key: 'checkin', label: 'Check-in/out times', weight: 5, passed: !!listing.checkInTime && !!listing.checkOutTime })
        const totalWeight = checks.reduce((s, c) => s + c.weight, 0)
        const passedWeight = checks.filter(c => c.passed).reduce((s, c) => s + c.weight, 0)
        const score = Math.round((passedWeight / totalWeight) * 100)
        return NextResponse.json({ score, checks, totalWeight, passedWeight })
      }
      default:
        return NextResponse.json({ error: 'unknown op' }, { status: 400 })
    }
  } catch (err: any) {
    console.error('[stayora API GET error]', op, err)
    return NextResponse.json({ error: err.message || 'server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url)
  const op = url.searchParams.get('op') || ''
  try {
    const body = await req.json().catch(() => ({}))
    switch (op) {
      case 'register': {
        const { email, password, name } = body
        if (!email || !password || !name) return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 })
        if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
        const existing = await db.user.findUnique({ where: { email } })
        if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
        const passwordHash = await bcrypt.hash(password, 10)
        const role = (body.role || 'GUEST').toUpperCase()
        const user = await db.user.create({
          data: {
            email, passwordHash, name,
            role: ['GUEST', 'HOST'].includes(role) ? role : 'GUEST',
            avatarUrl: body.avatarUrl || `https://i.pravatar.cc/200?u=${encodeURIComponent(email)}`,
            bio: body.bio || null,
            country: body.country || null,
            isVerified: true,
          },
        })
        const token = await createSession(user.id)
        const c = await cookies()
        c.set('stayora-session', token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' })
        return NextResponse.json({ user: toSafeUser(user) })
      }
      case 'login': {
        const { email, password } = body
        if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
        const user = await db.user.findUnique({ where: { email } })
        if (!user) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        const token = await createSession(user.id)
        const c = await cookies()
        c.set('stayora-session', token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' })
        return NextResponse.json({ user: toSafeUser(user) })
      }
      case 'logout': {
        const me = await getSessionUser()
        if (me) {
          const c = await cookies()
          c.delete('stayora-session')
          await db.session.deleteMany({ where: { userId: me.id } }).catch(() => {})
        }
        return NextResponse.json({ ok: true })
      }
      case 'create-booking': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'Please sign in to book' }, { status: 401 })
        const { listingId, checkIn, checkOut, adults, children, infants, pets, couponCode } = body
        if (!listingId || !checkIn || !checkOut) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        const listing = await db.listing.findUnique({ where: { id: listingId } })
        if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
        const checkInDate = new Date(checkIn)
        const checkOutDate = new Date(checkOut)
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / 86400000)
        if (nights < listing.minNights) return NextResponse.json({ error: `Minimum stay is ${listing.minNights} nights` }, { status: 400 })
        if (listing.maxGuests < adults + children) return NextResponse.json({ error: 'Exceeds maximum occupancy' }, { status: 400 })
        const conflicting = await db.availability.findFirst({
          where: { listingId, date: { gte: checkInDate, lt: checkOutDate }, isAvailable: false },
        })
        if (conflicting) return NextResponse.json({ error: 'Selected dates are not available' }, { status: 409 })
        const overlapping = await db.booking.findFirst({
          where: { listingId, status: { in: ['CONFIRMED', 'PENDING'] }, checkIn: { lt: checkOutDate }, checkOut: { gt: checkInDate } },
        })
        if (overlapping) return NextResponse.json({ error: 'Selected dates overlap an existing booking' }, { status: 409 })
        const nightlySubtotal = listing.basePrice * nights
        const cleaningFee = listing.cleaningFee
        const serviceFee = Math.round(nightlySubtotal * 0.12)
        const taxes = Math.round(nightlySubtotal * 0.08)
        let discounts = 0
        if (couponCode) {
          const coupon = await db.coupon.findUnique({ where: { code: couponCode } })
          if (coupon && coupon.active && coupon.validTo > new Date() && coupon.minAmount <= nightlySubtotal) {
            if (coupon.type === 'PERCENT') discounts = Math.round((nightlySubtotal * coupon.value) / 100)
            else discounts = coupon.value
          }
        }
        const totalAmount = nightlySubtotal + cleaningFee + serviceFee + taxes - discounts
        const platformFee = serviceFee
        const hostPayout = nightlySubtotal + cleaningFee - Math.round(nightlySubtotal * 0.03)
        const reference = `STY-${Date.now().toString().slice(-7)}`
        const booking = await db.booking.create({
          data: {
            reference, listingId, guestId: me.id, hostId: listing.hostId,
            status: listing.instantBook ? 'CONFIRMED' : 'PENDING',
            checkIn: checkInDate, checkOut: checkOutDate, nights,
            adults: adults || 1, children: children || 0, infants: infants || 0, pets: pets || 0,
            nightlySubtotal, cleaningFee, serviceFee, taxes, discounts, totalAmount, hostPayout, platformFee,
            currency: 'USD', couponCode: couponCode || null,
            confirmedAt: listing.instantBook ? new Date() : null,
          },
        })
        await db.paymentAttempt.create({
          data: { bookingId: booking.id, provider: 'MOCK', providerRef: `pi_test_${booking.id.slice(0, 8)}`, amount: totalAmount, currency: 'USD', status: 'CAPTURED', intent: 'CHARGE', idempotencyKey: `idem-${booking.id}` },
        })
        if (listing.instantBook) {
          const scheduledAt = new Date(checkOutDate.getTime() + 24 * 3600 * 1000)
          await db.payout.create({ data: { hostId: booking.hostId, bookingId: booking.id, amount: hostPayout, currency: 'USD', status: 'PENDING', provider: 'BANK', scheduledAt } })
        }
        await db.notification.create({ data: { userId: me.id, type: 'BOOKING_CONFIRMED', title: listing.instantBook ? 'Your booking is confirmed' : 'Your booking request was sent', body: `${listing.title} • ${checkInDate.toDateString()} → ${checkOutDate.toDateString()}`, link: '/guest?tab=trips' } })
        await db.notification.create({ data: { userId: listing.hostId, type: 'BOOKING_REQUEST_RECEIVED', title: listing.instantBook ? 'New booking confirmed' : 'New booking request', body: `${me.name} booked ${listing.title}`, link: '/host?tab=reservations' } })
        return NextResponse.json({ booking })
      }
      case 'cancel-booking': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const { bookingId, reason } = body
        const booking = await db.booking.findUnique({ where: { id: bookingId } })
        if (!booking) return NextResponse.json({ error: 'not found' }, { status: 404 })
        if (booking.guestId !== me.id && booking.hostId !== me.id && me.role !== 'ADMIN') return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const updated = await db.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: reason || 'Cancelled by user', cancellationPolicyApplied: 'FLEXIBLE' } })
        await db.paymentAttempt.updateMany({ where: { bookingId, status: 'CAPTURED' }, data: { status: 'REFUNDED' } })
        const payment = await db.paymentAttempt.findFirst({ where: { bookingId } })
        if (payment) {
          await db.refund.create({ data: { paymentAttemptId: payment.id, amount: booking.totalAmount, currency: booking.currency, reason: reason || 'Cancelled by user', status: 'COMPLETED' } })
        }
        await db.payout.deleteMany({ where: { bookingId } })
        await db.notification.create({ data: { userId: booking.guestId, type: 'RESERVATION_CANCELLED', title: 'Your reservation was cancelled', body: `Refund of $${(booking.totalAmount / 100).toFixed(2)} processed`, link: '/guest?tab=trips' } })
        return NextResponse.json({ booking: updated })
      }
      case 'add-wishlist': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const { listingId, wishlistId, name } = body
        let wId = wishlistId
        if (!wId) {
          const w = await db.wishlist.create({ data: { userId: me.id, name: name || 'Saved' } })
          wId = w.id
        }
        await db.wishlist.update({ where: { id: wId }, data: { listings: { connect: { id: listingId } } } })
        await db.listing.update({ where: { id: listingId }, data: { wishlistSaves: { increment: 1 } } })
        return NextResponse.json({ wishlistId: wId })
      }
      case 'remove-wishlist': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const { listingId, wishlistId } = body
        await db.wishlist.update({ where: { id: wishlistId }, data: { listings: { disconnect: { id: listingId } } } })
        await db.listing.update({ where: { id: listingId }, data: { wishlistSaves: { decrement: 1 } } })
        return NextResponse.json({ ok: true })
      }
      case 'send-message': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const { conversationId, recipientId, body: msgBody, bookingId } = body
        if (!msgBody) return NextResponse.json({ error: 'message body required' }, { status: 400 })
        let convId = conversationId
        if (!convId && recipientId) {
          const existing = await db.conversation.findFirst({ where: { OR: [{ userAId: me.id, userBId: recipientId }, { userAId: recipientId, userBId: me.id }] } })
          if (existing) convId = existing.id
          else {
            const conv = await db.conversation.create({ data: { userAId: me.id, userBId: recipientId, bookingId: bookingId || null } })
            convId = conv.id
          }
        }
        if (!convId) return NextResponse.json({ error: 'conversation required' }, { status: 400 })
        const message = await db.message.create({ data: { conversationId: convId, senderId: me.id, bookingId: bookingId || null, body: msgBody, isRead: false, sentAt: new Date() } })
        await db.conversation.update({ where: { id: convId }, data: { lastMessageAt: new Date() } })
        const conv = await db.conversation.findUnique({ where: { id: convId } })
        if (conv) {
          const recipientId = conv.userAId === me.id ? conv.userBId : conv.userAId
          await db.notification.create({ data: { userId: recipientId, type: 'MESSAGE_RECEIVED', title: `New message from ${me.name}`, body: msgBody.slice(0, 80), link: '/guest?tab=messages' } })
        }
        return NextResponse.json({ message, conversationId: convId })
      }
      case 'mark-read': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const { conversationId } = body
        await db.message.updateMany({ where: { conversationId, senderId: { not: me.id }, isRead: false }, data: { isRead: true, readAt: new Date() } })
        return NextResponse.json({ ok: true })
      }
      case 'create-review': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const { bookingId, rating, body: reviewBody, subratings } = body
        const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { listing: true } })
        if (!booking) return NextResponse.json({ error: 'booking not found' }, { status: 404 })
        if (booking.guestId !== me.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const existing = await db.review.findFirst({ where: { bookingId } })
        if (existing) return NextResponse.json({ error: 'review already submitted' }, { status: 409 })
        const review = await db.review.create({
          data: {
            authorId: me.id, subjectId: booking.hostId, listingId: booking.listingId, bookingId, rating,
            ratingAccuracy: subratings?.accuracy, ratingCleanliness: subratings?.cleanliness,
            ratingCommunication: subratings?.communication, ratingLocation: subratings?.location,
            ratingCheckIn: subratings?.checkIn, ratingValue: subratings?.value, body: reviewBody || null,
          },
        })
        const reviews = await db.review.findMany({ where: { listingId: booking.listingId, status: 'PUBLISHED' } })
        const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        await db.listing.update({ where: { id: booking.listingId }, data: { rating: Math.round(avgRating * 10) / 10, reviewCount: reviews.length } })
        return NextResponse.json({ review })
      }
      case 'mark-notification-read': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const { notificationId, all } = body
        if (all) await db.notification.updateMany({ where: { userId: me.id }, data: { isRead: true } })
        else await db.notification.update({ where: { id: notificationId }, data: { isRead: true } })
        return NextResponse.json({ ok: true })
      }
      case 'create-listing': {
        const me = await requireAuth(['HOST', 'ADMIN'])
        if (!me) return NextResponse.json({ error: 'host account required' }, { status: 403 })
        const { id, photos, ...data } = body
        const slug = data.title ? `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}` : `listing-${Date.now()}`
        if (id) {
          // Update existing listing (including photos replacement if provided)
          const updateData: any = { ...data }
          if (photos && Array.isArray(photos)) {
            // Replace all photos
            await db.listingPhoto.deleteMany({ where: { listingId: id } })
            if (photos.length > 0) {
              await db.listingPhoto.createMany({
                data: photos.map((p: any, idx: number) => ({
                  listingId: id,
                  url: p.url,
                  caption: p.caption || null,
                  position: idx,
                  isCover: idx === 0,
                })),
              })
              updateData.coverImage = photos[0].url
            }
          }
          const listing = await db.listing.update({ where: { id }, data: updateData })
          return NextResponse.json({ listing })
        }
        const listing = await db.listing.create({
          data: {
            hostId: me.id,
            title: data.title || 'Untitled Listing', slug,
            description: data.description || '',
            category: data.category || 'APARTMENT', roomType: data.roomType || 'ENTIRE',
            status: data.status || 'DRAFT',
            country: data.country || 'Portugal', city: data.city || 'Lisbon', neighborhood: data.neighborhood || null,
            lat: data.lat || null, lng: data.lng || null,
            maxGuests: data.maxGuests || 2, bedrooms: data.bedrooms || 1, beds: data.beds || 1, bathrooms: data.bathrooms || 1,
            basePrice: data.basePrice || 5000, cleaningFee: data.cleaningFee || 0,
            minNights: data.minNights || 1,
            amenities: data.amenities || '',
            coverImage: data.coverImage || photos?.[0]?.url || 'https://images.unsplash.com/photo-1502672260266-1c0e6d6f3a9b?w=1200&q=80',
            allowsPets: data.allowsPets || false, allowsSmoking: data.allowsSmoking || false, allowsParties: data.allowsParties || false,
            cancellationPolicy: data.cancellationPolicy || 'FLEXIBLE', instantBook: data.instantBook || false,
            photos: photos && photos.length > 0 ? {
              create: photos.map((p: any, idx: number) => ({
                url: p.url,
                caption: p.caption || null,
                position: idx,
                isCover: idx === 0,
              })),
            } : undefined,
          },
          include: { photos: true },
        })
        // Generate default availability for next 90 days
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const availabilityData = []
        for (let d = 0; d < 90; d++) {
          const date = new Date(today)
          date.setDate(today.getDate() + d)
          const isWeekend = date.getDay() === 0 || date.getDay() === 6
          const price = isWeekend && data.weekendPrice ? data.weekendPrice : (data.basePrice || 5000)
          availabilityData.push({ listingId: listing.id, date, isAvailable: true, priceOverride: price })
        }
        await db.availability.createMany({ data: availabilityData })
        return NextResponse.json({ listing })
      }
      case 'update-listing-status': {
        const me = await requireAuth(['HOST', 'ADMIN'])
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const { listingId, status } = body
        const listing = await db.listing.findUnique({ where: { id: listingId } })
        if (!listing || (listing.hostId !== me.id && me.role !== 'ADMIN')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const updated = await db.listing.update({ where: { id: listingId }, data: { status } })
        return NextResponse.json({ listing: updated })
      }
      case 'admin-user-action': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const { userId, action } = body
        if (action === 'SUSPEND') await db.user.update({ where: { id: userId }, data: { isVerified: false } })
        else if (action === 'REACTIVATE' || action === 'VERIFY') await db.user.update({ where: { id: userId }, data: { isVerified: true } })
        else if (action === 'DELETE') await db.user.delete({ where: { id: userId } })
        await db.auditLog.create({ data: { actorId: me.id, action: `USER_${action}`, resource: 'User', resourceId: userId, ip: '127.0.0.1' } })
        return NextResponse.json({ ok: true })
      }
      case 'admin-listing-action': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const { listingId, action } = body
        const moderationStatus = action === 'APPROVE' ? 'AUTO_APPROVED' : action === 'REJECT' ? 'REJECTED' : 'RESTRICTED'
        const status = action === 'REMOVE' ? 'ARCHIVED' : action === 'APPROVE' ? 'PUBLISHED' : 'PAUSED'
        const updated = await db.listing.update({ where: { id: listingId }, data: { moderationStatus, status } })
        await db.auditLog.create({ data: { actorId: me.id, action: `LISTING_${action}`, resource: 'Listing', resourceId: listingId, ip: '127.0.0.1' } })
        return NextResponse.json({ listing: updated })
      }
      case 'admin-refund': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const { bookingId, amount } = body
        const payment = await db.paymentAttempt.findFirst({ where: { bookingId } })
        if (!payment) return NextResponse.json({ error: 'no payment found' }, { status: 404 })
        await db.refund.create({ data: { paymentAttemptId: payment.id, amount: amount || payment.amount, currency: payment.currency, status: 'COMPLETED', reason: 'Admin-issued refund' } })
        await db.paymentAttempt.update({ where: { id: payment.id }, data: { status: 'REFUNDED' } })
        await db.auditLog.create({ data: { actorId: me.id, action: 'REFUND_ISSUED', resource: 'Booking', resourceId: bookingId, ip: '127.0.0.1' } })
        return NextResponse.json({ ok: true })
      }
      case 'support-ticket': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const { subject, category, description, priority, bookingId } = body
        const ticket = await db.supportTicket.create({
          data: { requesterId: me.id, subject, category: category || 'GENERAL', priority: priority || 'NORMAL', status: 'OPEN', description, bookingId: bookingId || null },
        })
        await db.notification.create({ data: { userId: me.id, type: 'SUPPORT_UPDATE', title: 'Support ticket created', body: `Ticket #${ticket.id.slice(0, 8)} — we'll respond within 24 hours.`, link: '/guest?tab=support' } })
        return NextResponse.json({ ticket })
      }
      case 'ai-travel-assistant': {
        // AI travel planning using z-ai-web-dev-sdk (server-side only)
        const { query, userPrefs } = body
        if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 })
        try {
          // Dynamically import z-ai-web-dev-sdk (server-side)
          const ZAI = (await import('z-ai-web-dev-sdk')).default
          const zai = await ZAI.create()
          // Fetch matching listings to provide real context
          const allListings = await db.listing.findMany({
            where: { status: 'PUBLISHED' },
            select: {
              id: true, title: true, city: true, country: true, neighborhood: true,
              basePrice: true, currency: true, maxGuests: true, bedrooms: true,
              category: true, rating: true, reviewCount: true, coverImage: true,
              amenities: true, instantBook: true,
            },
            take: 50,
            orderBy: { rating: 'desc' },
          })
          const listingsContext = allListings.slice(0, 25).map(l => ({
            id: l.id,
            title: l.title,
            location: `${l.neighborhood ? l.neighborhood + ', ' : ''}${l.city}, ${l.country}`,
            pricePerNight: `$${(l.basePrice / 100).toFixed(0)}`,
            category: l.category,
            rating: l.rating,
            guests: l.maxGuests,
            bedrooms: l.bedrooms,
            amenities: l.amenities.split(',').slice(0, 6),
            instantBook: l.instantBook,
          }))
          const systemPrompt = `You are Stayora's AI travel assistant. Help travelers find the perfect stay based on their natural-language request.

You have access to ${allListings.length} real listings on Stayora. Here are the top ${listingsContext.length}:

${JSON.stringify(listingsContext, null, 2)}

User preferences: ${JSON.stringify(userPrefs || {}, null, 2)}

Respond with EXACTLY this JSON structure (no other text):
{
  "greeting": "Brief personalized greeting (1 sentence)",
  "summary": "2-3 sentence summary of what you found for them",
  "recommendations": [
    {
      "listingId": "<real listing id from the data above>",
      "reason": "1-sentence personalized reason this matches"
    }
  ],
  "tips": ["Optional travel tip 1", "Optional tip 2"],
  "followups": ["Suggested follow-up question 1", "Suggested follow-up question 2"]
}

Pick at most 3 recommendations from the listings above. If the user's request doesn't match any listings, recommend the closest matches and explain why.`
          const completion = await zai.chat.completions.create({
            messages: [
              { role: 'assistant', content: systemPrompt },
              { role: 'user', content: query },
            ],
            thinking: { type: 'disabled' },
          })
          const content = completion.choices[0]?.message?.content || '{}'
          // Strip markdown code fences if present (LLM tends to wrap JSON in ```json ... ```)
          const cleanedContent = content
            .replace(/^```(?:json)?\s*\n?/i, '')
            .replace(/\n?```\s*$/i, '')
            .trim()
          try {
            const parsed = JSON.parse(cleanedContent)
            // Hydrate recommendations with full listing data
            const hydratedRecs = await Promise.all(
              (parsed.recommendations || []).map(async (r: any) => {
                const listing = await db.listing.findUnique({
                  where: { id: r.listingId },
                  include: { photos: { where: { isCover: true }, take: 1 }, host: true },
                })
                return { ...r, listing }
              })
            )
            return NextResponse.json({
              ...parsed,
              recommendations: hydratedRecs.filter((r: any) => r.listing),
            })
          } catch (parseErr) {
            return NextResponse.json({
              greeting: 'Hello!',
              summary: content.slice(0, 500),
              recommendations: [],
              tips: [],
              followups: [],
              raw: true,
            })
          }
        } catch (e: any) {
          console.error('[AI travel assistant error]', e)
          return NextResponse.json({ error: 'AI assistant temporarily unavailable: ' + e.message }, { status: 503 })
        }
      }
      case 'create-payment-intent': {
        // Proxies to the Stayora Payment Gateway mini-service on port 3004
        const { amount, currency, bookingId, listingId, userId } = body
        if (!amount) return NextResponse.json({ error: 'amount required' }, { status: 400 })
        const r = await fetch(`http://localhost:3004/payment-intents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: parseInt(amount),
            currency: currency || 'usd',
            metadata: { bookingId, listingId, userId },
          }),
        })
        const intent = await r.json()
        if (!r.ok) return NextResponse.json({ error: intent.error || 'gateway error' }, { status: r.status })
        return NextResponse.json({ intent })
      }
      case 'payment-webhook': {
        // Receives webhooks from the Stayora Payment Gateway (port 3004)
        const event = body
        if (event?.type === 'payment_intent.succeeded') {
          const { id, amount, currency, metadata } = event.data?.object || {}
          const { bookingId } = metadata || {}
          if (bookingId) {
            // Update payment attempt + booking status
            await db.paymentAttempt.updateMany({
              where: { bookingId },
              data: { status: 'CAPTURED', providerRef: id },
            })
            const booking = await db.booking.findUnique({ where: { id: bookingId } })
            if (booking && booking.status === 'PENDING') {
              await db.booking.update({
                where: { id: bookingId },
                data: { status: 'CONFIRMED', confirmedAt: new Date() },
              })
              // Schedule payout
              const scheduledAt = new Date(new Date(booking.checkOut).getTime() + 24 * 3600 * 1000)
              await db.payout.create({
                data: {
                  hostId: booking.hostId,
                  bookingId: booking.id,
                  amount: booking.hostPayout,
                  currency: booking.currency,
                  status: 'PENDING',
                  provider: 'BANK',
                  scheduledAt,
                },
              })
              await db.notification.create({
                data: {
                  userId: booking.guestId,
                  type: 'BOOKING_CONFIRMED',
                  title: 'Payment confirmed — your booking is live',
                  body: `Payment of $${(amount / 100).toFixed(2)} processed successfully`,
                  link: '/guest?tab=trips',
                },
              })
              await db.notification.create({
                data: {
                  userId: booking.hostId,
                  type: 'BOOKING_CONFIRMED',
                  title: 'New booking confirmed',
                  body: `A guest's payment has cleared — see your reservations`,
                  link: '/host?tab=reservations',
                },
              })
            }
          }
          return NextResponse.json({ received: true })
        }
        return NextResponse.json({ received: true, ignored: true })
      }
      case 'share-wishlist': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const { wishlistId, recipientEmails } = body
        const wishlist = await db.wishlist.findFirst({
          where: { id: wishlistId, userId: me.id },
        })
        if (!wishlist) return NextResponse.json({ error: 'not found' }, { status: 404 })
        // In production this would email recipients. For demo, generate a share token.
        const shareToken = `${wishlistId}-${Math.random().toString(36).slice(2, 10)}`
        await db.wishlist.update({
          where: { id: wishlistId },
          data: { isPrivate: false, shareToken },
        })
        return NextResponse.json({ shareToken, shareUrl: `/?wishlist=${shareToken}` })
      }
      case 'update-profile': {
        // Allow user to update their own profile (name, bio, country, avatarUrl)
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const { name, bio, country, avatarUrl, languages, currency } = body
        const updated = await db.user.update({
          where: { id: me.id },
          data: {
            ...(name !== undefined && { name }),
            ...(bio !== undefined && { bio }),
            ...(country !== undefined && { country }),
            ...(avatarUrl !== undefined && { avatarUrl }),
            ...(languages !== undefined && { languages }),
            ...(currency !== undefined && { currency }),
          },
        })
        return NextResponse.json({ user: toSafeUser(updated) })
      }
      // ============================================================
      // ADMIN CONTENT MANAGEMENT (CRUD for amenities, destinations,
      // wizard-steps, property-categories)
      // ============================================================
      case 'admin-content-upsert': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const { table, id, data } = body
        const allowedTables = ['amenity', 'destination', 'wizardStep', 'propertyCategory']
        if (!allowedTables.includes(table)) return NextResponse.json({ error: 'invalid table' }, { status: 400 })
        // Pick only safe fields per table
        const safeData: any = {}
        for (const [k, v] of Object.entries(data || {})) {
          if (['id', 'createdAt', 'updatedAt'].includes(k)) continue
          safeData[k] = v
        }
        try {
          // @ts-ignore - prisma model accessor is dynamic
          const result = id
            ? await (db as any)[table].update({ where: { id }, data: safeData })
            : await (db as any)[table].create({ data: safeData })
          await db.auditLog.create({
            data: {
              actorId: me.id,
              action: `CONTENT_${id ? 'UPDATE' : 'CREATE'}_${table.toUpperCase()}`,
              resource: table,
              resourceId: result.id,
              metadata: JSON.stringify({ data: safeData }),
              ip: '127.0.0.1',
            },
          })
          return NextResponse.json({ record: result })
        } catch (e: any) {
          return NextResponse.json({ error: e.message || 'upsert failed' }, { status: 400 })
        }
      }
      case 'admin-content-delete': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const { table, id } = body
        const allowedTables = ['amenity', 'destination', 'wizardStep', 'propertyCategory']
        if (!allowedTables.includes(table)) return NextResponse.json({ error: 'invalid table' }, { status: 400 })
        try {
          // @ts-ignore
          await (db as any)[table].delete({ where: { id } })
          await db.auditLog.create({
            data: {
              actorId: me.id,
              action: `CONTENT_DELETE_${table.toUpperCase()}`,
              resource: table,
              resourceId: id,
              ip: '127.0.0.1',
            },
          })
          return NextResponse.json({ ok: true })
        } catch (e: any) {
          return NextResponse.json({ error: e.message || 'delete failed' }, { status: 400 })
        }
      }
      case 'admin-content-reorder': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const { table, ids } = body
        const allowedTables = ['amenity', 'destination', 'wizardStep', 'propertyCategory']
        if (!allowedTables.includes(table)) return NextResponse.json({ error: 'invalid table' }, { status: 400 })
        const orderField = table === 'wizardStep' ? 'order' : 'sortOrder'
        for (let i = 0; i < ids.length; i++) {
          // @ts-ignore
          await (db as any)[table].update({ where: { id: ids[i] }, data: { [orderField]: i + 1 } })
        }
        await db.auditLog.create({
          data: {
            actorId: me.id,
            action: `CONTENT_REORDER_${table.toUpperCase()}`,
            resource: table,
            metadata: JSON.stringify({ ids }),
            ip: '127.0.0.1',
          },
        })
        return NextResponse.json({ ok: true })
      }
      // ============================================================
      // REVIEW REPLIES (host responds to guest review)
      // ============================================================
      case 'review-reply': {
        const me = await requireAuth(['HOST', 'ADMIN'])
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const { reviewId, reply } = body
        if (!reviewId || !reply) return NextResponse.json({ error: 'reviewId and reply required' }, { status: 400 })
        const review = await db.review.findUnique({ where: { id: reviewId } })
        if (!review) return NextResponse.json({ error: 'review not found' }, { status: 404 })
        if (review.subjectId !== me.id) return NextResponse.json({ error: 'only the reviewed host can reply' }, { status: 403 })
        const updated = await db.review.update({
          where: { id: reviewId },
          data: { hostReply: reply, hostReplyAt: new Date() },
        })
        // Notify the guest that their host replied
        await db.notification.create({
          data: {
            userId: review.authorId,
            type: 'REVIEW_REPLY',
            title: `${me.name} replied to your review`,
            body: reply.slice(0, 80),
            link: '/guest?tab=reviews',
          },
        })
        return NextResponse.json({ review: updated })
      }
      // ============================================================
      // SAVED SEARCHES
      // ============================================================
      case 'create-saved-search': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const { name, filters, notifyOnMatch } = body
        if (!name || !filters) return NextResponse.json({ error: 'name and filters required' }, { status: 400 })
        const search = await db.savedSearch.create({
          data: {
            userId: me.id,
            name,
            filters: JSON.stringify(filters),
            notifyOnMatch: notifyOnMatch !== false,
          },
        })
        return NextResponse.json({ search })
      }
      case 'delete-saved-search': {
        const me = await requireAuth()
        if (!me) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        const { id } = body
        const search = await db.savedSearch.findUnique({ where: { id } })
        if (!search || search.userId !== me.id) {
          return NextResponse.json({ error: 'not found or forbidden' }, { status: 404 })
        }
        await db.savedSearch.delete({ where: { id } })
        return NextResponse.json({ ok: true })
      }
      // ============================================================
      // ADMIN COUPON CRUD
      // ============================================================
      case 'admin-coupon-upsert': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const { id, ...data } = body
        // Sanitize
        const safeData: any = { ...data }
        if (safeData.validFrom) safeData.validFrom = new Date(safeData.validFrom)
        if (safeData.validTo) safeData.validTo = new Date(safeData.validTo)
        delete safeData.createdAt
        try {
          const result = id
            ? await db.coupon.update({ where: { id }, data: safeData })
            : await db.coupon.create({ data: safeData })
          await db.auditLog.create({
            data: {
              actorId: me.id,
              action: `COUPON_${id ? 'UPDATE' : 'CREATE'}`,
              resource: 'Coupon',
              resourceId: result.id,
              metadata: JSON.stringify({ code: result.code }),
              ip: '127.0.0.1',
            },
          })
          return NextResponse.json({ coupon: result })
        } catch (e: any) {
          return NextResponse.json({ error: e.message || 'upsert failed' }, { status: 400 })
        }
      }
      case 'admin-coupon-delete': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const { id } = body
        const coupon = await db.coupon.delete({ where: { id } })
        await db.auditLog.create({
          data: { actorId: me.id, action: 'COUPON_DELETE', resource: 'Coupon', resourceId: id, metadata: JSON.stringify({ code: coupon.code }), ip: '127.0.0.1' },
        })
        return NextResponse.json({ ok: true })
      }
      // ============================================================
      // EMAIL TEMPLATE CRUD
      // ============================================================
      case 'admin-email-template-upsert': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const { id, ...data } = body
        const safeData: any = { ...data }
        delete safeData.createdAt
        delete safeData.updatedAt
        try {
          const result = id
            ? await db.emailTemplate.update({ where: { id }, data: safeData })
            : await db.emailTemplate.create({ data: safeData })
          await db.auditLog.create({
            data: { actorId: me.id, action: `EMAIL_${id ? 'UPDATE' : 'CREATE'}`, resource: 'EmailTemplate', resourceId: result.id, metadata: JSON.stringify({ key: result.key }), ip: '127.0.0.1' },
          })
          return NextResponse.json({ template: result })
        } catch (e: any) {
          return NextResponse.json({ error: e.message || 'upsert failed' }, { status: 400 })
        }
      }
      case 'admin-email-template-delete': {
        const me = await requireAuth(['ADMIN'])
        if (!me) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
        const { id } = body
        await db.emailTemplate.delete({ where: { id } })
        await db.auditLog.create({
          data: { actorId: me.id, action: 'EMAIL_DELETE', resource: 'EmailTemplate', resourceId: id, ip: '127.0.0.1' },
        })
        return NextResponse.json({ ok: true })
      }
      default:
        return NextResponse.json({ error: 'unknown op' }, { status: 400 })
    }
  } catch (err: any) {
    console.error('[stayora API POST error]', op, err)
    return NextResponse.json({ error: err.message || 'server error' }, { status: 500 })
  }
}

async function createSession(userId: string): Promise<string> {
  const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${userId}`
  await db.session.create({ data: { userId, token, expiresAt: new Date(Date.now() + 30 * 86400000) } })
  return token
}
