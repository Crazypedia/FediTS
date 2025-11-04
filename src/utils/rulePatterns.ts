/**
 * Enhanced Rule Pattern Library for Trust & Safety Analysis
 *
 * Multi-language pattern matching with contextual awareness for:
 * - Core safety categories
 * - Protected classes
 * - Positive indicators
 * - Red flags
 */

export interface RulePattern {
  category: string;
  subcategory: string;
  weight: number; // Points awarded/deducted if matched
  patterns: {
    [language: string]: string[]; // Regex patterns by language
  };
  isRedFlag?: boolean;
  isPositive?: boolean;
}

/**
 * Umbrella Patterns (Broad terms that cover multiple categories - 8 points each)
 * These patterns are intentionally generous to catch general moderation language
 */
export const UMBRELLA_PATTERNS: RulePattern[] = [
  // General "hate speech" mentions should cover all hate categories
  {
    category: 'umbrella',
    subcategory: 'hate_speech_general',
    weight: 8,
    isPositive: true,
    patterns: {
      en: [
        'hate speech',
        'hateful.{0,20}(?:content|language|behavior)',
        '(?:no|don\'?t|prohibit|forbidden|ban).{0,30}hate',
        'hate.{0,20}(?:not|prohibited|forbidden|banned)',
        'bigotry',
        'bigoted'
      ],
      de: ['hassrede', 'hetze', 'volksverhetzung', 'bigotterie'],
      fr: ['discours de haine', 'propos haineux', 'bigoterie'],
      es: ['discurso de odio', 'lenguaje de odio', 'intolerancia'],
      ja: ['ヘイトスピーチ', '憎悪表現', '偏見']
    }
  },

  // General "discrimination" mentions should cover all protected classes
  {
    category: 'umbrella',
    subcategory: 'discrimination_general',
    weight: 8,
    isPositive: true,
    patterns: {
      en: [
        'discrimination',
        'discriminat(?:e|ing|ory)',
        '(?:no|don\'?t|prohibit|forbidden|ban).{0,30}discriminat',
        'discriminat.{0,20}(?:not|prohibited|forbidden|banned)',
        'prejudice',
        'bias.{0,20}(?:against|toward)'
      ],
      de: ['diskriminierung', 'vorurteil'],
      fr: ['discrimination', 'préjugé'],
      es: ['discriminación', 'prejuicio'],
      ja: ['差別', '偏見']
    }
  },

  // General "harassment" should cover various harassment forms
  {
    category: 'umbrella',
    subcategory: 'harassment_general',
    weight: 8,
    isPositive: true,
    patterns: {
      en: [
        '(?:no|don\'?t|prohibit|forbidden|ban).{0,30}harass',
        'harass.{0,20}(?:not|prohibited|forbidden|banned|tolerated)',
        '(?:no|don\'?t|prohibit|forbidden|ban).{0,30}bully',
        'bully.{0,20}(?:not|prohibited|forbidden|banned)'
      ],
      de: ['keine.*belästigung', 'kein.*mobbing'],
      fr: ['pas.*harcèlement', 'interdit.*harceler'],
      es: ['no.*acoso', 'prohibido.*acosar'],
      ja: ['嫌がらせ.*禁止', 'ハラスメント.*禁止']
    }
  },

  // General "abuse" mentions
  {
    category: 'umbrella',
    subcategory: 'abuse_general',
    weight: 7,
    isPositive: true,
    patterns: {
      en: [
        '(?:no|don\'?t|prohibit|forbidden|ban).{0,30}abuse',
        'abuse.{0,20}(?:not|prohibited|forbidden|banned|tolerated)',
        'abusive.{0,20}(?:behavior|content|language)'
      ],
      de: ['keine.*missbrauch', 'kein.*beleidigung'],
      fr: ['pas.*abus', 'interdit.*abuser'],
      es: ['no.*abuso', 'prohibido.*abusar'],
      ja: ['虐待.*禁止', '悪用.*禁止']
    }
  },

  // Respectful/inclusive language as positive umbrella
  {
    category: 'umbrella',
    subcategory: 'respect_inclusion',
    weight: 6,
    isPositive: true,
    patterns: {
      en: [
        'respectful.{0,20}(?:to|toward|of).{0,20}(?:all|everyone|others)',
        'inclusive.{0,20}(?:community|environment|space)',
        'safe.{0,20}(?:space|environment|community).{0,20}(?:for|to).{0,20}(?:all|everyone)',
        'welcoming.{0,20}(?:to|for).{0,20}(?:all|everyone)',
        'treat.{0,20}(?:others|people|everyone).{0,20}(?:with|respect|dignity)'
      ],
      de: ['respektvoll.*gegenüber', 'inklusiv.*gemeinschaft', 'sicherer.*raum'],
      fr: ['respectueux.*envers', 'communauté.*inclusive', 'espace.*sûr'],
      es: ['respetuoso.*hacia', 'comunidad.*inclusiva', 'espacio.*seguro'],
      ja: ['尊重', '包括的.*コミュニティ', '安全.*スペース']
    }
  }
];

