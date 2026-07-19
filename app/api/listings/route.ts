import { backendErrorMessage, backendJson, hasBackendBaseUrl, mapListing } from "@/lib/render-backend";
import { createLocalListing, listLocalListings } from "@/lib/local-api";

export async function GET(request: Request) {
  if (!hasBackendBaseUrl()) {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 8);
    const data = await listLocalListings({
      query: url.searchParams.get("query") ?? "",
      category: url.searchParams.get("category") ?? "",
      propertyType: url.searchParams.get("propertyType") ?? "",
      minPrice: Number(url.searchParams.get("minPrice") ?? 0),
      maxPrice: Number(url.searchParams.get("maxPrice") ?? 100000),
      guests: Number(url.searchParams.get("guests") ?? 0),
      page,
      pageSize,
    });
    return Response.json(data);
  }

  const url = new URL(request.url);
  const params = new URLSearchParams();
  const mapping: Record<string, string> = {
    query: "query",
    category: "category",
    propertyType: "property_type",
    minPrice: "min_price",
    maxPrice: "max_price",
    guests: "guests",
    page: "page",
    pageSize: "page_size",
  };
  for (const [source, target] of Object.entries(mapping)) {
    const value = url.searchParams.get(source);
    if (value !== null && value !== "") params.set(target, value);
  }

  const { response, data } = await backendJson<{ listings: unknown[]; total: number; page: number; pages: number }>(
    "/api/v1/listings",
    undefined,
    `?${params.toString()}`,
  );

  if (!response.ok) {
    return Response.json({ error: backendErrorMessage(data, "Unable to load listings") }, { status: response.status });
  }

  return Response.json({
    listings: (data?.listings ?? []).map((row) => mapListing(row as Parameters<typeof mapListing>[0])),
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pages: data?.pages ?? 1,
  });
}

export async function POST(request: Request) {
  if (!hasBackendBaseUrl()) {
    const body = await request.json() as Record<string, unknown>;
    const listing = await createLocalListing({
      hostId: Number(body.hostId ?? 2),
      title: String(body.title ?? "").trim(),
      subtitle: String(body.subtitle ?? "A memorable stay").trim(),
      description: String(body.description ?? "").trim(),
      city: String(body.city ?? "").trim(),
      country: "India",
      latitude: Number(body.latitude ?? 0),
      longitude: Number(body.longitude ?? 0),
      price: Number(body.price),
      cleaningFee: Number(body.cleaningFee ?? 0),
      serviceFeeRate: Number(body.serviceFeeRate ?? 0.12),
      propertyType: String(body.propertyType ?? ""),
      category: String(body.category ?? "Design"),
      guestCapacity: Number(body.guestCapacity ?? 2),
      bedrooms: Number(body.bedrooms ?? 1),
      beds: Number(body.beds ?? 1),
      baths: Number(body.baths ?? 1),
      amenities: Array.isArray(body.amenities) ? body.amenities.map(String) : [],
      images: Array.isArray(body.images) ? body.images.map(String).filter(Boolean) : [],
      badge: typeof body.badge === "string" ? body.badge : null,
    });
    return Response.json({ listing }, { status: 201 });
  }

  const body = await request.json() as Record<string, unknown>;
  const images = Array.isArray(body.images) ? body.images.map(String).filter(Boolean) : [];
  const payload = {
    host_id: Number(body.hostId ?? 2),
    title: String(body.title ?? "").trim(),
    subtitle: String(body.subtitle ?? "A memorable stay").trim(),
    description: String(body.description ?? "").trim(),
    city: String(body.city ?? "").trim(),
    country: "India",
    latitude: Number(body.latitude ?? 0),
    longitude: Number(body.longitude ?? 0),
    price: Number(body.price),
    cleaning_fee: Number(body.cleaningFee ?? 0),
    service_fee_rate: Number(body.serviceFeeRate ?? 0.12),
    property_type: String(body.propertyType ?? ""),
    category: String(body.category ?? "Design"),
    guest_capacity: Number(body.guestCapacity ?? 2),
    bedrooms: Number(body.bedrooms ?? 1),
    beds: Number(body.beds ?? 1),
    baths: Number(body.baths ?? 1),
    amenities: Array.isArray(body.amenities) ? body.amenities.map(String) : [],
    images,
  };

  const { response, data } = await backendJson<{ listing?: unknown }>(
    "/api/v1/listings",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    return Response.json({ error: backendErrorMessage(data, "Unable to save listing") }, { status: response.status });
  }

  return Response.json({ listing: mapListing((data?.listing ?? data) as Parameters<typeof mapListing>[0]) }, { status: response.status });
}
