import { Redis } from "@upstash/redis";

// Shared Upstash Redis client (Vercel Marketplace KV). Returns null when the
// store isn't configured so callers can degrade gracefully.
let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (client) return client;
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  client = new Redis({ url, token });
  return client;
}

export function redisConfigured(): boolean {
  return getRedis() !== null;
}
