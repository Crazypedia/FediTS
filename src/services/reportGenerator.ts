import type { InstanceReport, SafetyScore, ErrorInfo, ModerationPolicy, InstanceStatus, ModerationAnalysis } from '../types';
import { FediDBService } from './fedidb';
import { InstanceAPIService } from './instance';
import { CovenantService } from './covenant';
import { BlocklistService } from './blocklists';
import { InfrastructureService } from './infrastructure';
import { FediverseObserverService } from './fediverse-observer';
import { WellKnownService } from './well-known';
import { ModerationPolicyAnalyzer } from '../utils/moderationAnalyzer';

export class ReportGenerator {
  /**
   * Generate a complete trust and safety report for an instance
   */
  static async generateReport(domain: string): Promise<InstanceReport> {
    const errors: ErrorInfo[] = [];
    const timestamp = new Date();

    console.log(`Generating report for ${domain}...`);

    // First, try to determine if instance is reachable
    let instanceStatus: InstanceStatus = {
      reachable: false,
      checkedAt: new Date(),
      statusSource: 'unknown'
    };

    // Fetch data from all sources in parallel
    const [
      fedidbData,
      instanceData,
      observerData,
      covenantStatus,
      blocklistMatches,
      infrastructure,
      wellKnown
    ] = await Promise.all([
      FediDBService.getCompleteData(domain).catch(err => {
        errors.push({
          source: 'FediDB',
          message: err.message,
          timestamp: new Date()
        });
        return { instance: null, federation: null };
      }),
      InstanceAPIService.getCompleteData(domain).catch(err => {
        errors.push({
          source: 'Instance API',
          message: err.message,
          timestamp: new Date()
        });
        return { instance: null, rules: [], peers: [], software: undefined, serverType: undefined };
      }),
      FediverseObserverService.getInstance(domain).catch(err => {
        errors.push({
          source: 'Fediverse Observer',
          message: err.message,
          timestamp: new Date()
        });
        return null;
      }),
      CovenantService.checkCovenant(domain).catch(err => {
        errors.push({
          source: 'Server Covenant',
          message: err.message,
          timestamp: new Date()
        });
        return { listed: false, checkedAt: new Date() };
      }),
      BlocklistService.checkBlocklists(domain).catch(err => {
        errors.push({
          source: 'Blocklists',
          message: err.message,
          timestamp: new Date()
        });
        return [];
      }),
      InfrastructureService.detectInfrastructure(domain).catch(err => {
        errors.push({
          source: 'Infrastructure',
          message: err.message,
          timestamp: new Date()
        });
        return {};
      }),
      WellKnownService.getCompleteData(domain).catch(err => {
        errors.push({
          source: 'Well-Known',
          message: err.message,
          timestamp: new Date()
        });
        return {
          supportsWebfinger: false,
          supportsActivityPub: false,
          hasHostMeta: false,
          errors: [err.message]
        };
      })
    ]);

    // Determine instance status
    if (instanceData.instance) {
      // Successfully connected to instance
      instanceStatus = {
        reachable: true,
        checkedAt: new Date(),
        statusSource: 'direct'
      };
    } else if (observerData?.lastSeen) {
      // Check Fediverse Observer data
      const lastSeen = new Date(observerData.lastSeen);
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

      instanceStatus = {
        reachable: lastSeen > hourAgo,
        checkedAt: new Date(),
        lastSeenOnline: lastSeen,
        statusSource: 'fediverse-observer'
      };
    } else if (fedidbData.instance) {
      // Has FediDB data but no direct connection
      instanceStatus = {
        reachable: false,
        checkedAt: new Date(),
        statusSource: 'fedidb'
      };
    }

    // Determine software version (prefer fresh data, fallback to historical)
    const software = instanceData.software ||
                    observerData?.software ||
                    fedidbData.instance?.software ||
                    'unknown';

    const version = instanceData.instance?.version ||
                   observerData?.version ||
                   fedidbData.instance?.version ||
                   undefined;

    // Determine if data is historical (instance unreachable but we have archive data)
    const isHistoricalData = !instanceStatus.reachable && (!!fedidbData.instance || !!observerData);

    // Compile moderation policies
    const moderationPolicies: ModerationPolicy[] = instanceData.rules.map(rule => ({
      id: rule.id,
      text: rule.text
    }));

    // Analyze moderation policies for anti-hate speech provisions
    const moderationAnalysis = moderationPolicies.length > 0
      ? ModerationPolicyAnalyzer.analyze(moderationPolicies)
      : undefined;

    // Get peer list (prefer instance API, fallback to FediDB)
    const allPeers = instanceData.peers.length > 0
      ? instanceData.peers
      : (fedidbData.federation?.peers || []);

    // Limit peer list to prevent UI freezing (max 1000 peers)
    const MAX_PEERS = 1000;
    const peersTotalCount = allPeers.length;
    const peers = allPeers.slice(0, MAX_PEERS);

    if (peersTotalCount > MAX_PEERS) {
      console.warn(`Peer list truncated from ${peersTotalCount} to ${MAX_PEERS} peers`);
    }

    // Get blocked instances
    const blockedInstances = fedidbData.federation?.blocked || [];

    // Extract NodeInfo software detection
    const nodeInfoSoftware = 'nodeInfo' in wellKnown && wellKnown.nodeInfo?.software?.name
      ? wellKnown.nodeInfo.software.name.toLowerCase()
      : undefined;

    // Calculate safety score
    const safetyScore = this.calculateSafetyScore({
      hasInstanceData: !!instanceData.instance,
      hasModerationPolicies: moderationPolicies.length > 0,
      moderationAnalysis,
      hasPeers: peers.length > 0,
      blocklistMatches,
      covenantStatus,
      errors
    });

    return {
      domain,
      timestamp,
      software,
      version,
      serverType: instanceData.serverType,
      nodeInfoSoftware,
      infrastructure,
      wellKnown,
      moderationPolicies,
      moderationAnalysis,
      peers,
      peersTotalCount,
      blockedInstances,
      externalBlocklists: blocklistMatches,
      serverCovenant: covenantStatus,
      safetyScore,
      errors,
      instanceStatus,
      isHistoricalData
    };
  }

