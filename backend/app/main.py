from contextlib import asynccontextmanager
from datetime import datetime, timezone
from math import ceil
import os
from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, joinedload

from .database import Base, SessionLocal, engine, get_db
from .models import Booking, Favorite, Listing
from .schemas import BookingCreate, BookingOut, FavoriteCreate, ListingCreate, ListingOut, ListingUpdate
from .seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed_database(db)
    yield


app = FastAPI(title="Airbnb API", version="1.0.0", lifespan=lifespan)

def _allowed_origins() -> list[str]:
    defaults = ["http://localhost:3000", "http://localhost:4173"]
    configured = os.getenv("FRONTEND_ORIGINS") or os.getenv("FRONTEND_ORIGIN") or ""
    extras = [origin.strip() for origin in configured.split(",") if origin.strip()]
    return defaults + [origin for origin in extras if origin not in defaults]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_origin_regex=r"https://[^/]+\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.now(timezone.utc)}


def api_route(path: str, *, methods: list[str], **kwargs):
    def decorator(func):
        app.add_api_route(f"/api/v1{path}", func, methods=methods, **kwargs)
        app.add_api_route(f"/api{path}", func, methods=methods, **kwargs)
        return func

    return decorator


@api_route("/listings", methods=["GET"])
def list_listings(query: str = "", category: str = "", property_type: str = "", min_price: float = 0, max_price: float = 100000, guests: int = 0, page: int = Query(1, ge=1), page_size: int = Query(8, ge=1, le=50), db: Session = Depends(get_db)):
    filters = [Listing.price.between(min_price, max_price)]
    if query:
        pattern = f"%{query}%"
        filters.append(or_(Listing.city.ilike(pattern), Listing.country.ilike(pattern), Listing.title.ilike(pattern)))
    if category: filters.append(Listing.category == category)
    if property_type: filters.append(Listing.property_type == property_type)
    if guests: filters.append(Listing.guest_capacity >= guests)
    total = db.scalar(select(func.count(Listing.id)).where(*filters)) or 0
    items = db.scalars(select(Listing).where(*filters).order_by(Listing.rating.desc()).offset((page-1)*page_size).limit(page_size)).all()
    return {"listings": items, "total": total, "page": page, "pages": max(1, ceil(total/page_size))}


@api_route("/listings/{listing_id}", methods=["GET"], response_model=ListingOut)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    listing = db.get(Listing, listing_id)
    if not listing: raise HTTPException(404, "Listing not found")
    return listing


@api_route("/listings", methods=["POST"], response_model=ListingOut, status_code=201)
def create_listing(payload: ListingCreate, db: Session = Depends(get_db)):
    listing = Listing(**payload.model_dump(), rating=5, review_count=0)
    db.add(listing); db.commit(); db.refresh(listing)
    return listing


@api_route("/listings/{listing_id}", methods=["PATCH"], response_model=ListingOut)
def update_listing(listing_id: int, payload: ListingUpdate, host_id: int = 2, db: Session = Depends(get_db)):
    listing = db.get(Listing, listing_id)
    if not listing: raise HTTPException(404, "Listing not found")
    if listing.host_id != host_id: raise HTTPException(403, "You do not own this listing")
    for key, value in payload.model_dump(exclude_unset=True).items(): setattr(listing, key, value)
    db.commit(); db.refresh(listing)
    return listing


@api_route("/listings/{listing_id}", methods=["DELETE"], status_code=204)
def delete_listing(listing_id: int, host_id: int = 2, db: Session = Depends(get_db)):
    listing = db.get(Listing, listing_id)
    if not listing: raise HTTPException(404, "Listing not found")
    if listing.host_id != host_id: raise HTTPException(403, "You do not own this listing")
    db.delete(listing); db.commit()
    return Response(status_code=204)


@api_route("/bookings", methods=["GET"], response_model=list[BookingOut])
def list_bookings(guest_id: int | None = None, host_id: int | None = None, db: Session = Depends(get_db)):
    statement = select(Booking).options(joinedload(Booking.listing))
    if guest_id: statement = statement.where(Booking.guest_id == guest_id)
    if host_id: statement = statement.join(Listing).where(Listing.host_id == host_id)
    return db.scalars(statement.order_by(Booking.check_in)).unique().all()


@api_route("/bookings", methods=["POST"], response_model=BookingOut, status_code=201)
def create_booking(payload: BookingCreate, db: Session = Depends(get_db)):
    listing = db.get(Listing, payload.listing_id)
    if not listing: raise HTTPException(404, "Listing not found")
    nights = (payload.check_out - payload.check_in).days
    if nights < 1: raise HTTPException(400, "Check-out must be after check-in")
    if payload.guests > listing.guest_capacity: raise HTTPException(400, f"Maximum {listing.guest_capacity} guests")
    overlap = db.scalar(select(Booking.id).where(and_(Booking.listing_id == payload.listing_id, Booking.status == "confirmed", Booking.check_in < payload.check_out, Booking.check_out > payload.check_in)).limit(1))
    if overlap: raise HTTPException(status.HTTP_409_CONFLICT, "Those dates are unavailable")
    subtotal = listing.price*nights; service_fee = round(subtotal*listing.service_fee_rate, 2)
    booking = Booking(**payload.model_dump(),nights=nights,subtotal=subtotal,cleaning_fee=listing.cleaning_fee,service_fee=service_fee,total=subtotal+listing.cleaning_fee+service_fee,status="confirmed",confirmation_code=f"AIR-{uuid4().hex[:5].upper()}")
    db.add(booking); db.commit(); db.refresh(booking); booking.listing = listing
    return booking


@api_route("/favorites", methods=["GET"], response_model=list[ListingOut])
def list_favorites(user_id: int = 1, db: Session = Depends(get_db)):
    return db.scalars(select(Listing).join(Favorite).where(Favorite.user_id == user_id)).all()


@api_route("/favorites", methods=["POST"], status_code=201)
def add_favorite(payload: FavoriteCreate, db: Session = Depends(get_db)):
    exists = db.scalar(select(Favorite.id).where(Favorite.user_id == payload.user_id, Favorite.listing_id == payload.listing_id))
    if not exists: db.add(Favorite(**payload.model_dump())); db.commit()
    return {"ok": True}


@api_route("/favorites/{listing_id}", methods=["DELETE"], status_code=204)
def remove_favorite(listing_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    favorite = db.scalar(select(Favorite).where(Favorite.user_id == user_id, Favorite.listing_id == listing_id))
    if favorite: db.delete(favorite); db.commit()
    return Response(status_code=204)
