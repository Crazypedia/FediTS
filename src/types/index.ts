// Core domain types
export interface InstanceReport {
  domain: string;
  timestamp: Date;
  software?: string;
  version?: string;
  serverType?: string; // Detected server type (mastodon, pleroma, misskey, etc.)
  infrastructure?: InfrastructureInfo;
  uptime?: number;
  moderationPolicies?: ModerationPolicy[];
  peers?: string[];
  blockedInstances?: string[];
  externalBlocklists?: BlocklistMatch[];
  serverCovenant?: CovenantStatus;
  safetyScore: SafetyScore;
  errors: ErrorInfo[];
}

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

export interface ModerationPolicy {
  id: string;
  text: string;
}

export interface BlocklistMatch {
  listName: string;
  reason?: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface CovenantStatus {
  listed: boolean;
  checkedAt: Date;
  source?: string;
}

export interface SafetyScore {
  overall: number; // 0-100
  breakdown: {
    uptime: number;
    moderation: number;
    federation: number;
    trust: number;
  };
  flags: string[];
}

export interface ErrorInfo {
  source: string;
  message: string;
  timestamp: Date;
}

// API Response types
export interface FediDBInstance {
  domain: string;
  software?: string;
  version?: string;
  users?: number;
  statuses?: number;
  connections?: number;
  created_at?: string;
}

export interface FediDBFederation {
  domain: string;
  peers?: string[];
  blocked?: string[];
}

export interface FediverseObserverInstance {
  name: string;
  host: string;
  software?: string;
  version?: string;
  uptime?: number;
  up?: boolean;
}

export interface MastodonInstance {
  uri: string;
  title?: string;
  short_description?: string;
  description?: string;
  version?: string;
  registrations?: boolean;
  approval_required?: boolean;
  stats?: {
    user_count?: number;
    status_count?: number;
    domain_count?: number;
  };
}

export interface MastodonRule {
  id: string;
  text: string;
}

// Configuration types
export interface ApiConfig {
  fedidbKey?: string;
  observerKey?: string;
  instanceToken?: string;
  privacyMode: 'private' | 'anonymous';
}
