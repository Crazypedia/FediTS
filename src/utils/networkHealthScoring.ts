/**
 * Dynamic Network Health Scoring
 *
 * Analyzes federation health, instance reputation, blocking patterns,
 * and network reciprocity. Scores 0-25 points.
 */

import type { InstanceReport } from '../types';

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

export interface ReputationList {
  version: string;
  lastUpdated: string;
  source: string;
  instances: Array<{
    domain: string;
    reputation: 'trusted' | 'neutral' | 'problematic' | 'blocked';
    reason?: string;
    tags?: string[];
  }>;
}

export interface FederationStatistics {
  peerCounts: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
  };
}

/**
 * Network Health Scoring Engine
 */
export class NetworkHealthScorer {
  private static trustedInstances: Map<string, any> = new Map();
  private static problematicInstances: Map<string, any> = new Map();
  private static federationStats: FederationStatistics | null = null;

  /**
   * Load reputation lists
   */
  static async loadReputationLists(): Promise<void> {
    try {
      // Load trusted instances
      const trustedResponse = await fetch('/data/trusted-instances.json');
      if (trustedResponse.ok) {
        const trustedData: ReputationList = await trustedResponse.json();
        trustedData.instances.forEach(instance => {
          this.trustedInstances.set(instance.domain, instance);
        });
        console.log(`Loaded ${this.trustedInstances.size} trusted instances`);
      }

      // Load problematic instances
      const problematicResponse = await fetch('/data/problematic-instances.json');
      if (problematicResponse.ok) {
        const problematicData: ReputationList = await problematicResponse.json();
        problematicData.instances.forEach(instance => {
          this.problematicInstances.set(instance.domain, instance);
        });
        console.log(`Loaded ${this.problematicInstances.size} problematic instances`);
      }
    } catch (error) {
      console.error('Failed to load reputation lists:', error);
    }
  }

  /**
   * Load federation statistics for percentile calculations
   */
  static async loadFederationStatistics(): Promise<void> {
    try {
      const response = await fetch('/data/federation-stats.json');
      if (response.ok) {
        this.federationStats = await response.json();
        console.log('Loaded federation statistics');
        return;
      }
    } catch (error) {
      console.warn('Failed to load federation statistics, using defaults:', error);
    }

    // Use fallback estimates based on typical Fediverse distributions
    this.federationStats = {
      peerCounts: {
        p25: 50,
        p50: 150,
        p75: 500,
        p90: 1500,
        p95: 3000
      }
    };
  }

  /**
   * Score network health
   */
  static async score(report: InstanceReport): Promise<NetworkHealthScore> {
    try {
      // Ensure reputation lists are loaded
      if (this.trustedInstances.size === 0 && this.problematicInstances.size === 0) {
        await this.loadReputationLists();
      }

      // Ensure federation stats are loaded
      if (!this.federationStats) {
        await this.loadFederationStatistics();
      }

      // Double-check federation stats loaded
      if (!this.federationStats) {
        console.error('Federation stats failed to load, using minimal scoring');
        // Return minimal score if stats failed to load
        return {
          totalScore: 10,
          breakdown: {
            federationHealth: 5,
            reputation: 4,
            blockingBehavior: 1,
            reciprocity: 0
          },
          details: {
            peerCount: report.peersTotalCount || report.peers?.length || 0,
            peerPercentile: undefined,
            reputationLevel: 'neutral',
            blockCount: 0,
            blockRatio: undefined,
            blockedByCount: 0,
            isWidelyBlocked: false
          },
          flags: ['Network health scoring unavailable - using default values']
        };
      }

      const federationHealth = this.scoreFederationHealth(report);
      const reputation = this.scoreReputation(report);
      const blockingBehavior = this.scoreBlockingBehavior(report);
      const reciprocity = this.scoreReciprocity(report);

      const totalScore =
        federationHealth.score +
        reputation.score +
        blockingBehavior.score +
        reciprocity.score;

      const flags: string[] = [];
      flags.push(...federationHealth.flags);
      flags.push(...reputation.flags);
      flags.push(...blockingBehavior.flags);
      flags.push(...reciprocity.flags);

      return {
        totalScore,
        breakdown: {
          federationHealth: federationHealth.score,
          reputation: reputation.score,
          blockingBehavior: blockingBehavior.score,
          reciprocity: reciprocity.score
        },
        details: {
          peerCount: federationHealth.peerCount,
          peerPercentile: federationHealth.percentile,
          reputationLevel: reputation.level,
          blockCount: blockingBehavior.blockCount,
          blockRatio: blockingBehavior.blockRatio,
          blockedByCount: reciprocity.blockedByCount,
          isWidelyBlocked: reciprocity.isWidelyBlocked
        },
        flags
      };
    } catch (error) {
      console.error('Error in network health scoring:', error);
      // Return safe default on error
      return {
        totalScore: 10,
        breakdown: {
          federationHealth: 5,
          reputation: 4,
          blockingBehavior: 1,
          reciprocity: 0
        },
        details: {
          peerCount: report.peersTotalCount || report.peers?.length || 0,
          peerPercentile: undefined,
          reputationLevel: 'neutral',
          blockCount: 0,
          blockRatio: undefined,
          blockedByCount: 0,
          isWidelyBlocked: false
        },
        flags: ['Error calculating network health - using default values']
      };
    }
  }

