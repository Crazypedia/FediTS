/**
 * Service for detecting infrastructure and hosting information
 * Detects cloud providers, CDN, server software, hosting provider, country, etc.
 */

export interface InfrastructureInfo {
  cloudProvider?: string;
  hostingProvider?: string;
  cdn?: string;
  server?: string;
  country?: string;
  countryCode?: string;
  city?: string;
  ip?: string;
  asn?: string;
  asnOrg?: string;
  isCloudflare?: boolean;
  headers?: Record<string, string>;
}

export class InfrastructureService {
  /**
   * Detect IP address from domain
   */
  private static async resolveIP(domain: string): Promise<string | null> {
    try {
      // Use a DNS-over-HTTPS service to resolve IP
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.Answer && data.Answer.length > 0) {
        return data.Answer[0].data;
      }
      return null;
    } catch (error) {
      console.error('Error resolving IP:', error);
      return null;
    }
  }

  /**
   * Get geolocation and hosting info from IP
   */
  private static async getIPInfo(ip: string): Promise<Partial<InfrastructureInfo>> {
    try {
      // Using ip-api.com - free tier, no key needed, 45 requests/minute
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,isp,org,as,hosting`, {
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) return {};

      const data = await response.json();

      if (data.status !== 'success') return {};

      const info: Partial<InfrastructureInfo> = {
        country: data.country,
        countryCode: data.countryCode,
        city: data.city,
        asn: data.as,
        asnOrg: data.org || data.isp
      };

      // Detect hosting provider from ASN/ISP
      const provider = this.detectHostingProvider(data.isp, data.org, data.as);
      if (provider) {
        info.hostingProvider = provider;
      }

      return info;
    } catch (error) {
      console.error('Error fetching IP info:', error);
      return {};
    }
  }

  /**
   * Detect hosting provider from ISP/ASN information
   */
  private static detectHostingProvider(isp?: string, org?: string, asn?: string): string | undefined {
    const text = `${isp} ${org} ${asn}`.toLowerCase();

    // Popular hosting providers
    const providers: Record<string, string> = {
      'hetzner': 'Hetzner Online',
      'ovh': 'OVH',
      'digitalocean': 'DigitalOcean',
      'linode': 'Linode (Akamai)',
      'vultr': 'Vultr',
      'scaleway': 'Scaleway',
      'contabo': 'Contabo',
      'amazon': 'Amazon Web Services (AWS)',
      'aws': 'Amazon Web Services (AWS)',
      'google cloud': 'Google Cloud Platform',
      'gcp': 'Google Cloud Platform',
      'microsoft': 'Microsoft Azure',
      'azure': 'Microsoft Azure',
      'cloudflare': 'Cloudflare',
      'fastly': 'Fastly',
      'bytedance': 'ByteDance',
      'alibaba': 'Alibaba Cloud',
      'tencent': 'Tencent Cloud',
      'oracle': 'Oracle Cloud',
      'ibm': 'IBM Cloud',
      'rackspace': 'Rackspace',
      'bluehost': 'Bluehost',
      'godaddy': 'GoDaddy',
      'dreamhost': 'DreamHost',
      'hostgator': 'HostGator',
      'namecheap': 'Namecheap',
      'leaseweb': 'LeaseWeb',
      'serverius': 'Serverius',
      'anexia': 'Anexia',
      'netcup': 'netcup',
      'ionos': 'IONOS',
      '1&1': '1&1 IONOS',
      'strato': 'Strato',
      'kimsufi': 'Kimsufi (OVH)',
      'soyoustart': 'So you Start (OVH)',
      'online.net': 'Online.net (Scaleway)',
      'dedibox': 'Dedibox (Scaleway)',
    };

    for (const [key, name] of Object.entries(providers)) {
      if (text.includes(key)) {
        return name;
      }
    }

    return undefined;
  }

  /**
   * Detect infrastructure information from HTTP headers and DNS
   */
  static async detectInfrastructure(domain: string): Promise<InfrastructureInfo> {
    const info: InfrastructureInfo = {};

    try {
      // Fetch with HEAD request to get headers without body
      const response = await fetch(`https://${domain}/`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      });

      // Extract relevant headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      info.headers = headers;

      // Detect server software
      if (headers['server']) {
        info.server = headers['server'];
      }

      // Detect Cloudflare specifically
      if (headers['cf-ray'] || headers['cf-cache-status'] || headers['cf-request-id']) {
        info.isCloudflare = true;
        info.cdn = 'Cloudflare';
      }

      // Detect other CDNs
      if (!info.cdn) {
        const cdnHeaders = [
          { header: 'x-amz-cf-id', cdn: 'AWS CloudFront' },
          { header: 'x-fastly-request-id', cdn: 'Fastly' },
          { header: 'x-akamai-transformed', cdn: 'Akamai' },
          { header: 'x-cache', cdn: 'Generic CDN' },
          { header: 'x-edge-location', cdn: 'Edge Network' },
        ];

        for (const { header, cdn } of cdnHeaders) {
          if (headers[header]) {
            info.cdn = cdn;
            break;
          }
        }
      }

      // Detect cloud provider from headers
      if (headers['x-amzn-requestid'] || headers['x-amz-id-2']) {
        info.cloudProvider = 'Amazon Web Services (AWS)';
      } else if (headers['x-ms-request-id'] || headers['x-azure-ref']) {
        info.cloudProvider = 'Microsoft Azure';
      } else if (headers['x-goog-generation'] || headers['x-guploader-uploadid']) {
        info.cloudProvider = 'Google Cloud Platform';
      } else if (headers['server']?.includes('cloudflare')) {
        info.cloudProvider = 'Cloudflare Pages/Workers';
      } else if (headers['x-vercel-id'] || headers['x-vercel-cache']) {
        info.cloudProvider = 'Vercel';
      } else if (headers['x-nf-request-id']) {
        info.cloudProvider = 'Netlify';
      } else if (headers['x-do-app-origin']) {
        info.cloudProvider = 'DigitalOcean App Platform';
      } else if (headers['x-render-id']) {
        info.cloudProvider = 'Render';
      } else if (headers['x-fly-request-id']) {
        info.cloudProvider = 'Fly.io';
      }

      // If Cloudflare is detected, note it in cloud provider too
      if (info.isCloudflare && !info.cloudProvider) {
        info.cloudProvider = 'Behind Cloudflare (origin unknown)';
      }

    } catch (error) {
      console.error('Error detecting infrastructure from headers:', error);
    }

    // Resolve IP and get geolocation/hosting info
    try {
      const ip = await this.resolveIP(domain);
      if (ip) {
        info.ip = ip;

        // Get geolocation and hosting provider info
        const ipInfo = await this.getIPInfo(ip);
        Object.assign(info, ipInfo);

        // If we detected hosting provider but not cloud provider, use hosting provider
        if (info.hostingProvider && !info.cloudProvider) {
          info.cloudProvider = info.hostingProvider;
        }
      }
    } catch (error) {
      console.error('Error resolving IP/geolocation:', error);
    }

    return info;
  }

  /**
   * Get a human-readable summary of infrastructure
   */
  static getSummary(info: InfrastructureInfo): string[] {
    const summary: string[] = [];

    if (info.isCloudflare) {
      summary.push('🛡️ Protected by Cloudflare');
    }

    if (info.hostingProvider) {
      summary.push(`🏢 Hosted by: ${info.hostingProvider}`);
    } else if (info.cloudProvider) {
      summary.push(`☁️ Cloud: ${info.cloudProvider}`);
    }

    if (info.country) {
      const flag = info.countryCode ? this.getCountryFlag(info.countryCode) : '';
      summary.push(`${flag} ${info.city ? `${info.city}, ` : ''}${info.country}`);
    }

    if (info.cdn && !info.isCloudflare) {
      summary.push(`🌐 CDN: ${info.cdn}`);
    }

    if (info.server) {
      summary.push(`⚙️ Server: ${info.server}`);
    }

    if (info.asn) {
      summary.push(`🔢 ASN: ${info.asn}`);
    }

    if (summary.length === 0) {
      summary.push('Infrastructure details not detected');
    }

    return summary;
  }

  /**
   * Get country flag emoji from country code
   */
  private static getCountryFlag(countryCode: string): string {
    if (countryCode.length !== 2) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
}
