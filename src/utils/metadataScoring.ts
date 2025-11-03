/**
 * Enhanced Metadata Scoring
 *
 * Analyzes instance metadata for maturity, transparency, registration policies,
 * and description quality. Scores 0-25 points.
 */

import type { InstanceReport, WellKnownData } from '../types';

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

/**
 * Metadata Scoring Engine
 */
export class MetadataScorer {
  /**
   * Score instance metadata
   */
  static score(report: InstanceReport): MetadataScore {
    const maturity = this.scoreMaturity(report);
    const transparency = this.scoreTransparency(report);
    const registration = this.scoreRegistration(report);
    const description = this.scoreDescription(report);

    const totalScore = maturity.score + transparency.score + registration.score + description.score;

    const flags: string[] = [];

    // Collect flags
    flags.push(...maturity.flags);
    flags.push(...transparency.flags);
    flags.push(...registration.flags);
    flags.push(...description.flags);

    return {
      totalScore,
      breakdown: {
        maturity: maturity.score,
        transparency: transparency.score,
        registration: registration.score,
        description: description.score
      },
      details: {
        ageDays: maturity.ageDays,
        userCount: maturity.userCount,
        hasPrivacyPolicy: transparency.hasPrivacyPolicy,
        hasTerms: transparency.hasTerms,
        hasContact: transparency.hasContact,
        hasSecurityContact: transparency.hasSecurityContact,
        registrationPolicy: registration.policy,
        descriptionLength: description.length,
        descriptionQuality: description.quality
      },
      flags
    };
  }

  /**
   * Score instance maturity (0-8 points)
   */
  private static scoreMaturity(report: InstanceReport): {
    score: number;
    ageDays?: number;
    userCount?: number;
    flags: string[];
  } {
    const flags: string[] = [];
    let score = 0;
    let ageDays: number | undefined;
    let userCount: number | undefined;

    // Try to determine instance age
    const nodeInfo = 'nodeInfo' in (report.wellKnown || {}) ? (report.wellKnown as WellKnownData).nodeInfo : undefined;

    // Get user count
    if (nodeInfo?.usage?.users?.total) {
      userCount = nodeInfo.usage.users.total;
    }

    // Estimate age from creation date if available
    // Note: Most Fediverse software doesn't expose creation date directly
    // We'll need to rely on external data sources or heuristics

    // For now, use user count and activity as a proxy for maturity
    if (userCount !== undefined) {
      if (userCount < 10) {
        score += 0;
        flags.push('Very small instance (<10 users) - limited track record');
        ageDays = 30; // Estimate very new
      } else if (userCount < 50) {
        score += 2;
        ageDays = 90; // Estimate fairly new
      } else if (userCount < 500) {
        score += 4;
        ageDays = 180; // Estimate medium age
      } else if (userCount < 5000) {
        score += 6;
        ageDays = 365; // Estimate established
      } else {
        score += 8;
        ageDays = 730; // Estimate well-established
        flags.push('Large, established instance (5000+ users)');
      }
    } else {
      // No user count available
      score += 2; // Give minimal credit
      flags.push('User count not available - cannot assess maturity');
    }

    // Check for consistent activity (active users vs total users)
    if (nodeInfo?.usage?.users?.activeMonth && nodeInfo?.usage?.users?.total) {
      const activeRatio = nodeInfo.usage.users.activeMonth / nodeInfo.usage.users.total;
      if (activeRatio > 0.5) {
        // Very healthy activity ratio
        flags.push('High user activity ratio (>50% monthly active)');
      } else if (activeRatio < 0.1) {
        // Low activity ratio - might be abandoned
        flags.push('Low user activity ratio (<10% monthly active) - possible inactive instance');
        score = Math.max(0, score - 2); // Penalty for low activity
      }
    }

    return { score, ageDays, userCount, flags };
  }