/**
 * Core Safety Categories (Critical - 5 points each)
 */
export const CORE_SAFETY_PATTERNS: RulePattern[] = [
  // CSAM Protection
  {
    category: 'csam',
    subcategory: 'explicit_ban',
    weight: 5,
    isPositive: true,
    patterns: {
      en: [
        'child sexual abuse',
        'csam',
        'child pornography',
        'child exploitation',
        'minors?.{0,20}sexual',
        'sexual.{0,20}minors?',
        'underage.{0,20}sexual',
        'sexual.{0,20}underage'
      ],
      de: ['kindesmissbrauch', 'kinderpornografie', 'csam', 'sexueller missbrauch von kindern'],
      fr: ['abus sexuel.*enfants?', 'pédopornographie', 'csam', 'exploitation.*enfants?'],
      es: ['abuso sexual.*menores?', 'pornografía infantil', 'csam', 'explotación.*menores?'],
      ja: ['児童ポルノ', '児童性的虐待', '未成年者.*性的']
    }
  },

  // Harassment Protection
  {
    category: 'harassment',
    subcategory: 'general_ban',
    weight: 5,
    isPositive: true,
    patterns: {
      en: [
        'harassment',
        'harassing',
        'harass',
        'bullying',
        'bully',
        'stalking',
        'stalk',
        'targeted.{0,20}abuse',
        'sustained.{0,20}attacks?',
        'pile[- ]?ons?',
        'dogpiling',
        'brigading',
        'intimidation',
        'intimidating',
        'intimidate',
        'block.*evasion',
        'evading.*blocks?',
        'circumvent.*blocks?'
      ],
      de: ['belästigung', 'mobbing', 'stalking', 'schikanierung', 'blockumgehung'],
      fr: ['harcèlement', 'intimidation', 'harceler', 'contournement.*blocage'],
      es: ['acoso', 'intimidación', 'hostigamiento', 'evasión.*bloqueo'],
      ja: ['嫌がらせ', 'ハラスメント', 'いじめ', 'ストーカー', 'ブロック回避']
    }
  },

  // Hate Speech Protection
  {
    category: 'hate_speech',
    subcategory: 'general_ban',
    weight: 5,
    isPositive: true,
    patterns: {
      en: [
        'hate speech',
        'hate.{0,10}speech',
        'hateful.{0,20}(?:content|language|speech|rhetoric)',
        'slurs?',
        'epithets?',
        'dehumaniz',
        'incit.{0,20}hatred',
        'promote.{0,20}hatred',
        'hatred.{0,20}based on',
        'inflammatory.{0,20}language',
        'offensive.{0,20}language'
      ],
      de: ['hassrede', 'hetze', 'volksverhetzung', 'hass.*äußerung'],
      fr: ['discours de haine', 'propos haineux', 'incitation.*haine'],
      es: ['discurso de odio', 'lenguaje de odio', 'incitación.*odio'],
      ja: ['ヘイトスピーチ', '憎悪表現', '差別的.*発言']
    }
  },

  // Privacy/Doxxing Protection
  {
    category: 'privacy',
    subcategory: 'doxxing_ban',
    weight: 5,
    isPositive: true,
    patterns: {
      en: [
        'doxx?ing',
        'personal information.*without consent',
        'private.*information.*without.*permission',
        'address.*phone.*without',
        'real.*name.*without.*consent',
        'deadnaming'
      ],
      de: ['doxxing', 'persönliche.*daten.*ohne.*zustimmung', 'deadnaming'],
      fr: ['doxing', 'informations.*personnelles.*sans.*consentement', 'deadnaming'],
      es: ['doxing', 'información.*personal.*sin.*consentimiento', 'deadnaming'],
      ja: ['ドキシング', '個人情報.*無断.*公開', 'デッドネーミング']
    }
  },

  // Consent Violations
  {
    category: 'consent',
    subcategory: 'general_violations',
    weight: 5,
    isPositive: true,
    patterns: {
      en: [
        'non[- ]?consensual',
        'without.*consent',
        'unsolicited.*sexual',
        'unwanted.*advances',
        'revenge.*porn',
        'intimate.*images.*without.*consent'
      ],
      de: ['ohne.*zustimmung', 'unerwünschte.*sexuelle', 'racheporno'],
      fr: ['non.{0,5}consensuel', 'sans.*consentement', 'pornodivulgation'],
      es: ['no.*consensual', 'sin.*consentimiento', 'porno.*venganza'],
      ja: ['同意.*なし', '非同意', '合意.*ない']
    }
  },

  // Spam/Scams
  {
    category: 'spam',
    subcategory: 'general_ban',
    weight: 3,
    isPositive: true,
    patterns: {
      en: [
        'spam',
        'scam',
        'phishing',
        'unsolicited.*advertis',
        'malware',
        'excessive.*promotion',
        'link.*farming'
      ],
      de: ['spam', 'betrug', 'phishing', 'malware', 'unerwünschte.*werbung'],
      fr: ['spam', 'arnaque', 'hameçonnage', 'logiciel.*malveillant'],
      es: ['spam', 'estafa', 'phishing', 'malware', 'publicidad.*no.*solicitada'],
      ja: ['スパム', '詐欺', 'フィッシング', 'マルウェア']
    }
  },

  // Violence/Threats
  {
    category: 'violence',
    subcategory: 'threats_ban',
    weight: 5,
    isPositive: true,
    patterns: {
      en: [
        'threats?.*violence',
        'violent.*threats?',
        'death.*threats?',
        'calls?.*violence',
        'incit.*violence',
        'glorif.*violence',
        'graphic.*violence'
      ],
      de: ['gewaltandrohung', 'morddrohung', 'aufruf.*gewalt', 'gewaltverherrlichung'],
      fr: ['menaces?.*violence', 'menaces?.*mort', 'incitation.*violence', 'apologie.*violence'],
      es: ['amenazas?.*violencia', 'amenazas?.*muerte', 'incitación.*violencia'],
      ja: ['暴力.*脅迫', '殺害.*予告', '暴力.*扇動']
    }
  },

  // Misinformation (Optional - lower weight)
  {
    category: 'misinformation',
    subcategory: 'harmful_misinfo',
    weight: 2,
    isPositive: true,
    patterns: {
      en: [
        'misinformation',
        'disinformation',
        'false.*information',
        'misleading.*information',
        'deliberately.*false',
        'knowingly.*false',
        'false.*(?:and|or).*misleading',
        'misleading.*(?:and|or).*false',
        'medical.*misinformation',
        'health.*misinformation',
        'election.*interference',
        'coordinated.*inauthentic'
      ],
      de: ['fehlinformation', 'desinformation', 'falsche.*information', 'irreführend', 'medizinische.*fehlinformation', 'gesundheit.*desinformation', 'wahlmanipulation'],
      fr: ['désinformation', 'information.*fausse', 'information.*trompeuse', 'désinformation.*médicale', 'désinformation.*santé', 'ingérence.*électorale'],
      es: ['desinformación', 'información.*falsa', 'información.*engañosa', 'desinformación.*médica', 'desinformación.*salud', 'interferencia.*electoral'],
      ja: ['誤情報', '偽情報', '虚偽.*情報', '誤解.*招く', '医療.*誤情報', '健康.*デマ', '選挙.*干渉']
    }
  }
];

