// Core domain types
export interface InstanceReport {
  domain: string;
  timestamp: Date;
  software?: string; // Parsed from version string
  version?: string;
  serverType?: string; // Detected by Megalodon library
  nodeInfoSoftware?: string; // Detected from NodeInfo
  instanceData?: MastodonInstance; // Full instance data from API
  infrastructure?: InfrastructureInfo;
  wellKnown?: WellKnownData; // .well-known metadata and robots.txt
  uptime?: number;
  moderationPolicies?: ModerationPolicy[];
  moderationAnalysis?: ModerationAnalysis; // Legacy analysis (kept for backward compatibility)
  enhancedModerationAnalysis?: EnhancedModerationAnalysis; // Enhanced contextual analysis with explainability
  metadataScore?: MetadataScore; // Enhanced metadata quality scoring (0-25 points)
  networkHealthScore?: NetworkHealthScore; // Dynamic network health scoring (0-25 points)
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

export interface ModerationAnalysis {
  totalKeywords: number;
  categoriesAddressed: string[];
  keywordsFound: string[];
  score: number; // 0-37.5 (1.5x base score of 25)
  meetsMinimum: boolean; // Has at least 4 keywords
  details: {
    racism: number;
    sexism: number;
    homophobia: number;
    transphobia: number;
    antiSemitism: number;
    generalHate: number;
  };
}

export interface EnhancedModerationAnalysis {
  // Overall scoring
  totalScore: number; // Weighted score (0-100+ with bonuses)
  normalizedScore: number; // 0-37.5 for compatibility with existing system
  confidence: number; // 0-100, based on rule length and specificity

  // Coverage metrics
  categoriesCovered: string[];
  protectedClassesCovered: string[];
  positiveIndicators: string[];
  redFlags: string[];

  // Pattern matching results
  matchedPatterns: MatchedPattern[];
  missingCategories: string[];

  // Language detection
  detectedLanguages: string[];

  // Explainability
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];

  // Backward compatibility
  legacy: {
    totalKeywords: number;
    categoriesAddressed: string[];
    meetsMinimum: boolean;
  };
}

export interface MatchedPattern {
  category: string;
  subcategory: string;
  weight: number;
  matchedText: string;
  context: string; // Surrounding text for context
  isNegated: boolean;
  language: string;
  patternUsed: string;
}

export interface MetadataScore {
  totalScore: number; // 0-25
  breakdown: {
    maturity: number; // 0-8
    transparency: number; // 0-7
    registration: number; // 0-5
    description: number; // 0-5
  };
  details: {
    ageDays?: number;
    userCount?: number;
    hasPrivacyPolicy: boolean;
    hasTerms: boolean;
    hasContact: boolean;
    hasSecurityContact: boolean;
    registrationPolicy: string;
    descriptionLength: number;
    descriptionQuality: string;
  };
  flags: string[];
}

export interface NetworkHealthScore {
  totalScore: number; // 0-25
  breakdown: {
    federationHealth: number; // 0-10
    reputation: number; // 0-8
    blockingBehavior: number; // 0-4
    reciprocity: number; // 0-3
  };
  details: {
    peerCount: number;
    peerPercentile?: number;
    reputationLevel: 'trusted' | 'neutral' | 'problematic' | 'unknown';
    blockCount: number;
    blockRatio?: number;
    blockedByCount: number;
    isWidelyBlocked: boolean;
  };
  flags: string[];
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
  invites_enabled?: boolean;
  thumbnail?: string; // Instance thumbnail/banner image
  contact_account?: {
    username?: string;
    acct?: string;
    display_name?: string;
    url?: string;
  };
  email?: string; // Contact email
  rules?: Array<{id: string; text: string}>;
  stats?: {
    user_count?: number;
    status_count?: number;
    domain_count?: number;
  };
  urls?: {
    streaming_api?: string;
  };
  languages?: string[];
  configuration?: any;
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
