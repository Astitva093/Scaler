import { and, eq } from "drizzle-orm";

import { ensureDatabase } from "@/db/bootstrap";
import { getDb } from "@/db";
import { bookings, favorites, listings } from "@/db/schema";
import type { Booking, Listing } from "@/lib/types";

type ListingRow = typeof listings.$inferSelect;
type BookingRow = typeof bookings.$inferSelect;
type FavoriteRow = typeof favorites.$inferSelect;

type ListingListFilters = {
  query?: string;
  category?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  guests?: number;
  page?: number;
  pageSize?: number;
};

type CreateListingInput = {
  hostId: number;
  title: string;
  subtitle: string;
  description: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  price: number;
  cleaningFee: number;
  serviceFeeRate: number;
  propertyType: string;
  category: string;
  guestCapacity: number;
  bedrooms: number;
  beds: number;
  baths: number;
  amenities: string[];
  images: string[];
  badge?: string | null;
};

type UpdateListingInput = Partial<Omit<CreateListingInput, "hostId">>;

type CreateBookingInput = {
  listingId: number;
  guestId: number;
  checkIn: string;
  checkOut: string;
  guests: number;
};

function parseStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function toListing(row: ListingRow): Listing {
  return {
    id: row.id,
    hostId: row.hostId,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    city: row.city,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    price: row.price,
    cleaningFee: row.cleaningFee,
    serviceFeeRate: row.serviceFeeRate,
    rating: row.rating,
    reviewCount: row.reviewCount,
    propertyType: row.propertyType,
    category: row.category,
    guestCapacity: row.guestCapacity,
    bedrooms: row.bedrooms,
    beds: row.beds,
    baths: row.baths,
    amenities: parseStringArray(row.amenities),
    images: parseStringArray(row.images),
    badge: row.badge,
  };
}

function toBooking(row: BookingRow, listing?: Listing): Booking {
  return {
    id: row.id,
    listingId: row.listingId,
    guestId: row.guestId,
    checkIn: row.checkIn,
    checkOut: row.checkOut,
    guests: row.guests,
    nights: row.nights,
    subtotal: row.subtotal,
    cleaningFee: row.cleaningFee,
    serviceFee: row.serviceFee,
    total: row.total,
    status: row.status,
    confirmationCode: row.confirmationCode,
    listing,
  };
}

async function getDbReady() {
  await ensureDatabase();
  return getDb();
}

function matchesListingFilters(listing: Listing, filters: ListingListFilters) {
  const query = filters.query?.trim().toLowerCase() ?? "";
  const category = filters.category?.trim() ?? "";
  const propertyType = filters.propertyType?.trim() ?? "";
  const minPrice = filters.minPrice ?? 0;
  const maxPrice = filters.maxPrice ?? Number.POSITIVE_INFINITY;
  const guests = filters.guests ?? 0;
  const haystack = `${listing.city} ${listing.country} ${listing.title} ${listing.propertyType}`.toLowerCase();

  return (
    listing.price >= minPrice &&
    listing.price <= maxPrice &&
    (!query || haystack.includes(query)) &&
    (!category || listing.category === category) &&
    (!propertyType || listing.propertyType === propertyType) &&
    (!guests || listing.guestCapacity >= guests)
  );
}

