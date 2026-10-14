// Stayora seed data — populates a realistic marketplace
// Run: bun run scripts/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

const AMENITIES = [
  'wifi', 'kitchen', 'pool', 'parking', 'ac', 'workspace', 'washer', 'dryer',
  'tv', 'heating', 'hot_tub', 'gym', 'fireplace', 'bbq', 'balcony', 'garden',
  'beach_access', 'ski_storage', 'ev_charger', 'security', 'first_aid', 'smoke_alarm',
]

const DESTINATIONS = [
  { city: 'Lisbon', country: 'Portugal', countryCode: 'PT', lat: 38.7223, lng: -9.1393, neighborhood: 'Alfama' },
  { city: 'Kyoto', country: 'Japan', countryCode: 'JP', lat: 35.0116, lng: 135.7681, neighborhood: 'Gion' },
  { city: 'Marrakech', country: 'Morocco', countryCode: 'MA', lat: 31.6295, lng: -7.9811, neighborhood: 'Medina' },
  { city: 'Mexico City', country: 'Mexico', countryCode: 'MX', lat: 19.4326, lng: -99.1332, neighborhood: 'Roma Norte' },
  { city: 'Cape Town', country: 'South Africa', countryCode: 'ZA', lat: -33.9249, lng: 18.4241, neighborhood: 'Camps Bay' },
  { city: 'Reykjavik', country: 'Iceland', countryCode: 'IS', lat: 64.1466, lng: -21.9426, neighborhood: 'Midtown' },
  { city: 'Bali', country: 'Indonesia', countryCode: 'ID', lat: -8.3405, lng: 115.0920, neighborhood: 'Ubud' },
  { city: 'Barcelona', country: 'Spain', countryCode: 'ES', lat: 41.3851, lng: 2.1734, neighborhood: 'Gràcia' },
  { city: 'Buenos Aires', country: 'Argentina', countryCode: 'AR', lat: -34.6037, lng: -58.3816, neighborhood: 'Palermo' },
  { city: 'Queenstown', country: 'New Zealand', countryCode: 'NZ', lat: -45.0312, lng: 168.6626, neighborhood: 'Lakeview' },
]

const CATEGORIES = ['VILLA', 'APARTMENT', 'CABIN', 'LOFT', 'TINYHOUSE', 'BOAT', 'ROOM']
const ROOM_TYPES = ['ENTIRE', 'PRIVATE', 'SHARED']

const FIRST_NAMES = ['Aiko', 'Mateo', 'Priya', 'Liam', 'Sofia', 'Kwame', 'Elena', 'Hiro', 'Amara', 'Diego', 'Yuki', 'Nadia', 'Tomas', 'Layla', 'Idris', 'Mei', 'Rafael', 'Anika', 'Omar', 'Esme']
const LAST_NAMES = ['Tanaka', 'Silva', 'Kapoor', 'Murphy', 'Rossi', 'Adeyemi', 'Costa', 'Sato', 'Okafor', 'Hernández', 'Nakamura', 'Petrova', 'Novak', 'Khouri', 'Bauer', 'Chen', 'Vargas', 'Sharma', 'Hassan', 'Lefevre']

const TITLES_BY_CATEGORY: Record<string, string[]> = {
  VILLA: ['Cliffside Infinity Villa', 'Tropical Garden Retreat', 'Mediterranean Stone Villa', 'Ocean-View Pool Villa', 'Hillside Modernist Villa'],
  APARTMENT: ['Sunlit Designer Loft', 'Chic City Studio', 'Heritage Flat with Balcony', 'Skyline Penthouse', 'Cozy Bohemian Apartment'],
  CABIN: ['Pinewood Forest Cabin', 'A-Frame Mountain Retreat', 'Lakeside Log Cabin', 'Snowy Slopes Chalet', 'Riverside Cabin Hideaway'],
  LOFT: ['Industrial Brick Loft', 'Artist Warehouse Loft', 'Downtown Open-Plan Loft', 'Converted Factory Loft', 'Glass-Walled Sky Loft'],
  TINYHOUSE: ['Tiny House on Wheels', 'Eco Tiny Cabin', 'Minimalist Micro Home', 'Off-Grid Tiny House', 'Garden Tiny House'],
  BOAT: ['Floating Houseboat', 'Sailboat Liveaboard', 'Canal Boat Stay', 'Harbor Yacht Stay', 'Riverside Houseboat'],
  ROOM: ['Sunny Private Room', 'Cozy Attic Room', 'Garden-Facing Room', 'City Center Room', 'Quiet Study Room'],
}

