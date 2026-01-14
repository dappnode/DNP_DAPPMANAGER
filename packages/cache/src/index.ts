export { DappnodeCache, type CacheOptions } from "./DappnodeCache.js";

// Pre-configured cache instances for common use cases
import { LRUCache } from "lru-cache";

/**
 * Cache for dappstore directory data
 * Longer TTL since dappstore data doesn't change frequently
 */
export const dappstoreCache = new LRUCache<string, object>({
  max: 500, // Allow more items for directory packages
  ttl: 1000 * 60 * 30, // 30 minutes TTL
  updateAgeOnGet: true,
});

/**
 * Cache for smart contract addresses
 * Very long TTL since contract addresses rarely change
 */
export const contractAddressCache = new LRUCache<string, string>({
  max: 200,
  ttl: 1000 * 60 * 60 * 24, // 24 hours TTL
  updateAgeOnGet: true,
});

/**
 * Cache for staker configuration data
 * Shorter TTL for more frequent updates
 */
export const stakerConfigCache = new LRUCache<string, object>({
  max: 50,
  ttl: 1000 * 60 * 10, // 10 minutes TTL
  updateAgeOnGet: true,
});

/**
 * Get or set pattern for LRU cache
 * If the key exists, return the cached value
 * If not, call the factory function, cache the result, and return it
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export async function getOrSet<T extends {}>(
  cache: LRUCache<string, T>,
  key: string,
  factory: () => Promise<T>
): Promise<T> {
  const existing = cache.get(key);
  if (existing !== undefined) {
    return existing;
  }

  const value = await factory();
  cache.set(key, value);
  return value;
}