function calcNights(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T00:00:00Z`).getTime();
  const end = new Date(`${checkOut}T00:00:00Z`).getTime();
  return Math.floor((end - start) / 86400000);
}

function formatMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export async function listLocalListings(filters: ListingListFilters) {
  const db = await getDbReady();
  const rows = await db.select().from(listings);
  const all = rows.map(toListing).filter((listing) => matchesListingFilters(listing, filters));
  all.sort((a, b) => b.rating - a.rating);

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(50, filters.pageSize ?? 8));
  const total = all.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;

  return { listings: all.slice(start, start + pageSize), total, page, pages };
}

export async function getLocalListing(listingId: number) {
  const db = await getDbReady();
  const [row] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  return row ? toListing(row) : null;
}

export async function createLocalListing(input: CreateListingInput) {
  const db = await getDbReady();
  const [row] = await db.insert(listings).values({
    hostId: input.hostId,
    title: input.title,
    subtitle: input.subtitle,
    description: input.description,
    city: input.city,
    country: input.country,
    latitude: input.latitude,
    longitude: input.longitude,
    price: input.price,
    cleaningFee: input.cleaningFee,
    serviceFeeRate: input.serviceFeeRate,
    propertyType: input.propertyType,
    category: input.category,
    guestCapacity: input.guestCapacity,
    bedrooms: input.bedrooms,
    beds: input.beds,
    baths: input.baths,
    amenities: JSON.stringify(input.amenities),
    images: JSON.stringify(input.images),
    badge: input.badge ?? null,
  }).returning();

  return row ? toListing(row) : null;
}

export async function updateLocalListing(listingId: number, input: UpdateListingInput, hostId = 2) {
  const db = await getDbReady();
  const [existing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!existing) return null;
  if (existing.hostId !== hostId) {
    throw new Error("You do not own this listing");
  }

  const values: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  const assign = (key: string, value: unknown) => {
    if (value !== undefined) values[key] = value;
  };

  assign("title", input.title);
  assign("subtitle", input.subtitle);
  assign("description", input.description);
  assign("city", input.city);
  assign("country", input.country);
  assign("price", input.price);
  assign("cleaningFee", input.cleaningFee);
  assign("propertyType", input.propertyType);
  assign("category", input.category);
  assign("guestCapacity", input.guestCapacity);
  assign("bedrooms", input.bedrooms);
  assign("beds", input.beds);
  assign("baths", input.baths);
  if (input.amenities !== undefined) values.amenities = JSON.stringify(input.amenities);
  if (input.images !== undefined) values.images = JSON.stringify(input.images);

  const [row] = await db.update(listings).set(values).where(eq(listings.id, listingId)).returning();
  return row ? toListing(row) : null;
}

export async function deleteLocalListing(listingId: number, hostId = 2) {
  const db = await getDbReady();
  const [existing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  if (!existing) return false;
  if (existing.hostId !== hostId) {
    throw new Error("You do not own this listing");
  }
  await db.delete(listings).where(eq(listings.id, listingId));
  return true;
}

export async function listLocalBookings(guestId?: number | null, hostId?: number | null) {
  const db = await getDbReady();
  const [bookingRows, listingRows] = await Promise.all([
    db.select().from(bookings),
    db.select().from(listings),
  ]);
  const listingMap = new Map(listingRows.map((row) => [row.id, toListing(row)] as const));

  const filtered = bookingRows
    .map((row) => toBooking(row, listingMap.get(row.listingId)))
    .filter((booking) => {
      if (guestId && booking.guestId !== guestId) return false;
      if (hostId) {
        const listing = listingMap.get(booking.listingId);
        if (!listing || listing.hostId !== hostId) return false;
      }
      return true;
    })
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  return filtered;
}

export async function createLocalBooking(input: CreateBookingInput) {
  const db = await getDbReady();
  const [listingRow] = await db.select().from(listings).where(eq(listings.id, input.listingId)).limit(1);
  if (!listingRow) {
    return { error: "Listing not found", status: 404 as const };
  }

  const listing = toListing(listingRow);
  const nights = calcNights(input.checkIn, input.checkOut);
  if (nights < 1) {
    return { error: "Check-out must be after check-in", status: 400 as const };
  }
  if (input.guests > listing.guestCapacity) {
    return { error: `Maximum ${listing.guestCapacity} guests`, status: 400 as const };
  }

  const [bookingRows] = await Promise.all([db.select().from(bookings)]);
  const conflict = bookingRows.some((row) => {
    if (row.listingId !== input.listingId || row.status !== "confirmed") return false;
    return row.checkIn < input.checkOut && row.checkOut > input.checkIn;
  });
  if (conflict) {
    return { error: "Those dates are unavailable", status: 409 as const };
  }

  const subtotal = formatMoney(listing.price * nights);
  const serviceFee = formatMoney(subtotal * listing.serviceFeeRate);
  const confirmationCode = `AIR-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  const [row] = await db.insert(bookings).values({
    listingId: input.listingId,
    guestId: input.guestId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    nights,
    subtotal,
    cleaningFee: listing.cleaningFee,
    serviceFee,
    total: subtotal + listing.cleaningFee + serviceFee,
    status: "confirmed",
    confirmationCode,
  }).returning();

  return { booking: row ? toBooking(row, listing) : null };
}

export async function listLocalFavorites(userId: number) {
  const db = await getDbReady();
  const [favoriteRows, listingRows] = await Promise.all([
    db.select().from(favorites),
    db.select().from(listings),
  ]);
  const listingMap = new Map(listingRows.map((row) => [row.id, toListing(row)] as const));

  return favoriteRows
    .filter((row) => row.userId === userId)
    .map((row) => listingMap.get(row.listingId))
    .filter((listing): listing is Listing => Boolean(listing));
}

export async function addLocalFavorite(userId: number, listingId: number) {
  const db = await getDbReady();
  const [existing] = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId))).limit(1);
  if (!existing) {
    await db.insert(favorites).values({ userId, listingId });
  }
  return true;
}

export async function removeLocalFavorite(userId: number, listingId: number) {
  const db = await getDbReady();
  await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)));
  return true;
}
