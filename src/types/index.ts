// Core domain types
export interface InstanceReport {
  domain: string;
  timestamp: Date;
  software?: string;
  version?: string;
  serverType?: string; // Detected server type (mastodon, pleroma, misskey, etc.)
  infrastructure?: InfrastructureInfo;
  wellKnown?: WellKnownData; // .well-known metadata and robots.txt
  uptime?: number;
  moderationPolicies?: ModerationPolicy[];
  peers?: string[];
  peersTotalCount?: number; // Total number of peers before truncation
  blockedInstances?: string[];
  externalBlocklists?: BlocklistMatch[];
  serverCovenant?: CovenantStatus;
  safetyScore: SafetyScore;
  errors: ErrorInfo[];
  instanceStatus?: InstanceStatus; // Whether instance is reachable
  isHistoricalData?: boolean; // True if data is from archives/historical sources
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

export interface InstanceStatus {
  reachable: boolean; // Can we connect to the instance directly?
  checkedAt: Date;
  lastSeenOnline?: Date; // From Fediverse Observer if available
  statusSource: 'direct' | 'fediverse-observer' | 'fedidb' | 'unknown';
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
