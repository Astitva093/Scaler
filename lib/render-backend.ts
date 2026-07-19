import type { Booking, Listing } from "./types";

type BackendListing = {
  id: number;
  host_id: number;
  title: string;
  subtitle: string;
  description: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  price: number;
  cleaning_fee: number;
  service_fee_rate: number;
  rating: number;
  review_count: number;
  property_type: string;
  category: string;
  guest_capacity: number;
  bedrooms: number;
  beds: number;
  baths: number;
  amenities: string[];
  images: string[];
  badge: string | null;
};

type BackendHost = {
  name: string;
  bio: string;
  is_superhost: boolean;
  created_at: string;
};

type BackendReview = {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user_name: string;
};

type BackendUnavailable = {
  check_in: string;
  check_out: string;
};

type BackendBooking = {
  id: number;
  listing_id: number;
  guest_id: number;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  subtotal: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
  status: string;
  confirmation_code: string;
  listing?: BackendListing | null;
};

type BackendDetail = {
  listing: BackendListing;
  host?: BackendHost | null;
  reviews?: BackendReview[];
  unavailable?: BackendUnavailable[];
};

const backendBaseUrl = (process.env.BACKEND_API_BASE_URL ?? "").replace(/\/$/, "");

export function hasBackendBaseUrl() {
  return backendBaseUrl.length > 0;
}

export function backendUrl(path: string, search = "") {
  if (!backendBaseUrl) {
    throw new Error("BACKEND_API_BASE_URL is not configured");
  }
  return `${backendBaseUrl}${path}${search}`;
}

export async function backendJson<T>(path: string, init?: RequestInit, search = "") {
  const response = await fetch(backendUrl(path, search), init);
  let data: T | null = null;
  try {
    data = await response.json() as T;
  } catch {
    data = null;
  }
  return { response, data };
}

export function backendErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const candidate = data as { error?: unknown; detail?: unknown };
    if (typeof candidate.error === "string") return candidate.error;
    if (typeof candidate.detail === "string") return candidate.detail;
    if (Array.isArray(candidate.detail) && candidate.detail[0] && typeof candidate.detail[0] === "object") {
      const first = candidate.detail[0] as { msg?: unknown };
      if (typeof first.msg === "string") return first.msg;
    }
  }
  return fallback;
}

export function mapListing(row: BackendListing): Listing {
  return {
    id: row.id,
    hostId: row.host_id,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    city: row.city,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    price: row.price,
    cleaningFee: row.cleaning_fee,
    serviceFeeRate: row.service_fee_rate,
    rating: row.rating,
    reviewCount: row.review_count,
    propertyType: row.property_type,
    category: row.category,
    guestCapacity: row.guest_capacity,
    bedrooms: row.bedrooms,
    beds: row.beds,
    baths: row.baths,
    amenities: row.amenities,
    images: row.images,
    badge: row.badge,
  };
}

export function mapBooking(row: BackendBooking): Booking {
  return {
    id: row.id,
    listingId: row.listing_id,
    guestId: row.guest_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    guests: row.guests,
    nights: row.nights,
    subtotal: row.subtotal,
    cleaningFee: row.cleaning_fee,
    serviceFee: row.service_fee,
    total: row.total,
    status: row.status,
    confirmationCode: row.confirmation_code,
    listing: row.listing ? mapListing(row.listing) : undefined,
  };
}

export function mapDetail(payload: BackendDetail) {
  return {
    listing: mapListing(payload.listing),
    host: payload.host
      ? {
          name: payload.host.name,
          bio: payload.host.bio,
          isSuperhost: payload.host.is_superhost,
          createdAt: payload.host.created_at,
        }
      : undefined,
    reviews: (payload.reviews ?? []).map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      userName: review.user_name,
    })),
    unavailable: (payload.unavailable ?? []).map((item) => ({
      checkIn: item.check_in,
      checkOut: item.check_out,
    })),
  };
}

