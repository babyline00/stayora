'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppStore } from '@/store/useAppStore'

interface RealtimeMessage {
  id: string
  conversationId: string
  senderId: string
  body: string
  sentAt: string
  isRead: boolean
  sender?: any
}

interface RealtimeNotification {
  type: string
  title: string
  body?: string
}

interface PresenceInfo {
  userId: string
  online: boolean
}

interface UseRealtimeOptions {
  onMessage?: (message: RealtimeMessage) => void
  onNotification?: (notification: RealtimeNotification) => void
  onPresenceChange?: (info: PresenceInfo) => void
  onTyping?: (info: { conversationId: string; userId: string; name?: string; isTyping: boolean }) => void
  onRead?: (info: { conversationId: string; userId: string }) => void
}

/**
 * Hook for connecting to the Stayora real-time messaging service.
 * The service runs on port 3003. Caddy forwards via XTransformPort=3003.
 * Frontend must use io("/?XTransformPort=3003") — never direct localhost.
 */
export function useRealtimeMessaging(opts: UseRealtimeOptions = {}) {
  const { user } = useAppStore()
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const handlersRef = useRef(opts)
  useEffect(() => {
    handlersRef.current = opts
  })

  // Connect when user is available
  useEffect(() => {
    if (!user) return
    const socket = io('/?XTransformPort=3003', {
      auth: { userId: user.id, name: user.name },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', (err) => {
      console.warn('[realtime] connection error', err.message)
      setConnected(false)
    })

    socket.on('presence:online', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev)
        next.add(userId)
        return next
      })
      handlersRef.current.onPresenceChange?.({ userId, online: true })
    })

    socket.on('presence:offline', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
      handlersRef.current.onPresenceChange?.({ userId, online: false })
    })

    socket.on('presence:list', ({ userIds }: { userIds: string[] }) => {
      setOnlineUsers(new Set(userIds))
    })

    socket.on('message:new', (message: RealtimeMessage) => {
      handlersRef.current.onMessage?.(message)
    })

    socket.on('notification', (n: RealtimeNotification) => {
      handlersRef.current.onNotification?.(n)
    })

    socket.on('typing:start', (info: any) => {
      handlersRef.current.onTyping?.({ ...info, isTyping: true })
    })

    socket.on('typing:stop', (info: any) => {
      handlersRef.current.onTyping?.({ ...info, isTyping: false })
    })

    socket.on('conversation:read', (info: any) => {
      handlersRef.current.onRead?.(info)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [user?.id])

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('conversation:join', { conversationId })
  }, [])

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('conversation:leave', { conversationId })
  }, [])

  const sendMessage = useCallback(async (payload: {
    conversationId?: string
    recipientId?: string
    body: string
    bookingId?: string
  }): Promise<{ ok: boolean; message?: RealtimeMessage; conversationId?: string; error?: string }> => {
    return new Promise((resolve) => {
      const socket = socketRef.current
      if (!socket || !socket.connected) {
        resolve({ ok: false, error: 'not connected' })
        return
      }
      socket.emit('message:send', payload, (ack: any) => {
        if (ack?.error) resolve({ ok: false, error: ack.error })
        else resolve({ ok: true, message: ack.message, conversationId: ack.conversationId })
      })
    })
  }, [])

  const startTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing:start', { conversationId })
  }, [])

  const stopTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing:stop', { conversationId })
  }, [])

  const markRead = useCallback((conversationId: string) => {
    socketRef.current?.emit('message:read', { conversationId })
  }, [])

  return {
    connected,
    onlineUsers,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markRead,
  }
}
