import { NextRequest, NextResponse } from "next/server";
import {
  getEventReps,
  isActive,
  listEvents,
  resolveEventForRep,
  todayInTimezone,
} from "@/lib/events";
import { redisConfigured } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/events/active?rep=<hubspotId>
 * Returns the event a rep is at today plus any concurrently-running events
 * they're also assigned to (override candidates). Public — the scanner calls
 * this at launch; it only exposes event names, no sensitive data.
 *
 * Add &debug=1 to get a diagnosis of why an event did or didn't resolve
 * (slugs, dates, booleans only — no rep names / PII).
 */
export async function GET(req: NextRequest) {
  const rep = req.nextUrl.searchParams.get("rep") ?? "";

  if (req.nextUrl.searchParams.get("debug")) {
    return debug(rep);
  }

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

// Diagnostic view: everything needed to explain a resolution, minus PII.
async function debug(rep: string) {
  // Bump this marker whenever the resolver logic changes so a loaded page
  // makes it obvious whether the newest deploy is actually live.
  const MARKER = "events-active-debug v3 (string-id fix)";

  if (!redisConfigured()) {
    return NextResponse.json({
      marker: MARKER,
      redisConfigured: false,
      note: "No Redis store configured in this deployment (KV_REST_API_URL / KV_REST_API_TOKEN missing). Events can't be read.",
    });
  }

  const events = await listEvents();
  const rows = [];
  for (const e of events) {
    const reps = await getEventReps(e.slug);
    rows.push({
      slug: e.slug,
      startDate: e.startDate,
      endDate: e.endDate,
      timezone: e.timezone,
      todayInEventTz: todayInTimezone(e.timezone),
      activeToday: isActive(e),
      repCount: reps.length,
      repIdTypes: reps.map((r) => typeof r), // should all be "string" post-fix
      queriedRepAssigned: rep ? reps.includes(rep) : null,
    });
  }

  const { selected, alternatives } = await resolveEventForRep(rep);

  return NextResponse.json({
    marker: MARKER,
    redisConfigured: true,
    queriedRep: rep || "(none — add ?rep=<hubspotId>)",
    eventCount: events.length,
    events: rows,
    resolvedForRep: {
      selected: selected?.slug ?? null,
      alternatives: alternatives.map((a) => a.slug),
    },
  });
}
