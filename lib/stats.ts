import { Redis } from "@upstash/redis";

// Per-rep scan counters, backed by Upstash Redis (Vercel Marketplace KV).
// Holds integer counts only — never contact/PII data. Everything degrades to a
// no-op when no store is configured, so the app runs fine without it.

const REP_COUNTS = "scans:rep_counts"; // hash: repId -> count
const REP_NAMES = "scans:rep_names"; // hash: repId -> display name
const REP_EVENT_COUNTS = "scans:rep_event_counts"; // hash: "repId::event" -> count

let client: Redis | null = null;

function getRedis(): Redis | null {
  if (client) return client;
  // Vercel's Upstash integration sets KV_REST_API_*; the standalone Upstash
  // integration sets UPSTASH_REDIS_REST_*. Accept either.
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  client = new Redis({ url, token });
  return client;
}

export function statsConfigured(): boolean {
  return getRedis() !== null;
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
}

/** Aggregate per-rep counts, highest first. null when the store isn't configured. */
export async function getStats(): Promise<Stats | null> {
  const redis = getRedis();
  if (!redis) return null;

  const [counts, names] = await Promise.all([
    redis.hgetall<Record<string, number>>(REP_COUNTS),
    redis.hgetall<Record<string, string>>(REP_NAMES),
  ]);

  const reps: RepStat[] = Object.entries(counts ?? {})
    .map(([repId, count]) => ({
      repId,
      repName: (names ?? {})[repId] || repId,
      count: Number(count),
    }))
    .sort((a, b) => b.count - a.count);

  const total = reps.reduce((sum, r) => sum + r.count, 0);
  return { reps, total };
}
