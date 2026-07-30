import { getRedis, redisConfigured } from "./redis";

// Per-rep scan counters, backed by Upstash Redis (Vercel Marketplace KV).
// Holds integer counts only — never contact/PII data. Everything degrades to a
// no-op when no store is configured, so the app runs fine without it.

const REP_COUNTS = "scans:rep_counts"; // hash: repId -> count
const REP_NAMES = "scans:rep_names"; // hash: repId -> display name
const REP_EVENT_COUNTS = "scans:rep_event_counts"; // hash: "repId::event" -> count

export function statsConfigured(): boolean {
  return redisConfigured();
}

/**
 * Record one scan/submission for a rep. Best-effort: callers should not let a
 * failure here block the submission. No-op when the store isn't configured.
 */
export async function recordScan(
  repId: string,
  repName: string,
  event: string,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const id = repId || "unattributed";
  const name = repName || (repId ? repId : "Unattributed");

  await Promise.all([
    redis.hincrby(REP_COUNTS, id, 1),
    redis.hset(REP_NAMES, { [id]: name }),
    event
      ? redis.hincrby(REP_EVENT_COUNTS, `${id}::${event}`, 1)
      : Promise.resolve(),
  ]);
}

export interface RepStat {
  repId: string;
  repName: string;
  count: number;
}

export interface Stats {
  reps: RepStat[];
  total: number;
  /** All event slugs seen, sorted — for the admin filter dropdown. */
  events: string[];
  /** The event this result is filtered to, or "" for all events. */
  event: string;
}

/**
 * Aggregate per-rep counts, highest first. Pass an `event` slug to filter to a
 * single event; omit (or "") for all events. `events` always lists every event
 * seen so the UI can populate its filter. null when the store isn't configured.
 */
export async function getStats(event = ""): Promise<Stats | null> {
  const redis = getRedis();
  if (!redis) return null;

  const [counts, names, eventCounts] = await Promise.all([
    redis.hgetall<Record<string, number>>(REP_COUNTS),
    redis.hgetall<Record<string, string>>(REP_NAMES),
    redis.hgetall<Record<string, number>>(REP_EVENT_COUNTS),
  ]);

  const namesMap = names ?? {};

  // Parse "repId::event" fields into events + per-event per-rep counts.
  const events = new Set<string>();
  const perEvent: Record<string, Record<string, number>> = {};
  for (const [key, value] of Object.entries(eventCounts ?? {})) {
    const sep = key.indexOf("::");
    if (sep === -1) continue;
    const repId = key.slice(0, sep);
    const ev = key.slice(sep + 2);
    events.add(ev);
    (perEvent[ev] ??= {})[repId] = Number(value);
  }

  const source: Record<string, number> = event
    ? (perEvent[event] ?? {})
    : Object.fromEntries(
        Object.entries(counts ?? {}).map(([k, v]) => [k, Number(v)]),
      );

  const reps: RepStat[] = Object.entries(source)
    .map(([repId, count]) => ({
      repId,
      repName: namesMap[repId] || repId,
      count: Number(count),
    }))
    .sort((a, b) => b.count - a.count);

  const total = reps.reduce((sum, r) => sum + r.count, 0);
  return { reps, total, events: [...events].sort(), event };
}