const DESCRIPTIONS = [
  'Wake up to panoramic views and slow mornings on the private terrace. This bright, airy space blends local craftsmanship with thoughtful modern design.',
  'A serene escape tucked into a vibrant neighborhood. Handpicked ceramics, soft linens, and a fully stocked kitchen make longer stays effortless.',
  'Designed by a local architect, this home honors its surroundings with native materials and floor-to-ceiling windows framing the landscape.',
  'Step straight from your door to the beach, trails, or cafés. Every detail — from rainfall shower to the record player — was chosen for comfort.',
  'A peaceful retreat perfect for remote work and slow evenings. High-speed Wi-Fi, dedicated workspace, and a kitchen made for cooking together.',
  'Quietly luxurious, this home balances clean minimalism with warm, tactile textures. Sleeps up to four guests in two well-appointed bedrooms.',
  'A heritage property carefully restored to preserve original features while adding modern comforts like radiant heating and a sleek chef\'s kitchen.',
  'Set within walking distance of the city\'s best markets and museums, this home is the ideal base for both exploration and restoration.',
]

const REVIEW_SNIPPETS = [
  'A flawless stay. The space was even more beautiful in person and the host thought of every detail.',
  'Perfect location, spotless home, and the welcome guide was incredibly helpful for our first time in the city.',
  'We loved every minute. Comfortable beds, great kitchen, and a balcony with the best view in town.',
  'Exactly as described. Smooth check-in, fast responses, and a neighborhood full of cafés and galleries.',
  'An unforgettable retreat. The design is impeccable and the host made us feel genuinely welcome.',
  'Ideal for a quiet remote-work week. The Wi-Fi was rock-solid and the workspace had natural light all day.',
  'Stylish, comfortable, and well-located. We walked everywhere and the host\'s local tips were spot on.',
  'A thoughtful, well-equipped home base for our family trip. Beds were incredibly comfortable.',
]

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomSubset<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

const PHOTO_URLS = [
  'https://images.unsplash.com/photo-1564013799929-1c0e9c74b3c6?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1568605114984-50efff9414d2?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-ee504a64c936?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c6b76f?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600596350398-26bf18a8d1b1?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be1a8c9d6e9b?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1583847268963-bb3aea6c4d6b?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1613977258134-b4f3d7f8c0d4?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600210492493-1cd5d6fa62fb?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505693416388-ac5dc06f3a9b?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505691938855-17547c102c17?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1484154262920-1a5a96e1ab0a?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502672023488-4eb53b3d6798?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1580587774836-e2fb97960e6a?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1576941085061-ff2a9d9d9b8c?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1599808613325-8e6076b7c8d2?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1605275118034-4eda3c4d6d8e?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1493809842344-471f1d6c5e25?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1524758632328-cf1b6c2e3a9f?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494522358652-f30e61a60313?w=1200&q=80&auto=format&fit=crop',
]

const AVATAR_URLS = Array.from({ length: 8 }, (_, i) => `https://i.pravatar.cc/200?img=${i + 1}`)

