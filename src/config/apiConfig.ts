/**
 * API Configuration System
 *
 * Manages external API keys, rate limits, and feature flags.
 * Supports environment variables and runtime configuration.
 */

export interface ExternalAPIConfig {
  enabled: boolean;
  apiKey?: string;
  rateLimit: {
    maxRequests: number; // Maximum requests per period
    periodMs: number; // Period in milliseconds
  };
  timeout: number; // Request timeout in milliseconds
  cacheTTL: number; // Cache time-to-live in milliseconds
  weight: number; // Scoring weight (positive or negative)
  required: boolean; // Is this API required for scoring?
  retryConfig?: {
    maxRetries: number;
    backoffMs: number; // Initial backoff in milliseconds
  };
}

export interface APIConfigSet {
  googleSafeBrowsing: ExternalAPIConfig;
  virusTotal: ExternalAPIConfig;
  urlhaus: ExternalAPIConfig;
  phishTank: ExternalAPIConfig;
  alienVault: ExternalAPIConfig;
  sslLabs: ExternalAPIConfig;
  securityTrails: ExternalAPIConfig;
  cloudflareRadar: ExternalAPIConfig;
  certificateTransparency: ExternalAPIConfig;
  spamhaus: ExternalAPIConfig;
  ipQualityScore: ExternalAPIConfig;
  abuseIPDB: ExternalAPIConfig;
}

/**
 * Default API configuration
 */
