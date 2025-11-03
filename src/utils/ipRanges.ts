/**
 * IP Range Detection for Cloud Providers and CDNs
 *
 * Uses publicly documented IP ranges to identify infrastructure providers.
 * Sources:
 * - AWS: https://ip-ranges.amazonaws.com/ip-ranges.json
 * - Google Cloud: https://www.gstatic.com/ipranges/cloud.json
 * - Azure: https://www.microsoft.com/en-us/download/details.aspx?id=56519
 * - Cloudflare: https://www.cloudflare.com/ips-v4 and /ips-v6
 * - Oracle Cloud: https://docs.oracle.com/en-us/iaas/tools/public_ip_ranges.json
 * - DigitalOcean: Known ranges from documentation
 * - Hetzner: Known ranges from documentation
 * - OVH: Known ranges from documentation
 */

export interface IPRangeProvider {
  name: string;
  category: 'cloud' | 'cdn' | 'hosting';
  ranges: string[]; // CIDR notation
}

/**
 * Sample of well-known IP ranges for major providers
 * Note: This is a curated subset. Full lists would be too large for client-side bundling.
 * These ranges are commonly seen in Fediverse hosting.
 */
export const KNOWN_IP_RANGES: IPRangeProvider[] = [
  // Cloudflare (CDN) - Sample ranges
  {
    name: 'Cloudflare',
    category: 'cdn',
    ranges: [
      '173.245.48.0/20',
      '103.21.244.0/22',
      '103.22.200.0/22',
      '103.31.4.0/22',
      '141.101.64.0/18',
      '108.162.192.0/18',
      '190.93.240.0/20',
      '188.114.96.0/20',
      '197.234.240.0/22',
      '198.41.128.0/17',
      '162.158.0.0/15',
      '104.16.0.0/13',
      '104.24.0.0/14',
      '172.64.0.0/13',
      '131.0.72.0/22'
    ]
  },

  // AWS - Sample ranges (commonly used regions)
  {
    name: 'Amazon Web Services (AWS)',
    category: 'cloud',
    ranges: [
      // US East (commonly used for Fediverse)
      '3.0.0.0/8',
      '13.0.0.0/8',
      '18.0.0.0/8',
      '35.0.0.0/8',
      '52.0.0.0/8',
      '54.0.0.0/8',
      // EU regions
      '18.130.0.0/16',
      '35.176.0.0/15',
      '52.16.0.0/15',
      // Asia Pacific
      '13.112.0.0/14',
      '52.192.0.0/11'
    ]
  },

  // Google Cloud Platform
  {
    name: 'Google Cloud Platform',
    category: 'cloud',
    ranges: [
      '34.0.0.0/8',
      '35.184.0.0/13',
      '35.192.0.0/12',
      '35.208.0.0/12',
      '35.224.0.0/12',
      '35.240.0.0/13',
      '130.211.0.0/16',
      '34.64.0.0/10',
      '34.128.0.0/10'
    ]
  },

  // Microsoft Azure
  {
    name: 'Microsoft Azure',
    category: 'cloud',
    ranges: [
      '13.64.0.0/11',
      '13.96.0.0/13',
      '13.104.0.0/14',
      '20.0.0.0/8',
      '23.96.0.0/13',
      '40.0.0.0/8',
      '51.0.0.0/8',
      '52.0.0.0/8',
      '104.0.0.0/8',
      '137.116.0.0/15',
      '137.135.0.0/16',
      '138.91.0.0/16',
      '157.54.0.0/15',
      '168.61.0.0/16'
    ]
  },

  // Oracle Cloud Infrastructure
  {
    name: 'Oracle Cloud Infrastructure',
    category: 'cloud',
    ranges: [
      '129.146.0.0/16',
      '129.213.0.0/16',
      '130.35.0.0/16',
      '132.145.0.0/16',
      '134.70.0.0/16',
      '138.1.0.0/16',
      '140.91.0.0/16',
      '147.154.0.0/16',
      '150.136.0.0/16',
      '152.67.0.0/16'
    ]
  },

  // Hetzner (Popular European hosting for Fediverse)
  {
    name: 'Hetzner',
    category: 'hosting',
    ranges: [
      '88.99.0.0/16',
      '138.201.0.0/16',
      '144.76.0.0/16',
      '148.251.0.0/16',
      '159.69.0.0/16',
      '168.119.0.0/16',
      '176.9.0.0/16',
      '178.63.0.0/16',
      '188.40.0.0/16',
      '195.201.0.0/16',
      '213.133.96.0/19',
      '213.239.192.0/18',
      '5.9.0.0/16',
      '46.4.0.0/16',
      '49.12.0.0/16',
      '49.13.0.0/16',
      '65.108.0.0/16',
      '65.109.0.0/16',
      '78.46.0.0/15',
      '85.10.192.0/18',
      '94.130.0.0/16',
      '95.216.0.0/16',
      '116.202.0.0/16',
      '116.203.0.0/16',
      '135.181.0.0/16',
      '136.243.0.0/16',
      '138.201.0.0/16',
      '142.132.0.0/16',
      '157.90.0.0/16'
    ]
  },

  // DigitalOcean (Popular for Fediverse)
  {
    name: 'DigitalOcean',
    category: 'hosting',
    ranges: [
      '104.131.0.0/16',
      '104.236.0.0/16',
      '107.170.0.0/16',
      '138.197.0.0/16',
      '138.68.0.0/16',
      '139.59.0.0/16',
      '157.230.0.0/16',
      '159.65.0.0/16',
      '159.89.0.0/16',
      '161.35.0.0/16',
      '162.243.0.0/16',
      '164.90.0.0/16',
      '165.227.0.0/16',
      '165.232.0.0/16',
      '167.71.0.0/16',
      '167.99.0.0/16',
      '167.172.0.0/16',
      '174.138.0.0/16',
      '178.62.0.0/16',
      '188.166.0.0/16',
      '188.226.0.0/16',
      '192.241.0.0/16',
      '206.189.0.0/16',
      '209.97.128.0/18',
      '45.55.0.0/16',
      '46.101.0.0/16',
      '64.225.0.0/16',
      '67.205.128.0/18',
      '68.183.0.0/16'
    ]
  },

  // OVH (Major European provider)
  {
    name: 'OVH',
    category: 'hosting',
    ranges: [
      '51.38.0.0/16',
      '51.68.0.0/16',
      '51.75.0.0/16',
      '51.77.0.0/16',
      '51.79.0.0/16',
      '51.81.0.0/16',
      '51.83.0.0/16',
      '51.89.0.0/16',
      '51.91.0.0/16',
      '51.195.0.0/16',
      '51.210.0.0/16',
      '51.222.0.0/16',
      '54.36.0.0/16',
      '54.37.0.0/16',
      '54.38.0.0/16',
      '57.128.0.0/16',
      '91.121.0.0/16',
      '135.125.0.0/16',
      '137.74.0.0/16',
      '139.99.0.0/16',
      '141.94.0.0/16',
      '141.95.0.0/16',
      '145.239.0.0/16',
      '146.59.0.0/16',
      '147.135.0.0/16',
      '151.80.0.0/16',
      '152.228.0.0/16',
      '158.69.0.0/16',
      '167.114.0.0/16',
      '178.32.0.0/15',
      '185.15.68.0/22',
      '188.165.0.0/16',
      '192.95.0.0/16',
      '193.70.0.0/16',
      '198.27.64.0/18',
      '198.50.128.0/17',
      '199.231.224.0/20',
      '212.83.128.0/19',
      '213.186.32.0/19',
      '213.251.128.0/18'
    ]
  },

  // Linode (Akamai) - Popular for Fediverse
  {
    name: 'Linode (Akamai)',
    category: 'hosting',
    ranges: [
      '45.33.0.0/16',
      '45.56.0.0/16',
      '45.79.0.0/16',
      '50.116.0.0/18',
      '66.175.208.0/20',
      '66.228.32.0/19',
      '69.164.192.0/19',
      '72.14.176.0/20',
      '85.90.244.0/22',
      '96.126.96.0/19',
      '97.107.128.0/18',
      '103.3.60.0/22',
      '103.41.124.0/22',
      '104.200.16.0/20',
      '104.237.128.0/17',
      '106.187.32.0/19',
      '139.144.0.0/16',
      '139.162.0.0/16',
      '170.187.128.0/17',
      '172.104.0.0/15',
      '172.232.0.0/16',
      '172.233.0.0/16',
      '172.234.0.0/16',
      '173.230.128.0/19',
      '173.255.192.0/18',
      '176.58.96.0/19',
      '178.79.128.0/17',
      '185.3.92.0/22',
      '192.46.208.0/20',
      '192.53.112.0/20',
      '192.81.128.0/17',
      '192.155.80.0/20',
      '198.58.96.0/19',
      '198.74.48.0/20',
      '212.71.232.0/21',
      '212.111.32.0/19'
    ]
  },

  // Vultr
  {
    name: 'Vultr',
    category: 'hosting',
    ranges: [
      '45.32.0.0/16',
      '45.63.0.0/16',
      '45.76.0.0/16',
      '45.77.0.0/16',
      '66.42.0.0/16',
      '95.179.128.0/17',
      '104.156.224.0/19',
      '108.61.0.0/16',
      '140.82.0.0/15',
      '144.202.0.0/16',
      '149.28.0.0/16',
      '155.138.128.0/17',
      '207.148.0.0/18',
      '207.246.64.0/18',
      '216.128.128.0/17'
    ]
  },

  // Scaleway
  {
    name: 'Scaleway',
    category: 'hosting',
    ranges: [
      '51.15.0.0/16',
      '51.158.0.0/15',
      '62.210.0.0/16',
      '163.172.0.0/16',
      '195.154.0.0/16',
      '212.47.224.0/19',
      '212.129.0.0/18'
    ]
  },

  // Contabo
  {
    name: 'Contabo',
    category: 'hosting',
    ranges: [
      '173.212.192.0/18',
      '173.249.0.0/17',
      '185.252.28.0/22'
    ]
  },

  // Fastly (CDN)
  {
    name: 'Fastly',
    category: 'cdn',
    ranges: [
      '23.235.32.0/20',
      '43.249.72.0/22',
      '103.244.50.0/24',
      '103.245.222.0/23',
      '103.245.224.0/24',
      '104.156.80.0/20',
      '140.248.64.0/18',
      '140.248.128.0/17',
      '146.75.0.0/17',
      '151.101.0.0/16',
      '157.52.64.0/18',
      '167.82.0.0/17',
      '167.82.128.0/20',
      '167.82.160.0/20',
      '167.82.224.0/20',
      '172.111.64.0/18',
      '185.31.16.0/22',
      '199.27.72.0/21',
      '199.232.0.0/16'
    ]
  },

  // Akamai (CDN)
  {
    name: 'Akamai',
    category: 'cdn',
    ranges: [
      '23.0.0.0/12',
      '23.32.0.0/11',
      '23.64.0.0/14',
      '23.72.0.0/13',
      '104.64.0.0/10',
      '184.24.0.0/13',
      '184.50.0.0/15',
      '2.16.0.0/13'
    ]
  }
];

