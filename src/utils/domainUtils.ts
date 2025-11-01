/**
 * Domain validation and normalization utilities
 */

/**
 * Normalizes a domain input by:
 * - Converting to lowercase
 * - Removing protocol (http://, https://)
 * - Trimming leading/trailing slashes and whitespace
 * - Removing path components
 */
export function normalizeDomain(input: string): string {
  let normalized = input.trim().toLowerCase();

  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, '');

  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, '');

  // Remove path components (take only the domain part)
  normalized = normalized.split('/')[0];

  // Remove port if present (optional - could keep for non-standard ports)
  // normalized = normalized.split(':')[0];

  return normalized;
}

/**
 * Validates domain format using basic regex
 */
export function isValidDomainFormat(domain: string): boolean {
  // Basic domain validation regex
  // Allows subdomains, requires TLD
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;

  // Also allow localhost and IP addresses for development
  const localhostRegex = /^localhost(:\d+)?$/;
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/;

  return domainRegex.test(domain) || localhostRegex.test(domain) || ipRegex.test(domain);
}

/**
 * Checks if domain is reachable via HTTPS
 * Returns both reachability status and any error encountered
 */
export async function checkDomainReachability(domain: string): Promise<{
  reachable: boolean;
  error?: string;
  redirectedTo?: string;
}> {
  try {
    const response = await fetch(`https://${domain}/api/v1/instance`, {
      method: 'HEAD',
      mode: 'cors',
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    return {
      reachable: response.ok,
      redirectedTo: response.redirected ? response.url : undefined
    };
  } catch (error) {
    // Try root path as fallback
    try {
      const response = await fetch(`https://${domain}/`, {
        method: 'HEAD',
        mode: 'cors',
        signal: AbortSignal.timeout(10000)
      });

      return {
        reachable: response.ok,
        redirectedTo: response.redirected ? response.url : undefined
      };
    } catch (fallbackError) {
      return {
        reachable: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Validates domain through multiple checks:
 * 1. Format validation
 * 2. DNS/reachability check
 */
export async function validateDomain(input: string): Promise<{
  valid: boolean;
  normalized: string;
  errors: string[];
}> {
  const errors: string[] = [];
  const normalized = normalizeDomain(input);

  if (!normalized) {
    errors.push('Domain cannot be empty');
    return { valid: false, normalized: '', errors };
  }

  if (!isValidDomainFormat(normalized)) {
    errors.push('Invalid domain format');
    return { valid: false, normalized, errors };
  }

  const reachability = await checkDomainReachability(normalized);
  if (!reachability.reachable) {
    errors.push(`Domain not reachable: ${reachability.error || 'Unknown error'}`);
  }

  return {
    valid: errors.length === 0,
    normalized,
    errors
  };
}

/**
 * Extracts domain from various URL formats
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.includes('://') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return normalizeDomain(url);
  }
}
