import type { CovenantStatus } from '../types';

/**
 * Service for checking if an instance is part of the Fediverse Server Covenant
 *
 * The Server Covenant is a set of commitments made by server operators:
 * - Active moderation against racism, sexism, homophobia, transphobia
 * - Daily backups
 * - At least one other person with access to the server infrastructure
 * - Commitment to give users at least 3 months warning before shutting down
 *
 * List available at: https://github.com/lightpub-dev/server-covenant-list
 */

const COVENANT_LIST_URL = 'https://raw.githubusercontent.com/lightpub-dev/server-covenant-list/main/list.json';

// Cache the covenant list to avoid repeated fetches
let covenantListCache: Set<string> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export class CovenantService {
  /**
   * Fetch the Server Covenant list
   */
  private static async fetchCovenantList(): Promise<Set<string>> {
    try {
      const response = await fetch(COVENANT_LIST_URL, {
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch covenant list: ${response.status}`);
      }

      const data = await response.json();

      // The list format may vary, adapt as needed
      // Assuming it's an array of domains or objects with domain property
      let domains: string[];

      if (Array.isArray(data)) {
        domains = data.map(item =>
          typeof item === 'string' ? item : item.domain || item.host
        ).filter(Boolean);
      } else if (data.servers) {
        domains = data.servers;
      } else {
        console.error('Unexpected covenant list format:', data);
        return new Set();
      }

      return new Set(domains.map(d => d.toLowerCase()));
    } catch (error) {
      console.error('Error fetching Server Covenant list:', error);
      return new Set();
    }
  }

  /**
   * Get the covenant list (with caching)
   */
  private static async getCovenantList(): Promise<Set<string>> {
    const now = Date.now();

    if (covenantListCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return covenantListCache;
    }

    covenantListCache = await this.fetchCovenantList();
    cacheTimestamp = now;

    return covenantListCache;
  }

  /**
   * Check if an instance is part of the Server Covenant
   */
  static async checkCovenant(domain: string): Promise<CovenantStatus> {
    const normalizedDomain = domain.toLowerCase();
    const covenantList = await this.getCovenantList();

    const listed = covenantList.has(normalizedDomain);

    return {
      listed,
      checkedAt: new Date(),
      source: listed ? COVENANT_LIST_URL : undefined
    };
  }

  /**
   * Clear the cache (useful for testing or manual refresh)
   */
  static clearCache(): void {
    covenantListCache = null;
    cacheTimestamp = 0;
  }
}