/**
 * Protected Classes (3 points each)
 */
export const PROTECTED_CLASS_PATTERNS: RulePattern[] = [
  {
    category: 'protected_class',
    subcategory: 'race',
    weight: 3,
    isPositive: true,
    patterns: {
      en: [
        'race',
        'racial',
        'racism',
        'racist',
        'ethnicity',
        'ethnic',
        'color',
        'colour',
        'national.*origin',
        'xenophobia',
        'xenophobic'
      ],
      de: ['rasse', 'rassismus', 'ethnisch', 'herkunft', 'fremdenfeindlich'],
      fr: ['race', 'racisme', 'raciste', 'ethnicité', 'ethnique', 'origine.*nationale', 'xénophobie'],
      es: ['raza', 'racismo', 'racista', 'etnicidad', 'étnico', 'origen.*nacional', 'xenofobia'],
      ja: ['人種', '民族', '出身', '国籍', '外国人嫌悪']
    }
  },
  {
    category: 'protected_class',
    subcategory: 'gender_identity',
    weight: 3,
    isPositive: true,
    patterns: {
      en: [
        'gender.*identity',
        'transgender',
        'trans(?:gender)?(?:\\b|phobia)',
        'non[- ]?binary',
        'gender.*expression',
        'cisgender',
        'transphobia',
        'transphobic',
        'gender.*diverse',
        'sexism',
        'sexist',
        'misogyn',
        'gender',
        'sex(?:\\b|ual.*discrimination)'
      ],
      de: ['geschlechtsidentität', 'transgender', 'nicht[- ]?binär', 'geschlechtsausdruck', 'transphobie', 'sexismus', 'misogynie', 'geschlecht'],
      fr: ['identité.*genre', 'transgenre', 'non[- ]?binaire', 'expression.*genre', 'transphobie', 'sexisme', 'misogynie', 'genre'],
      es: ['identidad.*género', 'transgénero', 'no.*binario', 'expresión.*género', 'transfobia', 'sexismo', 'misoginia', 'género'],
      ja: ['性自認', 'トランスジェンダー', 'ノンバイナリー', '性表現', 'トランス嫌悪', '性差別', '女性嫌悪', '性別']
    }
  },
  {
    category: 'protected_class',
    subcategory: 'sexual_orientation',
    weight: 3,
    isPositive: true,
    patterns: {
      en: [
        'sexual.*orientation',
        'lgbtq',
        'lgbt',
        'lgbtqia',
        'gay',
        'lesbian',
        'bisexual',
        'queer',
        'asexual',
        'pansexual',
        'homophobia',
        'homophobic'
      ],
      de: ['sexuelle.*orientierung', 'lgbtq', 'schwul', 'lesbisch', 'bisexuell', 'homophobie'],
      fr: ['orientation.*sexuelle', 'lgbtq', 'gai', 'lesbienne', 'bisexuel', 'homophobie'],
      es: ['orientación.*sexual', 'lgbtq', 'gay', 'lesbiana', 'bisexual', 'homofobia'],
      ja: ['性的指向', 'lgbtq', 'ゲイ', 'レズビアン', 'ホモフォビア']
    }
  },
  {
    category: 'protected_class',
    subcategory: 'religion',
    weight: 3,
    isPositive: true,
    patterns: {
      en: [
        'religion',
        'religious',
        'faith',
        'belief',
        'creed',
        'antisemitism',
        'anti[- ]?semitism',
        'antisemitic',
        'islamophobia',
        'islamophobic'
      ],
      de: ['religion', 'religiös', 'glaube', 'bekenntnis', 'antisemitismus', 'islamophobie'],
      fr: ['religion', 'religieux', 'foi', 'croyance', 'antisémitisme', 'islamophobie'],
      es: ['religión', 'religioso', 'fe', 'creencia', 'antisemitismo', 'islamofobia'],
      ja: ['宗教', '信仰', '信条', '反ユダヤ主義', 'イスラム嫌悪']
    }
  },
  {
    category: 'protected_class',
    subcategory: 'disability',
    weight: 3,
    isPositive: true,
    patterns: {
      en: [
        'disability',
        'disabilities',
        'disabled',
        'ableism',
        'ableist',
        'neurodivergent',
        'neurodiversity',
        'mental.*health',
        'mental.*illness'
      ],
      de: ['behinderung', 'behindert', 'ableismus', 'neurodivergent', 'neurodiversität'],
      fr: ['handicap', 'handicapé', 'validisme', 'neurodivergent', 'neurodiversité'],
      es: ['discapacidad', 'discapacitado', 'capacitismo', 'neurodivergente', 'neurodiversidad'],
      ja: ['障害', '障がい', '能力主義', 'ニューロダイバージェント', '神経多様性']
    }
  },
  {
    category: 'protected_class',
    subcategory: 'age',
    weight: 2,
    isPositive: true,
    patterns: {
      en: ['age', 'ageism', 'ageist'],
      de: ['alter', 'altersdiskriminierung'],
      fr: ['âge', 'âgisme'],
      es: ['edad', 'edadismo'],
      ja: ['年齢', '年齢差別']
    }
  },
  {
    category: 'protected_class',
    subcategory: 'caste',
    weight: 3,
    isPositive: true,
    patterns: {
      en: ['caste', 'casteism', 'casteist'],
      de: ['kaste', 'kastensystem'],
      fr: ['caste', 'système.*castes'],
      es: ['casta', 'sistema.*castas'],
      ja: ['カースト', 'カースト制度']
    }
  }
];

