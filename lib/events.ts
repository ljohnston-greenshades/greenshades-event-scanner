import { getRedis } from "./redis";

// Events + rep assignments, configured by the events manager and used to
// auto-select the current event for a rep at launch (no `event` in the URL).
//
// Redis layout:
//   events                 hash: slug -> JSON(EventRecord)
//   event_reps:<slug>      set:  assigned rep HubSpot IDs

export interface EventRecord {
  slug: string;
  name: string;
  /** Inclusive YYYY-MM-DD date range, interpreted in `timezone`. */
  startDate: string;
  endDate: string;
  /** IANA timezone, e.g. "America/New_York". */
  timezone: string;
}

const EVENTS = "events";
const repsKey = (slug: string) => `event_reps:${slug}`;

/** Turn a display name into a URL-safe slug: "SHRM Annual 2026" -> "shrm-annual-2026". */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Current date (YYYY-MM-DD) in a given IANA timezone. */
export function todayInTimezone(timezone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    // Invalid tz — fall back to UTC date.
    return now.toISOString().slice(0, 10);
  }
}

function isActive(event: EventRecord, now: Date): boolean {
  const today = todayInTimezone(event.timezone, now);
  return event.startDate <= today && today <= event.endDate;
}

export async function listEvents(): Promise<EventRecord[]> {
  const redis = getRedis();
  if (!redis) return [];
  const raw = await redis.hgetall<Record<string, EventRecord>>(EVENTS);
  // @upstash/redis auto-parses JSON values, so entries are already objects.
  return Object.values(raw ?? {}).sort((a, b) =>
    a.startDate.localeCompare(b.startDate) || a.slug.localeCompare(b.slug),
  );
}

export async function upsertEvent(event: EventRecord): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Stats store not configured");
  await redis.hset(EVENTS, { [event.slug]: JSON.stringify(event) });
}

export async function deleteEvent(slug: string): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Stats store not configured");
  await Promise.all([redis.hdel(EVENTS, slug), redis.del(repsKey(slug))]);
}

export async function getEventReps(slug: string): Promise<string[]> {
  const redis = getRedis();
  if (!redis) return [];
  const members = (await redis.smembers(repsKey(slug))) ?? [];
  // HubSpot IDs are all-numeric strings, and @upstash/redis auto-parses
  // numeric-looking set members into JS numbers. Coerce back to strings so
  // rep matching (resolveEventForRep), the admin roster, and the edit-form
  // checkboxes all compare like-for-like.
  return members.map((m) => String(m));
}

/** Replace the assigned reps for an event. */
export async function setEventReps(slug: string, repIds: string[]): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Stats store not configured");
  await redis.del(repsKey(slug));
  if (repIds.length) {
    await redis.sadd(repsKey(slug), repIds[0], ...repIds.slice(1));
  }
}

export interface EventResolution {
  /** The auto-selected event for the rep today, or null if none. */
  selected: EventRecord | null;
  /** Other events running concurrently that the rep is also assigned to. */
  alternatives: EventRecord[];
}

/**
 * Resolve which event a rep is at today: the events active now (date range
 * contains today in the event's timezone) that the rep is assigned to. The
 * first (by start date) is auto-selected; the rest are override candidates.
 */
export async function resolveEventForRep(
  repId: string,
  now: Date = new Date(),
): Promise<EventResolution> {
  const events = await listEvents();
  const active = events.filter((e) => isActive(e, now));

  const assigned: EventRecord[] = [];
  for (const e of active) {
    const reps = await getEventReps(e.slug);
    if (reps.includes(repId)) assigned.push(e);
  }

  if (assigned.length === 0) return { selected: null, alternatives: [] };
  return { selected: assigned[0], alternatives: assigned.slice(1) };
}
