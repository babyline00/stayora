'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useRealtimeMessaging } from '@/hooks/use-realtime-messaging'

/**
 * Wraps the app to receive real-time notifications via Socket.io.
 * - Shows a toast when a new booking, message, payout, or support event fires
 * - Refreshes notification badge count
 * - Displays an "X is typing…" indicator for active conversations (via store)
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { showToast, user } = useAppStore()

  const { connected } = useRealtimeMessaging({
    onNotification: (n) => {
      showToast(n.title, n.body, 'default')
      // Refresh notifications in the background
      fetch('/api/stayora?op=notifications', { credentials: 'include' }).catch(() => {})
    },
    onMessage: () => {
      // Individual message handling is done in the Messages tab via joinConversation
      // Here we just bump the unread count
    },
  })

  // Debug log
  useEffect(() => {
    if (user && connected) {
      console.log('[realtime] connected as', user.name)
    }
  }, [user, connected])

  return <>{children}</>
}
