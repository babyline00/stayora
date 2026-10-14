// Seed content tables (amenities, destinations, wizard-steps, categories)
// Run: bun run scripts/seed-content.ts
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const AMENITIES = [
  { key: 'wifi', label: 'Wi-Fi', icon: 'wifi', category: 'general', sortOrder: 1 },
  { key: 'kitchen', label: 'Kitchen', icon: 'utensils', category: 'kitchen', sortOrder: 2 },
  { key: 'pool', label: 'Pool', icon: 'waves', category: 'outdoor', sortOrder: 3 },
  { key: 'parking', label: 'Free parking', icon: 'car', category: 'outdoor', sortOrder: 4 },
  { key: 'ac', label: 'Air conditioning', icon: 'snowflake', category: 'general', sortOrder: 5 },
  { key: 'workspace', label: 'Dedicated workspace', icon: 'briefcase', category: 'general', sortOrder: 6 },
  { key: 'washer', label: 'Washer', icon: 'droplet', category: 'bathroom', sortOrder: 7 },
  { key: 'dryer', label: 'Dryer', icon: 'droplet', category: 'bathroom', sortOrder: 8 },
  { key: 'tv', label: 'TV', icon: 'tv', category: 'general', sortOrder: 9 },
  { key: 'heating', label: 'Heating', icon: 'flame', category: 'general', sortOrder: 10 },
  { key: 'hot_tub', label: 'Hot tub', icon: 'waves', category: 'outdoor', sortOrder: 11 },
  { key: 'gym', label: 'Gym', icon: 'dumbbell', category: 'general', sortOrder: 12 },
  { key: 'fireplace', label: 'Fireplace', icon: 'flame', category: 'general', sortOrder: 13 },
  { key: 'bbq', label: 'BBQ grill', icon: 'flame', category: 'outdoor', sortOrder: 14 },
  { key: 'balcony', label: 'Balcony', icon: 'home', category: 'outdoor', sortOrder: 15 },
  { key: 'garden', label: 'Garden', icon: 'tree-palm', category: 'outdoor', sortOrder: 16 },
  { key: 'beach_access', label: 'Beach access', icon: 'tree-palm', category: 'outdoor', sortOrder: 17 },
  { key: 'ski_storage', label: 'Ski storage', icon: 'mountain', category: 'outdoor', sortOrder: 18 },
  { key: 'ev_charger', label: 'EV charger', icon: 'zap', category: 'outdoor', sortOrder: 19 },
  { key: 'security', label: 'Security system', icon: 'shield-check', category: 'safety', sortOrder: 20 },
  { key: 'first_aid', label: 'First aid kit', icon: 'heart', category: 'safety', sortOrder: 21 },
  { key: 'smoke_alarm', label: 'Smoke alarm', icon: 'bell', category: 'safety', sortOrder: 22 },
]

