import { getRedis, redisConfigured } from "./redis";

// Per-rep scan counters, backed by Upstash Redis (Vercel Marketplace KV).
// Holds integer counts only — never contact/PII data. Everything degrades to a
// no-op when no store is configured, so the app runs fine without it.

const REP_COUNTS = "scans:rep_counts"; // hash: repId -> count
const REP_NAMES = "scans:rep_names"; // hash: repId -> display name
const REP_EVENT_COUNTS = "scans:rep_event_counts"; // hash: "repId::event" -> count
const REP_HANDRAISE_COUNTS = "scans:rep_handraise_counts"; // hash: repId -> count
const REP_EVENT_HANDRAISE_COUNTS = "scans:rep_event_handraise_counts"; // hash: "repId::event" -> count

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
  handRaiser = false,
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
    handRaiser
      ? redis.hincrby(REP_HANDRAISE_COUNTS, id, 1)
      : Promise.resolve(),
    handRaiser && event
      ? redis.hincrby(REP_EVENT_HANDRAISE_COUNTS, `${id}::${event}`, 1)
      : Promise.resolve(),
  ]);
}

export interface RepStat {
  repId: string;
  repName: string;
  count: number;
  /** Scans flagged "wants a demo". */
  handRaisers: number;
}

export interface Stats {
  reps: RepStat[];
  total: number;
  totalHandRaisers: number;
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

  const [counts, names, eventCounts, handCounts, eventHandCounts] =
    await Promise.all([
      redis.hgetall<Record<string, number>>(REP_COUNTS),
      redis.hgetall<Record<string, string>>(REP_NAMES),
      redis.hgetall<Record<string, number>>(REP_EVENT_COUNTS),
      redis.hgetall<Record<string, number>>(REP_HANDRAISE_COUNTS),
      redis.hgetall<Record<string, number>>(REP_EVENT_HANDRAISE_COUNTS),
    ]);

  const namesMap = names ?? {};
  const events = new Set<string>();

  // Parse "repId::event" fields into { event: { repId: count } }.
  function byEvent(hash: Record<string, number> | null) {
    const out: Record<string, Record<string, number>> = {};
    for (const [key, value] of Object.entries(hash ?? {})) {
      const sep = key.indexOf("::");
      if (sep === -1) continue;
      const ev = key.slice(sep + 2);
      events.add(ev);
      (out[ev] ??= {})[key.slice(0, sep)] = Number(value);
    }
    return out;
  }
  const toNumbers = (hash: Record<string, number> | null) =>
    Object.fromEntries(
      Object.entries(hash ?? {}).map(([k, v]) => [k, Number(v)]),
    );

  const perEvent = byEvent(eventCounts);
  const perEventHand = byEvent(eventHandCounts);

  const source = event ? (perEvent[event] ?? {}) : toNumbers(counts);
  const handSource = event
    ? (perEventHand[event] ?? {})
    : toNumbers(handCounts);

  const reps: RepStat[] = Object.entries(source)
    .map(([repId, count]) => ({
      repId,
      repName: namesMap[repId] || repId,
      count: Number(count),
      handRaisers: Number(handSource[repId] ?? 0),
    }))
    .sort((a, b) => b.count - a.count);

  const total = reps.reduce((sum, r) => sum + r.count, 0);
  const totalHandRaisers = reps.reduce((sum, r) => sum + r.handRaisers, 0);
  return { reps, total, totalHandRaisers, events: [...events].sort(), event };
}