/**
 * Positive Indicators (2-3 points each)
 */
export const POSITIVE_INDICATOR_PATTERNS: RulePattern[] = [
  {
    category: 'positive',
    subcategory: 'appeals_process',
    weight: 3,
    isPositive: true,
    patterns: {
      en: ['appeals?', 'appeal.*process', 'contest.*decision', 'review.*decision', 'dispute'],
      de: ['berufung', 'einspruch', 'beschwerde'],
      fr: ['appel', 'recours', 'contester'],
      es: ['apelación', 'recurso', 'impugnar'],
      ja: ['異議申し立て', '再審査', '不服申し立て']
    }
  },
  {
    category: 'positive',
    subcategory: 'transparency',
    weight: 2,
    isPositive: true,
    patterns: {
      en: ['transparency', 'transparent', 'moderation.*log', 'public.*moderation', 'accountability'],
      de: ['transparenz', 'rechenschaftspflicht', 'moderation.*protokoll'],
      fr: ['transparence', 'responsabilité', 'journal.*modération'],
      es: ['transparencia', 'responsabilidad', 'registro.*moderación'],
      ja: ['透明性', '説明責任', 'モデレーション.*記録']
    }
  },
  {
    category: 'positive',
    subcategory: 'content_warnings',
    weight: 2,
    isPositive: true,
    patterns: {
      en: ['content.*warning', 'cw', 'trigger.*warning', 'tw', 'nsfw.*tag'],
      de: ['inhaltswarnung', 'trigger.*warnung'],
      fr: ['avertissement.*contenu', 'avertissement.*déclencheur'],
      es: ['advertencia.*contenido', 'advertencia.*disparador'],
      ja: ['コンテンツ警告', 'トリガー警告', '閲覧注意']
    }
  },
  {
    category: 'positive',
    subcategory: 'graduated_enforcement',
    weight: 2,
    isPositive: true,
    patterns: {
      en: ['graduated', 'escalat', 'warning.*before', 'progressive.*enforcement', 'proportional'],
      de: ['abgestuft', 'eskalation', 'warnung.*vor', 'verhältnismäßig'],
      fr: ['gradué', 'escalade', 'avertissement.*avant', 'proportionné'],
      es: ['graduado', 'escalamiento', 'advertencia.*antes', 'proporcional'],
      ja: ['段階的', 'エスカレーション', '警告.*前']
    }
  },
  {
    category: 'positive',
    subcategory: 'community_input',
    weight: 2,
    isPositive: true,
    patterns: {
      en: ['community.*input', 'user.*feedback', 'democratic', 'community.*vote'],
      de: ['gemeinschaft.*beteiligung', 'benutzer.*feedback', 'demokratisch'],
      fr: ['participation.*communauté', 'retour.*utilisateur', 'démocratique'],
      es: ['participación.*comunidad', 'retroalimentación.*usuario', 'democrático'],
      ja: ['コミュニティ.*参加', 'ユーザー.*フィードバック', '民主的']
    }
  }
];