export const DEFAULT_API_CONFIG: APIConfigSet = {
  googleSafeBrowsing: {
    enabled: false, // Disabled by default (requires API key)
    rateLimit: { maxRequests: 10000, periodMs: 24 * 60 * 60 * 1000 }, // 10k/day
    timeout: 10000,
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    weight: -50, // Critical threats
    required: false,
    retryConfig: { maxRetries: 3, backoffMs: 1000 }
  },

  virusTotal: {
    enabled: false, // Disabled by default (requires API key)
    rateLimit: { maxRequests: 500, periodMs: 24 * 60 * 60 * 1000 }, // 500/day
    timeout: 10000,
    cacheTTL: 48 * 60 * 60 * 1000, // 48 hours
    weight: -30, // High threats
    required: false,
    retryConfig: { maxRetries: 2, backoffMs: 2000 }
  },

  urlhaus: {
    enabled: true, // No API key required
    rateLimit: { maxRequests: 1000, periodMs: 60 * 60 * 1000 }, // 1000/hour (reasonable use)
    timeout: 10000,
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    weight: -40, // High threats
    required: false,
    retryConfig: { maxRetries: 3, backoffMs: 1000 }
  },

  phishTank: {
    enabled: false, // Requires API key
    rateLimit: { maxRequests: 10000, periodMs: 24 * 60 * 60 * 1000 }, // 10k/day
    timeout: 10000,
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    weight: -50, // Critical threats
    required: false,
    retryConfig: { maxRetries: 3, backoffMs: 1000 }
  },

  alienVault: {
    enabled: false, // Requires registration
    rateLimit: { maxRequests: 1000, periodMs: 24 * 60 * 60 * 1000 }, // 1000/day (estimated)
    timeout: 10000,
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    weight: -30, // Medium-high threats
    required: false,
    retryConfig: { maxRetries: 2, backoffMs: 2000 }
  },

  sslLabs: {
    enabled: true, // Free, no key required
    rateLimit: { maxRequests: 100, periodMs: 60 * 60 * 1000 }, // Conservative: 100/hour
    timeout: 30000, // SSL Labs can take longer
    cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days (SSL configs change slowly)
    weight: 10, // Positive weight for good SSL
    required: false,
    retryConfig: { maxRetries: 2, backoffMs: 5000 }
  },

  securityTrails: {
    enabled: false, // Free tier is very limited (50/month)
    rateLimit: { maxRequests: 50, periodMs: 30 * 24 * 60 * 60 * 1000 }, // 50/month
    timeout: 10000,
    cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
    weight: 0, // Informational only
    required: false,
    retryConfig: { maxRetries: 1, backoffMs: 2000 }
  },

  cloudflareRadar: {
    enabled: true, // No key required for some endpoints
    rateLimit: { maxRequests: 1000, periodMs: 24 * 60 * 60 * 1000 }, // Conservative estimate
    timeout: 10000,
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    weight: 5, // Positive for good reputation
    required: false,
    retryConfig: { maxRetries: 3, backoffMs: 1000 }
  },

  certificateTransparency: {
    enabled: true, // crt.sh - free, unlimited
    rateLimit: { maxRequests: 10000, periodMs: 60 * 60 * 1000 }, // Very high limit
    timeout: 10000,
    cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
    weight: 5, // Positive for valid certs
    required: false,
    retryConfig: { maxRetries: 3, backoffMs: 1000 }
  },

  spamhaus: {
    enabled: true, // DNS-based, free for non-commercial
    rateLimit: { maxRequests: 1000, periodMs: 24 * 60 * 60 * 1000 }, // Conservative
    timeout: 5000, // DNS queries should be fast
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    weight: -40, // High threat (spam/botnet)
    required: false,
    retryConfig: { maxRetries: 2, backoffMs: 1000 }
  },

  ipQualityScore: {
    enabled: false, // Requires API key
    rateLimit: { maxRequests: 5000, periodMs: 30 * 24 * 60 * 60 * 1000 }, // 5k/month
    timeout: 10000,
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    weight: -30, // Medium-high threats
    required: false,
    retryConfig: { maxRetries: 2, backoffMs: 2000 }
  },

  abuseIPDB: {
    enabled: false, // Requires API key
    rateLimit: { maxRequests: 1000, periodMs: 24 * 60 * 60 * 1000 }, // 1000/day
    timeout: 10000,
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    weight: -20, // Medium threats
    required: false,
    retryConfig: { maxRetries: 3, backoffMs: 1000 }
  }
};

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private requestTimestamps: Map<string, number[]> = new Map();

  /**
   * Check if request is allowed under rate limit
   */
  isAllowed(apiName: string, config: ExternalAPIConfig): boolean {
    const now = Date.now();
    const timestamps = this.requestTimestamps.get(apiName) || [];

    // Remove timestamps outside the period
    const validTimestamps = timestamps.filter(
      ts => now - ts < config.rateLimit.periodMs
    );

    // Check if under limit
    if (validTimestamps.length >= config.rateLimit.maxRequests) {
      return false;
    }

    return true;
  }

  /**
   * Record a request
   */
  recordRequest(apiName: string): void {
    const now = Date.now();
    const timestamps = this.requestTimestamps.get(apiName) || [];
    timestamps.push(now);
    this.requestTimestamps.set(apiName, timestamps);
  }

  /**
   * Get time until rate limit resets
   */
  getTimeUntilReset(apiName: string, config: ExternalAPIConfig): number {
    const timestamps = this.requestTimestamps.get(apiName);
    if (!timestamps || timestamps.length === 0) {
      return 0;
    }

    const now = Date.now();
    const oldestRelevant = timestamps.find(
      ts => now - ts < config.rateLimit.periodMs
    );

    if (!oldestRelevant) {
      return 0;
    }

    return config.rateLimit.periodMs - (now - oldestRelevant);
  }

  /**
   * Get remaining requests in current period
   */
  getRemainingRequests(apiName: string, config: ExternalAPIConfig): number {
    const now = Date.now();
    const timestamps = this.requestTimestamps.get(apiName) || [];

    const validTimestamps = timestamps.filter(
      ts => now - ts < config.rateLimit.periodMs
    );

    return Math.max(0, config.rateLimit.maxRequests - validTimestamps.length);
  }

  /**
   * Clear rate limit data for an API
   */
  clearAPI(apiName: string): void {
    this.requestTimestamps.delete(apiName);
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.requestTimestamps.clear();
  }
}

/**
 * API Configuration Manager
 */
export class APIConfigManager {
  private static instance: APIConfigManager;
  private config: APIConfigSet;
  private rateLimiter: RateLimiter;

  private constructor() {
    this.config = this.loadConfig();
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): APIConfigManager {
    if (!APIConfigManager.instance) {
      APIConfigManager.instance = new APIConfigManager();
    }
    return APIConfigManager.instance;
  }