  /**
   * Score administrative transparency (0-7 points)
   */
  private static scoreTransparency(report: InstanceReport): {
    score: number;
    hasPrivacyPolicy: boolean;
    hasTerms: boolean;
    hasContact: boolean;
    hasSecurityContact: boolean;
    flags: string[];
  } {
    const flags: string[] = [];
    let score = 0;

    const wellKnown = report.wellKnown;
    const nodeInfo = wellKnown && 'nodeInfo' in wellKnown ? (wellKnown as WellKnownData).nodeInfo : undefined;

    // Check for contact information (+2 points)
    let hasContact = false;
    if (wellKnown && 'securityTxt' in wellKnown && wellKnown.securityTxt?.contact && wellKnown.securityTxt.contact.length > 0) {
      score += 2;
      hasContact = true;
    } else if (nodeInfo?.metadata && typeof nodeInfo.metadata === 'object') {
      // Check for contact in metadata
      const metadata = nodeInfo.metadata as Record<string, any>;
      if (metadata.contact || metadata.email || metadata.adminContact) {
        score += 2;
        hasContact = true;
      }
    }

    if (!hasContact) {
      flags.push('No contact information found');
    }

    // Check for privacy policy (+2 points)
    // Note: We'd need to check for common URLs or metadata fields
    let hasPrivacyPolicy = false;
    if (nodeInfo?.metadata && typeof nodeInfo.metadata === 'object') {
      const metadata = nodeInfo.metadata as Record<string, any>;
      if (metadata.privacyPolicy || metadata.privacy || metadata.privacyPolicyUrl) {
        score += 2;
        hasPrivacyPolicy = true;
      }
    }

    if (!hasPrivacyPolicy) {
      flags.push('No privacy policy found');
    }

    // Check for terms of service (+1 point)
    let hasTerms = false;
    if (nodeInfo?.metadata && typeof nodeInfo.metadata === 'object') {
      const metadata = nodeInfo.metadata as Record<string, any>;
      if (metadata.terms || metadata.termsOfService || metadata.tosUrl) {
        score += 1;
        hasTerms = true;
      }
    }

    // Check for security contact (+1 point)
    let hasSecurityContact = false;
    if (wellKnown && 'securityTxt' in wellKnown && wellKnown.securityTxt) {
      score += 1;
      hasSecurityContact = true;
      flags.push('Has security.txt file');
    }

    // Check for admin account visibility (+1 point)
    // This would require checking if admin account is publicly visible
    // For now, we'll give credit if metadata exists (implies some level of openness)
    if (nodeInfo?.metadata && Object.keys(nodeInfo.metadata).length > 0) {
      score += 1;
    }

    return {
      score,
      hasPrivacyPolicy,
      hasTerms,
      hasContact,
      hasSecurityContact,
      flags
    };
  }

  /**
   * Score registration policy (0-5 points)
   */
  private static scoreRegistration(report: InstanceReport): {
    score: number;
    policy: string;
    flags: string[];
  } {
    const flags: string[] = [];
    let score = 0;
    let policy = 'unknown';

    const wellKnown = report.wellKnown;
    const nodeInfo = wellKnown && 'nodeInfo' in wellKnown ? (wellKnown as WellKnownData).nodeInfo : undefined;

    if (!nodeInfo) {
      flags.push('Registration policy unknown');
      return { score: 2, policy, flags }; // Neutral score
    }

    const openRegistrations = nodeInfo.openRegistrations;

    // Analyze registration policy
    if (!openRegistrations) {
      // Closed or invite-only
      policy = 'closed';
      score = 5; // Highest score - careful user selection
      flags.push('Closed/invite-only registration - careful user selection');
    } else {
      // Open registrations
      const metadata = nodeInfo.metadata as Record<string, any> | undefined;
      const approvalRequired = metadata?.approvalRequired || metadata?.approval_required;

      if (approvalRequired) {
        // Open with approval
        policy = 'approval-required';
        score = 4;
        flags.push('Open registration with approval required');
      } else {
        // Fully open
        policy = 'open';

        // Check for anti-spam measures in rules
        const hasAntiSpam = report.moderationPolicies?.some(p =>
          /spam|bot|automat/i.test(p.text)
        );

        if (hasAntiSpam) {
          score = 3;
          flags.push('Open registration with anti-spam policies');
        } else {
          score = 1;
          flags.push('Open registration without clear anti-spam measures');
        }
      }
    }

    return { score, policy, flags };
  }

