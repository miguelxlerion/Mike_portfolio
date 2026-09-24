import { NextResponse } from "next/server";
import { getVisitCount, registerVisit } from "@/lib/pins";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ count: await getVisitCount() });
}

export async function POST() {
  return NextResponse.json({ count: await registerVisit() });
}
