/**
 * Enhanced Moderation Policy Analyzer
 *
 * Implements contextual analysis, phrase-level matching, negation detection,
 * and weighted scoring using comprehensive pattern library.
 */

import { ALL_PATTERNS, RulePattern, CORE_SAFETY_PATTERNS, PROTECTED_CLASS_PATTERNS, POSITIVE_INDICATOR_PATTERNS, RED_FLAG_PATTERNS } from './rulePatterns';
import type { EnhancedModerationAnalysis, MatchedPattern } from '../types';

/**
 * Prohibition patterns - these indicate a rule/ban (positive for moderation)
 * e.g., "No racism", "Don't harass", "Banned: hate speech"
 */
const PROHIBITION_PATTERNS = [
  /\b(?:no|not|never|don't|dont)\s+$/i,
  /\b(?:banned?|prohibited?|forbidden|disallowed?)\b.*$/i,
  /\b(?:we\s+)?(?:do\s+)?not\s+(?:allow|permit|tolerate)\b.*$/i,
  /\b(?:verboten|nicht\s+erlaubt)\b.*$/i, // German
  /\b(?:interdit|défendu)\b.*$/i, // French
  /\b(?:prohibido|no\s+permitido)\b.*$/i, // Spanish
  /\b(?:禁止|違反)\b.*$/i // Japanese
];

/**
 * True negation patterns - these negate protection (negative for moderation)
 * e.g., "No protection for", "Not covered", "Except for"
 */
const TRUE_NEGATION_PATTERNS = [
  /\b(?:no|not|never)\s+(?:protection|policy|rule|coverage|moderation)\s+(?:for|against|on)\s*$/i,
  /\b(?:except|excluding|but\s+not|other\s+than)\s*$/i,
  /\b(?:unless|however|although)\s*$/i,
  /\b(?:kein.*schutz|keine.*richtlinie)\s*$/i, // German
  /\b(?:pas.*protection|sans.*politique)\s*$/i, // French
  /\b(?:sin.*protección|excepto)\s*$/i // Spanish
];

/**
 * Context window size for checking negations (characters before match)
 */
const NEGATION_WINDOW = 50;

/**
 * Enhanced Moderation Policy Analyzer
 */
export class EnhancedModerationAnalyzer {
  /**
   * Analyze moderation policies with contextual understanding
   */
  static analyze(policies: Array<{ id: string; text: string }>): EnhancedModerationAnalysis {
    // Combine all policy text
    const fullText = policies.map(p => p.text).join('\n\n');

    // Detect languages present in the rules
    const detectedLanguages = this.detectLanguages(fullText);

    // Match patterns with contextual analysis
    const matchedPatterns = this.matchPatternsWithContext(fullText, detectedLanguages);

    // Calculate scores and coverage
    const totalScore = this.calculateWeightedScore(matchedPatterns);
    const normalizedScore = this.normalizeScore(totalScore);
    const confidence = this.calculateConfidence(fullText, matchedPatterns);

    // Analyze coverage
    const categoriesCovered = this.extractCategories(matchedPatterns, CORE_SAFETY_PATTERNS);
    const protectedClassesCovered = this.extractCategories(matchedPatterns, PROTECTED_CLASS_PATTERNS);
    const positiveIndicators = this.extractCategories(matchedPatterns, POSITIVE_INDICATOR_PATTERNS);
    const redFlags = this.extractCategories(matchedPatterns, RED_FLAG_PATTERNS);

    // Identify gaps
    const missingCategories = this.identifyMissingCategories(matchedPatterns);

    // Calculate Server Covenant alignment
    const serverCovenantAlignment = this.calculateServerCovenantAlignment(matchedPatterns);

    // Generate explanations
    const strengths = this.identifyStrengths(matchedPatterns, categoriesCovered, positiveIndicators, serverCovenantAlignment);
    const weaknesses = this.identifyWeaknesses(missingCategories, redFlags, serverCovenantAlignment);
    const suggestions = this.generateSuggestions(missingCategories, weaknesses);

    // Legacy compatibility metrics
    const legacy = this.generateLegacyMetrics(matchedPatterns, categoriesCovered);

    return {
      totalScore,
      normalizedScore,
      confidence,
      categoriesCovered,
      protectedClassesCovered,
      positiveIndicators,
      redFlags,
      matchedPatterns,
      missingCategories,
      detectedLanguages,
      serverCovenantAlignment,
      strengths,
      weaknesses,
      suggestions,
      legacy
    };
  }

  /**
   * Detect which languages are present in the rules
   */
  private static detectLanguages(text: string): string[] {
    const languages: Set<string> = new Set();

    // Check for language-specific characters and patterns
    if (/[a-zA-Z]/.test(text)) languages.add('en');
    if (/[äöüßÄÖÜ]/.test(text)) languages.add('de');
    if (/[àâäéèêëïîôùûüÿœæçÀÂÄÉÈÊËÏÎÔÙÛÜŸŒÆÇ]/.test(text)) languages.add('fr');
    if (/[áéíóúüñÁÉÍÓÚÜÑ¿¡]/.test(text)) languages.add('es');
    if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) languages.add('ja');

    // Default to English if nothing detected
    if (languages.size === 0) languages.add('en');

    return Array.from(languages);
  }

  /**
   * Match patterns with contextual analysis and negation detection
   */
  private static matchPatternsWithContext(text: string, languages: string[]): MatchedPattern[] {
    const matches: MatchedPattern[] = [];
    const lowerText = text.toLowerCase();

    for (const pattern of ALL_PATTERNS) {
      // Try each detected language
      for (const lang of languages) {
        const langPatterns = pattern.patterns[lang];
        if (!langPatterns) continue;

        for (const patternStr of langPatterns) {
          try {
            // Create regex from pattern string
            const regex = new RegExp(patternStr, 'gi');
            let match;

            while ((match = regex.exec(lowerText)) !== null) {
              const matchStart = match.index;
              const matchEnd = matchStart + match[0].length;

              // Extract context window
              const contextStart = Math.max(0, matchStart - 30);
              const contextEnd = Math.min(lowerText.length, matchEnd + 30);
              const context = text.substring(contextStart, contextEnd);

              // Check for negation in preceding text
              const precedingText = lowerText.substring(
                Math.max(0, matchStart - NEGATION_WINDOW),
                matchStart
              );
              const isNegated = this.checkNegation(precedingText, pattern);

              // Calculate effective weight (negated patterns have reduced/reversed weight)
              let effectiveWeight = pattern.weight;
              if (isNegated) {
                if (pattern.isRedFlag) {
                  // Negating a red flag is good (e.g., "we do NOT allow discrimination")
                  effectiveWeight = Math.abs(pattern.weight) * 0.5;
                } else {
                  // Negating a positive pattern is bad (e.g., "NO protection for harassment")
                  effectiveWeight = pattern.weight * -0.5;
                }
              }

              matches.push({
                category: pattern.category,
                subcategory: pattern.subcategory,
                weight: effectiveWeight,
                matchedText: match[0],
                context: context.trim(),
                isNegated,
                language: lang,
                patternUsed: patternStr
              });
            }
          } catch (error) {
            console.warn(`Error processing pattern: ${patternStr}`, error);
          }
        }
      }
    }

    return matches;
  }

  /**
   * Check if a match is negated by preceding text
   *
   * This distinguishes between:
   * - Prohibition statements: "No racism" = GOOD (not negated)
   * - True negation: "No protection for racism" = BAD (negated)
   */
  private static checkNegation(precedingText: string, pattern: RulePattern): boolean {
    // For safety and protected class patterns, check if this is a prohibition statement
    // e.g., "No racism", "Don't harass", "Banned: hate speech"
    const isProhibitionStatement = PROHIBITION_PATTERNS.some(p => p.test(precedingText));
    if (isProhibitionStatement && (
      pattern.category === 'csam' ||
      pattern.category === 'harassment' ||
      pattern.category === 'hate_speech' ||
      pattern.category === 'privacy' ||
      pattern.category === 'consent' ||
      pattern.category === 'spam' ||
      pattern.category === 'violence' ||
      pattern.category === 'misinformation' ||
      pattern.category === 'protected_class' ||
      pattern.category === 'umbrella'
    )) {
      // This is a prohibition (e.g., "No racism"), NOT a negation
      return false;
    }

    // Check for true negation (e.g., "No protection for", "Not covered")
    const isTrueNegation = TRUE_NEGATION_PATTERNS.some(p => p.test(precedingText));
    if (isTrueNegation) {
      return true;
    }

    // Red flags should be checked more strictly (we want to detect them even with negation nearby)
    if (pattern.isRedFlag) {
      // Only consider it negated if there's a strong negation very close
      const closeWindow = precedingText.slice(-20);
      return TRUE_NEGATION_PATTERNS.some(neg => neg.test(closeWindow));
    }

    // Default: not negated
    return false;
  }

  /**
   * Calculate weighted score from matched patterns
   */
  private static calculateWeightedScore(matches: MatchedPattern[]): number {
    // Remove duplicates (same subcategory matched multiple times)
    const uniqueMatches = new Map<string, MatchedPattern>();

    for (const match of matches) {
      const key = `${match.category}-${match.subcategory}`;
      const existing = uniqueMatches.get(key);

      // Keep the match with highest weight (or most recent if tied)
      if (!existing || match.weight > existing.weight) {
        uniqueMatches.set(key, match);
      }
    }

    // Sum up weights
    let totalScore = 0;
    for (const match of uniqueMatches.values()) {
      totalScore += match.weight;
    }

    return Math.max(0, totalScore); // Don't go below 0
  }

  /**
   * Normalize score to 0-37.5 range for compatibility with existing system
   * Made more generous to account for umbrella patterns and freeform moderation language
   */
  private static normalizeScore(rawScore: number): number {
    // Expected score range:
    // - Umbrella patterns: 5 patterns × 6-8 points = ~40 points (NEW)
    // - Core safety patterns: 8 categories × 5 points = 40 points
    // - Protected classes: 6 classes × 2-3 points = ~15 points
    // - Positive indicators: 5 indicators × 2-3 points = ~12 points
    // - Total positive potential: ~107 points (with umbrellas)
    // - Red flags can subtract up to ~50 points

    // Map raw score to 0-37.5 scale (more generous at lower scores)
    // 0 points = 0
    // 8+ points = 15 (basic moderation)
    // 20+ points = 25 (good moderation)
    // 35+ points = 37.5 (exceptional)

    if (rawScore <= 0) return 0;
    if (rawScore < 8) return rawScore * 1.0; // 0-8 range, very generous for low scores
    if (rawScore < 20) return 8 + ((rawScore - 8) * 0.58); // 8-15 range
    if (rawScore < 35) return 15 + ((rawScore - 20) * 0.67); // 15-25 range
    if (rawScore < 50) return 25 + ((rawScore - 35) * 0.83); // 25-37.5 range

    return 37.5; // Cap at maximum
  }

  /**
   * Calculate confidence score based on rule quality and specificity
   */
  private static calculateConfidence(fullText: string, matches: MatchedPattern[]): number {
    let confidence = 50; // Start at medium confidence

    // Factor 1: Rule length (longer = more detailed = higher confidence)
    const textLength = fullText.length;
    if (textLength > 2000) confidence += 20;
    else if (textLength > 1000) confidence += 15;
    else if (textLength > 500) confidence += 10;
    else if (textLength > 200) confidence += 5;
    else confidence -= 10; // Very short rules

    // Factor 2: Number of matches (more specific coverage = higher confidence)
    if (matches.length > 20) confidence += 15;
    else if (matches.length > 10) confidence += 10;
    else if (matches.length > 5) confidence += 5;
    else if (matches.length < 3) confidence -= 10;

    // Factor 3: Presence of positive indicators (shows thoughtful policy)
    const hasPositiveIndicators = matches.some(m => POSITIVE_INDICATOR_PATTERNS.some(p => p.category === m.category));
    if (hasPositiveIndicators) confidence += 10;

    // Factor 4: Presence of red flags (reduces confidence in safety)
    const hasRedFlags = matches.some(m => m.weight < 0);
    if (hasRedFlags) confidence -= 15;

    // Factor 5: Language diversity (multi-language shows inclusive approach)
    // Increased bonus for multilingual policies
    const languages = new Set(matches.map(m => m.language));
    if (languages.size >= 4) confidence += 20; // 4+ languages: highly inclusive
    else if (languages.size === 3) confidence += 15; // 3 languages: very inclusive
    else if (languages.size === 2) confidence += 10; // 2 languages: inclusive
    // Single language: no bonus

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Extract unique categories from matches
   */
  private static extractCategories(matches: MatchedPattern[], patternSet: RulePattern[]): string[] {
    const categories = new Set<string>();
    const patternCategories = new Set(patternSet.map(p => p.category));

    for (const match of matches) {
      if (patternCategories.has(match.category) && match.weight > 0) {
        categories.add(match.subcategory);
      }
    }

    return Array.from(categories);
  }

  /**
   * Calculate Server Covenant alignment score
   * Based on: "Active moderation against racism, sexism, homophobia and transphobia"
   */
  private static calculateServerCovenantAlignment(matches: MatchedPattern[]): {
    score: number;
    meetsRequirements: boolean;
    details: {
      hasRacismPolicy: boolean;
      hasSexismPolicy: boolean;
      hasHomophobiaPolicy: boolean;
      hasTransphobiaPolicy: boolean;
    };
  } {
    // Check for each required policy area using actual category names from patterns
    const hasRacismPolicy = matches.some(m =>
      (m.category === 'protected_class' && m.subcategory === 'race' && m.weight > 0) ||
      (m.category === 'hate_speech' && m.matchedText && /racis|racial|race/i.test(m.matchedText) && m.weight > 0)
    );

    const hasSexismPolicy = matches.some(m =>
      (m.category === 'protected_class' && (m.subcategory === 'gender' || m.subcategory === 'gender_identity') && m.weight > 0) ||
      (m.category === 'hate_speech' && m.matchedText && /sexis|misogyn|gender/i.test(m.matchedText) && m.weight > 0) ||
      (m.category === 'harassment' && m.matchedText && /gender|sex/i.test(m.matchedText) && m.weight > 0)
    );

    const hasHomophobiaPolicy = matches.some(m =>
      (m.category === 'protected_class' && m.subcategory === 'sexual_orientation' && m.weight > 0) ||
      (m.category === 'hate_speech' && m.matchedText && /homophob|gay|lesbian|lgbtq|lgbt|sexual.*orientation/i.test(m.matchedText) && m.weight > 0)
    );

    const hasTransphobiaPolicy = matches.some(m =>
      (m.category === 'protected_class' && m.subcategory === 'gender_identity' && m.weight > 0) ||
      (m.category === 'hate_speech' && m.matchedText && /transphob|transgender|trans|non.*binary|gender.*identity/i.test(m.matchedText) && m.weight > 0)
    );

    // Calculate score (25 points each)
    let score = 0;
    if (hasRacismPolicy) score += 25;
    if (hasSexismPolicy) score += 25;
    if (hasHomophobiaPolicy) score += 25;
    if (hasTransphobiaPolicy) score += 25;

    // Bonus for comprehensive coverage (all four areas)
    const meetsRequirements = hasRacismPolicy && hasSexismPolicy && hasHomophobiaPolicy && hasTransphobiaPolicy;

    return {
      score,
      meetsRequirements,
      details: {
        hasRacismPolicy,
        hasSexismPolicy,
        hasHomophobiaPolicy,
        hasTransphobiaPolicy
      }
    };
  }

  /**
   * Identify missing critical categories
   */
  private static identifyMissingCategories(matches: MatchedPattern[]): string[] {
    const coveredCategories = new Set(matches.filter(m => m.weight > 0).map(m => m.category));
    const missing: string[] = [];

    // Check critical core safety categories
    const criticalCategories = [
      'Core Safety: Harassment',
      'Core Safety: Hate Speech',
      'Core Safety: Privacy/Doxxing',
      'Protected Class: Gender Identity',
      'Protected Class: Sexual Orientation',
      'Protected Class: Race'
    ];

    for (const category of criticalCategories) {
      if (!coveredCategories.has(category)) {
        missing.push(category);
      }
    }

    return missing;
  }

  /**
   * Identify policy strengths for explainability
   */
  private static identifyStrengths(
    matches: MatchedPattern[],
    categoriesCovered: string[],
    positiveIndicators: string[],
    serverCovenantAlignment: any
  ): string[] {
    const strengths: string[] = [];

    // Check Server Covenant alignment
    if (serverCovenantAlignment.meetsRequirements) {
      strengths.push('✓ Fully aligns with Fediverse Server Covenant anti-harassment requirements');
    } else if (serverCovenantAlignment.score >= 75) {
      strengths.push('Strong alignment with Fediverse Server Covenant requirements (missing 1 area)');
    }

    // Check coverage
    if (categoriesCovered.length >= 8) {
      strengths.push('Comprehensive coverage of core safety categories');
    } else if (categoriesCovered.length >= 5) {
      strengths.push('Good coverage of multiple safety categories');
    }

    // Check positive indicators
    if (positiveIndicators.includes('Appeals Process')) {
      strengths.push('Includes clear appeals process for moderation decisions');
    }
    if (positiveIndicators.includes('Transparency')) {
      strengths.push('Commits to transparency in moderation practices');
    }
    if (positiveIndicators.includes('Graduated Enforcement')) {
      strengths.push('Uses graduated enforcement approach');
    }
    if (positiveIndicators.includes('Community Input')) {
      strengths.push('Involves community in policy decisions');
    }

    // Check for strong anti-hate provisions
    const hateMatches = matches.filter(m =>
      m.category.includes('Hate Speech') ||
      m.category.includes('Protected Class')
    );
    if (hateMatches.length >= 5) {
      strengths.push('Strong anti-discrimination and hate speech provisions');
    }

    return strengths;
  }

  /**
   * Identify policy weaknesses for explainability
   */
  private static identifyWeaknesses(
    missingCategories: string[],
    redFlags: string[],
    serverCovenantAlignment: any
  ): string[] {
    const weaknesses: string[] = [];

    // Check Server Covenant alignment gaps
    if (!serverCovenantAlignment.meetsRequirements) {
      const missing: string[] = [];
      if (!serverCovenantAlignment.details.hasRacismPolicy) missing.push('racism');
      if (!serverCovenantAlignment.details.hasSexismPolicy) missing.push('sexism');
      if (!serverCovenantAlignment.details.hasHomophobiaPolicy) missing.push('homophobia');
      if (!serverCovenantAlignment.details.hasTransphobiaPolicy) missing.push('transphobia');

      if (missing.length > 0) {
        weaknesses.push(`⚠ Server Covenant gap: Missing explicit policies against ${missing.join(', ')}`);
      }
    }

    // Check for red flags
    if (redFlags.includes('Free Speech Absolutism')) {
      weaknesses.push('Policy emphasizes unrestricted free speech over user safety');
    }
    if (redFlags.includes('Hostile Framing')) {
      weaknesses.push('Policy uses hostile framing toward protected groups');
    }
    if (redFlags.includes('Discrimination Allowed')) {
      weaknesses.push('Policy explicitly allows discrimination');
    }
    if (redFlags.includes('Vague/Absent')) {
      weaknesses.push('Policy is vague or lacks specific safety provisions');
    }

    // Check for critical missing categories
    if (missingCategories.includes('Core Safety: Harassment')) {
      weaknesses.push('No clear harassment protection policy');
    }
    if (missingCategories.includes('Core Safety: Hate Speech')) {
      weaknesses.push('No explicit hate speech prohibition');
    }
    if (missingCategories.includes('Protected Class: Gender Identity')) {
      weaknesses.push('No specific protections for gender identity');
    }
    if (missingCategories.includes('Protected Class: Sexual Orientation')) {
      weaknesses.push('No specific protections for sexual orientation');
    }

    return weaknesses;
  }

  /**
   * Generate suggestions for improvement
   */
  private static generateSuggestions(missingCategories: string[], weaknesses: string[]): string[] {
    const suggestions: string[] = [];

    // Suggest adding missing categories
    if (missingCategories.length > 0) {
      suggestions.push(`Consider adding explicit policies for: ${missingCategories.slice(0, 3).join(', ')}`);
    }

    // Suggest addressing weaknesses
    if (weaknesses.some(w => w.includes('vague'))) {
      suggestions.push('Make policies more specific with clear examples and definitions');
    }
    if (weaknesses.some(w => w.includes('harassment'))) {
      suggestions.push('Add clear harassment prevention and reporting procedures');
    }
    if (weaknesses.some(w => w.includes('hate speech'))) {
      suggestions.push('Explicitly prohibit hate speech targeting protected groups');
    }

    // Suggest positive indicators if missing
    if (!weaknesses.some(w => w.includes('appeals'))) {
      suggestions.push('Consider adding an appeals process for moderation decisions');
    }

    return suggestions;
  }

  /**
   * Generate legacy metrics for backward compatibility
   */
  private static generateLegacyMetrics(
    matches: MatchedPattern[],
    categoriesCovered: string[]
  ): { totalKeywords: number; categoriesAddressed: string[]; meetsMinimum: boolean } {
    const totalKeywords = matches.filter(m => m.weight > 0).length;
    const meetsMinimum = totalKeywords >= 4 && categoriesCovered.length >= 3;

    // Map to legacy category names
    const legacyCategories = Array.from(new Set(
      matches
        .filter(m => m.weight > 0)
        .map(m => m.category.split(':')[1]?.trim() || m.category)
    ));

    return {
      totalKeywords,
      categoriesAddressed: legacyCategories,
      meetsMinimum
    };
  }
}