  /**
   * Score federation health based on peer count (0-10 points)
   */
  private static scoreFederationHealth(report: InstanceReport): {
    score: number;
    peerCount: number;
    percentile?: number;
    flags: string[];
  } {
    const flags: string[] = [];
    const peerCount = report.peersTotalCount || report.peers?.length || 0;

    if (peerCount === 0) {
      flags.push('No federation - instance is isolated');
      return { score: 0, peerCount, flags };
    }

    // Calculate percentile
    const stats = this.federationStats!;
    let percentile: number;
    let score: number;

    if (peerCount >= stats.peerCounts.p95) {
      percentile = 95;
      score = 10;
      flags.push(`Excellent federation (top 5%, ${peerCount.toLocaleString()} peers)`);
    } else if (peerCount >= stats.peerCounts.p90) {
      percentile = 90;
      score = 9;
      flags.push(`Very good federation (top 10%, ${peerCount.toLocaleString()} peers)`);
    } else if (peerCount >= stats.peerCounts.p75) {
      percentile = 75;
      score = 8;
    } else if (peerCount >= stats.peerCounts.p50) {
      percentile = 50;
      score = 6;
    } else if (peerCount >= stats.peerCounts.p25) {
      percentile = 25;
      score = 4;
    } else {
      percentile = 10;
      score = 2;
      flags.push(`Limited federation (bottom 25%, ${peerCount.toLocaleString()} peers)`);
    }

    return { score, peerCount, percentile, flags };
  }

  /**
   * Score instance reputation (0-8 points)
   */
  private static scoreReputation(report: InstanceReport): {
    score: number;
    level: 'trusted' | 'neutral' | 'problematic' | 'unknown';
    flags: string[];
  } {
    const flags: string[] = [];
    const domain = report.domain;

    // Check if in trusted list
    if (this.trustedInstances.has(domain)) {
      const entry = this.trustedInstances.get(domain);
      flags.push(`Trusted instance: ${entry.reason || 'Community verified'}`);
      return { score: 8, level: 'trusted', flags };
    }

    // Check if in problematic list
    if (this.problematicInstances.has(domain)) {
      const entry = this.problematicInstances.get(domain);
      flags.push(`⚠️ Problematic instance: ${entry.reason || 'Known issues'}`);
      return { score: 0, level: 'problematic', flags };
    }

    // Neutral - not in any list
    return { score: 4, level: 'neutral', flags };
  }

