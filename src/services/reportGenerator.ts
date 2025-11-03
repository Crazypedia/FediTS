import type { InstanceReport, SafetyScore, ErrorInfo, ModerationPolicy, InstanceStatus } from '../types';
import { FediDBService } from './fedidb';
import { InstanceAPIService } from './instance';
import { CovenantService } from './covenant';
import { BlocklistService } from './blocklists';
import { InfrastructureService } from './infrastructure';
import { FediverseObserverService } from './fediverse-observer';
import { WellKnownService } from './well-known';

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

    // Calculate safety score
    const safetyScore = this.calculateSafetyScore({
      hasInstanceData: !!instanceData.instance,
      hasModerationPolicies: moderationPolicies.length > 0,
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
      infrastructure,
      wellKnown,
      moderationPolicies,
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
   */
  private static calculateSafetyScore(data: {
    hasInstanceData: boolean;
    hasModerationPolicies: boolean;
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

    // Moderation transparency score (0-25)
    let moderationScore = 0;
    if (data.hasModerationPolicies) {
      moderationScore = 25; // Has published rules
    } else {
      flags.push('No public moderation policies found');
    }

    // Federation visibility score (0-25)
    let federationScore = 0;
    if (data.hasPeers) {
      federationScore = 25; // Peer list is public
    } else {
      flags.push('Peer list not publicly available');
      moderationScore = 15; // Still give partial credit
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

    // Penalize for errors (but not too harshly)
    const errorPenalty = Math.min(data.errors.length * 2, 10);
    const overall = Math.max(
      0,
      uptimeScore + moderationScore + federationScore + trustScore - errorPenalty
    );

    return {
      overall,
      breakdown: {
        uptime: uptimeScore,
        moderation: moderationScore,
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
