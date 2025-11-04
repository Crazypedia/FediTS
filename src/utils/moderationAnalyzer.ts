/**
 * Moderation Policy Analyzer
 *
 * Analyzes server moderation rules against Mastodon Server Covenant standards
 * for active moderation against hate speech and discrimination.
 *
 * Based on: "Active moderation against racism, sexism, homophobia and transphobia"
 */

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

// Comprehensive keyword patterns for anti-hate speech moderation
const MODERATION_KEYWORDS = {
  racism: [
    // Direct terms
    'racism', 'racist', 'racial', 'race-based',
    'white supremacy', 'white supremacist', 'white nationalism', 'white nationalist',
    'xenophobia', 'xenophobic',
    'racial discrimination', 'racial hatred', 'racial harassment',
    'racial slurs', 'racial epithets',
    'ethno-nationalism', 'ethnic hatred', 'ethnic discrimination',
    'apartheid', 'segregation',
    'black lives matter', 'blm',
    'racial justice', 'racial equity',
    'anti-black', 'anti-asian', 'anti-indigenous', 'anti-latinx', 'anti-latino',
    'colorism', 'racial prejudice', 'racial bias',

    // Context phrases
    'discrimination based on race', 'discrimination based on ethnicity',
    'discrimination based on national origin', 'discrimination based on skin color',
    'hate based on race', 'harassment based on race',
    'prejudice against', 'bigotry against',
    'supremacist ideologies', 'supremacist content',
    'nazi', 'neo-nazi', 'fascist', 'fascism'
  ],

  sexism: [
    // Direct terms
    'sexism', 'sexist', 'misogyny', 'misogynistic', 'misogynist',
    'gender discrimination', 'gender-based discrimination',
    'sex discrimination', 'sex-based discrimination',
    'gender harassment', 'sexual harassment',
    'gender bias', 'gender prejudice',
    'anti-woman', 'anti-women',
    'feminism', 'feminist', 'gender equality', 'gender equity',
    'patriarchy', 'patriarchal',
    'gender-based violence', 'gender violence',
    'toxic masculinity',
    'incel', 'manosphere',

    // Context phrases
    'discrimination based on gender', 'discrimination based on sex',
    'hate based on gender', 'harassment based on gender',
    'objectification of women', 'dehumanization of women',
    'rape culture', 'rape apology', 'victim blaming',
    'gender stereotypes', 'gender roles'
  ],

  homophobia: [
    // Direct terms
    'homophobia', 'homophobic',
    'lgbtq', 'lgbtqia', 'lgbt', 'lgbtq+', 'lgbtqia+',
    'gay', 'lesbian', 'bisexual', 'queer',
    'sexual orientation', 'sexuality-based',
    'anti-gay', 'anti-lgbtq', 'anti-lgbt',
    'heterosexism', 'heterosexist',
    'biphobia', 'biphobic',
    'conversion therapy', 'ex-gay',
    'sexual minority', 'sexual minorities',
    'pride', 'lgbtq pride',

    // Context phrases
    'discrimination based on sexual orientation',
    'discrimination based on sexuality',
    'hate based on sexual orientation',
    'harassment based on sexual orientation',
    'lgbtq rights', 'gay rights', 'marriage equality',
    'sexual orientation discrimination',
    'homosexual discrimination'
  ],

  transphobia: [
    // Direct terms
    'transphobia', 'transphobic',
    'transgender', 'trans', 'non-binary', 'nonbinary', 'enby',
    'gender identity', 'gender expression',
    'anti-trans', 'anti-transgender',
    'transmisogyny', 'transmisogynistic',
    'cisgender', 'cis',
    'gender diverse', 'gender non-conforming', 'genderqueer',
    'deadnaming', 'deadname', 'misgendering', 'misgender',
    'terf', 'gender critical',
    'transition', 'transitioning', 'gender affirming',
    'two-spirit', 'third gender',

    // Context phrases
    'discrimination based on gender identity',
    'discrimination based on gender expression',
    'hate based on gender identity',
    'harassment based on gender identity',
    'trans rights', 'transgender rights',
    'gender identity discrimination',
    'gender expression discrimination',
    'bathroom bills', 'gender affirming care',
    'pronouns', 'chosen name'
  ],

  antiSemitism: [
    // Direct terms
    'anti-semitism', 'antisemitism', 'anti-semitic', 'antisemitic',
    'jewish', 'judaism', 'jew', 'jews',
    'holocaust denial', 'holocaust',
    'nazi', 'nazism', 'neo-nazi',
    'zionism', 'zionist', 'anti-zionism',
    'pogrom', 'blood libel',
    'synagogue',

    // Context phrases
    'discrimination against jewish',
    'hatred of jewish', 'hatred of jews',
    'jewish conspiracy', 'jewish stereotypes',
    'discrimination based on religion',
    'religious discrimination', 'religious hatred',
    'hate based on religion'
  ],

  generalHate: [
    // Broad hate speech terms
    'hate speech', 'hate crime', 'hate content',
    'harassment', 'harassing', 'harass',
    'discrimination', 'discriminate', 'discriminatory',
    'bigotry', 'bigot', 'bigoted',
    'prejudice', 'prejudiced',
    'intolerance', 'intolerant',
    'supremacy', 'supremacist',
    'extremism', 'extremist', 'radicalization',

    // Protected characteristics
    'protected class', 'protected characteristic', 'protected group',
    'marginalized', 'marginalized group', 'marginalized community',
    'minority', 'minorities',
    'vulnerable group', 'vulnerable population',

    // Moderation action terms
    'zero tolerance', 'will not tolerate', 'will be removed',
    'strictly prohibited', 'expressly forbidden', 'forbidden',
    'safe space', 'inclusive', 'inclusive community', 'inclusive environment',
    'diversity', 'equity', 'inclusion', 'dei',
    'respect', 'respectful', 'dignity',
    'welcoming', 'welcoming environment',

    // Harm terms
    'dehumanization', 'dehumanize',
    'slurs', 'slur', 'epithets', 'epithet',
    'degrading', 'denigrating', 'disparaging',
    'threatening', 'threats', 'intimidation', 'intimidating',
    'violence', 'violent content',
    'abuse', 'abusive',
    'hateful', 'hatred',
    'toxic', 'toxicity'
  ]
};

