import { LRUCache } from "lru-cache";

export interface CacheOptions {
  max?: number;
  ttl?: number; // Time to live in milliseconds
  allowStale?: boolean;
  updateAgeOnGet?: boolean;
  updateAgeOnHas?: boolean;
}

/**
 * A generic LRU cache wrapper for DappNode applications.
 * Provides controlled cache eviction and performance improvements.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export class DappnodeCache<K extends {} = string, V extends {} = object> {
  private cache: LRUCache<K, V>;

  constructor(options: CacheOptions = {}) {
    this.cache = new LRUCache<K, V>({
      max: options.max || 100, // Default max 100 items
      ttl: options.ttl || 1000 * 60 * 15, // Default 15 minutes TTL
      allowStale: options.allowStale || false,
      updateAgeOnGet: options.updateAgeOnGet || true,
      updateAgeOnHas: options.updateAgeOnHas || true,
    });
  }

  /**
   * Get a value from the cache
   */
  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  /**
   * Set a value in the cache
   */
  set(key: K, value: V): void {
    this.cache.set(key, value);
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a key from the cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get or set a value with a factory function
   * If the key exists, return the cached value
   * If not, call the factory function, cache the result, and return it
   */
  async getOrSet(key: K, factory: () => Promise<V>): Promise<V> {
    const existing = this.get(key);
    if (existing !== undefined) {
      return existing;
    }

    const value = await factory();
    this.set(key, value);
    return value;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    max: number;
    calculatedSize: number;
  } {
    return {
      size: this.cache.size,
      max: this.cache.max,
      calculatedSize: this.cache.calculatedSize,
    };
  }
}