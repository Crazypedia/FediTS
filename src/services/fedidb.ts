import type { FediDBInstance, FediDBFederation } from '../types';

const FEDIDB_BASE_URL = 'https://fedidb.org/api';

export class FediDBService {
  /**
   * Fetch instance information from FediDB
   */
  static async getInstance(domain: string): Promise<FediDBInstance | null> {
    try {
      const response = await fetch(`${FEDIDB_BASE_URL}/v1/instance?domain=${encodeURIComponent(domain)}`, {
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Instance ${domain} not found in FediDB`);
          return null;
        }
        throw new Error(`FediDB API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('FediDB getInstance error:', error);
      return null;
    }
  }

  /**
   * Fetch federation data (peers, blocks) from FediDB
   */
  static async getFederation(domain: string): Promise<FediDBFederation | null> {
    try {
      const response = await fetch(`${FEDIDB_BASE_URL}/v1/instance/federation?domain=${encodeURIComponent(domain)}`, {
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Federation data for ${domain} not found in FediDB`);
          return null;
        }
        throw new Error(`FediDB API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('FediDB getFederation error:', error);
      return null;
    }
  }

  /**
   * Get complete instance data from FediDB
   */
  static async getCompleteData(domain: string): Promise<{
    instance: FediDBInstance | null;
    federation: FediDBFederation | null;
  }> {
    const [instance, federation] = await Promise.all([
      this.getInstance(domain),
      this.getFederation(domain)
    ]);

    return { instance, federation };
  }
}
