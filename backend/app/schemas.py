from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ListingBase(BaseModel):
    title: str = Field(min_length=4, max_length=180)
    subtitle: str = Field(min_length=3, max_length=220)
    description: str = Field(min_length=20)
    city: str
    country: Literal["India"] = "India"
    latitude: float = 0
    longitude: float = 0
    price: float = Field(gt=0)
    cleaning_fee: float = Field(default=0, ge=0)
    service_fee_rate: float = Field(default=0.12, ge=0, le=0.3)
    property_type: str
    category: str
    guest_capacity: int = Field(ge=1, le=16)
    bedrooms: int = Field(ge=1, le=20)
    beds: int = Field(ge=1, le=30)
    baths: float = Field(ge=0.5, le=20)
    amenities: list[str] = Field(default_factory=list)
    images: list[str] = Field(min_length=1)


class ListingCreate(ListingBase):
    host_id: int = 2


class ListingUpdate(BaseModel):
    title: str | None = None
    subtitle: str | None = None
    description: str | None = None
    city: str | None = None
    country: Literal["India"] | None = None
    price: float | None = Field(default=None, gt=0)
    cleaning_fee: float | None = Field(default=None, ge=0)
    property_type: str | None = None
    category: str | None = None
    guest_capacity: int | None = None
    bedrooms: int | None = None
    beds: int | None = None
    baths: float | None = None
    amenities: list[str] | None = None
    images: list[str] | None = None


class ListingOut(ListingBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    host_id: int
    rating: float
    review_count: int
    badge: str | None
    created_at: datetime


class BookingCreate(BaseModel):
    listing_id: int
    guest_id: int = 1
    check_in: date
    check_out: date
    guests: int = Field(ge=1, le=16)


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    listing_id: int
    guest_id: int
    check_in: date
    check_out: date
    guests: int
    nights: int
    subtotal: float
    cleaning_fee: float
    service_fee: float
    total: float
    status: str
    confirmation_code: str
    created_at: datetime
    listing: ListingOut | None = None


class FavoriteCreate(BaseModel):
    user_id: int = 1
    listing_id: int
