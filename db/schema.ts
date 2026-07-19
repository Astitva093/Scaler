import { sql } from "drizzle-orm";
import { integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("guest"),
  avatarUrl: text("avatar_url").notNull().default(""),
  bio: text("bio").notNull().default(""),
  isSuperhost: integer("is_superhost", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const listings = sqliteTable("listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  hostId: integer("host_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  description: text("description").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  latitude: real("latitude").notNull().default(0),
  longitude: real("longitude").notNull().default(0),
  price: real("price").notNull(),
  cleaningFee: real("cleaning_fee").notNull().default(0),
  serviceFeeRate: real("service_fee_rate").notNull().default(0.12),
  rating: real("rating").notNull().default(5),
  reviewCount: integer("review_count").notNull().default(0),
  propertyType: text("property_type").notNull(),
  category: text("category").notNull(),
  guestCapacity: integer("guest_capacity").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  beds: integer("beds").notNull(),
  baths: real("baths").notNull(),
  amenities: text("amenities").notNull().default("[]"),
  images: text("images").notNull().default("[]"),
  badge: text("badge"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  guestId: integer("guest_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  checkIn: text("check_in").notNull(),
  checkOut: text("check_out").notNull(),
  guests: integer("guests").notNull(),
  nights: integer("nights").notNull(),
  subtotal: real("subtotal").notNull(),
  cleaningFee: real("cleaning_fee").notNull(),
  serviceFee: real("service_fee").notNull(),
  total: real("total").notNull(),
  status: text("status").notNull().default("confirmed"),
  confirmationCode: text("confirmation_code").notNull().unique(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const favorites = sqliteTable("favorites", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [primaryKey({ columns: [table.userId, table.listingId] })]);
