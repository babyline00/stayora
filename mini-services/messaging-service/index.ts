// Stayora Messaging Service — real-time chat on port 3003
// Connect from frontend with: io("/?XTransformPort=3003")
import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// In-memory presence tracker
const onlineUsers = new Map<string, Set<string>>() // userId -> Set<socketId>

interface AuthPayload {
  userId: string
  name: string
}

function verifyAuth(payload: AuthPayload | string): AuthPayload | null {
  // In production this would verify a JWT or session token
  // For demo we accept any userId + name combo
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload) as AuthPayload } catch { return null }
  }
  if (!payload?.userId || !payload?.name) return null
  return payload
}

async function persistMessage(data: {
  conversationId: string
  senderId: string
  body: string
  bookingId?: string
}) {
  const message = await db.message.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      bookingId: data.bookingId || null,
      body: data.body,
      isRead: false,
      sentAt: new Date(),
    },
    include: { sender: true },
  })
  await db.conversation.update({
    where: { id: data.conversationId },
    data: { lastMessageAt: new Date() },
  })
  // Notify recipient via DB notification (also delivered via socket)
  const conv = await db.conversation.findUnique({
    where: { id: data.conversationId },
  })
  if (conv) {
    const recipientId = conv.userAId === data.senderId ? conv.userBId : conv.userAId
    await db.notification.create({
      data: {
        userId: recipientId,
        type: 'MESSAGE_RECEIVED',
        title: `New message`,
        body: data.body.slice(0, 80),
        link: '/guest?tab=messages',
      },
    })
    // Push the notification live
    const recipientSockets = onlineUsers.get(recipientId)
    if (recipientSockets) {
      for (const sid of recipientSockets) {
        io.to(sid).emit('notification', {
          type: 'MESSAGE_RECEIVED',
          title: 'New message',
          body: data.body.slice(0, 80),
        })
      }
    }
  }
  return message
}

io.use(async (socket, next) => {
  // Handshake auth
  const auth = verifyAuth(socket.handshake.auth as any)
  if (!auth) return next(new Error('unauthorized'))
  ;(socket as any).auth = auth
  next()
})

io.on('connection', (socket) => {
  const auth = (socket as any).auth as AuthPayload
  const { userId, name } = auth

  // Track presence
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set())
  onlineUsers.get(userId)!.add(socket.id)
  console.log(`[messaging] ${name} (${userId}) connected; sockets=${onlineUsers.get(userId)!.size}`)

  // Broadcast presence: this user is now online
  io.emit('presence:online', { userId })

  // Send current online user list
  socket.emit('presence:list', { userIds: Array.from(onlineUsers.keys()) })

  // Join this user's personal room (so other services can target them)
  socket.join(`user:${userId}`)

  // Join conversation rooms (so messages in a conversation are broadcast)
  socket.on('conversation:join', ({ conversationId }: { conversationId: string }) => {
    socket.join(`conversation:${conversationId}`)
    socket.data.conversationId = conversationId
    // Mark messages from the other party as read
    db.message.updateMany({
      where: { conversationId, senderId: { not: userId }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    }).then(() => {
      io.to(`conversation:${conversationId}`).emit('conversation:read', { conversationId, userId })
    }).catch(() => {})
  })

  socket.on('conversation:leave', ({ conversationId }: { conversationId: string }) => {
    socket.leave(`conversation:${conversationId}`)
    socket.data.conversationId = null
  })

  // Send a message
  socket.on('message:send', async (payload: {
    conversationId?: string
    recipientId?: string
    body: string
    bookingId?: string
  }, ack?: (r: any) => void) => {
    if (!payload?.body || typeof payload.body !== 'string') {
      if (ack) ack({ error: 'invalid body' })
      return
    }
    let conversationId = payload.conversationId
    try {
      // Find or create conversation
      if (!conversationId && payload.recipientId) {
        const existing = await db.conversation.findFirst({
          where: {
            OR: [
              { userAId: userId, userBId: payload.recipientId },
              { userAId: payload.recipientId, userBId: userId },
            ],
          },
        })
        if (existing) conversationId = existing.id
        else {
          const conv = await db.conversation.create({
            data: { userAId: userId, userBId: payload.recipientId, bookingId: payload.bookingId || null },
          })
          conversationId = conv.id
        }
      }
      if (!conversationId) {
        if (ack) ack({ error: 'conversation required' })
        return
      }
      const message = await persistMessage({
        conversationId,
        senderId: userId,
        body: payload.body,
        bookingId: payload.bookingId,
      })
      // Join this socket to the conversation room so future broadcasts reach it
      socket.join(`conversation:${conversationId}`)
      // Broadcast to the conversation room (both participants)
      io.to(`conversation:${conversationId}`).emit('message:new', message)
      // Also push to recipient's personal room in case they're not in the conversation room
      const conv = await db.conversation.findUnique({ where: { id: conversationId } })
      if (conv) {
        const recipientId = conv.userAId === userId ? conv.userBId : conv.userAId
        io.to(`user:${recipientId}`).emit('message:new', message)
      }
      if (ack) ack({ ok: true, message, conversationId })
    } catch (e: any) {
      console.error('[messaging] message:send error', e)
      if (ack) ack({ error: e.message || 'server error' })
    }
  })

  // Typing indicator
  socket.on('typing:start', ({ conversationId }: { conversationId: string }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:start', { userId, name })
  })
  socket.on('typing:stop', ({ conversationId }: { conversationId: string }) => {
    socket.to(`conversation:${conversationId}`).emit('typing:stop', { userId })
  })

  // Mark read
  socket.on('message:read', async ({ conversationId }: { conversationId: string }) => {
    await db.message.updateMany({
      where: { conversationId, senderId: { not: userId }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
    io.to(`conversation:${conversationId}`).emit('conversation:read', { conversationId, userId })
  })

  socket.on('disconnect', () => {
    const set = onlineUsers.get(userId)
    if (set) {
      set.delete(socket.id)
      if (set.size === 0) {
        onlineUsers.delete(userId)
        io.emit('presence:offline', { userId })
      }
    }
    console.log(`[messaging] ${name} (${userId}) disconnected`)
  })

  socket.on('error', (err: any) => {
    console.error(`[messaging] socket error ${socket.id}:`, err)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[messaging] Stayora messaging service running on port ${PORT}`)
})

process.on('SIGTERM', () => httpServer.close(() => process.exit(0)))
process.on('SIGINT', () => httpServer.close(() => process.exit(0)))
