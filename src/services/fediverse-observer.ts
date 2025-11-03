/**
 * Service for Fediverse Observer API (GraphQL)
 * Provides historical uptime and instance data
 */

export interface FediverseObserverNode {
  name: string;
  host: string;
  software?: string;
  version?: string;
  uptime?: number;
  users?: number;
  statuses?: number;
  connections?: number;
  openRegistrations?: boolean;
  lastSeen?: string;
  upSince?: string;
}

const OBSERVER_API_URL = 'https://api.fediverse.observer';

export class FediverseObserverService {
  /**
   * Query instance information from Fediverse Observer
   * Uses GraphQL API
   */
  static async getInstance(domain: string): Promise<FediverseObserverNode | null> {
    try {
      // GraphQL query for node information
      const query = `
        query GetNode($host: String!) {
          node(host: $host) {
            name
            host
            software
            version
            uptime
            users
            statuses
            connections
            openRegistrations
            lastSeen
            upSince
          }
        }
      `;

      const response = await fetch(OBSERVER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { host: domain }
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        console.warn(`Fediverse Observer API error: ${response.status}`);
        return null;
      }

      const result = await response.json();

      if (result.errors) {
        console.warn('Fediverse Observer GraphQL errors:', result.errors);
        return null;
      }

      if (result.data?.node) {
        console.log('Fediverse Observer data retrieved');
        return result.data.node;
      }

      return null;
    } catch (error) {
      console.error('Error fetching from Fediverse Observer:', error);
      return null;
    }
  }

  /**
   * Check if instance is currently up according to Fediverse Observer
   */
  static async isInstanceUp(domain: string): Promise<boolean | null> {
    try {
      const query = `
        query CheckUptime($host: String!) {
          node(host: $host) {
            uptime
            lastSeen
          }
        }
      `;

      const response = await fetch(OBSERVER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { host: domain }
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) return null;

      const result = await response.json();

      if (result.data?.node) {
        // If lastSeen is recent (within last hour), consider it up
        if (result.data.node.lastSeen) {
          const lastSeen = new Date(result.data.node.lastSeen);
          const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
          return lastSeen > hourAgo;
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking uptime from Fediverse Observer:', error);
      return null;
    }
  }
}
