import { NextResponse } from "next/server";
import { db } from "@/db";
import { voices } from "@/db/schema";
import { ensureDatabase, getVoices } from "@/lib/pins";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await getVoices();
  return NextResponse.json({ voices: rows });
}

export async function POST(request: Request) {
  await ensureDatabase();
  const payload = (await request.json()) as Record<string, unknown>;

  const name = String(payload.name ?? "").trim().slice(0, 80);
  const message = String(payload.message ?? "").trim().slice(0, 600);
  const place = String(payload.place ?? "").trim().slice(0, 80);

  if (!name || !message) {
    return NextResponse.json(
      { error: "Name and message are required." },
      { status: 400 },
    );
  }

  const [created] = await db
    .insert(voices)
    .values({ name, place, message })
    .returning();

  return NextResponse.json({ voice: created }, { status: 201 });
}
