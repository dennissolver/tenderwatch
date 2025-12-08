export interface MatchResult {
  score: number;
  tier: "strong" | "maybe" | "stretch" | "reject";
  matchedKeywords: string[];
  reasoning: string;
}

export interface MatchConfig {
  keywordsMust: string[];
  keywordsBonus: string[];
  keywordsExclude: string[];
  regions: string[];
  valueMin?: number;
  valueMax?: number;
  includeUnspecifiedValue: boolean;
  minResponseDays?: number;
  preferredSectors: string[];
  preferredBuyers: string[];
  certificationsHeld: string[];
  sensitivity: "strict" | "balanced" | "adventurous";
}

export interface TenderForMatching {
  title: string;
  description: string;
  fullText?: string;
  regions: string[];
  categories: string[];
  buyerOrg?: string;
  valueLow?: number;
  valueHigh?: number;
  closesAt?: Date;
  certificationsRequired: string[];
}

export function matchTender(
  tender: TenderForMatching,
  config: MatchConfig
): MatchResult {
  let score = 0;
  const matchedKeywords: string[] = [];
  const reasons: string[] = [];

  const searchText = \`\${tender.title} \${tender.description} \${tender.fullText || ""}\`.toLowerCase();

  // HARD FILTERS - instant rejection

  // Excluded keywords
  for (const keyword of config.keywordsExclude) {
    if (searchText.includes(keyword.toLowerCase())) {
      return {
        score: 0,
        tier: "reject",
        matchedKeywords: [],
        reasoning: \`Contains excluded keyword: "\${keyword}"\`
      };
    }
  }

  // Region filter (if specified)
  if (config.regions.length > 0) {
    const regionMatch = config.regions.some(r => 
      tender.regions.some(tr => tr.toLowerCase().includes(r.toLowerCase()))
    );
    if (!regionMatch) {
      return {
        score: 0,
        tier: "reject",
        matchedKeywords: [],
        reasoning: "Not in target regions"
      };
    }
  }

  // Value range filter
  if (tender.valueLow !== undefined) {
    if (config.valueMin && tender.valueLow < config.valueMin) {
      return {
        score: 0,
        tier: "reject",
        matchedKeywords: [],
        reasoning: \`Value ($\${tender.valueLow.toLocaleString()}) below minimum ($\${config.valueMin.toLocaleString()})\`
      };
    }
    if (config.valueMax && tender.valueHigh && tender.valueHigh > config.valueMax) {
      return {
        score: 0,
        tier: "reject",
        matchedKeywords: [],
        reasoning: \`Value ($\${tender.valueHigh.toLocaleString()}) above maximum ($\${config.valueMax.toLocaleString()})\`
      };
    }
  } else if (!config.includeUnspecifiedValue) {
    return {
      score: 0,
      tier: "reject",
      matchedKeywords: [],
      reasoning: "Value not specified (excluded by preference)"
    };
  }

  // Response time filter
  if (config.minResponseDays && tender.closesAt) {
    const daysUntilClose = Math.floor(
      (tender.closesAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilClose < config.minResponseDays) {
      return {
        score: 0,
        tier: "reject",
        matchedKeywords: [],
        reasoning: \`Only \${daysUntilClose} days to respond (minimum: \${config.minResponseDays})\`
      };
    }
  }

  // SCORING

  // Must-have keywords (40 points each, max 120)
  let mustMatchCount = 0;
  for (const keyword of config.keywordsMust) {
    if (searchText.includes(keyword.toLowerCase())) {
      mustMatchCount++;
      matchedKeywords.push(keyword);
      if (mustMatchCount <= 3) {
        score += 40;
      }
    }
  }
  if (mustMatchCount > 0) {
    reasons.push(\`Matched \${mustMatchCount} must-have keyword(s)\`);
  }

  // Bonus keywords (15 points each, max 45)
  let bonusMatchCount = 0;
  for (const keyword of config.keywordsBonus) {
    if (searchText.includes(keyword.toLowerCase())) {
      bonusMatchCount++;
      matchedKeywords.push(keyword);
      if (bonusMatchCount <= 3) {
        score += 15;
      }
    }
  }
  if (bonusMatchCount > 0) {
    reasons.push(\`Matched \${bonusMatchCount} bonus keyword(s)\`);
  }

  // Sector match (20 points)
  const sectorMatch = config.preferredSectors.some(s =>
    tender.categories.some(c => c.toLowerCase().includes(s.toLowerCase()))
  );
  if (sectorMatch) {
    score += 20;
    reasons.push("Sector match");
  }

  // Preferred buyer match (25 points)
  if (tender.buyerOrg && config.preferredBuyers.length > 0) {
    const buyerMatch = config.preferredBuyers.some(b =>
      tender.buyerOrg!.toLowerCase().includes(b.toLowerCase())
    );
    if (buyerMatch) {
      score += 25;
      reasons.push("Preferred buyer");
    }
  }

  // Certification match (10 points)
  if (tender.certificationsRequired.length > 0 && config.certificationsHeld.length > 0) {
    const certMatch = tender.certificationsRequired.some(c =>
      config.certificationsHeld.some(h => h.toLowerCase().includes(c.toLowerCase()))
    );
    if (certMatch) {
      score += 10;
      reasons.push("Certification match");
    }
  }

  // Determine tier based on sensitivity
  const thresholds = {
    strict: { strong: 80, maybe: 50, stretch: 30 },
    balanced: { strong: 70, maybe: 40, stretch: 20 },
    adventurous: { strong: 50, maybe: 25, stretch: 10 }
  }[config.sensitivity];

  let tier: "strong" | "maybe" | "stretch" | "reject";
  if (score >= thresholds.strong) {
    tier = "strong";
  } else if (score >= thresholds.maybe) {
    tier = "maybe";
  } else if (score >= thresholds.stretch && config.sensitivity === "adventurous") {
    tier = "stretch";
  } else if (score >= thresholds.stretch && config.sensitivity !== "strict") {
    tier = "stretch";
  } else {
    tier = "reject";
  }

  return {
    score,
    tier,
    matchedKeywords,
    reasoning: reasons.join(". ") || "No significant matches"
  };
}