/**
 * Red Flags (negative points)
 */
export const RED_FLAG_PATTERNS: RulePattern[] = [
  {
    category: 'red_flag',
    subcategory: 'free_speech_absolutism',
    weight: -10,
    isRedFlag: true,
    patterns: {
      en: [
        'free speech.*absolute',
        'unlimited.*free.*speech',
        'no.*censorship',
        'anything.*goes',
        'free.*expression.*paramount'
      ],
      de: ['meinungsfreiheit.*absolut', 'keine.*zensur'],
      fr: ['liberté.*expression.*absolue', 'pas.*censure'],
      es: ['libertad.*expresión.*absoluta', 'sin.*censura'],
      ja: ['言論.*絶対.*自由', '検閲.*なし']
    }
  },
  {
    category: 'red_flag',
    subcategory: 'hostile_framing',
    weight: -15,
    isRedFlag: true,
    patterns: {
      en: [
        'woke.*mob',
        'cancel.*culture',
        'snowflakes?',
        'sjw',
        'politically.*correct.*police',
        'thought.*police'
      ],
      de: ['woke.*mob', 'cancel.*kultur'],
      fr: ['woke.*mob', 'culture.*annulation'],
      es: ['woke.*mob', 'cultura.*cancelación'],
      ja: ['ポリコレ.*警察']
    }
  },
  {
    category: 'red_flag',
    subcategory: 'discrimination_allowed',
    weight: -20,
    isRedFlag: true,
    patterns: {
      en: [
        'right.*discriminate',
        'protected.*from.*criticism',
        'special.*protection.*for',
        'criticism.*is.*not.*[a-z]+phobia'
      ],
      de: ['recht.*diskriminieren'],
      fr: ['droit.*discriminer'],
      es: ['derecho.*discriminar'],
      ja: ['差別.*権利']
    }
  },
  {
    category: 'red_flag',
    subcategory: 'vague_absent',
    weight: -5,
    isRedFlag: true,
    patterns: {
      en: [
        '^be.*nice$',
        '^be.*kind$',
        '^don\'?t.*be.*jerk',
        'common.*sense',
        'use.*judgement'
      ],
      de: ['^sei.*nett$', 'gesunder.*menschenverstand'],
      fr: ['^sois.*gentil', 'bon.*sens'],
      es: ['^sé.*amable', 'sentido.*común'],
      ja: ['^優しく.*して', '常識']
    }
  }
];

/**
 * All patterns combined for easy iteration
 * Umbrella patterns are checked first to catch broad language
 */
export const ALL_PATTERNS = [
  ...UMBRELLA_PATTERNS,
  ...CORE_SAFETY_PATTERNS,
  ...PROTECTED_CLASS_PATTERNS,
  ...POSITIVE_INDICATOR_PATTERNS,
  ...RED_FLAG_PATTERNS
];

/**
 * Get patterns for a specific language (with English fallback)
 */
export function getPatternsForLanguage(language: string): RulePattern[] {
  return ALL_PATTERNS.map(pattern => ({
    ...pattern,
    patterns: {
      [language]: pattern.patterns[language] || pattern.patterns.en || []
    }
  }));
}
