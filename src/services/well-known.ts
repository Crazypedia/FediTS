/**
 * Service for fetching and parsing .well-known endpoints and robots.txt
 * Provides metadata about instance configuration, policies, and Fediverse support
 */

export interface NodeInfo {
  version: string;
  software: {
    name: string;
    version: string;
    repository?: string;
    homepage?: string;
  };
  protocols: string[];
  services?: {
    inbound?: string[];
    outbound?: string[];
  };
  openRegistrations: boolean;
  usage: {
    users: {
      total?: number;
      activeMonth?: number;
      activeHalfyear?: number;
    };
    localPosts?: number;
    localComments?: number;
  };
  metadata?: Record<string, any>;
}

export interface RobotsTxt {
  raw: string;
  userAgents: {
    agent: string;
    rules: {
      disallow: string[];
      allow: string[];
      crawlDelay?: number;
    };
  }[];
  sitemaps: string[];
  hasRestrictivePolicies: boolean;
}

export interface SecurityTxt {
  contact: string[];
  expires?: string;
  encryption?: string[];
  acknowledgments?: string;
  preferredLanguages?: string[];
  canonical?: string;
  policy?: string;
  hiring?: string;
}

export interface WellKnownData {
  nodeInfo?: NodeInfo;
  robotsTxt?: RobotsTxt;
  securityTxt?: SecurityTxt;
  supportsWebfinger: boolean;
  supportsActivityPub: boolean;
  hasHostMeta: boolean;
  errors: string[];
}

export class WellKnownService {
  /**
   * Fetch NodeInfo - standard for Fediverse instance metadata
   * https://nodeinfo.diaspora.software/
   */
  static async fetchNodeInfo(domain: string): Promise<NodeInfo | null> {
    try {
      // First, get the NodeInfo location from .well-known/nodeinfo
      const wellKnownResponse = await fetch(`https://${domain}/.well-known/nodeinfo`, {
        signal: AbortSignal.timeout(10000)
      });

      if (!wellKnownResponse.ok) {
        console.log('NodeInfo well-known endpoint not found');
        return null;
      }

      const wellKnown = await wellKnownResponse.json();

      // Find the latest NodeInfo version supported
      const links = wellKnown.links || [];
      const nodeInfoLink = links.find((link: any) =>
        link.rel === 'http://nodeinfo.diaspora.software/ns/schema/2.1' ||
        link.rel === 'http://nodeinfo.diaspora.software/ns/schema/2.0'
      );

      if (!nodeInfoLink?.href) {
        console.log('No NodeInfo link found');
        return null;
      }

      // Fetch the actual NodeInfo document
      const nodeInfoResponse = await fetch(nodeInfoLink.href, {
        signal: AbortSignal.timeout(10000)
      });

      if (!nodeInfoResponse.ok) {
        return null;
      }

      const nodeInfo = await nodeInfoResponse.json();
      console.log('NodeInfo fetched successfully');
      return nodeInfo;

    } catch (error) {
      console.error('Error fetching NodeInfo:', error);
      return null;
    }
  }

