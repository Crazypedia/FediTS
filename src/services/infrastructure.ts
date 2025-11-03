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
      const response = await fetch(`https://ip-api.com/json/${ip}?fields=status,country,countryCode,city,isp,org,as,hosting`, {
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
   * Detect CDN via DNS CNAME records
   */
  private static async detectCDNviaDNS(domain: string): Promise<string | null> {
    try {
      const response = await fetch(
        `https://dns.google/resolve?name=${domain}&type=CNAME`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!response.ok) return null;

      const data = await response.json();

      if (data.Answer) {
        for (const record of data.Answer) {
          if (record.type === 5) { // CNAME record
            const cname = record.data.toLowerCase();

            // Check common CDN patterns
            if (cname.includes('cloudflare')) return 'Cloudflare';
            if (cname.includes('fastly')) return 'Fastly';
            if (cname.includes('akamai')) return 'Akamai';
            if (cname.includes('cloudfront')) return 'AWS CloudFront';
            if (cname.includes('cdn77')) return 'CDN77';
            if (cname.includes('stackpath')) return 'StackPath';
            if (cname.includes('bunnycdn') || cname.includes('b-cdn')) return 'BunnyCDN';
            if (cname.includes('imperva') || cname.includes('incapsula')) return 'Imperva';
            if (cname.includes('edgecast')) return 'Edgecast (Verizon)';
            if (cname.includes('netlify')) return 'Netlify';
            if (cname.includes('vercel')) return 'Vercel';
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error detecting CDN via DNS:', error);
      return null;
    }
  }

  /**
   * Enhanced CDN detection from HTTP headers
   */
  private static detectCDNFromHeaders(headers: Record<string, string>): string | null {
    // Cloudflare
    if (headers['cf-ray'] || headers['cf-cache-status'] || headers['cf-request-id']) {
      return 'Cloudflare';
    }

    // Fastly
    if (headers['x-served-by']?.includes('fastly') ||
        headers['x-fastly-request-id'] ||
        headers['fastly-ff']) {
      return 'Fastly';
    }

    // Akamai
    if (headers['x-akamai-request-id'] ||
        headers['x-akamai-transformed'] ||
        headers['server']?.toLowerCase().includes('akamaighost')) {
      return 'Akamai';
    }

    // AWS CloudFront
    if (headers['x-amz-cf-id'] || headers['x-amz-cf-pop']) {
      return 'AWS CloudFront';
    }

    // BunnyCDN
    if (headers['cdn-pullzone'] || headers['bunnycdn-cache-status']) {
      return 'BunnyCDN';
    }

    // CDN77
    if (headers['x-cdn'] === 'cdn77') {
      return 'CDN77';
    }

    // StackPath
    if (headers['server']?.includes('stackpath') || headers['x-sp-url']) {
      return 'StackPath';
    }

    // Check via header for proxy/CDN chains
    if (headers['via']) {
      const via = headers['via'].toLowerCase();
      if (via.includes('cloudflare')) return 'Cloudflare';
      if (via.includes('fastly')) return 'Fastly';
      if (via.includes('akamai')) return 'Akamai';
      if (via.includes('varnish')) return 'Varnish Cache';
    }

    // Check x-cache header
    if (headers['x-cache']) {
      const cache = headers['x-cache'].toLowerCase();
      if (cache.includes('cloudfront')) return 'AWS CloudFront';
      if (cache.includes('fastly')) return 'Fastly';
    }

    // Check server-timing header (some CDNs expose this)
    if (headers['server-timing']) {
      const timing = headers['server-timing'].toLowerCase();
      if (timing.includes('cdn')) return 'CDN (detected via server-timing)';
    }

    // Check cdn-loop header (RFC 8586 - CDN loop prevention)
    if (headers['cdn-loop']) {
      const loop = headers['cdn-loop'].toLowerCase();
      if (loop.includes('cloudflare')) return 'Cloudflare';
      if (loop.includes('fastly')) return 'Fastly';
      if (loop.includes('akamai')) return 'Akamai';
    }

    return null;
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

      // Use enhanced CDN detection from HTTP headers
      const cdnFromHeaders = this.detectCDNFromHeaders(headers);
      if (cdnFromHeaders) {
        info.cdn = cdnFromHeaders;
        // Mark Cloudflare specifically
        if (cdnFromHeaders === 'Cloudflare') {
          info.isCloudflare = true;
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

    // If CDN not detected via headers, try DNS CNAME detection
    if (!info.cdn) {
      try {
        const cdnViaDNS = await this.detectCDNviaDNS(domain);
        if (cdnViaDNS) {
          info.cdn = cdnViaDNS;
          console.log(`CDN detected via DNS CNAME: ${cdnViaDNS}`);
          // Mark Cloudflare specifically
          if (cdnViaDNS === 'Cloudflare') {
            info.isCloudflare = true;
          }
        }
      } catch (error) {
        console.error('Error detecting CDN via DNS:', error);
      }
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