  /**
   * Calculate safety score based on collected data
   * Score is 0-100, with breakdown for each category
   *
   * New scoring system:
   * - Uptime: 0-25 (25% of score)
   * - Moderation: 0-37.5 (tracked for display, but only 0-25 counts toward overall score)
   * - Federation: 0-25 (25% of score)
   * - Trust: 0-25 (25% of score)
   * Total possible: 100 (25+25+25+25)
   *
   * Note: Moderation can exceed 25 (up to 37.5) to recognize exceptional policies,
   * but the overall score is capped at 100 to maintain scale consistency.
   */
  private static calculateSafetyScore(data: {
    hasInstanceData: boolean;
    hasModerationPolicies: boolean;
    moderationAnalysis?: ModerationAnalysis;
    hasPeers: boolean;
    blocklistMatches: any[];
    covenantStatus: any;
    errors: ErrorInfo[];
  }): SafetyScore {
    const flags: string[] = [];

    // Uptime/Responsiveness score (0-25)
    let uptimeScore = 0;
    if (data.hasInstanceData) {
      uptimeScore = 25; // Instance is reachable
    } else {
      flags.push('Instance API unreachable');
    }

    // Moderation quality score (0-37.5, with 25 as base)
    // Uses granular analysis of anti-hate speech provisions
    let moderationScore = 0;
    if (data.hasModerationPolicies && data.moderationAnalysis) {
      moderationScore = data.moderationAnalysis.score;

      if (!data.moderationAnalysis.meetsMinimum) {
        flags.push('Moderation policies lack sufficient anti-hate speech provisions');
      } else if (data.moderationAnalysis.score >= 35) {
        flags.push('Excellent anti-hate speech moderation policies');
      } else if (data.moderationAnalysis.score >= 30) {
        // Good score, no flag needed
      } else if (data.moderationAnalysis.score < 20) {
        flags.push('Limited anti-hate speech coverage in moderation policies');
      }

      // Add detail about what's covered
      if (data.moderationAnalysis.categoriesAddressed.length > 0) {
        const categories = data.moderationAnalysis.categoriesAddressed.join(', ');
        console.log(`Moderation addresses: ${categories}`);
      }
    } else if (data.hasModerationPolicies) {
      // Has policies but no analysis (shouldn't happen, but fallback)
      moderationScore = 15;
      flags.push('Moderation policies present but not analyzed');
    } else {
      flags.push('No public moderation policies found');
    }

    // Federation visibility score (0-25)
    let federationScore = 0;
    if (data.hasPeers) {
      federationScore = 25; // Peer list is public
    } else {
      flags.push('Peer list not publicly available');
    }

    // Trust score (0-25)
    let trustScore = 25; // Start at max

    // Check blocklists
    if (data.blocklistMatches.length > 0) {
      const hasCritical = data.blocklistMatches.some(m => m.severity === 'critical');
      const hasWarning = data.blocklistMatches.some(m => m.severity === 'warning');

      if (hasCritical) {
        trustScore = 0;
        flags.push('Found on critical blocklists');
      } else if (hasWarning) {
        trustScore = 10;
        flags.push('Found on warning blocklists');
      }
    }

    // Bonus for Server Covenant
    if (data.covenantStatus.listed) {
      trustScore = Math.min(trustScore + 5, 25); // Add 5 points bonus, cap at 25
    }

    // Calculate overall score (0-100)
    // Note: Moderation can score up to 37.5, but only 25 counts toward overall score
    // The extra points (25-37.5) are bonus points shown in breakdown but don't inflate overall score
    const moderationContribution = Math.min(moderationScore, 25);
    const rawTotal = uptimeScore + moderationContribution + federationScore + trustScore;

    // Penalize for errors (but not too harshly)
    const errorPenalty = Math.min(data.errors.length * 2, 10);

    // Overall score out of 100 (25+25+25+25 = 100)
    const overall = Math.max(0, Math.round(rawTotal - errorPenalty));

    return {
      overall,
      breakdown: {
        uptime: uptimeScore,
        moderation: moderationScore, // Store full score for display (can be 0-37.5)
        federation: federationScore,
        trust: trustScore
      },
      flags
    };
  }

  /**
   * Get a textual summary of the safety score
   */
  static getScoreSummary(score: number): { label: string; color: string } {
    if (score >= 80) {
      return { label: 'Excellent', color: 'success' };
    } else if (score >= 60) {
      return { label: 'Good', color: 'success' };
    } else if (score >= 40) {
      return { label: 'Fair', color: 'warning' };
    } else if (score >= 20) {
      return { label: 'Poor', color: 'warning' };
    } else {
      return { label: 'Critical', color: 'danger' };
    }
  }
}
