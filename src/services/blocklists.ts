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
    console.log(`[Blocklist] Fetching ${listName} from ${url}`);

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        console.error(`[Blocklist] Failed to fetch ${listName}: HTTP ${response.status} ${response.statusText}`);
        console.error(`[Blocklist] URL: ${url}`);
        return new Map();
      }

      console.log(`[Blocklist] Successfully fetched ${listName}, parsing data...`);
      const data = await response.json();
      const entries = new Map<string, BlocklistEntry>();

      console.log(`[Blocklist] ${listName} data structure:`, Array.isArray(data) ? 'Array' : typeof data);

      // Parse the blocklist (format may vary)
      if (Array.isArray(data)) {
        console.log(`[Blocklist] ${listName} has ${data.length} entries`);

        data.forEach((item, index) => {
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
            console.warn(`[Blocklist] ${listName}[${index}]: Unrecognized entry format:`, item);
            return;
          }

          entries.set(domain.toLowerCase(), {
            domain: domain.toLowerCase(),
            reason,
            severity
          });

          // Log first few entries for debugging
          if (index < 3) {
            console.log(`[Blocklist] ${listName}[${index}]: ${domain}${reason ? ` - ${reason}` : ''}`);
          }
        });
      } else if (typeof data === 'object') {
        // Handle object format where keys are domains
        const domainKeys = Object.keys(data);
        console.log(`[Blocklist] ${listName} has ${domainKeys.length} entries (object format)`);

        Object.entries(data).forEach(([domain, info]: [string, any], index) => {
          const reason = typeof info === 'string' ? info : info?.reason || info?.description || info?.comment;
          const severity = info?.severity || defaultSeverity;

          entries.set(domain.toLowerCase(), {
            domain: domain.toLowerCase(),
            reason,
            severity
          });

          // Log first few entries for debugging
          if (index < 3) {
            console.log(`[Blocklist] ${listName}[${index}]: ${domain}${reason ? ` - ${reason}` : ''}`);
          }
        });
      } else {
        console.error(`[Blocklist] ${listName}: Unexpected data format (not array or object)`);
      }

      console.log(`[Blocklist] ${listName} loaded ${entries.size} domains`);
      return entries;
    } catch (error) {
      console.error(`[Blocklist] Error fetching ${listName}:`, error);
      console.error(`[Blocklist] URL: ${url}`);
      if (error instanceof Error) {
        console.error(`[Blocklist] Error details: ${error.message}`);
        console.error(`[Blocklist] Stack trace:`, error.stack);
      }
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

    console.log(`[Blocklist] Checking domain: ${normalizedDomain}`);

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

    console.log(`[Blocklist] GardenFence has ${gardenFence.size} entries, IFTAS DNI has ${iftasDni.size} entries`);

    // Check GardenFence
    const gardenFenceMatch = gardenFence.get(normalizedDomain);
    if (gardenFenceMatch) {
      console.log(`[Blocklist] ⚠️  MATCH in GardenFence: ${normalizedDomain}`);
      console.log(`[Blocklist] Reason: ${gardenFenceMatch.reason || 'No reason provided'}`);
      console.log(`[Blocklist] Severity: ${gardenFenceMatch.severity}`);

      matches.push({
        listName: BLOCKLIST_SOURCES.GARDEN_FENCE.name,
        reason: gardenFenceMatch.reason,
        severity: gardenFenceMatch.severity
      });
    } else {
      console.log(`[Blocklist] ✓ No match in GardenFence for ${normalizedDomain}`);
    }

    // Check IFTAS DNI
    const iftasMatch = iftasDni.get(normalizedDomain);
    if (iftasMatch) {
      console.log(`[Blocklist] ⚠️  MATCH in IFTAS DNI: ${normalizedDomain}`);
      console.log(`[Blocklist] Reason: ${iftasMatch.reason || 'No reason provided'}`);
      console.log(`[Blocklist] Severity: ${iftasMatch.severity}`);

      matches.push({
        listName: BLOCKLIST_SOURCES.IFTAS_DNI.name,
        reason: iftasMatch.reason,
        severity: iftasMatch.severity
      });
    } else {
      console.log(`[Blocklist] ✓ No match in IFTAS DNI for ${normalizedDomain}`);
    }

    console.log(`[Blocklist] Total matches for ${normalizedDomain}: ${matches.length}`);

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
