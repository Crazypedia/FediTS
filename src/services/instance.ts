import generator, { detector, MegalodonInterface } from 'megalodon';
import type { MastodonInstance, MastodonRule } from '../types';

export class InstanceAPIService {
  /**
   * Detect the type of Fediverse server
   * Supports: Mastodon, Pleroma, Misskey, Friendica, GoToSocial, Firefish, Pixelfed
   */
  static async detectServerType(domain: string): Promise<'mastodon' | 'pleroma' | 'friendica' | 'gotosocial' | 'firefish' | 'pixelfed' | null> {
    try {
      const serverType = await detector(`https://${domain}`);
      console.log(`Detected server type for ${domain}: ${serverType}`);
      return serverType;
    } catch (error) {
      console.error('Error detecting server type:', error);
      return null;
    }
  }

  /**
   * Create a megalodon client for the instance
   * Sharkey, Calckey, and other Misskey forks should use 'misskey' client type
   */
  static async createClient(domain: string): Promise<MegalodonInterface | null> {
    try {
      const serverType = await this.detectServerType(domain);
      if (!serverType) {
        console.warn(`Could not detect server type for ${domain}, defaulting to mastodon`);
        return generator('mastodon', `https://${domain}`);
      }

      // Firefish, Sharkey, Calckey are Misskey-compatible but not in megalodon types
      // We'll handle them specially in the fallback
      return generator(serverType, `https://${domain}`);
    } catch (error) {
      console.error('Error creating megalodon client:', error);
      return null;
    }
  }

  /**
   * Fetch instance information using megalodon
   * Works with Mastodon, Pleroma, Misskey, and other Fediverse software
   */
  static async getInstanceInfo(domain: string): Promise<MastodonInstance | null> {
    try {
      const client = await this.createClient(domain);
      if (!client) {
        return this.getInstanceInfoFallback(domain);
      }

      const response = await client.getInstance();
      return response.data as unknown as MastodonInstance;
    } catch (error) {
      console.error('Instance API getInstanceInfo error:', error);

      // Try Misskey-compatible API for Sharkey/Calckey/Firefish forks
      try {
        const misskeyClient = generator('firefish', `https://${domain}`);
        const response = await misskeyClient.getInstance();
        return response.data as unknown as MastodonInstance;
      } catch (misskeyError) {
        console.error('Misskey-compatible client also failed:', misskeyError);
      }

      // Final fallback to direct fetch
      return this.getInstanceInfoFallback(domain);
    }
  }

  /**
   * Fallback method using direct fetch for instances that might not work with megalodon
   */
  private static async getInstanceInfoFallback(domain: string): Promise<MastodonInstance | null> {
    try {
      const response = await fetch(`https://${domain}/api/v1/instance`, {
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Instance API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Instance API fallback error:', error);
      return null;
    }
  }

  /**
   * Fetch moderation rules from the instance
   * Note: Not all instances support rules endpoint, so we use fallback
   */
  static async getRules(domain: string): Promise<MastodonRule[]> {
    return this.getRulesFallback(domain);
  }

  /**
   * Fallback method for fetching rules
   */
  private static async getRulesFallback(domain: string): Promise<MastodonRule[]> {
    try {
      const response = await fetch(`https://${domain}/api/v1/instance/rules`, {
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Rules endpoint not available for ${domain}`);
          return [];
        }
        throw new Error(`Rules API error: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Instance API getRules fallback error:', error);
      return [];
    }
  }

  /**
   * Fetch list of federated peers (if publicly available)
   * Note: Not all instances expose peers, use direct fetch
   */
  static async getPeers(domain: string): Promise<string[]> {
    return this.getPeersFallback(domain);
  }

  /**
   * Fallback method for fetching peers
   */
  private static async getPeersFallback(domain: string): Promise<string[]> {
    try {
      const response = await fetch(`https://${domain}/api/v1/instance/peers`, {
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 403) {
          console.warn(`Peers endpoint not available for ${domain}`);
          return [];
        }
        throw new Error(`Peers API error: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Instance API getPeers fallback error:', error);
      return [];
    }
  }

  /**
   * Detect the software type based on instance response
   * Checks version string and other metadata
   */
  static detectSoftware(instance: MastodonInstance): string {
    if (!instance.version) return 'unknown';

    const version = instance.version.toLowerCase();

    // Check specific software types (order matters - check forks before base)
    if (version.includes('sharkey')) return 'sharkey';
    if (version.includes('firefish')) return 'firefish';
    if (version.includes('calckey')) return 'calckey';
    if (version.includes('foundkey')) return 'foundkey';
    if (version.includes('misskey')) return 'misskey';

    if (version.includes('akkoma')) return 'akkoma';
    if (version.includes('pleroma')) return 'pleroma';

    if (version.includes('glitch')) return 'mastodon-glitch';
    if (version.includes('hometown')) return 'mastodon-hometown';
    if (version.includes('mastodon')) return 'mastodon';

    if (version.includes('gotosocial')) return 'gotosocial';
    if (version.includes('pixelfed')) return 'pixelfed';
    if (version.includes('peertube')) return 'peertube';
    if (version.includes('lemmy')) return 'lemmy';
    if (version.includes('friendica')) return 'friendica';
    if (version.includes('hubzilla')) return 'hubzilla';
    if (version.includes('bookwyrm')) return 'bookwyrm';
    if (version.includes('writefreely')) return 'writefreely';
    if (version.includes('wordpress')) return 'wordpress+activitypub';

    return 'other';
  }

  /**
   * Get complete instance data
   */
  static async getCompleteData(domain: string): Promise<{
    instance: MastodonInstance | null;
    rules: MastodonRule[];
    peers: string[];
    software?: string;
    serverType?: string;
  }> {
    // Detect server type first
    const serverType = await this.detectServerType(domain);

    const instance = await this.getInstanceInfo(domain);

    if (!instance) {
      return {
        instance: null,
        rules: [],
        peers: [],
        software: undefined,
        serverType: serverType || undefined
      };
    }

    const [rules, peers] = await Promise.all([
      this.getRules(domain),
      this.getPeers(domain)
    ]);

    const software = this.detectSoftware(instance);

    return {
      instance,
      rules,
      peers,
      software,
      serverType: serverType || undefined
    };
  }
}
