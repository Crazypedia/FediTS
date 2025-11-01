import type { BlocklistMatch } from '../types';

/**
 * Service for checking instances against known blocklists
 *
 * Blocklists checked:
 * - FediGarden (The Bad Space) - https://thebadspace.org
 * - IFTAS DNI (Do Not Interact) list
 * - Oliphant's lists
 */

interface BlocklistEntry {
  domain: string;
  reason?: string;
  severity: 'info' | 'warning' | 'critical';
}

// Known blocklist sources
const BLOCKLIST_SOURCES = {
  GARDEN_FENCE: {
    name: 'GardenFence',
    url: 'https://github.com/gardenfence/blocklist/raw/main/blocklist.json',
    severity: 'warning' as const
  },
  IFTAS_DNI: {
    name: 'IFTAS DNI',
    url: 'https://raw.githubusercontent.com/iftas-org/dni-list/main/dni-instances.json',
    severity: 'critical' as const
  },
  // The Bad Space API (if available)
  BAD_SPACE: {
    name: 'The Bad Space',
    apiUrl: 'https://thebadspace.org/api/v1',
    severity: 'critical' as const
  }
};

// Cache for blocklists
const blocklistCache: Map<string, {
  entries: Map<string, BlocklistEntry>;
  timestamp: number;
}> = new Map();

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export class BlocklistService {
  /**
   * Fetch a blocklist from a URL
   */
  private static async fetchBlocklist(url: string, listName: string, defaultSeverity: 'info' | 'warning' | 'critical'): Promise<Map<string, BlocklistEntry>> {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        console.warn(`Failed to fetch ${listName}: ${response.status}`);
        return new Map();
      }

      const data = await response.json();
      const entries = new Map<string, BlocklistEntry>();

      // Parse the blocklist (format may vary)
      if (Array.isArray(data)) {
        data.forEach(item => {
          let domain: string;
          let reason: string | undefined;
          let severity = defaultSeverity;

          if (typeof item === 'string') {
            domain = item;
          } else if (item.domain) {
            domain = item.domain;
            reason = item.reason || item.description || item.comment;
            severity = item.severity || defaultSeverity;
          } else if (item.host) {
            domain = item.host;
            reason = item.reason || item.description;
            severity = item.severity || defaultSeverity;
          } else {
            return;
          }

          entries.set(domain.toLowerCase(), {
            domain: domain.toLowerCase(),
            reason,
            severity
          });
        });
      } else if (typeof data === 'object') {
        // Handle object format where keys are domains
        Object.entries(data).forEach(([domain, info]: [string, any]) => {
          entries.set(domain.toLowerCase(), {
            domain: domain.toLowerCase(),
            reason: typeof info === 'string' ? info : info?.reason,
            severity: info?.severity || defaultSeverity
          });
        });
      }

      return entries;
    } catch (error) {
      console.error(`Error fetching ${listName}:`, error);
      return new Map();
    }
  }

  /**
   * Get cached blocklist or fetch if expired
   */
  private static async getBlocklist(key: string, url: string, listName: string, severity: 'info' | 'warning' | 'critical'): Promise<Map<string, BlocklistEntry>> {
    const now = Date.now();
    const cached = blocklistCache.get(key);

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return cached.entries;
    }

    const entries = await this.fetchBlocklist(url, listName, severity);
    blocklistCache.set(key, { entries, timestamp: now });

    return entries;
  }

  /**
   * Check if instance appears in any blocklists
   */
  static async checkBlocklists(domain: string): Promise<BlocklistMatch[]> {
    const normalizedDomain = domain.toLowerCase();
    const matches: BlocklistMatch[] = [];

    // Fetch all blocklists in parallel
    const [gardenFence, iftasDni] = await Promise.all([
      this.getBlocklist(
        'garden_fence',
        BLOCKLIST_SOURCES.GARDEN_FENCE.url,
        BLOCKLIST_SOURCES.GARDEN_FENCE.name,
        BLOCKLIST_SOURCES.GARDEN_FENCE.severity
      ),
      this.getBlocklist(
        'iftas_dni',
        BLOCKLIST_SOURCES.IFTAS_DNI.url,
        BLOCKLIST_SOURCES.IFTAS_DNI.name,
        BLOCKLIST_SOURCES.IFTAS_DNI.severity
      )
    ]);

    // Check GardenFence
    const gardenFenceMatch = gardenFence.get(normalizedDomain);
    if (gardenFenceMatch) {
      matches.push({
        listName: BLOCKLIST_SOURCES.GARDEN_FENCE.name,
        reason: gardenFenceMatch.reason,
        severity: gardenFenceMatch.severity
      });
    }

    // Check IFTAS DNI
    const iftasMatch = iftasDni.get(normalizedDomain);
    if (iftasMatch) {
      matches.push({
        listName: BLOCKLIST_SOURCES.IFTAS_DNI.name,
        reason: iftasMatch.reason,
        severity: iftasMatch.severity
      });
    }

    return matches;
  }

  /**
   * Check a list of domains against blocklists
   */
  static async checkMultipleDomains(domains: string[]): Promise<Map<string, BlocklistMatch[]>> {
    const results = new Map<string, BlocklistMatch[]>();

    // Fetch blocklists once
    const [gardenFence, iftasDni] = await Promise.all([
      this.getBlocklist(
        'garden_fence',
        BLOCKLIST_SOURCES.GARDEN_FENCE.url,
        BLOCKLIST_SOURCES.GARDEN_FENCE.name,
        BLOCKLIST_SOURCES.GARDEN_FENCE.severity
      ),
      this.getBlocklist(
        'iftas_dni',
        BLOCKLIST_SOURCES.IFTAS_DNI.url,
        BLOCKLIST_SOURCES.IFTAS_DNI.name,
        BLOCKLIST_SOURCES.IFTAS_DNI.severity
      )
    ]);

    // Check each domain
    domains.forEach(domain => {
      const normalizedDomain = domain.toLowerCase();
      const matches: BlocklistMatch[] = [];

      const gardenFenceMatch = gardenFence.get(normalizedDomain);
      if (gardenFenceMatch) {
        matches.push({
          listName: BLOCKLIST_SOURCES.GARDEN_FENCE.name,
          reason: gardenFenceMatch.reason,
          severity: gardenFenceMatch.severity
        });
      }

      const iftasMatch = iftasDni.get(normalizedDomain);
      if (iftasMatch) {
        matches.push({
          listName: BLOCKLIST_SOURCES.IFTAS_DNI.name,
          reason: iftasMatch.reason,
          severity: iftasMatch.severity
        });
      }

      if (matches.length > 0) {
        results.set(domain, matches);
      }
    });

    return results;
  }

  /**
   * Clear all cached blocklists
   */
  static clearCache(): void {
    blocklistCache.clear();
  }
}
