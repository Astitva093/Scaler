import { backendErrorMessage, backendJson, hasBackendBaseUrl, mapListing } from "@/lib/render-backend";
import { deleteLocalListing, getLocalListing, updateLocalListing } from "@/lib/local-api";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const id = Number((await params).id);
  if (!hasBackendBaseUrl()) {
    const listing = await getLocalListing(id);
    if (!listing) {
      return Response.json({ error: "Listing not found" }, { status: 404 });
    }
    return Response.json({ listing });
  }

  const { response, data } = await backendJson(`/api/v1/listings/${id}`);

  if (!response.ok) {
    return Response.json({ error: backendErrorMessage(data, "Listing not found") }, { status: response.status });
  }

  return Response.json({ listing: mapListing(data as Parameters<typeof mapListing>[0]) });
}

export async function PATCH(request: Request, { params }: Context) {
  const id = Number((await params).id);
  if (!hasBackendBaseUrl()) {
    const body = await request.json() as Record<string, unknown>;
    try {
      const listing = await updateLocalListing(id, {
        title: typeof body.title === "string" ? body.title : undefined,
        subtitle: typeof body.subtitle === "string" ? body.subtitle : undefined,
        description: typeof body.description === "string" ? body.description : undefined,
        city: typeof body.city === "string" ? body.city : undefined,
        country: typeof body.country === "string" ? body.country : undefined,
        price: typeof body.price === "number" ? body.price : undefined,
        cleaningFee: typeof body.cleaningFee === "number" ? body.cleaningFee : undefined,
        propertyType: typeof body.propertyType === "string" ? body.propertyType : undefined,
        category: typeof body.category === "string" ? body.category : undefined,
        guestCapacity: typeof body.guestCapacity === "number" ? body.guestCapacity : undefined,
        bedrooms: typeof body.bedrooms === "number" ? body.bedrooms : undefined,
        beds: typeof body.beds === "number" ? body.beds : undefined,
        baths: typeof body.baths === "number" ? body.baths : undefined,
        amenities: Array.isArray(body.amenities) ? body.amenities.map(String) : undefined,
        images: Array.isArray(body.images) ? body.images.map(String).filter(Boolean) : undefined,
      });
      if (!listing) {
        return Response.json({ error: "Listing not found" }, { status: 404 });
      }
      return Response.json({ listing });
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "Unable to save listing" },
        { status: 403 },
      );
    }
  }

  const body = await request.json() as Record<string, unknown>;
  const payload = {
    title: body.title,
    subtitle: body.subtitle,
    description: body.description,
    city: body.city,
    country: body.country ?? "India",
    price: body.price,
    cleaning_fee: body.cleaningFee,
    property_type: body.propertyType,
    category: body.category,
    guest_capacity: body.guestCapacity,
    bedrooms: body.bedrooms,
    beds: body.beds,
    baths: body.baths,
    amenities: body.amenities,
    images: body.images,
  };

  const { response, data } = await backendJson(`/api/v1/listings/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return Response.json({ error: backendErrorMessage(data, "Unable to save listing") }, { status: response.status });
  }

  return Response.json({ listing: mapListing(data as Parameters<typeof mapListing>[0]) });
}

export async function DELETE(_: Request, { params }: Context) {
  const id = Number((await params).id);
  if (!hasBackendBaseUrl()) {
    try {
      const removed = await deleteLocalListing(id);
      if (!removed) {
        return Response.json({ error: "Listing not found" }, { status: 404 });
      }
      return Response.json({ ok: true });
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "Unable to delete listing" },
        { status: 403 },
      );
    }
  }

  const { response, data } = await backendJson(`/api/v1/listings/${id}`, { method: "DELETE" });

  if (!response.ok) {
    return Response.json({ error: backendErrorMessage(data, "Unable to delete listing") }, { status: response.status });
  }

  return Response.json({ ok: true });
}
