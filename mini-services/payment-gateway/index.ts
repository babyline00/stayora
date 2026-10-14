// Stayora Payment Gateway — Stripe-style mock on port 3004
// Implements PaymentIntents, card tokenization, 3DS simulation, and webhooks
// API is at /?XTransformPort=3004 (Caddy strips the query and forwards here)
//
// Endpoints (all JSON):
//   POST /payment-intents            — create a PaymentIntent
//   POST /payment-intents/:id/confirm — confirm with payment method
//   POST /payment-methods           — tokenize a card
//   POST /payment-intents/:id/cancel — cancel a PaymentIntent
//   POST /webhooks/test              — simulate a webhook event (for QA)
//   GET  /healthz
//
// Card numbers (test):
//   4242 4242 4242 4242 — succeeds immediately
//   4000 0027 6000 3184 — requires 3DS authentication
//   4000 0000 0000 0002 — card declined
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const PORT = 3004

// In-memory store of payment intents (real Stripe would persist server-side)
interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'succeeded' | 'canceled' | 'processing'
  clientSecret: string
  paymentMethodId?: string
  metadata: Record<string, any>
  nextAction?: { type: 'use_stripe_sdk' | 'redirect_to_url'; redirectUrl?: string; sdkData?: string }
  createdAt: string
}

interface PaymentMethod {
  id: string
  type: 'card'
  card: { brand: string; last4: string; expMonth: number; expYear: number; funding: 'credit' | 'debit' }
  billingDetails: { name?: string; email?: string; line1?: string; city?: string; country?: string; postalCode?: string }
  createdAt: string
}

const intents = new Map<string, PaymentIntent>()
const methods = new Map<string, PaymentMethod>()

function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36).slice(-4)}`
}

function detectBrand(num: string): string {
  if (num.startsWith('4')) return 'visa'
  if (num.startsWith('5')) return 'mastercard'
  if (num.startsWith('3')) return 'amex'
  if (num.startsWith('6')) return 'discover'
  return 'unknown'
}

function sendJson(res: ServerResponse, status: number, body: any) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' })
  res.end(JSON.stringify(body))
}

async function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let buf = ''
    req.on('data', (c) => (buf += c))
    req.on('end', () => {
      try { resolve(JSON.parse(buf || '{}')) } catch { resolve({}) }
    })
  })
}

// Simulate webhook delivery (calls back to the Next.js webhook endpoint)
async function deliverWebhook(event: { type: string; data: { object: any } }) {
  try {
    const payload = JSON.stringify(event)
    // In production Stripe would sign this; here we use a shared secret
    await fetch(`http://localhost:3000/api/stayora?op=payment-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Stayora-Signature': 'sha256=demo' },
      body: payload,
    })
    console.log(`[gateway] webhook delivered: ${event.type}`)
  } catch (e) {
    console.error('[gateway] webhook delivery failed', e)
  }
}