/**
 * Analyze moderation policies for anti-hate speech provisions
 */
export class ModerationPolicyAnalyzer {
  /**
   * Analyze a set of moderation rules
   */
  static analyze(policies: Array<{ id: string; text: string }>): ModerationAnalysis {
    // Combine all policy text into one for analysis
    const fullText = policies.map(p => p.text).join(' ').toLowerCase();

    const details = {
      racism: 0,
      sexism: 0,
      homophobia: 0,
      transphobia: 0,
      antiSemitism: 0,
      generalHate: 0
    };

    const keywordsFound: string[] = [];
    const categoriesAddressed: string[] = [];

    // Check each category
    for (const [category, keywords] of Object.entries(MODERATION_KEYWORDS)) {
      let categoryMatches = 0;

      for (const keyword of keywords) {
        // Use word boundary regex for more accurate matching
        const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');

        if (pattern.test(fullText)) {
          categoryMatches++;
          if (!keywordsFound.includes(keyword)) {
            keywordsFound.push(keyword);
          }
        }
      }

      // Update category count
      const categoryKey = this.getCategoryKey(category);
      details[categoryKey] = categoryMatches;

      // Category is "addressed" if it has at least 1 keyword
      if (categoryMatches > 0) {
        categoriesAddressed.push(this.getCategoryLabel(category));
      }
    }

    const totalKeywords = keywordsFound.length;
    const meetsMinimum = totalKeywords >= 2; // Lowered from 4 to be more forgiving

    // Calculate score (0-37.5, which is 1.5x the base 25 points)
    const score = this.calculateScore(totalKeywords, categoriesAddressed.length, details);

    return {
      totalKeywords,
      categoriesAddressed,
      keywordsFound,
      score,
      meetsMinimum,
      details
    };
  }

  /**
   * Calculate the moderation score
   *
   * Scoring:
   * - Need minimum 2 keywords to get any score (lowered from 4 to be more forgiving)
   * - Base score: 25 points
   * - Can score up to 37.5 points (1.5x base)
   * - Bonus for covering more categories
   * - Bonus for more comprehensive coverage
   */
  private static calculateScore(
    totalKeywords: number,
    categoriesCount: number,
    details: ModerationAnalysis['details']
  ): number {
    const BASE_SCORE = 25;
    const MAX_SCORE = 37.5; // 1.5x base

    // Must meet minimum threshold of 2 keywords (lowered from 4 to be more forgiving)
    if (totalKeywords < 2) {
      return 0;
    }

    // Start with base score
    let score = BASE_SCORE;

    // Bonus for keyword coverage (up to +5 points)
    // More keywords = better coverage
    // Adjusted formula to be more generous at lower keyword counts
    const keywordBonus = Math.min(5, (totalKeywords - 2) * 0.6);
    score += keywordBonus;

    // Bonus for category diversity (up to +5 points)
    // Covering all 6 categories = +5
    // Each category is worth ~0.83 points
    const categoryBonus = Math.min(5, categoriesCount * 0.83);
    score += categoryBonus;

    // Bonus for comprehensive coverage of critical categories (up to +2.5 points)
    // Racism, transphobia, and homophobia are critical per Mastodon Server Covenant
    // Lowered threshold from 3 to 2 to be more forgiving
    let criticalBonus = 0;
    if (details.racism >= 2) criticalBonus += 0.83;
    if (details.transphobia >= 2) criticalBonus += 0.83;
    if (details.homophobia >= 2) criticalBonus += 0.84;
    score += criticalBonus;

    // Cap at maximum score
    return Math.min(MAX_SCORE, Math.round(score * 10) / 10);
  }

  private static getCategoryKey(category: string): keyof ModerationAnalysis['details'] {
    const mapping: Record<string, keyof ModerationAnalysis['details']> = {
      'racism': 'racism',
      'sexism': 'sexism',
      'homophobia': 'homophobia',
      'transphobia': 'transphobia',
      'antiSemitism': 'antiSemitism',
      'generalHate': 'generalHate'
    };
    return mapping[category] || 'generalHate';
  }

  private static getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'racism': 'Racism & White Supremacy',
      'sexism': 'Sexism & Misogyny',
      'homophobia': 'Homophobia',
      'transphobia': 'Transphobia',
      'antiSemitism': 'Anti-Semitism',
      'generalHate': 'General Hate Speech'
    };
    return labels[category] || category;
  }

  /**
   * Get a human-readable summary of the analysis
   */
  static getSummary(analysis: ModerationAnalysis): string {
    if (!analysis.meetsMinimum) {
      return 'Insufficient anti-hate speech provisions detected (minimum 4 keywords required)';
    }

    if (analysis.score >= 35) {
      return 'Excellent: Comprehensive anti-hate speech policies covering multiple categories';
    } else if (analysis.score >= 30) {
      return 'Very Good: Strong anti-hate speech policies with good category coverage';
    } else if (analysis.score >= 25) {
      return 'Good: Adequate anti-hate speech provisions meeting basic standards';
    } else {
      return 'Fair: Some anti-hate speech provisions, but limited coverage';
    }
  }
}