  /**
   * Fetch and parse robots.txt
   */
  static async fetchRobotsTxt(domain: string): Promise<RobotsTxt | null> {
    try {
      const response = await fetch(`https://${domain}/robots.txt`, {
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        return null;
      }

      const raw = await response.text();
      return this.parseRobotsTxt(raw);

    } catch (error) {
      console.error('Error fetching robots.txt:', error);
      return null;
    }
  }

  /**
   * Parse robots.txt content
   */
  private static parseRobotsTxt(raw: string): RobotsTxt {
    const userAgents: RobotsTxt['userAgents'] = [];
    const sitemaps: string[] = [];

    const lines = raw.split('\n').map(line => line.trim());
    let currentAgent: any = null;

    for (const line of lines) {
      if (!line || line.startsWith('#')) continue;

      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();

      if (!key || !value) continue;

      const lowerKey = key.toLowerCase().trim();

      if (lowerKey === 'user-agent') {
        if (currentAgent) {
          userAgents.push(currentAgent);
        }
        currentAgent = {
          agent: value,
          rules: { disallow: [], allow: [] }
        };
      } else if (lowerKey === 'disallow' && currentAgent) {
        currentAgent.rules.disallow.push(value);
      } else if (lowerKey === 'allow' && currentAgent) {
        currentAgent.rules.allow.push(value);
      } else if (lowerKey === 'crawl-delay' && currentAgent) {
        currentAgent.rules.crawlDelay = parseFloat(value);
      } else if (lowerKey === 'sitemap') {
        sitemaps.push(value);
      }
    }

    if (currentAgent) {
      userAgents.push(currentAgent);
    }

    // Determine if policies are restrictive
    const hasRestrictivePolicies = userAgents.some(ua =>
      ua.agent === '*' && ua.rules.disallow.some(path => path === '/' || path.length > 10)
    );

    return {
      raw,
      userAgents,
      sitemaps,
      hasRestrictivePolicies
    };
  }

  /**
   * Fetch security.txt
   */
  static async fetchSecurityTxt(domain: string): Promise<SecurityTxt | null> {
    try {
      // Try .well-known/security.txt first (RFC 9116)
      let response = await fetch(`https://${domain}/.well-known/security.txt`, {
        signal: AbortSignal.timeout(10000)
      });

      // Fallback to /security.txt (legacy location)
      if (!response.ok) {
        response = await fetch(`https://${domain}/security.txt`, {
          signal: AbortSignal.timeout(10000)
        });
      }

      if (!response.ok) {
        return null;
      }

      const raw = await response.text();
      return this.parseSecurityTxt(raw);

    } catch (error) {
      console.error('Error fetching security.txt:', error);
      return null;
    }
  }

  /**
   * Parse security.txt
   */
  private static parseSecurityTxt(raw: string): SecurityTxt {
    const security: SecurityTxt = { contact: [] };

    const lines = raw.split('\n').map(line => line.trim());

    for (const line of lines) {
      if (!line || line.startsWith('#')) continue;

      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const value = line.slice(colonIndex + 1).trim();

      switch (key) {
        case 'contact':
          security.contact.push(value);
          break;
        case 'expires':
          security.expires = value;
          break;
        case 'encryption':
          security.encryption = security.encryption || [];
          security.encryption.push(value);
          break;
        case 'acknowledgments':
        case 'acknowledgements':
          security.acknowledgments = value;
          break;
        case 'preferred-languages':
          security.preferredLanguages = value.split(',').map(l => l.trim());
          break;
        case 'canonical':
          security.canonical = value;
          break;
        case 'policy':
          security.policy = value;
          break;
        case 'hiring':
          security.hiring = value;
          break;
      }
    }

    return security;
  }

  /**
   * Check if webfinger is supported
   */
  static async checkWebfinger(domain: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://${domain}/.well-known/webfinger?resource=acct:test@${domain}`,
        { signal: AbortSignal.timeout(5000) }
      );
      // 404 is expected for non-existent user, but endpoint exists
      // 400 is also acceptable (endpoint exists but rejects format)
      return response.status === 404 || response.status === 400 || response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Check if host-meta is available
   */
  static async checkHostMeta(domain: string): Promise<boolean> {
    try {
      const response = await fetch(`https://${domain}/.well-known/host-meta`, {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get all well-known data for a domain
   */
  static async getCompleteData(domain: string): Promise<WellKnownData> {
    const errors: string[] = [];

    const [
      nodeInfo,
      robotsTxt,
      securityTxt,
      supportsWebfinger,
      hasHostMeta
    ] = await Promise.all([
      this.fetchNodeInfo(domain).catch(err => {
        errors.push(`NodeInfo: ${err.message}`);
        return null;
      }),
      this.fetchRobotsTxt(domain).catch(err => {
        errors.push(`robots.txt: ${err.message}`);
        return null;
      }),
      this.fetchSecurityTxt(domain).catch(err => {
        errors.push(`security.txt: ${err.message}`);
        return null;
      }),
      this.checkWebfinger(domain).catch(() => false),
      this.checkHostMeta(domain).catch(() => false)
    ]);

    // ActivityPub is indicated by NodeInfo protocols or webfinger support
    const supportsActivityPub =
      nodeInfo?.protocols?.includes('activitypub') ||
      supportsWebfinger;

    return {
      nodeInfo: nodeInfo || undefined,
      robotsTxt: robotsTxt || undefined,
      securityTxt: securityTxt || undefined,
      supportsWebfinger,
      supportsActivityPub,
      hasHostMeta,
      errors: errors.filter(e => !e.includes('404')) // Filter out expected 404s
    };
  }
}
