import { backendErrorMessage, backendJson, hasBackendBaseUrl, mapListing } from "@/lib/render-backend";
import { addLocalFavorite, listLocalFavorites, removeLocalFavorite } from "@/lib/local-api";

export async function GET(request: Request) {
  if (!hasBackendBaseUrl()) {
    const url = new URL(request.url);
    const userId = Number(url.searchParams.get("userId") ?? 1);
    return Response.json({ favorites: await listLocalFavorites(userId) });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const params = new URLSearchParams();
  if (userId) params.set("user_id", userId);

  const { response, data } = await backendJson<unknown[]>("/api/v1/favorites", undefined, `?${params.toString()}`);
  if (!response.ok) {
    return Response.json({ error: backendErrorMessage(data, "Unable to load favorites") }, { status: response.status });
  }

  return Response.json({
    favorites: (Array.isArray(data) ? data : []).map((row) => mapListing(row as Parameters<typeof mapListing>[0])),
  });
}

export async function POST(request: Request) {
  if (!hasBackendBaseUrl()) {
    const body = await request.json() as Record<string, unknown>;
    await addLocalFavorite(Number(body.userId ?? 1), Number(body.listingId));
    return Response.json({ ok: true }, { status: 201 });
  }

  const body = await request.json() as Record<string, unknown>;
  const payload = {
    user_id: Number(body.userId ?? 1),
    listing_id: Number(body.listingId),
  };

  const { response, data } = await backendJson("/api/v1/favorites", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return Response.json({ error: backendErrorMessage(data, "Unable to save favorite") }, { status: response.status });
  }

  return Response.json({ ok: true }, { status: response.status });
}

export async function DELETE(request: Request) {
  if (!hasBackendBaseUrl()) {
    const body = await request.json() as Record<string, unknown>;
    await removeLocalFavorite(Number(body.userId ?? 1), Number(body.listingId));
    return Response.json({ ok: true });
  }

  const body = await request.json() as Record<string, unknown>;
  const userId = Number(body.userId ?? 1);
  const listingId = Number(body.listingId);

  const { response, data } = await backendJson(
    `/api/v1/favorites/${listingId}`,
    {
      method: "DELETE",
    },
    `?user_id=${userId}`,
  );

  if (!response.ok) {
    return Response.json({ error: backendErrorMessage(data, "Unable to remove favorite") }, { status: response.status });
  }

  return Response.json({ ok: true }, { status: response.status });
}
