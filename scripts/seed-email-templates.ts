// Seed default email templates
// Run: bun run scripts/seed-email-templates.ts
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const TEMPLATES = [
  {
    key: 'booking-confirmation',
    subject: 'Your booking at {{listingTitle}} is confirmed',
    body: `Hi {{guestName}},

Your reservation {{reference}} at {{listingTitle}} is confirmed!

Check-in: {{checkIn}} at {{checkInTime}}
Check-out: {{checkOut}} at {{checkOutTime}}
Guests: {{guests}}
Total paid: {{totalAmount}}

You can message your host directly from your Stayora dashboard. Have a great trip!

— The Stayora team`,
    variables: '["guestName","reference","listingTitle","checkIn","checkOut","checkInTime","checkOutTime","guests","totalAmount"]',
  },
  {
    key: 'booking-request-received',
    subject: 'New booking request for {{listingTitle}}',
    body: `Hi {{hostName}},

{{guestName}} has requested to book your property {{listingTitle}} from {{checkIn}} to {{checkOut}} for {{nights}} nights.

Total potential payout: {{hostPayout}}

Respond within 24 hours to keep your response rate high.

— The Stayora team`,
    variables: '["hostName","guestName","listingTitle","checkIn","checkOut","nights","hostPayout"]',
  },
  {
    key: 'message-received',
    subject: 'New message from {{senderName}}',
    body: `Hi {{recipientName}},

{{senderName}} sent you a new message on Stayora:

"{{messageBody}}"

Reply from your dashboard to keep the conversation going.

— The Stayora team`,
    variables: '["recipientName","senderName","messageBody"]',
  },
  {
    key: 'review-reminder',
    subject: 'How was your stay at {{listingTitle}}?',
    body: `Hi {{guestName}},

Your trip to {{listingTitle}} has ended. We'd love to hear about your experience!

Leave a review in just 2 minutes from your Stayora dashboard.

— The Stayora team`,
    variables: '["guestName","listingTitle"]',
  },
  {
    key: 'payout-processing',
    subject: 'Your payout of {{amount}} is processing',
    body: `Hi {{hostName}},

Your payout of {{amount}} for booking {{reference}} is now processing. It should arrive in your account within 1-3 business days.

— The Stayora team`,
    variables: '["hostName","amount","reference"]',
  },
  {
    key: 'welcome',
    subject: 'Welcome to Stayora, {{name}}!',
    body: `Hi {{name}},

Welcome to Stayora — your home for unique stays, hosted experiences, and trusted local services across 50+ destinations.

Here are a few things you can do to get started:
- Complete your profile
- Browse trending destinations
- Save properties to your wishlist
- Message hosts with questions

Happy travels!

— The Stayora team`,
    variables: '["name"]',
  },
  {
    key: 'password-reset',
    subject: 'Reset your Stayora password',
    body: `Hi {{name}},

We received a request to reset your Stayora password. Click the link below to choose a new password:

{{resetLink}}

If you didn't request this, you can safely ignore this email.

— The Stayora team`,
    variables: '["name","resetLink"]',
  },
]

async function seed() {
  console.log('🌱 Seeding email templates...')
  await db.emailTemplate.deleteMany()
  for (const t of TEMPLATES) {
    await db.emailTemplate.create({ data: t })
  }
  console.log(`✅ ${TEMPLATES.length} email templates seeded`)
}

seed().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