  /**
   * Load configuration from environment and defaults
   */
  private loadConfig(): APIConfigSet {
    const config = { ...DEFAULT_API_CONFIG };

    // Check for environment variables (Vite uses import.meta.env)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // Google Safe Browsing
      if (import.meta.env.VITE_GOOGLE_API_KEY) {
        config.googleSafeBrowsing.apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
        config.googleSafeBrowsing.enabled = true;
      }

      // VirusTotal
      if (import.meta.env.VITE_VIRUSTOTAL_API_KEY) {
        config.virusTotal.apiKey = import.meta.env.VITE_VIRUSTOTAL_API_KEY;
        config.virusTotal.enabled = true;
      }

      // PhishTank
      if (import.meta.env.VITE_PHISHTANK_API_KEY) {
        config.phishTank.apiKey = import.meta.env.VITE_PHISHTANK_API_KEY;
        config.phishTank.enabled = true;
      }

      // AlienVault OTX
      if (import.meta.env.VITE_ALIENVAULT_API_KEY) {
        config.alienVault.apiKey = import.meta.env.VITE_ALIENVAULT_API_KEY;
        config.alienVault.enabled = true;
      }

      // SecurityTrails
      if (import.meta.env.VITE_SECURITYTRAILS_API_KEY) {
        config.securityTrails.apiKey = import.meta.env.VITE_SECURITYTRAILS_API_KEY;
        config.securityTrails.enabled = true;
      }

      // IPQualityScore
      if (import.meta.env.VITE_IPQS_API_KEY) {
        config.ipQualityScore.apiKey = import.meta.env.VITE_IPQS_API_KEY;
        config.ipQualityScore.enabled = true;
      }

      // AbuseIPDB
      if (import.meta.env.VITE_ABUSEIPDB_API_KEY) {
        config.abuseIPDB.apiKey = import.meta.env.VITE_ABUSEIPDB_API_KEY;
        config.abuseIPDB.enabled = true;
      }
    }

    return config;
  }

  /**
   * Get configuration for specific API
   */
  getConfig(apiName: keyof APIConfigSet): ExternalAPIConfig {
    return this.config[apiName];
  }

  /**
   * Get all enabled APIs
   */
  getEnabledAPIs(): Array<keyof APIConfigSet> {
    return (Object.keys(this.config) as Array<keyof APIConfigSet>).filter(
      key => this.config[key].enabled
    );
  }

  /**
   * Check if API is enabled and has remaining quota
   */
  canUseAPI(apiName: keyof APIConfigSet): {
    allowed: boolean;
    reason?: string;
    timeUntilReset?: number;
  } {
    const config = this.config[apiName];

    if (!config.enabled) {
      return { allowed: false, reason: 'API disabled' };
    }

    if (config.apiKey === undefined && this.requiresAPIKey(apiName)) {
      return { allowed: false, reason: 'API key not configured' };
    }

    if (!this.rateLimiter.isAllowed(apiName, config)) {
      const timeUntilReset = this.rateLimiter.getTimeUntilReset(apiName, config);
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        timeUntilReset
      };
    }

    return { allowed: true };
  }

  /**
   * Check if API requires an API key
   */
  private requiresAPIKey(apiName: keyof APIConfigSet): boolean {
    const noKeyRequired = [
      'urlhaus',
      'sslLabs',
      'cloudflareRadar',
      'certificateTransparency',
      'spamhaus'
    ];
    return !noKeyRequired.includes(apiName);
  }

  /**
   * Record API usage
   */
  recordUsage(apiName: keyof APIConfigSet): void {
    this.rateLimiter.recordRequest(apiName);
  }

  /**
   * Get rate limit status for an API
   */
  getRateLimitStatus(apiName: keyof APIConfigSet): {
    remaining: number;
    limit: number;
    resetIn: number;
  } {
    const config = this.config[apiName];
    return {
      remaining: this.rateLimiter.getRemainingRequests(apiName, config),
      limit: config.rateLimit.maxRequests,
      resetIn: this.rateLimiter.getTimeUntilReset(apiName, config)
    };
  }

  /**
   * Get rate limiter instance
   */
  getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }

  /**
   * Update API configuration at runtime
   */
  updateConfig(apiName: keyof APIConfigSet, updates: Partial<ExternalAPIConfig>): void {
    this.config[apiName] = { ...this.config[apiName], ...updates };
  }

  /**
   * Enable/disable an API
   */
  setEnabled(apiName: keyof APIConfigSet, enabled: boolean): void {
    this.config[apiName].enabled = enabled;
  }

  /**
   * Get overall API status
   */
  getStatus(): {
    totalAPIs: number;
    enabledAPIs: number;
    withKeys: number;
    availableAPIs: string[];
  } {
    const totalAPIs = Object.keys(this.config).length;
    const enabledAPIs = this.getEnabledAPIs().length;
    const withKeys = (Object.keys(this.config) as Array<keyof APIConfigSet>).filter(
      key => this.config[key].apiKey !== undefined
    ).length;

    const availableAPIs = this.getEnabledAPIs().filter(
      apiName => this.canUseAPI(apiName).allowed
    );

    return {
      totalAPIs,
      enabledAPIs,
      withKeys,
      availableAPIs: availableAPIs as string[]
    };
  }
}

/**
 * Convenience function to get API config manager
 */
export function getAPIConfig(): APIConfigManager {
  return APIConfigManager.getInstance();
}
