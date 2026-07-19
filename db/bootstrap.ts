import { count } from "drizzle-orm";
import { getD1, getDb } from "./index";
import { bookings, favorites, listings, reviews, users } from "./schema";
import { seedListings } from "@/lib/seed";

let ready: Promise<void> | null = null;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'guest', avatar_url TEXT NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '', is_superhost INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS listings (id INTEGER PRIMARY KEY AUTOINCREMENT, host_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, subtitle TEXT NOT NULL, description TEXT NOT NULL, city TEXT NOT NULL, country TEXT NOT NULL, latitude REAL NOT NULL DEFAULT 0, longitude REAL NOT NULL DEFAULT 0, price REAL NOT NULL, cleaning_fee REAL NOT NULL DEFAULT 0, service_fee_rate REAL NOT NULL DEFAULT 0.12, rating REAL NOT NULL DEFAULT 5, review_count INTEGER NOT NULL DEFAULT 0, property_type TEXT NOT NULL, category TEXT NOT NULL, guest_capacity INTEGER NOT NULL, bedrooms INTEGER NOT NULL, beds INTEGER NOT NULL, baths REAL NOT NULL, amenities TEXT NOT NULL DEFAULT '[]', images TEXT NOT NULL DEFAULT '[]', badge TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE, guest_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, check_in TEXT NOT NULL, check_out TEXT NOT NULL, guests INTEGER NOT NULL, nights INTEGER NOT NULL, subtotal REAL NOT NULL, cleaning_fee REAL NOT NULL, service_fee REAL NOT NULL, total REAL NOT NULL, status TEXT NOT NULL DEFAULT 'confirmed', confirmation_code TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, rating INTEGER NOT NULL, comment TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS favorites (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (user_id, listing_id))`,
  `CREATE INDEX IF NOT EXISTS bookings_listing_dates_idx ON bookings (listing_id, check_in, check_out)`,
  `CREATE INDEX IF NOT EXISTS listings_city_category_idx ON listings (city, category)`,
];

async function initialize() {
  const d1 = getD1();
  await d1.batch(schemaStatements.map((statement) => d1.prepare(statement)));
  await d1.batch([
    d1.prepare("UPDATE listings SET price = price * 100, cleaning_fee = cleaning_fee * 100, country = 'India' WHERE price < 1000"),
    d1.prepare("UPDATE bookings SET subtotal = subtotal * 100, cleaning_fee = cleaning_fee * 100, service_fee = service_fee * 100, total = total * 100 WHERE total < 10000"),
  ]);
  const db = getDb();
  const [{ value }] = await db.select({ value: count() }).from(listings);
  if (value > 0) return;

  await db.insert(users).values([
    { id:1, name:"Maya Kapoor", email:"maya@airbnb.demo", role:"guest", avatarUrl:"", bio:"Slow traveller and architecture lover." },
    { id:2, name:"Aarav Mehta", email:"aarav@airbnb.demo", role:"host", avatarUrl:"", bio:"I host design-led homes across India and love helping guests plan unhurried trips.", isSuperhost:true },
    { id:3, name:"Nila & Dev", email:"nila@airbnb.demo", role:"host", avatarUrl:"", bio:"A husband-and-wife hosting team focused on warm, local hospitality.", isSuperhost:true },
    { id:4, name:"Kabir Singh", email:"kabir@airbnb.demo", role:"host", avatarUrl:"", bio:"Nature stays, small details, good coffee.", isSuperhost:false },
  ]).onConflictDoNothing();
  for (const listing of seedListings) {
    await db.insert(listings).values({
      ...listing,
      amenities: JSON.stringify(listing.amenities),
      images: JSON.stringify(listing.images),
      badge: listing.badge ?? null,
    }).onConflictDoNothing();
  }
  await db.insert(reviews).values([
    { id:1, listingId:1, userId:1, rating:5, comment:"The sunrise through the glass walls was unforgettable. Thoughtful design, total quiet, and an exceptionally helpful host.", createdAt:"2026-05-12" },
    { id:2, listingId:1, userId:3, rating:5, comment:"Even better than the photographs. We cooked, read by the fire, and barely wanted to leave the deck.", createdAt:"2026-03-28" },
    { id:3, listingId:2, userId:1, rating:5, comment:"A beautiful, breezy house with the beach at the end of the lane. The pool and outdoor breakfast were highlights.", createdAt:"2026-04-09" },
  ]).onConflictDoNothing();
  await db.insert(bookings).values({ id:1, listingId:2, guestId:1, checkIn:"2026-08-21", checkOut:"2026-08-24", guests:2, nights:3, subtotal:73200, cleaningFee:4500, serviceFee:8784, total:86484, status:"confirmed", confirmationCode:"AIR-8G2KQ" }).onConflictDoNothing();
  await db.insert(favorites).values([{ userId:1, listingId:3 }, { userId:1, listingId:7 }]).onConflictDoNothing();
}

export function ensureDatabase() {
  ready ??= initialize().catch((error) => { ready = null; throw error; });
  return ready;
}