/**
 * Check if an IP address is within a CIDR range
 */
export function ipInRange(ip: string, cidr: string): boolean {
  try {
    const [range, bits] = cidr.split('/');
    const mask = -1 << (32 - parseInt(bits));

    const ipNum = ipToNumber(ip);
    const rangeNum = ipToNumber(range);

    return (ipNum & mask) === (rangeNum & mask);
  } catch (error) {
    console.error('Error checking IP range:', error);
    return false;
  }
}

/**
 * Convert IP address string to number
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.');
  if (parts.length !== 4) {
    throw new Error('Invalid IP address format');
  }

  return parts.reduce((acc, octet) => {
    return (acc << 8) + parseInt(octet);
  }, 0) >>> 0; // Convert to unsigned 32-bit integer
}

/**
 * Detect provider from IP address using known ranges
 */
export function detectProviderFromIP(ip: string): { provider: string; category: string } | null {
  // Skip private IPs
  if (isPrivateIP(ip)) {
    return null;
  }

  for (const provider of KNOWN_IP_RANGES) {
    for (const range of provider.ranges) {
      if (ipInRange(ip, range)) {
        return {
          provider: provider.name,
          category: provider.category
        };
      }
    }
  }

  return null;
}

/**
 * Check if IP is a private/local address
 */
function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(p => parseInt(p));

  if (parts.length !== 4) return false;

  // 10.0.0.0/8
  if (parts[0] === 10) return true;

  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;

  // 127.0.0.0/8 (localhost)
  if (parts[0] === 127) return true;

  return false;
}

/**
 * Get all providers for a given category
 */
export function getProvidersByCategory(category: 'cloud' | 'cdn' | 'hosting'): string[] {
  return KNOWN_IP_RANGES
    .filter(p => p.category === category)
    .map(p => p.name);
}
