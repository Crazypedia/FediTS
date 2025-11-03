/**
 * Cache Manager
 *
 * Provides TTL-based caching using localStorage with namespace support,
 * size management, and versioning for schema changes.
 */

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  namespace?: string; // Cache namespace
  version?: string; // Schema version for cache invalidation
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
}

/**
 * Default TTLs for different data types (in milliseconds)
 */
export const DEFAULT_TTLS = {
  INSTANCE_REPORT: 7 * 24 * 60 * 60 * 1000, // 7 days
  EXTERNAL_API: 24 * 60 * 60 * 1000, // 24 hours
  EXTERNAL_API_LONG: 48 * 60 * 60 * 1000, // 48 hours (for SSL checks, etc.)
  KNOWN_INSTANCES: 24 * 60 * 60 * 1000, // 24 hours
  NODEINFO: 12 * 60 * 60 * 1000, // 12 hours
  FEDERATION_DATA: 24 * 60 * 60 * 1000, // 24 hours
  REPUTATION_LISTS: 7 * 24 * 60 * 60 * 1000, // 7 days
  PRECOMPUTED_DATA: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Cache namespaces
 */
export const CACHE_NAMESPACES = {
  REPORTS: 'fedits:reports',
  EXTERNAL_API: 'fedits:external',
  METADATA: 'fedits:metadata',
  NETWORK: 'fedits:network',
  REPUTATION: 'fedits:reputation',
  CONFIG: 'fedits:config',
};

/**
 * Current cache schema version
 * Increment this when cache structure changes to invalidate old cache
 */
export const CACHE_VERSION = '1.0.0';

/**
 * Maximum cache size in bytes (5MB default, leaving room for other data)
 */
const MAX_CACHE_SIZE = 5 * 1024 * 1024;

/**
 * Cache Manager
 */
export class CacheManager {
  private static instance: CacheManager;

  private constructor() {
    // Singleton pattern
    this.cleanupExpired();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(key: string, namespace: string = CACHE_NAMESPACES.REPORTS): string {
    return `${namespace}:${key}`;
  }

  /**
   * Set cache entry
   */
  set<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): boolean {
    const {
      ttl = DEFAULT_TTLS.INSTANCE_REPORT,
      namespace = CACHE_NAMESPACES.REPORTS,
      version = CACHE_VERSION
    } = options;

    try {
      const cacheKey = this.getCacheKey(key, namespace);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        version
      };

      const serialized = JSON.stringify(entry);

      // Check size before setting
      if (this.wouldExceedQuota(serialized)) {
        console.warn('Cache quota would be exceeded, cleaning up old entries');
        this.cleanupOldest();
      }

      localStorage.setItem(cacheKey, serialized);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('LocalStorage quota exceeded, clearing old cache entries');
        this.cleanupOldest(0.5); // Clear 50% of cache
        // Try again after cleanup
        try {
          const cacheKey = this.getCacheKey(key, namespace);
          const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl,
            version
          };
          localStorage.setItem(cacheKey, JSON.stringify(entry));
          return true;
        } catch {
          return false;
        }
      }
      console.error('Failed to set cache:', error);
      return false;
    }
  }

  /**
   * Get cache entry
   */
  get<T>(
    key: string,
    options: CacheOptions = {}
  ): T | null {
    const {
      namespace = CACHE_NAMESPACES.REPORTS,
      version = CACHE_VERSION
    } = options;

    try {
      const cacheKey = this.getCacheKey(key, namespace);
      const serialized = localStorage.getItem(cacheKey);

      if (!serialized) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(serialized);

      // Check version
      if (entry.version !== version) {
        console.log(`Cache version mismatch for ${key}, invalidating`);
        this.delete(key, { namespace });
        return null;
      }

      // Check expiration
      const now = Date.now();
      if (now - entry.timestamp > entry.ttl) {
        console.log(`Cache expired for ${key}`);
        this.delete(key, { namespace });
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  }

  /**
   * Delete cache entry
   */
  delete(key: string, options: CacheOptions = {}): void {
    const { namespace = CACHE_NAMESPACES.REPORTS } = options;
    const cacheKey = this.getCacheKey(key, namespace);
    localStorage.removeItem(cacheKey);
  }

  /**
   * Clear entire namespace
   */
  clearNamespace(namespace: string): void {
    const keys = this.getNamespaceKeys(namespace);
    keys.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.startsWith('fedits:')) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Get all keys in a namespace
   */
  private getNamespaceKeys(namespace: string): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${namespace}:`)) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Cleanup expired entries
   */
  cleanupExpired(): number {
    let cleaned = 0;
    const allKeys = Object.keys(localStorage);

    allKeys.forEach(key => {
      if (!key.startsWith('fedits:')) return;

      try {
        const serialized = localStorage.getItem(key);
        if (!serialized) return;

        const entry: CacheEntry<any> = JSON.parse(serialized);
        const now = Date.now();

        if (now - entry.timestamp > entry.ttl) {
          localStorage.removeItem(key);
          cleaned++;
        }
      } catch (error) {
        // Invalid entry, remove it
        localStorage.removeItem(key);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired cache entries`);
    }

    return cleaned;
  }

  /**
   * Cleanup oldest entries to free space
   */
  cleanupOldest(percentToRemove: number = 0.25): void {
    const entries: Array<{ key: string; timestamp: number }> = [];

    // Collect all fedits cache entries with timestamps
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('fedits:')) continue;

      try {
        const serialized = localStorage.getItem(key);
        if (!serialized) continue;

        const entry: CacheEntry<any> = JSON.parse(serialized);
        entries.push({ key, timestamp: entry.timestamp });
      } catch {
        // Invalid entry, will be cleaned up
      }
    }

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest N% of entries
    const toRemove = Math.ceil(entries.length * percentToRemove);
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(entries[i].key);
    }

    console.log(`Cleaned up ${toRemove} oldest cache entries (${(percentToRemove * 100).toFixed(0)}%)`);
  }

  /**
   * Check if adding data would exceed quota
   */
  private wouldExceedQuota(newData: string): boolean {
    const currentSize = this.getCurrentCacheSize();
    const newDataSize = new Blob([newData]).size;
    return currentSize + newDataSize > MAX_CACHE_SIZE;
  }

  /**
   * Get current cache size in bytes
   */
  getCurrentCacheSize(): number {
    let size = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('fedits:')) continue;

      const value = localStorage.getItem(key);
      if (value) {
        size += new Blob([key, value]).size;
      }
    }
    return size;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    totalSize: number;
    byNamespace: Record<string, { count: number; size: number }>;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const stats = {
      totalEntries: 0,
      totalSize: 0,
      byNamespace: {} as Record<string, { count: number; size: number }>,
      oldestEntry: null as number | null,
      newestEntry: null as number | null,
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('fedits:')) continue;

      const value = localStorage.getItem(key);
      if (!value) continue;

      try {
        const entry: CacheEntry<any> = JSON.parse(value);
        const size = new Blob([key, value]).size;

        // Update totals
        stats.totalEntries++;
        stats.totalSize += size;

        // Extract namespace
        const namespace = key.split(':')[0] + ':' + key.split(':')[1];

        // Update namespace stats
        if (!stats.byNamespace[namespace]) {
          stats.byNamespace[namespace] = { count: 0, size: 0 };
        }
        stats.byNamespace[namespace].count++;
        stats.byNamespace[namespace].size += size;

        // Track oldest/newest
        if (stats.oldestEntry === null || entry.timestamp < stats.oldestEntry) {
          stats.oldestEntry = entry.timestamp;
        }
        if (stats.newestEntry === null || entry.timestamp > stats.newestEntry) {
          stats.newestEntry = entry.timestamp;
        }
      } catch {
        // Skip invalid entries
      }
    }

    return stats;
  }

  /**
   * Get time until cache entry expires
   */
  getTimeToExpiry(key: string, options: CacheOptions = {}): number | null {
    const { namespace = CACHE_NAMESPACES.REPORTS } = options;

    try {
      const cacheKey = this.getCacheKey(key, namespace);
      const serialized = localStorage.getItem(cacheKey);

      if (!serialized) {
        return null;
      }

      const entry: CacheEntry<any> = JSON.parse(serialized);
      const expiryTime = entry.timestamp + entry.ttl;
      const now = Date.now();

      return Math.max(0, expiryTime - now);
    } catch {
      return null;
    }
  }

  /**
   * Check if cache entry exists and is valid
   */
  has(key: string, options: CacheOptions = {}): boolean {
    return this.get(key, options) !== null;
  }

  /**
   * Update TTL of existing entry without modifying data
   */
  touch(key: string, options: CacheOptions = {}): boolean {
    const data = this.get(key, options);
    if (data === null) {
      return false;
    }
    return this.set(key, data, options);
  }
}

/**
 * Convenience function to get cache manager instance
 */
export function getCache(): CacheManager {
  return CacheManager.getInstance();
}

/**
 * Decorator for caching function results
 */
export function cached<T>(
  keyGenerator: (...args: any[]) => string,
  options: CacheOptions = {}
) {
  return function (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]): Promise<T> {
      const cache = getCache();
      const cacheKey = keyGenerator(...args);

      // Try cache first
      const cached = cache.get<T>(cacheKey, options);
      if (cached !== null) {
        console.log(`Cache hit for ${propertyKey}:${cacheKey}`);
        return cached;
      }

      // Cache miss, call original method
      console.log(`Cache miss for ${propertyKey}:${cacheKey}`);
      const result = await originalMethod.apply(this, args);

      // Store in cache
      cache.set(cacheKey, result, options);

      return result;
    };

    return descriptor;
  };
}
