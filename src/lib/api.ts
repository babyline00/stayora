'use client'

// Lightweight client-side API helpers around /api/stayora
export async function getJSON<T = any>(op: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL('/api/stayora', window.location.origin)
  url.searchParams.set('op', op)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    }
  }
  const res = await fetch(url.toString(), { credentials: 'include' })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export async function postJSON<T = any>(op: string, body?: any): Promise<T> {
  const url = `/api/stayora?op=${encodeURIComponent(op)}`
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : '{}',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as any)?.error || `API error ${res.status}`)
  return data as T
}

export const fetchListings = (params?: Record<string, any>) => getJSON('listings', params)
export const fetchListing = (id: string) => getJSON('listing', { id })
export const searchListings = (params: Record<string, any>) => getJSON('search', params)
export const fetchAvailability = (listingId: string) => getJSON('availability', { listingId })
export const fetchDestinations = () => getJSON('destinations')
export const fetchReviews = (listingId: string) => getJSON('reviews', { listingId })
export const fetchExperiences = () => getJSON('experiences')
export const fetchServices = () => getJSON('services')
export const fetchBookings = (role: 'guest' | 'host' = 'guest') => getJSON('bookings', { role })
export const fetchAllBookings = () => getJSON('all-bookings')
export const fetchConversations = () => getJSON('conversations')
export const fetchMessages = (conversationId: string) => getJSON('messages', { conversationId })
export const fetchWishlists = () => getJSON('wishlists')
export const fetchNotifications = () => getJSON('notifications')
export const fetchHostDashboard = () => getJSON('host-dashboard')
export const fetchAdminDashboard = () => getJSON('admin-dashboard')
export const fetchUsers = () => getJSON('users')
export const validateCoupon = (code: string, subtotal: number) => getJSON('coupon', { code, subtotal: String(subtotal) })

export const register = (data: { email: string; password: string; name: string; role?: 'GUEST' | 'HOST' }) =>
  postJSON('register', data)
export const login = (email: string, password: string) => postJSON('login', { email, password })
export const logout = () => postJSON('logout')

export const createBooking = (data: {
  listingId: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  infants: number
  pets: number
  couponCode?: string
}) => postJSON('create-booking', data)

export const cancelBooking = (bookingId: string, reason?: string) =>
  postJSON('cancel-booking', { bookingId, reason })

export const addWishlist = (listingId: string, wishlistId?: string, name?: string) =>
  postJSON('add-wishlist', { listingId, wishlistId, name })

export const removeWishlist = (listingId: string, wishlistId: string) =>
  postJSON('remove-wishlist', { listingId, wishlistId })

export const sendMessage = (data: { conversationId?: string; recipientId?: string; body: string; bookingId?: string }) =>
  postJSON('send-message', data)

export const markRead = (conversationId: string) => postJSON('mark-read', { conversationId })

export const createReview = (data: {
  bookingId: string
  rating: number
  body?: string
  subratings?: { accuracy?: number; cleanliness?: number; communication?: number; location?: number; checkIn?: number; value?: number }
}) => postJSON('create-review', data)

export const markNotificationRead = (notificationId?: string, all?: boolean) =>
  postJSON('mark-notification-read', { notificationId, all })

export const createListing = (data: any) => postJSON('create-listing', data)
export const updateListingStatus = (listingId: string, status: string) =>
  postJSON('update-listing-status', { listingId, status })

export const adminUserAction = (userId: string, action: 'SUSPEND' | 'REACTIVATE' | 'VERIFY' | 'DELETE') =>
  postJSON('admin-user-action', { userId, action })

export const adminListingAction = (listingId: string, action: 'APPROVE' | 'REJECT' | 'RESTRICT' | 'REMOVE') =>
  postJSON('admin-listing-action', { listingId, action })

export const adminRefund = (bookingId: string, amount?: number) =>
  postJSON('admin-refund', { bookingId, amount })

export const createSupportTicket = (data: { subject: string; category?: string; description?: string; priority?: string; bookingId?: string }) =>
  postJSON('support-ticket', data)

// AI Travel Assistant
export const askTravelAssistant = (query: string, userPrefs?: any) =>
  postJSON<{ greeting: string; summary: string; recommendations: any[]; tips: string[]; followups: string[] }>('ai-travel-assistant', { query, userPrefs })

// Payment Gateway proxy (through the main API, which forwards to port 3004)
export const createPaymentIntent = (data: { amount: number; currency?: string; bookingId?: string; listingId?: string; userId?: string }) =>
  postJSON<{ intent: any }>('create-payment-intent', data)

// Confirm a payment intent (calls gateway directly via XTransformPort=3004)
export async function confirmPaymentIntent(intentId: string, paymentMethodId: string): Promise<any> {
  const r = await fetch(`/payment-intents/${intentId}/confirm?XTransformPort=3004`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_method: paymentMethodId }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((data as any)?.error || `Gateway error ${r.status}`)
  return data
}

// Authenticate a 3DS challenge
export async function authenticate3DS(intentId: string): Promise<any> {
  const r = await fetch(`/payment-intents/${intentId}/authenticate?XTransformPort=3004`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((data as any)?.error || `Gateway error ${r.status}`)
  return data
}

// Create a payment method (tokenize a card) — calls gateway directly via XTransformPort=3004
export async function createPaymentMethod(card: { number: string; exp_month: number; exp_year: number; cvc: string }, billing_details?: any): Promise<any> {
  const r = await fetch(`/payment-methods?XTransformPort=3004`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ card, billing_details }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((data as any)?.error || `Gateway error ${r.status}`)
  return data
}

// Map markers
export const fetchMapMarkers = (destination?: string) => getJSON('map-markers', { destination })

// Recently viewed
export const fetchRecentlyViewed = (ids: string[]) => getJSON('recently-viewed', { ids: ids.join(',') })

// Destination landing page
export const fetchDestination = (city: string) => getJSON('destination', { city })

// Share wishlist
export const shareWishlist = (wishlistId: string, recipientEmails?: string[]) =>
  postJSON('share-wishlist', { wishlistId, recipientEmails })