  /**
   * Score blocking behavior (0-4 points)
   * Note: Most servers don't expose block lists, so we give neutral scores
   */
  private static scoreBlockingBehavior(report: InstanceReport): {
    score: number;
    blockCount: number;
    blockRatio?: number;
    flags: string[];
  } {
    const flags: string[] = [];
    const blockCount = report.blockedInstances?.length || 0;
    const peerCount = report.peersTotalCount || report.peers?.length || 0;

    // Most servers don't expose block lists
    // If we have no block data, give neutral score
    if (blockCount === 0 && !report.blockedInstances) {
      // Block list not exposed (common)
      return { score: 2, blockCount: 0, flags };
    }

    if (blockCount === 0) {
      // Block list is exposed but empty
      if (peerCount > 100) {
        flags.push('Large instance with no blocks listed');
        return { score: 2, blockCount, flags };
      }
      return { score: 3, blockCount, flags };
    }

    // If we have block data, analyze it
    const totalKnownInstances = peerCount + blockCount;
    const blockRatio = totalKnownInstances > 0
      ? (blockCount / totalKnownInstances) * 100
      : 0;

    if (blockRatio < 1) {
      flags.push(`Low blocking activity (${blockRatio.toFixed(1)}%)`);
      return { score: 4, blockCount, blockRatio, flags };
    } else if (blockRatio < 5) {
      return { score: 3, blockCount, blockRatio, flags };
    } else if (blockRatio < 15) {
      flags.push(`Moderate blocking activity (${blockRatio.toFixed(1)}%)`);
      return { score: 2, blockCount, blockRatio, flags };
    } else if (blockRatio < 30) {
      flags.push(`High blocking activity (${blockRatio.toFixed(1)}%)`);
      return { score: 1, blockCount, blockRatio, flags };
    } else {
      flags.push(`Very high blocking activity (${blockRatio.toFixed(1)}%)`);
      return { score: 0, blockCount, blockRatio, flags };
    }
  }

  /**
   * Score block reciprocity (0-3 points)
   * Checks if this instance appears on external blocklists
   */
  private static scoreReciprocity(report: InstanceReport): {
    score: number;
    blockedByCount: number;
    isWidelyBlocked: boolean;
    flags: string[];
  } {
    const flags: string[] = [];

    // Check if this instance appears on external blocklists
    // Note: This only includes blocklists we actively check, not private server blocks
    const blockedByCount = report.externalBlocklists?.filter(
      bl => bl.severity === 'critical' || bl.severity === 'warning'
    ).length || 0;

    const isWidelyBlocked = blockedByCount >= 5; // Lowered threshold since we have limited blocklist coverage

    if (blockedByCount === 0) {
      // Not on any public blocklists we check
      return { score: 3, blockedByCount, isWidelyBlocked, flags };
    } else if (blockedByCount === 1) {
      // On one blocklist - could be false positive
      flags.push(`Found on 1 blocklist - review recommended`);
      return { score: 2, blockedByCount, isWidelyBlocked, flags };
    } else if (blockedByCount < 5) {
      // On multiple blocklists - concerning
      flags.push(`⚠️ Found on ${blockedByCount} blocklists - reputation concerns`);
      return { score: 1, blockedByCount, isWidelyBlocked, flags };
    } else {
      // On many blocklists - serious issue
      flags.push(`🚨 Found on ${blockedByCount}+ blocklists - serious reputation issues`);
      return { score: 0, blockedByCount, isWidelyBlocked, flags };
    }
  }

  /**
   * Get human-readable summary
   */
  static getSummary(networkScore: NetworkHealthScore): string {
    const { totalScore } = networkScore;

    if (totalScore >= 20) {
      return 'Excellent network health - well-connected, trusted, and balanced moderation';
    } else if (totalScore >= 15) {
      return 'Good network health - solid federation and reputation';
    } else if (totalScore >= 10) {
      return 'Fair network health - adequate connections with some concerns';
    } else if (totalScore >= 5) {
      return 'Limited network health - poor federation or reputation issues';
    } else {
      return 'Poor network health - isolated, untrusted, or widely blocked';
    }
  }

  /**
   * Get specific recommendations
   */
  static getRecommendations(networkScore: NetworkHealthScore): string[] {
    const recommendations: string[] = [];
    const { breakdown, details } = networkScore;

    if (breakdown.federationHealth < 5) {
      recommendations.push('Improve federation by connecting with more instances');
      recommendations.push('Review and adjust federation policies to encourage peering');
    }

    if (breakdown.reputation === 0) {
      recommendations.push('Address reported issues to improve instance reputation');
      recommendations.push('Engage with community to understand concerns');
    }

    if (breakdown.blockingBehavior < 2) {
      if ((details.blockRatio || 0) > 20) {
        recommendations.push('Review blocking policies - very high block rate may indicate over-moderation');
      } else if (details.blockCount === 0 && details.peerCount > 100) {
        recommendations.push('Consider implementing selective blocking for problematic instances');
      }
    }

    if (details.isWidelyBlocked) {
      recommendations.push('Critical: Instance is widely blocked - immediate review of moderation policies needed');
      recommendations.push('Contact instance administrators who have blocked you to understand concerns');
    }

    return recommendations;
  }
}