  /**
   * Score description quality (0-5 points)
   */
  private static scoreDescription(report: InstanceReport): {
    score: number;
    length: number;
    quality: string;
    flags: string[];
  } {
    const flags: string[] = [];
    let score = 0;
    let quality = 'none';

    const wellKnown = report.wellKnown;
    const nodeInfo = wellKnown && 'nodeInfo' in wellKnown ? (wellKnown as WellKnownData).nodeInfo : undefined;

    // Get description from metadata
    let description = '';
    if (nodeInfo?.metadata && typeof nodeInfo.metadata === 'object') {
      const metadata = nodeInfo.metadata as Record<string, any>;
      description = metadata.description || metadata.shortDescription || metadata.about || '';
    }

    const length = description.length;

    if (length === 0) {
      quality = 'none';
      flags.push('No instance description found');
      return { score: 0, length, quality, flags };
    }

    // Score based on length
    if (length > 200) {
      score += 2;
      quality = 'detailed';
    } else if (length > 100) {
      score += 1;
      quality = 'adequate';
    } else {
      quality = 'minimal';
    }

    // Check for language diversity (non-ASCII suggests multi-language)
    if (/[^\x00-\x7F]/.test(description)) {
      score += 1;
      flags.push('Multi-language description detected');
    }

    // Check for clear community focus
    const focusKeywords = [
      /community/i,
      /focus/i,
      /topic/i,
      /interest/i,
      /group/i,
      /dedicated/i,
      /speciali[sz]ed/i
    ];

    if (focusKeywords.some(pattern => pattern.test(description))) {
      score += 1;
      flags.push('Clear community focus described');
    }

    // Check for contact/admin info in description
    if (/admin|contact|email|support/i.test(description)) {
      score += 1;
      flags.push('Contact information included in description');
    }

    return {
      score: Math.min(5, score), // Cap at 5
      length,
      quality,
      flags
    };
  }

  /**
   * Get human-readable summary of metadata quality
   */
  static getSummary(metadataScore: MetadataScore): string {
    const { totalScore } = metadataScore;

    if (totalScore >= 20) {
      return 'Excellent metadata quality - mature instance with strong transparency';
    } else if (totalScore >= 15) {
      return 'Good metadata quality - established instance with adequate transparency';
    } else if (totalScore >= 10) {
      return 'Fair metadata quality - some transparency but room for improvement';
    } else if (totalScore >= 5) {
      return 'Limited metadata quality - minimal transparency and documentation';
    } else {
      return 'Poor metadata quality - very limited information available';
    }
  }

  /**
   * Get specific recommendations for improvement
   */
  static getRecommendations(metadataScore: MetadataScore): string[] {
    const recommendations: string[] = [];
    const { breakdown, details } = metadataScore;

    if (breakdown.maturity < 4) {
      recommendations.push('Consider building user base and community engagement over time');
    }

    if (!details.hasPrivacyPolicy) {
      recommendations.push('Add a privacy policy to inform users about data handling');
    }

    if (!details.hasTerms) {
      recommendations.push('Publish terms of service to set clear expectations');
    }

    if (!details.hasContact) {
      recommendations.push('Provide contact information for users and administrators');
    }

    if (!details.hasSecurityContact) {
      recommendations.push('Add a security.txt file for responsible disclosure');
    }

    if (breakdown.registration < 3) {
      recommendations.push('Consider implementing approval requirements or anti-spam measures');
    }

    if (breakdown.description < 3) {
      recommendations.push('Expand instance description to explain community focus and values');
    }

    return recommendations;
  }
}