async function seed() {
  console.log('🌱 Seeding Stayora database...')
  await db.$transaction([
    db.notificationPreference.deleteMany(),
    db.referralCode.deleteMany(),
    db.campaign.deleteMany(),
    db.ticketNote.deleteMany(),
    db.supportTicket.deleteMany(),
    db.refund.deleteMany(),
    db.paymentAttempt.deleteMany(),
    db.payout.deleteMany(),
    db.bookingChange.deleteMany(),
    db.review.deleteMany(),
    db.wishlist.deleteMany(),
    db.message.deleteMany(),
    db.conversation.deleteMany(),
    db.notification.deleteMany(),
    db.serviceSlot.deleteMany(),
    db.service.deleteMany(),
    db.experienceSession.deleteMany(),
    db.experience.deleteMany(),
    db.teamMember.deleteMany(),
    db.priceOverride.deleteMany(),
    db.seasonalRate.deleteMany(),
    db.blockedDate.deleteMany(),
    db.availability.deleteMany(),
    db.room.deleteMany(),
    db.listingPhoto.deleteMany(),
    db.listing.deleteMany(),
    db.auditLog.deleteMany(),
    db.verificationRecord.deleteMany(),
    db.session.deleteMany(),
    db.coupon.deleteMany(),
    db.user.deleteMany(),
  ])

  const passwordHash = await bcrypt.hash('stayora123', 10)

  const admin = await db.user.create({
    data: {
      email: 'admin@stayora.com',
      passwordHash,
      name: 'Amara Okafor',
      role: 'ADMIN',
      avatarUrl: AVATAR_URLS[0],
      bio: 'Stayora operations lead. Loves travel, design, and well-built software.',
      country: 'PT',
      isVerified: true,
    },
  })

  const hosts: string[] = []
  for (let i = 0; i < 12; i++) {
    const host = await db.user.create({
      data: {
        email: `host${i + 1}@stayora.com`,
        passwordHash,
        name: `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`,
        role: 'HOST',
        avatarUrl: AVATAR_URLS[(i + 1) % AVATAR_URLS.length],
        bio: 'Passionate host who loves connecting guests with the local area.',
        country: randomFrom(DESTINATIONS).countryCode,
        isVerified: true,
        isSuperhost: i % 3 === 0,
        responseRate: randomInt(88, 100),
        responseTimeMins: randomFrom([15, 30, 60, 120]),
      },
    })
    hosts.push(host.id)
  }

  const guests: string[] = []
  for (let i = 0; i < 8; i++) {
    const guest = await db.user.create({
      data: {
        email: `guest${i + 1}@stayora.com`,
        passwordHash,
        name: `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`,
        role: 'GUEST',
        avatarUrl: AVATAR_URLS[(i + 4) % AVATAR_URLS.length],
        bio: 'Frequent traveler who loves design-led stays.',
        country: randomFrom(DESTINATIONS).countryCode,
        isVerified: true,
      },
    })
    guests.push(guest.id)
  }

  const listingIds: string[] = []
  for (let i = 0; i < 32; i++) {
    const destination = randomFrom(DESTINATIONS)
    const category = randomFrom(CATEGORIES)
    const roomType = randomFrom(ROOM_TYPES)
    const hostId = randomFrom(hosts)
    const basePrice = randomInt(4500, 45000)
    const maxGuests = randomInt(2, 8)
    const bedrooms = randomInt(1, 5)
    const bathrooms = Math.max(1, bedrooms - randomInt(0, 2))
    const beds = bedrooms + randomInt(0, 2)
    const title = randomFrom(TITLES_BY_CATEGORY[category])
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i + 1}`
    const amenitiesSubset = randomSubset(AMENITIES, randomInt(6, 12)).join(',')
    const cover = PHOTO_URLS[i % PHOTO_URLS.length]

    const listing = await db.listing.create({
      data: {
        hostId,
        title,
        slug,
        description: `${randomFrom(DESCRIPTIONS)} Located in ${destination.neighborhood}, ${destination.city}, ${destination.country}.`,
        category,
        roomType,
        status: 'PUBLISHED',
        moderationStatus: 'AUTO_APPROVED',
        country: destination.country,
        countryCode: destination.countryCode,
        region: destination.country,
        city: destination.city,
        neighborhood: destination.neighborhood,
        lat: destination.lat + (Math.random() - 0.5) * 0.1,
        lng: destination.lng + (Math.random() - 0.5) * 0.1,
        maxGuests,
        bedrooms,
        beds,
        bathrooms,
        basePrice,
        weekendPrice: Math.round(basePrice * 1.2),
        currency: 'USD',
        cleaningFee: randomInt(1500, 8000),
        extraGuestFee: randomInt(0, 1500),
        weeklyDiscountPct: randomFrom([0, 5, 10, 15]),
        monthlyDiscountPct: randomFrom([0, 10, 20, 30]),
        minNights: randomFrom([1, 1, 2, 3]),
        maxNights: 365,
        advanceBookingDays: randomFrom([90, 180, 365]),
        checkInTime: '15:00',
        checkOutTime: '11:00',
        instantBook: Math.random() > 0.5,
        cancellationPolicy: randomFrom(['FLEXIBLE', 'MODERATE', 'STRICT']),
        allowsPets: Math.random() > 0.6,
        allowsChildren: true,
        amenities: amenitiesSubset,
        coverImage: cover,
        rating: randomFloat(4.2, 5.0, 1),
        reviewCount: randomInt(3, 180),
        views: randomInt(500, 12000),
        wishlistSaves: randomInt(20, 800),
        impressions: randomInt(2000, 40000),
        detailViews: randomInt(500, 15000),
        bookingInquiries: randomInt(50, 2000),
        bookingConfirmed: randomInt(10, 400),
        revenueCents: randomInt(500000, 5000000),
        photos: {
          create: Array.from({ length: randomInt(5, 8) }, (_, idx) => ({
            url: PHOTO_URLS[(i * 3 + idx) % PHOTO_URLS.length],
            caption: idx === 0 ? 'Cover photo' : `View ${idx}`,
            position: idx,
            isCover: idx === 0,
          })),
        },
        rooms: {
          create: Array.from({ length: bedrooms }, (_, idx) => ({
            name: `Bedroom ${idx + 1}`,
            bedType: randomFrom(['QUEEN', 'KING', 'DOUBLE', 'TWIN']),
            bedCount: randomInt(1, 2),
          })),
        },
      },
    })
    listingIds.push(listing.id)

    const availabilityData: { date: Date; isAvailable: boolean; priceOverride: number | null }[] = []
    const today = new Date()
    for (let d = 0; d < 90; d++) {
      const date = new Date(today)
      date.setDate(today.getDate() + d)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const price = isWeekend && listing.weekendPrice ? listing.weekendPrice : listing.basePrice
      const isBlocked = Math.random() < 0.1
      availabilityData.push({ date, isAvailable: !isBlocked, priceOverride: isBlocked ? null : price })
    }
    await db.availability.createMany({
      data: availabilityData.map(a => ({
        listingId: listing.id,
        date: a.date,
        isAvailable: a.isAvailable,
        priceOverride: a.priceOverride,
      })),
    })

    const seasonStart = new Date()
    seasonStart.setDate(seasonStart.getDate() + 30)
    const seasonEnd = new Date(seasonStart)
    seasonEnd.setDate(seasonEnd.getDate() + 60)
    await db.seasonalRate.create({
      data: {
        listingId: listing.id,
        name: 'Peak Season',
        startDate: seasonStart,
        endDate: seasonEnd,
        price: Math.round(basePrice * 1.3),
        weekendPrice: Math.round(basePrice * 1.5),
      },
    })
  }

  await db.coupon.create({
    data: {
      code: 'WELCOME10',
      type: 'PERCENT',
      value: 10,
      validFrom: new Date(Date.now() - 86400000),
      validTo: new Date(Date.now() + 86400000 * 90),
      maxRedemptions: 1000,
      minAmount: 5000,
    },
  })
  await db.coupon.create({
    data: {
      code: 'STAYORA50',
      type: 'FLAT',
      value: 5000,
      validFrom: new Date(Date.now() - 86400000),
      validTo: new Date(Date.now() + 86400000 * 30),
      maxRedemptions: 100,
      minAmount: 20000,
    },
  })

  let bookingCounter = 1000
  for (let i = 0; i < 30; i++) {
    const listingId = randomFrom(listingIds)
    const listing = await db.listing.findUnique({ where: { id: listingId } })
    if (!listing) continue
    const guestId = randomFrom(guests)
    const nights = randomInt(2, 8)
    const checkIn = new Date()
    checkIn.setDate(checkIn.getDate() + randomInt(-30, 60))
    const checkOut = new Date(checkIn)
    checkOut.setDate(checkOut.getDate() + nights)
    const adults = randomInt(1, Math.min(4, listing.maxGuests))
    const nightlySubtotal = listing.basePrice * nights
    const cleaningFee = listing.cleaningFee
    const serviceFee = Math.round(nightlySubtotal * 0.12)
    const taxes = Math.round(nightlySubtotal * 0.08)
    const totalAmount = nightlySubtotal + cleaningFee + serviceFee + taxes
    const platformFee = serviceFee
    const hostPayout = nightlySubtotal + cleaningFee - Math.round(nightlySubtotal * 0.03)

    let status = 'CONFIRMED'
    if (checkOut < new Date()) status = 'COMPLETED'
    if (checkIn > new Date() && Math.random() < 0.1) status = 'PENDING'
    if (Math.random() < 0.05) status = 'CANCELLED'

    const booking = await db.booking.create({
      data: {
        reference: `STY-${bookingCounter++}`,
        listingId,
        guestId,
        hostId: listing.hostId,
        status,
        checkIn,
        checkOut,
        nights,
        adults,
        children: Math.random() > 0.7 ? randomInt(1, 2) : 0,
        infants: 0,
        pets: 0,
        nightlySubtotal,
        cleaningFee,
        serviceFee,
        taxes,
        totalAmount,
        hostPayout,
        platformFee,
        currency: 'USD',
        confirmedAt: status !== 'PENDING' ? new Date() : null,
        cancelledAt: status === 'CANCELLED' ? new Date() : null,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        cancellationReason: status === 'CANCELLED' ? 'Schedule change' : null,
      },
    })

    const payStatus = status === 'CANCELLED' ? 'REFUNDED' : 'CAPTURED'
    await db.paymentAttempt.create({
      data: {
        bookingId: booking.id,
        provider: 'MOCK',
        providerRef: `pi_test_${booking.id.slice(0, 8)}`,
        amount: totalAmount,
        currency: 'USD',
        status: payStatus,
        intent: 'CHARGE',
      },
    })

    if (status === 'CONFIRMED' || status === 'COMPLETED') {
      const payoutStatus = status === 'COMPLETED' ? 'COMPLETED' : 'PENDING'
      await db.payout.create({
        data: {
          hostId: booking.hostId,
          bookingId: booking.id,
          amount: hostPayout,
          currency: 'USD',
          status: payoutStatus,
          provider: 'BANK',
          providerRef: `po_test_${booking.id.slice(0, 8)}`,
          scheduledAt: status === 'CONFIRMED' ? new Date(Date.now() + 86400000 * 2) : null,
          completedAt: status === 'COMPLETED' ? new Date() : null,
        },
      })
    }

    if (status === 'COMPLETED' && Math.random() > 0.4) {
      const rating = randomFrom([4, 5, 5, 5])
      await db.review.create({
        data: {
          authorId: guestId,
          subjectId: booking.hostId,
          listingId,
          bookingId: booking.id,
          rating,
          ratingAccuracy: randomFrom([4, 5]),
          ratingCleanliness: randomFrom([4, 5]),
          ratingCommunication: 5,
          ratingLocation: randomFrom([4, 5]),
          ratingCheckIn: 5,
          ratingValue: randomFrom([4, 5]),
          body: randomFrom(REVIEW_SNIPPETS),
        },
      })
    }
  }

  for (let i = 0; i < 8; i++) {
    const dest = randomFrom(DESTINATIONS)
    const titles = ['Sunrise Photography Walk', 'Local Market & Cooking Class', 'Hidden Street Art Tour', 'Coastal Sunset Cruise', 'Mountain Tea Ceremony', 'Old Town Architecture Walk', 'Pottery Workshop with Masters', 'Forest Sound Bath Session']
    const exp = await db.experience.create({
      data: {
        hostId: randomFrom(hosts),
        title: randomFrom(titles),
        description: 'A guided experience designed for small groups. All materials, snacks, and local insights are included.',
        category: randomFrom(['FOOD', 'CULTURE', 'NATURE', 'PHOTOGRAPHY', 'WELLNESS']),
        destination: `${dest.city}, ${dest.country}`,
        meetingPoint: `${dest.neighborhood} central square`,
        durationMinutes: randomFrom([120, 180, 240, 300]),
        capacity: randomInt(6, 12),
        pricePerPerson: randomInt(3500, 15000),
        coverImage: PHOTO_URLS[(i + 5) % PHOTO_URLS.length],
      },
    })
    for (let j = 0; j < 5; j++) {
      const start = new Date()
      start.setDate(start.getDate() + j * 3 + 1)
      start.setHours(9, 0, 0, 0)
      const end = new Date(start)
      end.setMinutes(end.getMinutes() + exp.durationMinutes)
      await db.experienceSession.create({
        data: {
          experienceId: exp.id,
          startsAt: start,
          endsAt: end,
          capacity: exp.capacity,
          bookedCount: randomInt(0, exp.capacity - 1),
        },
      })
    }
  }

  const serviceCats = ['CLEANING', 'MAINTENANCE', 'PHOTOGRAPHY', 'CONCIERGE', 'TRANSPORT']
  for (let i = 0; i < 6; i++) {
    const svc = await db.service.create({
      data: {
        providerId: randomFrom(hosts),
        category: randomFrom(serviceCats),
        title: ['Turnover Cleaning', 'Maintenance On-Call', 'Pro Real-Estate Photography', 'Personal Concierge', 'Airport Transfers', 'In-Stay Chef'][i],
        description: 'Reliable, professional service for hosts and guests. Insured and background-checked.',
        basePrice: randomInt(3500, 25000),
        serviceArea: 'Greater metro area',
        duration: randomFrom([60, 90, 120, 240]),
        coverImage: PHOTO_URLS[(i + 10) % PHOTO_URLS.length],
        rating: randomFloat(4.5, 5.0, 1),
        reviewCount: randomInt(15, 200),
      },
    })
    for (let j = 0; j < 4; j++) {
      const start = new Date()
      start.setDate(start.getDate() + j * 2 + 1)
      start.setHours(10, 0, 0, 0)
      const end = new Date(start)
      end.setMinutes(end.getMinutes() + svc.duration)
      await db.serviceSlot.create({
        data: {
          serviceId: svc.id,
          startsAt: start,
          endsAt: end,
          status: 'OPEN',
        },
      })
    }
  }

  for (let i = 0; i < 12; i++) {
    const userA = randomFrom(guests)
    let userB = randomFrom(hosts)
    while (userB === userA) userB = randomFrom(hosts)
    const conv = await db.conversation.create({
      data: {
        userAId: userA,
        userBId: userB,
        lastMessageAt: new Date(Date.now() - randomInt(60, 6000) * 60000),
      },
    })
    for (let m = 0; m < randomInt(3, 7); m++) {
      const isA = m % 2 === 0
      await db.message.create({
        data: {
          conversationId: conv.id,
          senderId: isA ? userA : userB,
          body: randomFrom([
            'Hi! Is the place available next weekend?',
            'Yes, both nights are open. Want me to send a quote?',
            'That would be great, thank you!',
            'Welcome! Check-in details will be sent 24 hours before arrival.',
            'Is there parking on site?',
            'Yes, free parking for one vehicle in the driveway.',
            'Perfect — see you Friday.',
            'The apartment is exactly as described. Thanks!',
          ]),
          isRead: Math.random() > 0.3,
          sentAt: new Date(Date.now() - (10 - m) * 3600000 - randomInt(0, 1800000)),
        },
      })
    }
  }

  for (const g of guests.slice(0, 4)) {
    for (let i = 0; i < 3; i++) {
      await db.notification.create({
        data: {
          userId: g,
          type: randomFrom(['BOOKING_CONFIRMED', 'MESSAGE_RECEIVED', 'REVIEW_REMINDER', 'PAYOUT_PROCESSING']),
          title: randomFrom(['Your booking is confirmed', 'New message from your host', 'Leave a review for your stay', 'Special offer inside']),
          body: 'Tap to view details.',
          link: '/dashboard',
          isRead: Math.random() > 0.5,
        },
      })
    }
  }
  for (const h of hosts.slice(0, 5)) {
    for (let i = 0; i < 3; i++) {
      await db.notification.create({
        data: {
          userId: h,
          type: randomFrom(['BOOKING_REQUEST_RECEIVED', 'MESSAGE_RECEIVED', 'PAYOUT_PROCESSING', 'REVIEW_REMINDER']),
          title: randomFrom(['New booking request', 'New message from a guest', 'Payout scheduled', 'New review from a guest']),
          body: 'Open your dashboard to respond.',
          link: '/host',
          isRead: Math.random() > 0.5,
        },
      })
    }
  }

  for (let i = 0; i < 6; i++) {
    await db.supportTicket.create({
      data: {
        requesterId: randomFrom([...guests, ...hosts]),
        assigneeId: i % 2 === 0 ? admin.id : null,
        subject: randomFrom(['Help with refund', 'Listing not appearing in search', 'Payment failed at checkout', 'Special accommodation request', 'Question about cancellation policy', 'Login issues after password reset']),
        category: randomFrom(['BOOKING', 'PAYMENT', 'LISTING', 'TRUST_SAFETY', 'ACCOUNT', 'GENERAL']),
        priority: randomFrom(['LOW', 'NORMAL', 'NORMAL', 'HIGH']),
        status: randomFrom(['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED']),
        description: 'Customer needs assistance — full context available in the linked booking.',
      },
    })
  }

  for (let i = 0; i < 5; i++) {
    await db.auditLog.create({
      data: {
        actorId: admin.id,
        action: randomFrom(['USER_SUSPENDED', 'LISTING_REVIEWED', 'REFUND_ISSUED', 'CONFIG_CHANGED', 'PAYOUT_OVERRIDE']),
        resource: randomFrom(['User', 'Listing', 'Booking', 'Payout']),
        resourceId: randomFrom([...guests, ...listingIds]),
        ip: '203.0.113.42',
      },
    })
  }

  console.log('✅ Seeding complete!')
  console.log(`   Users: ${guests.length + hosts.length + 1} (1 admin, ${hosts.length} hosts, ${guests.length} guests)`)
  console.log(`   Listings: ${listingIds.length}`)
  console.log(`   Coupons: 2 (WELCOME10, STAYORA50)`)
  console.log(`   Demo login: admin@stayora.com / host1@stayora.com / guest1@stayora.com — password: stayora123`)
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
