import { NextResponse } from "next/server";
import { db } from "@/db";
import { pins } from "@/db/schema";
import { ensureDatabase, getPins } from "@/lib/pins";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await getPins();
  return NextResponse.json({ pins: rows });
}

export async function POST(request: Request) {
  await ensureDatabase();
  const body = (await request.json()) as Record<string, unknown>;

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "A title is required." }, { status: 400 });
  }

  const slug =
    String(body.slug ?? title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 100) || `pin-${Date.now()}`;

  const existing = await getPins();
  const nextNumber = existing.reduce((max, p) => Math.max(max, p.number), 0) + 1;

  const [created] = await db
    .insert(pins)
    .values({
      slug: `${slug}-${Date.now().toString(36).slice(-4)}`,
      number: nextNumber,
      title: title.slice(0, 180),
      subtitle: String(body.subtitle ?? "").slice(0, 180),
      artist: String(body.artist ?? "").slice(0, 180),
      category: String(body.category ?? "mural").slice(0, 60),
      year: String(body.year ?? new Date().getFullYear()).slice(0, 12),
      body: String(body.body ?? ""),
      quote: String(body.quote ?? ""),
      quoteAuthor: String(body.quoteAuthor ?? "").slice(0, 120),
      imageUrl: String(body.imageUrl ?? "/images/mural-2.jpg").slice(0, 400),
      accent: String(body.accent ?? "#E4572E").slice(0, 20),
      x: Number(body.x ?? 50),
      y: Number(body.y ?? 50),
    })
    .returning();

  return NextResponse.json({ pin: created }, { status: 201 });
}
