/**
 * Service for detecting infrastructure and hosting information
 * Detects cloud providers, CDN, server software, etc.
 */

export interface InfrastructureInfo {
  cloudProvider?: string;
  cdn?: string;
  server?: string;
  country?: string;
  ip?: string;
  headers?: Record<string, string>;
}

export class InfrastructureService {
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

      // Detect CDN
      const cdnHeaders = [
        'cf-ray', // Cloudflare
        'x-amz-cf-id', // AWS CloudFront
        'x-fastly-request-id', // Fastly
        'x-akamai-transformed', // Akamai
        'x-cdn', // Generic CDN
        'x-edge-location', // Generic edge
      ];

      for (const header of cdnHeaders) {
        if (headers[header]) {
          if (header.startsWith('cf-')) {
            info.cdn = 'Cloudflare';
          } else if (header.startsWith('x-amz')) {
            info.cdn = 'AWS CloudFront';
          } else if (header.includes('fastly')) {
            info.cdn = 'Fastly';
          } else if (header.includes('akamai')) {
            info.cdn = 'Akamai';
          } else {
            info.cdn = headers[header];
          }
          break;
        }
      }

      // Detect cloud provider from headers and patterns
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

      // Detect from server header patterns
      if (!info.cloudProvider && info.server) {
        const server = info.server.toLowerCase();
        if (server.includes('nginx')) {
          // Could be self-hosted or various providers
          if (server.includes('cloudflare')) {
            info.cloudProvider = 'Cloudflare';
          }
        }
      }

    } catch (error) {
      console.error('Error detecting infrastructure:', error);
    }

    return info;
  }

  /**
   * Get a human-readable summary of infrastructure
   */
  static getSummary(info: InfrastructureInfo): string[] {
    const summary: string[] = [];

    if (info.cloudProvider) {
      summary.push(`Hosted on: ${info.cloudProvider}`);
    }

    if (info.cdn) {
      summary.push(`CDN: ${info.cdn}`);
    }

    if (info.server) {
      summary.push(`Server: ${info.server}`);
    }

    if (summary.length === 0) {
      summary.push('Infrastructure details not detected');
    }

    return summary;
  }
}
