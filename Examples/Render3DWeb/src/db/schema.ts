import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  real,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * A "pin" is a point of interest placed on the aerial map of the colonia.
 * x / y are percentages (0-100) relative to the map image.
 */
export const pins = pgTable("pins", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  number: integer("number").notNull().default(0),
  title: varchar("title", { length: 180 }).notNull(),
  subtitle: varchar("subtitle", { length: 180 }).notNull().default(""),
  artist: varchar("artist", { length: 180 }).notNull().default(""),
  category: varchar("category", { length: 60 }).notNull().default("mural"),
  year: varchar("year", { length: 12 }).notNull().default(""),
  body: text("body").notNull().default(""),
  quote: text("quote").notNull().default(""),
  quoteAuthor: varchar("quote_author", { length: 120 }).notNull().default(""),
  imageUrl: varchar("image_url", { length: 400 }).notNull().default(""),
  accent: varchar("accent", { length: 20 }).notNull().default("#E4572E"),
  x: real("x").notNull().default(50),
  y: real("y").notNull().default(50),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Short voices left by visitors — "leave your mark on the wall". */
export const voices = pgTable("voices", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 80 }).notNull(),
  place: varchar("place", { length: 80 }).notNull().default(""),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Simple counter of how many people "flew to" Zacamil. */
export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Pin = typeof pins.$inferSelect;
export type NewPin = typeof pins.$inferInsert;
export type Voice = typeof voices.$inferSelect;
