import type { InstanceReport } from '../types';

const CACHE_PREFIX = 'fedits_cache_';
const CACHE_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

interface CachedReport {
  report: InstanceReport;
  cachedAt: number; // timestamp
}

export class CacheService {
  /**
   * Get cached report for a domain if it exists and is still valid
   */
  static getCachedReport(domain: string): InstanceReport | null {
    try {
      const key = this.getCacheKey(domain);
      const cached = localStorage.getItem(key);

      if (!cached) {
        return null;
      }

      const data: CachedReport = JSON.parse(cached);
      const now = Date.now();
      const age = now - data.cachedAt;

      // Check if cache is still valid (less than 8 hours old)
      if (age > CACHE_DURATION_MS) {
        console.log(`Cache expired for ${domain} (age: ${Math.round(age / 1000 / 60)} minutes)`);
        this.clearCache(domain);
        return null;
      }

      console.log(`Cache hit for ${domain} (age: ${Math.round(age / 1000 / 60)} minutes)`);

      // Restore Date objects
      return {
        ...data.report,
        timestamp: new Date(data.report.timestamp),
        errors: data.report.errors.map(err => ({
          ...err,
          timestamp: new Date(err.timestamp)
        })),
        serverCovenant: data.report.serverCovenant ? {
          ...data.report.serverCovenant,
          checkedAt: new Date(data.report.serverCovenant.checkedAt)
        } : undefined
      };
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  /**
   * Store report in cache
   */
  static setCachedReport(domain: string, report: InstanceReport): void {
    try {
      const key = this.getCacheKey(domain);
      const data: CachedReport = {
        report,
        cachedAt: Date.now()
      };

      localStorage.setItem(key, JSON.stringify(data));
      console.log(`Cached report for ${domain}`);
    } catch (error) {
      console.error('Error writing cache:', error);
      // If localStorage is full, try to clear old caches
      this.cleanupOldCaches();
      // Try one more time
      try {
        const key = this.getCacheKey(domain);
        const data: CachedReport = {
          report,
          cachedAt: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));
      } catch (retryError) {
        console.error('Failed to cache even after cleanup:', retryError);
      }
    }
  }

  /**
   * Clear cache for a specific domain
   */
  static clearCache(domain: string): void {
    try {
      const key = this.getCacheKey(domain);
      localStorage.removeItem(key);
      console.log(`Cleared cache for ${domain}`);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache age in milliseconds for a domain
   */
  static getCacheAge(domain: string): number | null {
    try {
      const key = this.getCacheKey(domain);
      const cached = localStorage.getItem(key);

      if (!cached) {
        return null;
      }

      const data: CachedReport = JSON.parse(cached);
      return Date.now() - data.cachedAt;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if cache exists and is valid for a domain
   */
  static isCacheValid(domain: string): boolean {
    const age = this.getCacheAge(domain);
    return age !== null && age < CACHE_DURATION_MS;
  }

  /**
   * Get human-readable cache age
   */
  static getCacheAgeString(domain: string): string | null {
    const age = this.getCacheAge(domain);

    if (age === null) {
      return null;
    }

    const minutes = Math.floor(age / 1000 / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m ago`;
    } else {
      return `${minutes}m ago`;
    }
  }

  /**
   * Clean up old/expired caches
   */
  static cleanupOldCaches(): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      // Find all cache keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          try {
            const cached = localStorage.getItem(key);
            if (cached) {
              const data: CachedReport = JSON.parse(cached);
              const age = now - data.cachedAt;

              // Remove if older than cache duration
              if (age > CACHE_DURATION_MS) {
                keysToRemove.push(key);
              }
            }
          } catch (error) {
            // If we can't parse it, remove it
            keysToRemove.push(key);
          }
        }
      }

      // Remove old caches
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Cleaned up old cache: ${key}`);
      });

      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} old cache entries`);
      }
    } catch (error) {
      console.error('Error cleaning up caches:', error);
    }
  }

  /**
   * Get cache key for a domain
   */
  private static getCacheKey(domain: string): string {
    return `${CACHE_PREFIX}${domain.toLowerCase()}`;
  }

  /**
   * Clear all caches
   */
  static clearAllCaches(): void {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`Cleared ${keysToRemove.length} cache entries`);
    } catch (error) {
      console.error('Error clearing all caches:', error);
    }
  }
}
