import { NextRequest, NextResponse } from "next/server";
import {
  deleteEvent,
  EventRecord,
  getEventReps,
  listEvents,
  setEventReps,
  slugify,
  upsertEvent,
} from "@/lib/events";
import { redisConfigured } from "@/lib/redis";
import { REPS } from "@/lib/reps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns a NextResponse to short-circuit on auth/config failure, else null.
function gate(req: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "Admin is not configured (set ADMIN_PASSWORD)." },
      { status: 501 },
    );
  }
  if ((req.headers.get("x-admin-key") ?? "") !== expected) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!redisConfigured()) {
    return NextResponse.json(
      { error: "No store configured (set KV_REST_API_URL / KV_REST_API_TOKEN)." },
      { status: 501 },
    );
  }
  return null;
}

export async function GET(req: NextRequest) {
  const blocked = gate(req);
  if (blocked) return blocked;

  const events = await listEvents();
  const withReps = await Promise.all(
    events.map(async (e) => ({ ...e, repIds: await getEventReps(e.slug) })),
  );
  // Roster of all known reps for the assignment checkboxes.
  const reps = Object.entries(REPS).map(([id, name]) => ({ id, name }));
  return NextResponse.json({ events: withReps, reps });
}

export async function POST(req: NextRequest) {
  const blocked = gate(req);
  if (blocked) return blocked;

  let body: Partial<EventRecord> & { repIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const slug = (body.slug ?? "").trim() || slugify(name);
  const { startDate, endDate, timezone } = body;

  if (!name || !slug || !startDate || !endDate || !timezone) {
    return NextResponse.json(
      { error: "name, startDate, endDate, and timezone are required." },
      { status: 400 },
    );
  }
  if (startDate > endDate) {
    return NextResponse.json(
      { error: "startDate must be on or before endDate." },
      { status: 400 },
    );
  }

  const event: EventRecord = { slug, name, startDate, endDate, timezone };
  await upsertEvent(event);
  await setEventReps(slug, body.repIds ?? []);

  return NextResponse.json({ ok: true, event });
}

export async function DELETE(req: NextRequest) {
  const blocked = gate(req);
  if (blocked) return blocked;

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug is required." }, { status: 400 });
  }
  await deleteEvent(slug);
  return NextResponse.json({ ok: true });
}
