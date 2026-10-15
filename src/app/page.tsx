'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Shell } from '@/components/stayora/shared/shell'
import { HomeView } from '@/components/stayora/public/home'
import { SearchView } from '@/components/stayora/public/search'
import { PropertyDetail } from '@/components/stayora/public/property-detail'
import { ExperiencesView } from '@/components/stayora/public/experiences'
import { ServicesView } from '@/components/stayora/public/services'
import { DestinationView } from '@/components/stayora/public/destination'
import { AiAssistantView } from '@/components/stayora/public/ai-assistant'
import { HostProfileView } from '@/components/stayora/public/host-profile'
import { GuestDashboard } from '@/components/stayora/guest/dashboard'
import { HostDashboard } from '@/components/stayora/host/dashboard'
import { AdminPanel } from '@/components/stayora/admin/panel'
import { AuthModal } from '@/components/stayora/shared/auth-modal'
import { BookingModal } from '@/components/stayora/shared/booking-modal'
import { NewPaymentModal } from '@/components/stayora/shared/payment-modal'
import { Toast } from '@/components/stayora/shared/toast'
import { CreateListingWizard } from '@/components/stayora/host/create-listing-wizard'
import { RealtimeProvider } from '@/components/stayora/shared/realtime-provider'

export default function Page() {
  const { view, user, setUser, showAuthModal, bookingModalOpen, paymentModalOpen, paymentData, selectedListingId, addRecentlyViewed } = useAppStore()

  // Hydrate session on mount
  useEffect(() => {
    fetch('/api/stayora?op=me', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data?.user) setUser(data.user)
      })
      .catch(() => {})
  }, [setUser])

  // Track recently viewed when a property is opened
  useEffect(() => {
    if (view === 'property' && selectedListingId) {
      addRecentlyViewed(selectedListingId)
    }
  }, [view, selectedListingId, addRecentlyViewed])

  return (
    <RealtimeProvider>
      <Shell>
        {view === 'home' && <HomeView />}
        {view === 'search' && <SearchView />}
        {view === 'property' && <PropertyDetail />}
        {view === 'experiences' && <ExperiencesView />}
        {view === 'services' && <ServicesView />}
        {view === 'destination' && <DestinationView />}
        {view === 'ai-assistant' && <AiAssistantView />}
        {view === 'host-profile' && <HostProfileView />}
        {view === 'guest' && (user ? <GuestDashboard /> : <AuthRequired />)}
        {view === 'host' && (user ? <HostDashboard /> : <AuthRequired />)}
        {view === 'admin' && (user?.role === 'ADMIN' ? <AdminPanel /> : <AuthRequired admin />)}
        {view === 'create-listing' && (user ? <CreateListingWizard /> : <AuthRequired />)}

        {showAuthModal && <AuthModal />}
        {bookingModalOpen && <BookingModal />}
        {paymentModalOpen && paymentData && (
          <NewPaymentModal
            open={paymentModalOpen}
            onClose={() => useAppStore.getState().closePayment()}
            amount={paymentData.amount}
            currency={paymentData.currency}
            bookingId={paymentData.bookingId}
            listingId={paymentData.listingId}
            metadata={paymentData.metadata}
          />
        )}
        <Toast />
      </Shell>
    </RealtimeProvider>
  )
}

function AuthRequired({ admin }: { admin?: boolean }) {
  const openAuth = useAppStore(s => s.openAuth)
  useEffect(() => {
    Promise.resolve().then(() => openAuth('login'))
  }, [openAuth])
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="text-4xl">🔒</div>
      <h2 className="text-2xl font-bold text-navy">{admin ? 'Admin access required' : 'Please sign in to continue'}</h2>
      <p className="text-muted-foreground max-w-md">
        {admin
          ? 'You need an administrator account to access this section.'
          : 'Sign in or create an account to view your trips, wishlist, and host dashboard.'}
      </p>
      <button
        onClick={() => openAuth('login')}
        className="rounded-full bg-orange px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-orange/90"
      >
        Sign in
      </button>
    </div>
  )
}
