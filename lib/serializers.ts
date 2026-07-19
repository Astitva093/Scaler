import type { Listing } from "./types";

type ListingRow = Omit<Listing, "amenities" | "images"> & { amenities: string; images: string };

export function serializeListing(row: ListingRow): Listing {
  return {
    ...row,
    amenities: safeArray(row.amenities),
    images: safeArray(row.images),
  };
}

function safeArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
