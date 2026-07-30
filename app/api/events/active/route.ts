import { NextRequest, NextResponse } from "next/server";
import { resolveEventForRep } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/events/active?rep=<hubspotId>
 * Returns the event a rep is at today plus any concurrently-running events
 * they're also assigned to (override candidates). Public — the scanner calls
 * this at launch; it only exposes event names, no sensitive data.
 */
export async function GET(req: NextRequest) {
  const rep = req.nextUrl.searchParams.get("rep") ?? "";
  if (!rep) {
    return NextResponse.json({ selected: null, alternatives: [] });
  }

  const { selected, alternatives } = await resolveEventForRep(rep);
  const slim = (e: { slug: string; name: string }) => ({
    slug: e.slug,
    name: e.name,
  });

  return NextResponse.json({
    selected: selected ? slim(selected) : null,
    alternatives: alternatives.map(slim),
  });
}
