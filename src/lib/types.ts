// Lightweight types for Stayora entities

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  role: 'GUEST' | 'HOST' | 'ADMIN'
  bio?: string | null
  country?: string | null
  isVerified: boolean
  isSuperhost: boolean
  responseRate: number
  responseTimeMins: number
  listings?: Listing[]
}

export interface ListingPhoto {
  id: string
  url: string
  caption?: string | null
  position: number
  isCover: boolean
}

export interface Listing {
  id: string
  hostId: string
  title: string
  slug: string
  description: string
  category: string
  roomType: string
  status: string
  country: string
  city: string
  neighborhood?: string | null
  lat?: number | null
  lng?: number | null
  maxGuests: number
  bedrooms: number
  beds: number
  bathrooms: number
  basePrice: number
  weekendPrice?: number | null
  currency: string
  cleaningFee: number
  extraGuestFee: number
  weeklyDiscountPct: number
  monthlyDiscountPct: number
  minNights: number
  maxNights: number
  checkInTime: string
  checkOutTime: string
  instantBook: boolean
  cancellationPolicy: string
  allowsPets: boolean
  allowsSmoking: boolean
  allowsParties: boolean
  amenities: string
  coverImage?: string | null
  rating: number
  reviewCount: number
  views: number
  wishlistSaves: number
  createdAt: string
  updatedAt: string
  photos?: ListingPhoto[]
  host?: User
  isSuperhost?: boolean
}

export interface Review {
  id: string
  authorId: string
  listingId?: string | null
  bookingId?: string | null
  rating: number
  body?: string | null
  createdAt: string
  author?: User
}

export interface Booking {
  id: string
  reference: string
  listingId: string
  guestId: string
  hostId: string
  status: string
  checkIn: string
  checkOut: string
  nights: number
  adults: number
  children: number
  infants: number
  pets: number
  nightlySubtotal: number
  cleaningFee: number
  serviceFee: number
  taxes: number
  discounts: number
  totalAmount: number
  hostPayout: number
  platformFee: number
  currency: string
  confirmedAt?: string | null
  cancelledAt?: string | null
  completedAt?: string | null
  cancellationReason?: string | null
  createdAt: string
  listing?: Listing
  guest?: User
  host?: User
  paymentAttempts?: PaymentAttempt[]
  payout?: Payout | null
  reviews?: Review[]
}

export interface PaymentAttempt {
  id: string
  bookingId: string
  provider: string
  providerRef?: string | null
  amount: number
  currency: string
  status: string
  intent: string
  createdAt: string
}

export interface Payout {
  id: string
  hostId: string
  bookingId: string
  amount: number
  currency: string
  status: string
  provider: string
  providerRef?: string | null
  scheduledAt?: string | null
  completedAt?: string | null
  createdAt: string
}

export interface Conversation {
  id: string
  userAId: string
  userBId: string
  bookingId?: string | null
  lastMessageAt?: string | null
  userA: User
  userB: User
  messages?: Message[]
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  bookingId?: string | null
  body: string
  isRead: boolean
  sentAt: string
  readAt?: string | null
  sender?: User
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body?: string | null
  link?: string | null
  isRead: boolean
  createdAt: string
}

export interface Wishlist {
  id: string
  userId: string
  name: string
  description?: string | null
  isPrivate: boolean
  createdAt: string
  listings: Listing[]
}

export interface SupportTicket {
  id: string
  requesterId: string
  assigneeId?: string | null
  subject: string
  category: string
  priority: string
  status: string
  description?: string | null
  createdAt: string
  requester?: User
  assignee?: User | null
  booking?: Booking | null
}

export interface Experience {
  id: string
  hostId: string
  title: string
  description: string
  category: string
  destination: string
  meetingPoint?: string | null
  durationMinutes: number
  capacity: number
  pricePerPerson: number
  currency: string
  coverImage?: string | null
  rating: number
  reviewCount: number
  host?: User
  sessions?: ExperienceSession[]
}

export interface ExperienceSession {
  id: string
  experienceId: string
  startsAt: string
  endsAt: string
  capacity: number
  bookedCount: number
  status: string
}

export interface Service {
  id: string
  providerId: string
  category: string
  title: string
  description: string
  basePrice: number
  currency: string
  serviceArea?: string | null
  duration: number
  coverImage?: string | null
  rating: number
  reviewCount: number
  status: string
  provider?: User
  slots?: ServiceSlot[]
}

export interface ServiceSlot {
  id: string
  serviceId: string
  startsAt: string
  endsAt: string
  status: string
}
