import { backendErrorMessage, backendJson, hasBackendBaseUrl, mapBooking } from "@/lib/render-backend";
import { createLocalBooking, listLocalBookings } from "@/lib/local-api";

export async function GET(request: Request) {
  if (!hasBackendBaseUrl()) {
    const url = new URL(request.url);
    const guestId = url.searchParams.get("guestId");
    const hostId = url.searchParams.get("hostId");
    const bookings = await listLocalBookings(guestId ? Number(guestId) : null, hostId ? Number(hostId) : null);
    return Response.json({ bookings });
  }

  const url = new URL(request.url);
  const params = new URLSearchParams();
  const guestId = url.searchParams.get("guestId");
  const hostId = url.searchParams.get("hostId");
  if (guestId) params.set("guest_id", guestId);
  if (hostId) params.set("host_id", hostId);

  const { response, data } = await backendJson<{ bookings: unknown[] }>("/api/v1/bookings", undefined, `?${params.toString()}`);
  if (!response.ok) {
    return Response.json({ error: backendErrorMessage(data, "Unable to load bookings") }, { status: response.status });
  }

  return Response.json({
    bookings: (Array.isArray(data) ? data : data?.bookings ?? []).map((row) => mapBooking(row as Parameters<typeof mapBooking>[0])),
  });
}

export async function POST(request: Request) {
  if (!hasBackendBaseUrl()) {
    const body = await request.json() as Record<string, unknown>;
    const result = await createLocalBooking({
      listingId: Number(body.listingId),
      guestId: Number(body.guestId ?? 1),
      checkIn: String(body.checkIn ?? ""),
      checkOut: String(body.checkOut ?? ""),
      guests: Number(body.guests ?? 1),
    });

    if ("error" in result) {
      return Response.json({ error: result.error }, { status: result.status });
    }

    return Response.json({ booking: result.booking }, { status: 201 });
  }

  const body = await request.json() as Record<string, unknown>;
  const payload = {
    listing_id: Number(body.listingId),
    guest_id: Number(body.guestId ?? 1),
    check_in: String(body.checkIn ?? ""),
    check_out: String(body.checkOut ?? ""),
    guests: Number(body.guests ?? 1),
  };

  const { response, data } = await backendJson<{ booking?: unknown }>("/api/v1/bookings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return Response.json({ error: backendErrorMessage(data, "Booking failed") }, { status: response.status });
  }

  return Response.json({ booking: mapBooking((data?.booking ?? data) as Parameters<typeof mapBooking>[0]) }, { status: response.status });
}