const server = createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    return res.end()
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`)
  const path = url.pathname
  const segments = path.split('/').filter(Boolean)

  try {
    // Health
    if (path === '/healthz' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, service: 'stayora-payment-gateway', port: PORT, intents: intents.size, methods: methods.size })
    }

    // Create PaymentMethod (tokenize card)
    if (path === '/payment-methods' && req.method === 'POST') {
      const body = await readBody(req)
      const num = (body.card?.number || '').replace(/\s+/g, '')
      if (!/^\d{15,16}$/.test(num)) return sendJson(res, 400, { error: 'Invalid card number' })
      if (!body.card?.exp_month || !body.card?.exp_year) return sendJson(res, 400, { error: 'Missing expiry' })
      if (!body.card?.cvc || !/^\d{3,4}$/.test(body.card.cvc)) return sendJson(res, 400, { error: 'Invalid CVC' })

      // Test card routing
      const pm: PaymentMethod = {
        id: genId('pm'),
        type: 'card',
        card: {
          brand: detectBrand(num),
          last4: num.slice(-4),
          expMonth: parseInt(body.card.exp_month),
          expYear: parseInt(body.card.exp_year),
          funding: num.startsWith('4') || num.startsWith('5') ? 'credit' : 'debit',
        },
        billingDetails: body.billing_details || {},
        createdAt: new Date().toISOString(),
      }
      methods.set(pm.id, pm)
      return sendJson(res, 201, pm)
    }

    // Create PaymentIntent
    if (path === '/payment-intents' && req.method === 'POST') {
      const body = await readBody(req)
      const amount = parseInt(body.amount)
      if (!Number.isFinite(amount) || amount <= 0) return sendJson(res, 400, { error: 'Invalid amount' })
      const intent: PaymentIntent = {
        id: genId('pi'),
        amount,
        currency: (body.currency || 'usd').toLowerCase(),
        status: 'requires_payment_method',
        clientSecret: `${genId('cs')}_secret_${Math.random().toString(36).slice(2, 10)}`,
        metadata: body.metadata || {},
        createdAt: new Date().toISOString(),
      }
      intents.set(intent.id, intent)
      return sendJson(res, 201, intent)
    }

    // Confirm PaymentIntent
    if (segments.length === 3 && segments[0] === 'payment-intents' && segments[2] === 'confirm' && req.method === 'POST') {
      const id = segments[1]
      const intent = intents.get(id)
      if (!intent) return sendJson(res, 404, { error: 'PaymentIntent not found' })
      if (intent.status !== 'requires_payment_method' && intent.status !== 'requires_confirmation') {
        return sendJson(res, 400, { error: `Cannot confirm intent in status ${intent.status}` })
      }
      const body = await readBody(req)
      const pmId = body.payment_method
      const pm = methods.get(pmId)
      if (!pm) return sendJson(res, 400, { error: 'Invalid payment method' })
      intent.paymentMethodId = pmId

      // Route based on test card
      const last4 = pm.card.last4
      if (last4 === '0002') {
        // Declined
        intent.status = 'requires_payment_method'
        return sendJson(res, 402, { error: 'card_declined', message: 'Your card was declined.', payment_intent: intent })
      }
      if (last4 === '3184') {
        // Requires 3DS
        intent.status = 'requires_action'
        intent.nextAction = {
          type: 'use_stripe_sdk',
          sdkData: `stripe-3ds:${intent.id}:${Date.now()}`,
        }
        return sendJson(res, 200, intent)
      }
      // Default: succeed with a short delay (simulate network)
      intent.status = 'processing'
      setTimeout(async () => {
        intent.status = 'succeeded'
        await deliverWebhook({
          type: 'payment_intent.succeeded',
          data: { object: { id: intent.id, amount: intent.amount, currency: intent.currency, metadata: intent.metadata } },
        })
      }, 1200)
      return sendJson(res, 200, intent)
    }

    // 3DS Authenticate (frontend calls this to "complete" 3DS)
    if (segments.length === 3 && segments[0] === 'payment-intents' && segments[2] === 'authenticate' && req.method === 'POST') {
      const id = segments[1]
      const intent = intents.get(id)
      if (!intent) return sendJson(res, 404, { error: 'PaymentIntent not found' })
      if (intent.status !== 'requires_action') return sendJson(res, 400, { error: 'No action required' })
      intent.status = 'processing'
      delete intent.nextAction
      setTimeout(async () => {
        intent.status = 'succeeded'
        await deliverWebhook({
          type: 'payment_intent.succeeded',
          data: { object: { id: intent.id, amount: intent.amount, currency: intent.currency, metadata: intent.metadata } },
        })
      }, 800)
      return sendJson(res, 200, intent)
    }

    // Cancel a PaymentIntent
    if (segments.length === 3 && segments[0] === 'payment-intents' && segments[2] === 'cancel' && req.method === 'POST') {
      const id = segments[1]
      const intent = intents.get(id)
      if (!intent) return sendJson(res, 404, { error: 'PaymentIntent not found' })
      intent.status = 'canceled'
      return sendJson(res, 200, intent)
    }

    // Retrieve a PaymentIntent
    if (segments.length === 2 && segments[0] === 'payment-intents' && req.method === 'GET') {
      const id = segments[1]
      const intent = intents.get(id)
      if (!intent) return sendJson(res, 404, { error: 'PaymentIntent not found' })
      return sendJson(res, 200, intent)
    }

    // Test webhook trigger (for QA)
    if (path === '/webhooks/test' && req.method === 'POST') {
      const body = await readBody(req)
      await deliverWebhook({
        type: body.type || 'payment_intent.succeeded',
        data: { object: body.object || { id: 'pi_test', amount: 10000, currency: 'usd' } },
      })
      return sendJson(res, 200, { delivered: true })
    }

    return sendJson(res, 404, { error: 'Not found', path })
  } catch (err: any) {
    console.error('[gateway] error', err)
    return sendJson(res, 500, { error: err.message || 'server error' })
  }
})

server.listen(PORT, () => {
  console.log(`[gateway] Stayora payment gateway running on port ${PORT}`)
  console.log(`[gateway] Test cards: 4242...4242 (success), 4000...3184 (3DS), 4000...0002 (decline)`)
})

process.on('SIGTERM', () => server.close(() => process.exit(0)))
process.on('SIGINT', () => server.close(() => process.exit(0)))
