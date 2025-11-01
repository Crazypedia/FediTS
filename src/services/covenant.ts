import type { CovenantStatus } from '../types';

/**
 * Service for checking if an instance is part of the Mastodon Server Covenant
 *
 * The Mastodon Server Covenant is a set of commitments made by server operators:
 * - Active moderation against racism, sexism, homophobia, transphobia
 * - Daily backups
 * - At least one other person with access to the server infrastructure
 * - Commitment to give users at least 3 months warning before shutting down
 *
 * Official covenant: https://joinmastodon.org/covenant
 * List available at: https://api.joinmastodon.org/servers
 */

const COVENANT_LIST_URL = 'https://api.joinmastodon.org/servers';

// Cache the covenant list to avoid repeated fetches
let covenantListCache: Set<string> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export class CovenantService {
  /**
   * Fetch the Mastodon Server Covenant list
   */
  private static async fetchCovenantList(): Promise<Set<string>> {
    try {
      const response = await fetch(COVENANT_LIST_URL, {
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        console.warn(`Failed to fetch covenant list: ${response.status}`);
        return new Set();
      }

      const data = await response.json();

      // joinmastodon.org API returns an array of server objects
      let domains: string[] = [];

      if (Array.isArray(data)) {
        // Extract domain from each server object
        domains = data.map(item => {
          if (typeof item === 'string') {
            return item;
          }
          // Try various property names
          return item.domain || item.host || item.instance || item.name;
        }).filter(Boolean);
      } else if (data.servers && Array.isArray(data.servers)) {
        // Handle wrapped response
        domains = data.servers.map((item: any) =>
          typeof item === 'string' ? item : item.domain || item.host
        ).filter(Boolean);
      } else {
        console.warn('Unexpected covenant list format:', data);
        return new Set();
      }

      console.log(`Loaded ${domains.length} servers from Mastodon Server Covenant`);
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
