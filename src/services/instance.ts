import type { MastodonInstance, MastodonRule } from '../types';

export class InstanceAPIService {
  /**
   * Fetch instance information directly from the instance's API
   * Works with Mastodon, Pleroma, and compatible software
   */
  static async getInstanceInfo(domain: string): Promise<MastodonInstance | null> {
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
      console.error('Instance API getInstanceInfo error:', error);
      return null;
    }
  }

  /**
   * Fetch moderation rules from the instance
   */
  static async getRules(domain: string): Promise<MastodonRule[]> {
    try {
      const response = await fetch(`https://${domain}/api/v1/instance/rules`, {
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        // Rules endpoint might not exist on all instances
        if (response.status === 404) {
          console.warn(`Rules endpoint not available for ${domain}`);
          return [];
        }
        throw new Error(`Rules API error: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Instance API getRules error:', error);
      return [];
    }
  }

  /**
   * Fetch list of federated peers (if publicly available)
   */
  static async getPeers(domain: string): Promise<string[]> {
    try {
      const response = await fetch(`https://${domain}/api/v1/instance/peers`, {
        headers: {
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        // Peers endpoint might be disabled on some instances
        if (response.status === 404 || response.status === 403) {
          console.warn(`Peers endpoint not available for ${domain}`);
          return [];
        }
        throw new Error(`Peers API error: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Instance API getPeers error:', error);
      return [];
    }
  }

  /**
   * Detect the software type based on instance response
   */
  static detectSoftware(instance: MastodonInstance): string {
    if (!instance.version) return 'unknown';

    const version = instance.version.toLowerCase();

    if (version.includes('mastodon')) return 'mastodon';
    if (version.includes('pleroma')) return 'pleroma';
    if (version.includes('misskey')) return 'misskey';
    if (version.includes('lemmy')) return 'lemmy';
    if (version.includes('pixelfed')) return 'pixelfed';
    if (version.includes('peertube')) return 'peertube';
    if (version.includes('friendica')) return 'friendica';

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
  }> {
    const instance = await this.getInstanceInfo(domain);

    if (!instance) {
      return {
        instance: null,
        rules: [],
        peers: [],
        software: undefined
      };
    }

    const [rules, peers] = await Promise.all([
      this.getRules(domain),
      this.getPeers(domain)
    ]);

    const software = this.detectSoftware(instance);

    return { instance, rules, peers, software };
  }
}
