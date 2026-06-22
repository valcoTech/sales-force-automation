import { Redis } from "@upstash/redis";

const CACHE_TTL_SECONDS = 3600; // 1 hour
const CACHE_PREFIX = "incentive:filters:";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  if (!redis) {
    redis = new Redis({ url, token });
  }
  return redis;
}

export function incentiveFiltersCacheKey(userId: string): string {
  return `${CACHE_PREFIX}${userId}`;
}

export async function getCachedIncentiveFilters<T>(
  userId: string
): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;

  try {
    return (await client.get<T>(incentiveFiltersCacheKey(userId))) ?? null;
  } catch (err) {
    console.error("Redis GET error:", err);
    return null;
  }
}

export async function setCachedIncentiveFilters<T>(
  userId: string,
  data: T
): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.set(incentiveFiltersCacheKey(userId), data, {
      ex: CACHE_TTL_SECONDS,
    });
  } catch (err) {
    console.error("Redis SET error:", err);
  }
}

export async function invalidateAllIncentiveFiltersCache(): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    const keys = await client.keys(`${CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (err) {
    console.error("Redis invalidation error:", err);
  }
}

export function isRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}
