# Stayora — Complete Airbnb-Style Marketplace Platform

A production-ready marketplace for unique stays, hosted experiences, and trusted local services. Built with Next.js 16, TypeScript, Tailwind CSS, Prisma, and Socket.io.

## Features

### Public Site
- **Homepage** with hero search, category quick-filters, trending destinations, featured stays, recently added, recently viewed, AI assistant CTA, trust section
- **Search & Discovery** with live-filtering results, advanced filters (price, bedrooms, bathrooms, amenities, Instant Book, rating), 6 sort options, map view with OpenStreetMap, "Search as I move" toggle, "Save search" button
- **Property Detail** with 5-image photo gallery, fullscreen lightbox (keyboard nav + thumbnail strip), host card with profile link, amenities grid, 2-month availability calendar, price breakdown, reviews with sub-ratings, OpenStreetMap neighborhood map, house rules, sticky booking widget
- **Experiences** marketplace — category-filtered guided activities with sessions
- **Services** marketplace — cleaning, maintenance, photography, concierge, transport
- **Destination Landing Pages** — per-city SEO content with hero, map, top-rated listings, category browse
- **AI Travel Assistant** — natural-language trip planning using z-ai-web-dev-sdk LLM, returns 3 real listing recommendations with reasoning + followup questions
- **Host Profile Pages** — publicly viewable host bio, listings grid, reviews with host replies, response metrics

### Guest Dashboard (9 tabs)
- Overview, My Trips (upcoming/past/cancelled with cancel flow), Wishlists (multi-list), Messages (real-time Socket.io chat), Reviews (write reviews with 6 sub-ratings), Payments (transaction history), Notifications (mark-all-read), Profile (avatar upload + real save), Support (ticket creation + help topics)

### Host Dashboard (10 tabs)
- Overview (8 KPI cards + quick actions), Listings (publish/pause/duplicate), Calendar (per-listing availability), Reservations (accept/decline pending), Inbox (real-time messaging), Earnings (summary + payouts table), Analytics (metric cards + bar charts), Reviews (respond to guest reviews), Co-hosts (invite + permissions), Create Listing (10-step wizard with real image upload + auto-save draft + validation)

### Admin Panel (8 tabs)
- Dashboard (15 KPI cards + 30-day bar chart), Users (search/filter/verify/suspend/delete), Listings (approve/reject/restrict/remove), Bookings (search/filter/refund), Finance (payments + payouts tabs), Support (ticket triage), Content (amenities + destinations + wizard steps + categories + coupons + email templates — all DB-driven CRUD), Audit (action log with filters)

### Infrastructure
- **Real-time messaging** via Socket.io mini-service (port 3003) — presence, typing, message persistence, notification delivery
- **Payment gateway** mini-service (port 3004) — Stripe-style API with PaymentIntents, card tokenization, 3DS simulation, webhook delivery
- **OpenStreetMap** integration via Leaflet — marker clustering, rich popups with thumbnails, "Search as I move" with bounding-box filtering
- **Image upload** — multipart `/api/upload` route, drag-drop ImageUploader component, cover selection, drag-reorder
- **AI travel assistant** — server-side z-ai-web-dev-sdk with listing context injection
- **Content management** — amenities, destinations, wizard steps, property categories all DB-driven with admin CRUD and live cache invalidation

## Tech Stack

| Component | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | Prisma ORM + SQLite |
| State | Zustand (persisted) |
| Real-time | Socket.io |
| Maps | Leaflet + OpenStreetMap |
| AI | z-ai-web-dev-sdk |
| Auth | bcryptjs + httpOnly session cookies |
| Icons | Lucide |

## Design System

Stayora brand: navy blue (#1a2c4f), white, peach (#f8d7c2), orange (#ff6b35). Left sidebar navigation, clean typography, rounded cards, soft shadows.

## Getting Started

```bash
# Install dependencies
bun install

# Set up the database
bun run db:push

# Seed demo data
bun run scripts/seed.ts          # users, listings, bookings, reviews
bun run scripts/seed-content.ts   # amenities, destinations, wizard steps, categories
bun run scripts/seed-email-templates.ts  # email templates

# Start the dev server
bun run dev

# Start mini-services (in separate terminals)
cd mini-services/messaging-service && bun run dev   # port 3003
cd mini-services/payment-gateway && bun run dev      # port 3004
```

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Guest | guest1@stayora.com | stayora123 |
| Host | host1@stayora.com | stayora123 |
| Admin | admin@stayora.com | stayora123 |

## Test Payment Cards

| Card Number | Behavior |
|---|---|
| 4242 4242 4242 4242 | Succeeds immediately |
| 4000 0027 6000 3184 | Requires 3DS authentication |
| 4000 0000 0000 0002 | Declined |

## Project Structure

```
stayora/
├── prisma/schema.prisma          # 30+ models
├── scripts/
│   ├── seed.ts                   # marketplace data
│   ├── seed-content.ts           # amenities, destinations, etc.
│   └── seed-email-templates.ts   # email templates
├── mini-services/
│   ├── messaging-service/        # Socket.io (port 3003)
│   └── payment-gateway/          # Stripe-style API (port 3004)
├── src/
│   ├── app/
│   │   ├── page.tsx              # view switcher
│   │   ├── layout.tsx            # root layout
│   │   ├── globals.css           # Stayora design tokens
│   │   └── api/
│   │       ├── stayora/route.ts  # main API (40+ endpoints)
│   │       └── upload/route.ts   # image upload
│   ├── components/stayora/
│   │   ├── shared/               # shell, auth-modal, booking-modal, payment-modal,
│   │   │                         # image-uploader, open-street-map, property-card,
│   │   │                         # realtime-provider, toast
│   │   ├── public/               # home, search, property-detail, experiences,
│   │   │                         # services, destination, ai-assistant, host-profile
│   │   ├── guest/dashboard.tsx   # 9-tab guest dashboard
│   │   ├── host/dashboard.tsx    # 10-tab host dashboard
│   │   ├── host/create-listing-wizard.tsx  # 10-step wizard
│   │   └── admin/                # panel.tsx (8 tabs) + content-tab.tsx (6 sub-tabs)
│   ├── store/useAppStore.ts      # Zustand store
│   ├── hooks/                    # use-content, use-realtime-messaging, use-mobile
│   ├── lib/                      # api, db, format, types, icon-resolver
│   └── components/ui/            # shadcn/ui components
└── public/uploads/               # uploaded images (gitignored)
```

## License

This is a demo project. All rights reserved.
