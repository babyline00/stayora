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