const DESTINATIONS = [
  { city: 'Lisbon', country: 'Portugal', countryCode: 'PT', lat: 38.7223, lng: -9.1393, neighborhood: 'Alfama', image: 'https://images.unsplash.com/photo-1513735492236-0aaa1cd7d6f8?w=1600&q=80', tagline: 'The city of seven hills', description: 'Sun-drenched pastel buildings, fado in narrow lanes, and the best custard tarts you\'ll ever taste. Lisbon blends old-world charm with a thriving creative scene.', bestTime: 'April – October', popular: true, sortOrder: 1 },
  { city: 'Kyoto', country: 'Japan', countryCode: 'JP', lat: 35.0116, lng: 135.7681, neighborhood: 'Gion', image: 'https://images.unsplash.com/photo-1493976040374-85c547cb7b64?w=1600&q=80', tagline: 'Ancient temples, slow tea', description: 'Bamboo groves, golden pavilions, geisha in Gion. Kyoto is where Japan\'s imperial past still walks the streets.', bestTime: 'March – May (cherry blossom)', popular: true, sortOrder: 2 },
  { city: 'Marrakech', country: 'Morocco', countryCode: 'MA', lat: 31.6295, lng: -7.9811, neighborhood: 'Medina', image: 'https://images.unsplash.com/photo-1539020157-029a4a9bddbb?w=1600&q=80', tagline: 'Spices, souks, and riads', description: 'A maze of color and noise in the medina, calm inner courtyards in the riads, and the High Atlas shimmering on the horizon.', bestTime: 'October – April', popular: true, sortOrder: 3 },
  { city: 'Cape Town', country: 'South Africa', countryCode: 'ZA', lat: -33.9249, lng: 18.4241, neighborhood: 'Camps Bay', image: 'https://images.unsplash.com/photo-1568838-86b8f150150449-2c7a8e54cc?w=1600&q=80', tagline: 'Mountain meets ocean', description: 'Table Mountain looms over a city ringed by beaches, wineries, and the windswept Cape of Good Hope.', bestTime: 'November – March', popular: true, sortOrder: 4 },
  { city: 'Bali', country: 'Indonesia', countryCode: 'ID', lat: -8.3405, lng: 115.0920, neighborhood: 'Ubud', image: 'https://images.unsplash.com/photo-1518544801934-22e750781aaf?w=1600&q=80', tagline: 'Rice terraces and surf breaks', description: 'From the yoga studios of Ubud to the beach clubs of Seminyak, Bali blends spirituality, nature, and barefoot luxury.', bestTime: 'April – October', popular: true, sortOrder: 5 },
  { city: 'Barcelona', country: 'Spain', countryCode: 'ES', lat: 41.3851, lng: 2.1734, neighborhood: 'Gràcia', image: 'https://images.unsplash.com/photo-1583422409516-289528f1bfd4?w=1600&q=80', tagline: 'Gaudí, tapas, beach', description: 'Catalan modernism, late-night vermouth, and Mediterranean beaches all in one walkable city.', bestTime: 'May – September', popular: true, sortOrder: 6 },
  { city: 'Mexico City', country: 'Mexico', countryCode: 'MX', lat: 19.4326, lng: -99.1332, neighborhood: 'Roma Norte', image: 'https://images.unsplash.com/photo-1518444028531-1c6f3c7c3c3e?w=1600&q=80', tagline: 'Tacos, murals, mezcals', description: 'A megacity of neighborhoods — Roma, Condesa, Coyoacán — each with its own culinary and artistic rhythm.', bestTime: 'March – May', popular: true, sortOrder: 7 },
  { city: 'Reykjavik', country: 'Iceland', countryCode: 'IS', lat: 64.1466, lng: -21.9426, neighborhood: 'Midtown', image: 'https://images.unsplash.com/photo-1504541994902-91c3b8c3c3e0?w=1600&q=80', tagline: 'Geothermal nights, aurora skies', description: 'A tiny capital with big skies. Soak in hot springs by day, chase the northern lights by night.', bestTime: 'September – March (aurora)', popular: true, sortOrder: 8 },
  { city: 'Buenos Aires', country: 'Argentina', countryCode: 'AR', lat: -34.6037, lng: -58.3816, neighborhood: 'Palermo', image: 'https://images.unsplash.com/photo-1506440908997-2e8d6e3c4c7c?w=1600&q=80', tagline: 'Tango and asado', description: 'Paris of South America — wide boulevards, steak houses, milongas, and football on every corner.', bestTime: 'March – May, September – November', popular: true, sortOrder: 9 },
  { city: 'Queenstown', country: 'New Zealand', countryCode: 'NZ', lat: -45.0312, lng: 168.6626, neighborhood: 'Lakeview', image: 'https://images.unsplash.com/photo-1469854523086-1c6f3c7e0cd6?w=1600&q=80', tagline: 'Adventure capital', description: 'Bungee, ski, hike, jet boat — or just sit by Lake Wakatipu and admire the Remarkables.', bestTime: 'December – February (summer)', popular: true, sortOrder: 10 },
]

const WIZARD_STEPS = [
  { stepKey: 'type', label: 'Property type', icon: 'home', order: 1 },
  { stepKey: 'location', label: 'Location', icon: 'map-pin', order: 2 },
  { stepKey: 'capacity', label: 'Capacity', icon: 'users', order: 3 },
  { stepKey: 'amenities', label: 'Amenities', icon: 'sparkles', order: 4 },
  { stepKey: 'photos', label: 'Photos', icon: 'image', order: 5 },
  { stepKey: 'description', label: 'Description', icon: 'file-text', order: 6 },
  { stepKey: 'rules', label: 'House rules', icon: 'shield', order: 7 },
  { stepKey: 'availability', label: 'Availability', icon: 'calendar', order: 8 },
  { stepKey: 'pricing', label: 'Pricing', icon: 'dollar-sign', order: 9 },
  { stepKey: 'review', label: 'Review', icon: 'rocket', order: 10 },
]

const CATEGORIES = [
  { key: 'VILLA', label: 'Villa', icon: 'building-2', sortOrder: 1 },
  { key: 'APARTMENT', label: 'Apartment', icon: 'home', sortOrder: 2 },
  { key: 'CABIN', label: 'Cabin', icon: 'trees', sortOrder: 3 },
  { key: 'LOFT', label: 'Loft', icon: 'building', sortOrder: 4 },
  { key: 'TINYHOUSE', label: 'Tiny house', icon: 'tent', sortOrder: 5 },
  { key: 'BOAT', label: 'Boat', icon: 'ship', sortOrder: 6 },
  { key: 'ROOM', label: 'Private room', icon: 'home', sortOrder: 7 },
]

async function seed() {
  console.log('🌱 Seeding content tables...')

  // Clear existing
  await db.$transaction([
    db.amenity.deleteMany(),
    db.destination.deleteMany(),
    db.wizardStep.deleteMany(),
    db.propertyCategory.deleteMany(),
  ])

  // Insert amenities
  for (const a of AMENITIES) {
    await db.amenity.create({ data: a })
  }
  console.log(`✅ ${AMENITIES.length} amenities seeded`)

  // Insert destinations
  for (const d of DESTINATIONS) {
    await db.destination.create({ data: d })
  }
  console.log(`✅ ${DESTINATIONS.length} destinations seeded`)

  // Insert wizard steps
  for (const s of WIZARD_STEPS) {
    await db.wizardStep.create({ data: s })
  }
  console.log(`✅ ${WIZARD_STEPS.length} wizard steps seeded`)

  // Insert property categories
  for (const c of CATEGORIES) {
    await db.propertyCategory.create({ data: c })
  }
  console.log(`✅ ${CATEGORIES.length} property categories seeded`)
}

seed().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
