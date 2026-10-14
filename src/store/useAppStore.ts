'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewName =
  | 'home'
  | 'search'
  | 'property'
  | 'experiences'
  | 'services'
  | 'guest'
  | 'host'
  | 'admin'
  | 'create-listing'

export type GuestTab = 'overview' | 'trips' | 'wishlists' | 'messages' | 'reviews' | 'payments' | 'notifications' | 'profile' | 'support'
export type HostTab = 'overview' | 'listings' | 'calendar' | 'reservations' | 'inbox' | 'earnings' | 'analytics' | 'reviews' | 'cohosts' | 'create'
export type AdminTab = 'dashboard' | 'users' | 'listings' | 'bookings' | 'finance' | 'support' | 'audit'

export interface AppUser {
  id: string
  email: string
  name: string
  avatarUrl?: string
  role: 'GUEST' | 'HOST' | 'ADMIN'
  bio?: string
  country?: string
  isVerified: boolean
  isSuperhost: boolean
  responseRate: number
  responseTimeMins: number
}

export interface SearchFilters {
  destination: string
  checkIn?: string
  checkOut?: string
  adults: number
  children: number
  infants: number
  pets: number
  category?: string
  minPrice?: number
  maxPrice?: number
  minBedrooms?: number
  minBathrooms?: number
  amenities: string[]
  instantBookOnly: boolean
  minRating?: number
  sortBy: 'recommended' | 'price_asc' | 'price_desc' | 'rating' | 'reviews' | 'recent'
}

interface AppState {
  // Navigation
  view: ViewName
  guestTab: GuestTab
  hostTab: HostTab
  adminTab: AdminTab
  selectedListingId: string | null
  selectedBookingId: string | null
  selectedConversationId: string | null
  selectedExperienceId: string | null
  selectedServiceId: string | null
  selectedUserId: string | null

  // Auth
  user: AppUser | null
  showAuthModal: boolean
  authMode: 'login' | 'register'

  // Search
  filters: SearchFilters

  // Booking
  bookingModalOpen: boolean
  bookingListingId: string | null
  bookingDates: { checkIn?: string; checkOut?: string }
  bookingGuests: { adults: number; children: number; infants: number; pets: number }

  // UI
  sidebarOpen: boolean
  toast: { id: string; title: string; description?: string; variant?: 'default' | 'success' | 'error' } | null

  // Actions
  setView: (view: ViewName) => void
  setGuestTab: (tab: GuestTab) => void
  setHostTab: (tab: HostTab) => void
  setAdminTab: (tab: AdminTab) => void
  selectListing: (id: string | null) => void
  selectBooking: (id: string | null) => void
  selectConversation: (id: string | null) => void
  selectExperience: (id: string | null) => void
  selectService: (id: string | null) => void
  selectUser: (id: string | null) => void

  setUser: (user: AppUser | null) => void
  openAuth: (mode?: 'login' | 'register') => void
  closeAuth: () => void

  setFilters: (f: Partial<SearchFilters>) => void
  resetFilters: () => void

  openBooking: (listingId: string, dates?: { checkIn?: string; checkOut?: string }, guests?: { adults: number; children: number; infants: number; pets: number }) => void
  closeBooking: () => void

  setSidebarOpen: (open: boolean) => void
  showToast: (title: string, description?: string, variant?: 'default' | 'success' | 'error') => void
  clearToast: () => void
}

const DEFAULT_FILTERS: SearchFilters = {
  destination: '',
  adults: 1,
  children: 0,
  infants: 0,
  pets: 0,
  amenities: [],
  instantBookOnly: false,
  sortBy: 'recommended',
}

let toastCounter = 0

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      view: 'home',
      guestTab: 'overview',
      hostTab: 'overview',
      adminTab: 'dashboard',
      selectedListingId: null,
      selectedBookingId: null,
      selectedConversationId: null,
      selectedExperienceId: null,
      selectedServiceId: null,
      selectedUserId: null,

      user: null,
      showAuthModal: false,
      authMode: 'login',

      filters: DEFAULT_FILTERS,

      bookingModalOpen: false,
      bookingListingId: null,
      bookingDates: {},
      bookingGuests: { adults: 1, children: 0, infants: 0, pets: 0 },

      sidebarOpen: true,
      toast: null,

      setView: (view) => set({ view }),
      setGuestTab: (guestTab) => set({ guestTab }),
      setHostTab: (hostTab) => set({ hostTab }),
      setAdminTab: (adminTab) => set({ adminTab }),
      selectListing: (selectedListingId) => set({ selectedListingId, view: 'property' }),
      selectBooking: (selectedBookingId) => set({ selectedBookingId }),
      selectConversation: (selectedConversationId) => set({ selectedConversationId }),
      selectExperience: (selectedExperienceId) => set({ selectedExperienceId, view: 'experiences' }),
      selectService: (selectedServiceId) => set({ selectedServiceId, view: 'services' }),
      selectUser: (selectedUserId) => set({ selectedUserId }),

      setUser: (user) => set({ user }),
      openAuth: (mode = 'login') => set({ showAuthModal: true, authMode: mode }),
      closeAuth: () => set({ showAuthModal: false }),

      setFilters: (f) => set((state) => ({ filters: { ...state.filters, ...f } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      openBooking: (listingId, dates, guests) =>
        set({
          bookingModalOpen: true,
          bookingListingId: listingId,
          bookingDates: dates ?? {},
          bookingGuests: guests ?? { adults: 1, children: 0, infants: 0, pets: 0 },
        }),
      closeBooking: () => set({ bookingModalOpen: false }),

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      showToast: (title, description, variant = 'default') => {
        const id = `toast-${++toastCounter}`
        set({ toast: { id, title, description, variant } })
        setTimeout(() => set({ toast: null }), 3500)
      },
      clearToast: () => set({ toast: null }),
    }),
    {
      name: 'stayora-store',
      // Don't persist sensitive or transient fields
      partialize: (state) => ({
        user: state.user,
        filters: state.filters,
        view: state.view,
      }),
    }
  )
)
