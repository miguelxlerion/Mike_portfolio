import { asc, count, sql } from "drizzle-orm";
import { db } from "@/db";
import { pins, voices, visits, type Pin, type Voice } from "@/db/schema";
import { seedPins } from "@/db/seed-data";

let ensured = false;

/** Create tables if they don't exist yet and seed the editorial content once. */
export async function ensureDatabase(): Promise<void> {
  if (ensured) return;

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS pins (
      id serial PRIMARY KEY,
      slug varchar(120) NOT NULL UNIQUE,
      number integer NOT NULL DEFAULT 0,
      title varchar(180) NOT NULL,
      subtitle varchar(180) NOT NULL DEFAULT '',
      artist varchar(180) NOT NULL DEFAULT '',
      category varchar(60) NOT NULL DEFAULT 'mural',
      year varchar(12) NOT NULL DEFAULT '',
      body text NOT NULL DEFAULT '',
      quote text NOT NULL DEFAULT '',
      quote_author varchar(120) NOT NULL DEFAULT '',
      image_url varchar(400) NOT NULL DEFAULT '',
      accent varchar(20) NOT NULL DEFAULT '#E4572E',
      x real NOT NULL DEFAULT 50,
      y real NOT NULL DEFAULT 50,
      published boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now()
    );
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS voices (
      id serial PRIMARY KEY,
      name varchar(80) NOT NULL,
      place varchar(80) NOT NULL DEFAULT '',
      message text NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    );
  `));

  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS visits (
      id serial PRIMARY KEY,
      created_at timestamp NOT NULL DEFAULT now()
    );
  `));

  const existing = await db.select({ value: count() }).from(pins);
  if ((existing[0]?.value ?? 0) === 0) {
    await db.insert(pins).values(seedPins).onConflictDoNothing();
  }

  const existingVoices = await db.select({ value: count() }).from(voices);
  if ((existingVoices[0]?.value ?? 0) === 0) {
    await db.insert(voices).values([
      {
        name: "Marisol",
        place: "Zacamil, Sector 2",
        message:
          "I have lived under this staircase for forty-six years. It is the first time someone paints it instead of writing on it.",
      },
      {
        name: "Tobias",
        place: "Berlin",
        message:
          "Found this at 2am and flew over the whole map twice. Sound on is the right way.",
      },
      {
        name: "Ana Lucía",
        place: "San Salvador",
        message: "My mother grew up in Block D. I sent her pin number 6 and she cried.",
      },
    ]);
  }

  ensured = true;
}

export async function getPins(): Promise<Pin[]> {
  await ensureDatabase();
  return db.select().from(pins).orderBy(asc(pins.number));
}

export async function getVoices(): Promise<Voice[]> {
  await ensureDatabase();
  const rows = await db.select().from(voices).orderBy(asc(voices.id));
  return rows.slice(-24).reverse();
}

export async function getVisitCount(): Promise<number> {
  await ensureDatabase();
  const rows = await db.select({ value: count() }).from(visits);
  return 12840 + (rows[0]?.value ?? 0);
}

export async function registerVisit(): Promise<number> {
  await ensureDatabase();
  await db.insert(visits).values({});
  return getVisitCount();
}
