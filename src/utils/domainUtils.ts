/**
 * Domain validation and normalization utilities
 */

/**
 * Normalizes a domain input by:
 * - Converting to lowercase
 * - Removing protocol (http://, https://)
 * - Trimming leading/trailing slashes and whitespace
 * - Removing path components
 * - Removing common URL junk (@ symbols, query params, etc.)
 */
export function normalizeDomain(input: string): string {
  let normalized = input.trim().toLowerCase();

  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, '');

  // Remove ftp:// or other protocols
  normalized = normalized.replace(/^[a-z]+:\/\//, '');

  // Remove www. prefix if present
  normalized = normalized.replace(/^www\./, '');

  // Remove @ symbol (from URLs like https://user@domain.com or @user@domain.com)
  if (normalized.includes('@')) {
    const parts = normalized.split('@');
    // Take the last part after @ (the domain)
    normalized = parts[parts.length - 1];
  }

  // Remove query parameters and fragments
  normalized = normalized.split('?')[0].split('#')[0];

  // Remove trailing slashes and dots
  normalized = normalized.replace(/[\/\.]+$/, '');

  // Remove path components (take only the domain part)
  normalized = normalized.split('/')[0];

  // Remove port if present (optional - keeping it for non-standard ports)
  // But remove common standard ports
  normalized = normalized.replace(/:443$/, '').replace(/:80$/, '');

  // Remove any remaining whitespace
  normalized = normalized.replace(/\s+/g, '');

  return normalized;
}

/**
 * Validates domain format using basic regex
 * More lenient than strict RFC validation
 */
export function isValidDomainFormat(domain: string): boolean {
  if (!domain || domain.length === 0) {
    return false;
  }

  // Basic domain validation regex - lenient
  // Allows subdomains, requires TLD (or localhost)
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;

  // Also allow localhost and IP addresses
  const localhostRegex = /^localhost(:\d+)?$/;
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/;

  // Also allow simple single-word domains for development
  const simpleRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(:\d+)?$/;

  return domainRegex.test(domain) ||
         localhostRegex.test(domain) ||
         ipRegex.test(domain) ||
         simpleRegex.test(domain);
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
 * Validates domain through format checks only
 * We no longer require reachability since we support historical data
 *
 * This is lenient validation that just ensures we have a reasonable domain string
 */
export async function validateDomain(input: string): Promise<{
  valid: boolean;
  normalized: string;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const normalized = normalizeDomain(input);

  if (!normalized) {
    errors.push('Domain cannot be empty');
    return { valid: false, normalized: '', errors, warnings };
  }

  if (!isValidDomainFormat(normalized)) {
    errors.push('Invalid domain format. Please enter a valid domain name (e.g., mastodon.social)');
    return { valid: false, normalized, errors, warnings };
  }

  // Optional: Check reachability but don't fail validation if unreachable
  // We'll try to get historical data instead
  try {
    const reachability = await checkDomainReachability(normalized);
    if (!reachability.reachable) {
      warnings.push('Instance may be offline. Will attempt to retrieve historical data.');
    }
  } catch (error) {
    // Ignore reachability check errors - we'll try to scan anyway
    warnings.push('Could not verify instance status. Proceeding with scan.');
  }

  // Always return valid: true if format is good
  // Let the report generator handle actual connectivity issues
  return {
    valid: true,
    normalized,
    errors,
    warnings
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
