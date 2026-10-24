export interface RiskFinding {
  type: string;
  desc: string;
  weight: number;
  matchedText?: string;
}

export interface Clause {
  id: string;
  contractId: string;
  clauseType: string;
  originalText: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  explanation: string;
  recommendations: string;
  findings?: RiskFinding[];
  positionStart?: number;
  positionEnd?: number;
}

export interface RiskPattern {
  pattern: RegExp;
  weight: number;
  type: string;
  desc: string;
  recommendation: string;
}

export const RISK_PATTERNS: RiskPattern[] = [
  // 1. LIABILITY & DAMAGES
  {
    pattern: /unlimited liability/gi,
    weight: 0.95,
    type: 'Liability',
    desc: 'Unlimited liability clause with no monetary cap',
    recommendation: 'Negotiate a mutual liability cap limited to fees paid in the preceding 12 months.',
  },
  {
    pattern: /no limitation of liability|without limit(?:ation)? on liability/gi,
    weight: 0.90,
    type: 'Liability',
    desc: 'Exclusion of liability caps',
    recommendation: 'Insert an express mutual limitation of liability section with defined financial caps.',
  },
  {
    pattern: /(?:shall|will) have no liability|liability.*capped at.*(?:zero|\$0\b|no amount)/gi,
    weight: 0.88,
    type: 'Liability',
    desc: 'Total exclusion or zero liability for provider',
    recommendation: 'Require reasonable liability for breaches of confidentiality, IP, and gross negligence.',
  },
  {
    pattern: /sole and exclusive remedy|exclusive remedy/gi,
    weight: 0.75,
    type: 'Liability',
    desc: 'Exclusive remedy restriction limiting legal recourse',
    recommendation: 'Ensure exclusive remedy exceptions exist for willful misconduct and statutory breaches.',
  },
  {
    pattern: /indirect,?\s*(?:incidental,?\s*)?(?:special,?\s*)?(?:consequential|punitive)\s+damages/gi,
    weight: 0.70,
    type: 'Liability',
    desc: 'Broad consequential and indirect damages disclaimer',
    recommendation: 'Make the waiver of consequential damages strictly mutual for both parties.',
  },
  {
    pattern: /not exceed the (?:total )?fees paid/gi,
    weight: 0.65,
    type: 'Liability',
    desc: 'Liability capped strictly at fees paid',
    recommendation: 'Verify liability cap covers potential breach damages and is balanced mutually.',
  },

  // 2. TERMINATION & CANCELLATION
  {
    pattern: /immediately\s+(?:and\s+)?without\s+notice/gi,
    weight: 0.88,
    type: 'Termination',
    desc: 'Immediate termination without written notice',
    recommendation: 'Require a mandatory 15-30 day written notice with a cure period before termination.',
  },
  {
    pattern: /terminate (?:this agreement )?(?:at any time )?without (?:cause|reason|notice)/gi,
    weight: 0.82,
    type: 'Termination',
    desc: 'Unilateral termination for convenience without reasonable notice',
    recommendation: 'Require mutual termination rights with at least 30 to 60 days advance written notice.',
  },
  {
    pattern: /(?:90|120|180)\s+days(?:['']|\s+)written\s+notice/gi,
    weight: 0.65,
    type: 'Termination',
    desc: 'Excessively long termination notice period',
    recommendation: 'Reduce the termination notice window to a standard 30 to 45 days.',
  },
  {
    pattern: /all rights.*shall (?:immediately )?revert to (?:provider|vendor)/gi,
    weight: 0.78,
    type: 'Termination',
    desc: 'Immediate forfeiture and reversion of all rights upon termination',
    recommendation: 'Ensure completed paid deliverables remain the property of the client.',
  },
  {
    pattern: /upon termination.*pay (?:all )?(?:outstanding|remaining) fees within (?:[1-7]|seven) days/gi,
    weight: 0.70,
    type: 'Termination',
    desc: 'Abbreviated payment deadline upon termination',
    recommendation: 'Negotiate standard 30-day payment terms following final invoice submission.',
  },

  // 3. PAYMENT & PENALTIES
  {
    pattern: /non.?refundable\s+under\s+any\s+circumstances|all (?:fees|payments) are strictly non.?refundable/gi,
    weight: 0.85,
    type: 'Payment',
    desc: 'Absolute non-refundable payment policy with zero exception',
    recommendation: 'Insert prorated refunds if the agreement is terminated early due to provider breach.',
  },
  {
    pattern: /non.?refundable/gi,
    weight: 0.68,
    type: 'Payment',
    desc: 'Non-refundable fee condition',
    recommendation: 'Add clause allowing refund for unperformed services or material failure.',
  },
  {
    pattern: /penalty (?:of )?\d+%\s+per\s+month|interest (?:of )?(?:[2-9]|\d{2,})%\s+per\s+month/gi,
    weight: 0.85,
    type: 'Payment',
    desc: 'Excessive penalty or late payment interest (>24% APR)',
    recommendation: 'Cap late interest to standard statutory limits (typically 1.0% to 1.5% per month).',
  },
  {
    pattern: /penalty|late (?:payment )?fee/gi,
    weight: 0.60,
    type: 'Payment',
    desc: 'Late payment fee and penalty provision',
    recommendation: 'Include a 10-day grace period following billing notice before penalties accrue.',
  },
  {
    pattern: /right to suspend (?:services|access) if payment is not received within (?:[1-9]|1[0-4]) days/gi,
    weight: 0.72,
    type: 'Payment',
    desc: 'Rapid service suspension for minor payment delays',
    recommendation: 'Require at least 15 business days written notice and cure period before suspension.',
  },
  {
    pattern: /right to (?:increase|modify|adjust) (?:prices|fees|rates)(?: at any time)?(?: without notice)?/gi,
    weight: 0.80,
    type: 'Payment',
    desc: 'Unilateral price increase right for vendor',
    recommendation: 'Require price lock for current term and cap renewal increases to CPI (e.g., max 3-5%).',
  },

  // 4. AUTO-RENEWAL & LOCK-IN
  {
    pattern: /automatic(?:ally)?\s+renew(?:s|al)?/gi,
    weight: 0.72,
    type: 'Auto-renewal',
    desc: 'Automatic contract renewal clause',
    recommendation: 'Require provider to send written reminder 30-60 days before the renewal cutoff deadline.',
  },
  {
    pattern: /notice of non.?renewal at least (?:60|90|120) days/gi,
    weight: 0.75,
    type: 'Auto-renewal',
    desc: 'Strict advance opt-out window to prevent unwanted rollover',
    recommendation: 'Shorten opt-out notification window to 30 days before contract anniversary.',
  },
  {
    pattern: /renewal terms may be modified.*with \d+ days/gi,
    weight: 0.78,
    type: 'Auto-renewal',
    desc: 'Unilateral terms modification upon renewal',
    recommendation: 'Ensure client has right to cancel without penalty if renewal terms are modified.',
  },

  // 5. INDEMNIFICATION
  {
    pattern: /indemnif.*all.*claims/gi,
    weight: 0.86,
    type: 'Indemnification',
    desc: 'Overly broad indemnity covering all claims and third parties',
    recommendation: 'Limit indemnification to direct third-party claims arising from gross negligence.',
  },
  {
    pattern: /(?:provider|vendor) shall have no obligation to indemnify/gi,
    weight: 0.92,
    type: 'Indemnification',
    desc: 'Completely one-sided indemnification obligation',
    recommendation: 'Make indemnification mutual: provider must indemnify for IP infringement and data breach.',
  },
  {
    pattern: /indemnify,?\s+defend,?\s+and\s+hold\s+harmless/gi,
    weight: 0.78,
    type: 'Indemnification',
    desc: 'Comprehensive duty to defend and hold harmless',
    recommendation: 'Exclude duty to defend from early stages and require reasonable control of defense counsel.',
  },

  // 6. INTELLECTUAL PROPERTY
  {
    pattern: /all intellectual property.*exclusive property of (?:the )?(?:provider|vendor)/gi,
    weight: 0.88,
    type: 'IP Rights',
    desc: 'Vendor retains complete ownership of all work product and IP',
    recommendation: 'Specify that custom deliverables paid for by client are owned by client upon payment.',
  },
  {
    pattern: /client shall have no right,?\s+title,?\s+or interest in any deliverables/gi,
    weight: 0.92,
    type: 'IP Rights',
    desc: 'Client stripped of all rights and title to deliverables',
    recommendation: 'Require assignment of work product or an irrevocable worldwide perpetual license.',
  },
  {
    pattern: /perpetual,?\s+irrevocable,?\s+(?:worldwide,?\s+)?royalty.?free license to.*(?:customer|client) data/gi,
    weight: 0.90,
    type: 'IP Rights',
    desc: 'Perpetual irrevocable license to client proprietary data',
    recommendation: 'Delete client data license; limit vendor access strictly to service delivery.',
  },

  // 7. DISPUTE RESOLUTION & LEGAL WAIVERS
  {
    pattern: /class action waiver|waive.*class action/gi,
    weight: 0.84,
    type: 'Legal',
    desc: 'Waiver of class action participation rights',
    recommendation: 'Review consumer protection implications and retain individual lawsuit remedies.',
  },
  {
    pattern: /waive.*jury trial|waiver of trial by jury/gi,
    weight: 0.76,
    type: 'Legal',
    desc: 'Waiver of constitutional right to jury trial',
    recommendation: 'Consider whether bench trial or arbitration aligns with your risk strategy.',
  },
  {
    pattern: /binding arbitration|mandatory arbitration/gi,
    weight: 0.65,
    type: 'Legal',
    desc: 'Mandatory binding arbitration requirement',
    recommendation: 'Ensure arbitrator fees are shared equally and arbitration takes place in local venue.',
  },
  {
    pattern: /waive.*(?:any and all|all)\s+rights/gi,
    weight: 0.82,
    type: 'Legal',
    desc: 'Broad blanket waiver of legal rights',
    recommendation: 'Refuse general waivers; specify exact rights and remedies being adjusted.',
  },
  {
    pattern: /attorney(?:s'|s)?\s+fees/gi,
    weight: 0.55,
    type: 'Legal',
    desc: 'Attorney fees shifting clause',
    recommendation: 'Ensure fee-shifting applies mutually to the prevailing party only.',
  },

  // 8. GOVERNING LAW & JURISDICTION
  {
    pattern: /exclusive (?:jurisdiction|venue).*(?:courts of|in)\s+([A-Za-z\s]+)/gi,
    weight: 0.60,
    type: 'Governing Law',
    desc: 'Exclusive foreign or distant court jurisdiction',
    recommendation: 'Negotiate neutral jurisdiction or your own home state/country courts.',
  },
  {
    pattern: /governing law/gi,
    weight: 0.35,
    type: 'Governing Law',
    desc: 'Standard governing law clause',
    recommendation: 'Confirm governing law is acceptable to your legal counsel.',
  },

  // 9. WARRANTIES & DISCLAIMERS
  {
    pattern: /as.?is|with all faults/gi,
    weight: 0.74,
    type: 'Warranty',
    desc: 'As-is warranty disclaimer with zero performance guarantee',
    recommendation: 'Require express warranty that services will conform to specifications for 90+ days.',
  },
  {
    pattern: /no warranty|disclaims all warranties/gi,
    weight: 0.76,
    type: 'Warranty',
    desc: 'Complete disclaimer of implied and express warranties',
    recommendation: 'Require warranty of non-infringement, compliance with law, and professional standards.',
  },

  // 10. UNILATERAL DISCRETION & AMENDMENT
  {
    pattern: /sole discretion/gi,
    weight: 0.75,
    type: 'Discretion',
    desc: 'Unilateral sole discretion clause allowing arbitrary decisions',
    recommendation: 'Change "sole discretion" to "commercially reasonable discretion" or "mutual agreement".',
  },
  {
    pattern: /without notice/gi,
    weight: 0.76,
    type: 'General',
    desc: 'Unilateral action permitted without advance notice',
    recommendation: 'Require prompt written notice for any material action or change.',
  },
  {
    pattern: /modify (?:this agreement|these terms) at any time/gi,
    weight: 0.84,
    type: 'Discretion',
    desc: 'Unilateral right to alter agreement terms after signing',
    recommendation: 'Mandate that any amendments require written agreement signed by both parties.',
  },

  // 11. RESTRICTIVE COVENANTS
  {
    pattern: /non.?compete|not (?:engage in|participate in) any competing/gi,
    weight: 0.84,
    type: 'Non-Compete',
    desc: 'Restrictive covenant preventing commercial competition',
    recommendation: 'Narrow non-compete scope geographically and durationally, or remove entirely.',
  },
  {
    pattern: /non.?solicitation|shall not solicit (?:any )?(?:employees?|clients?|customers?)/gi,
    weight: 0.70,
    type: 'Non-Solicit',
    desc: 'Non-solicitation of staff or clients restriction',
    recommendation: 'Permit general public employment solicitations and narrow to direct solicitation.',
  },

  // 12. CONFIDENTIALITY
  {
    pattern: /confidentiality.*(?:survive|remain).*(?:indefinitely|in perpetuity|forever)/gi,
    weight: 0.68,
    type: 'Confidentiality',
    desc: 'Perpetual confidentiality obligation with no expiration',
    recommendation: 'Limit confidentiality duration to standard 3 to 5 years (except genuine trade secrets).',
  },
  {
    pattern: /confidential/gi,
    weight: 0.28,
    type: 'Confidentiality',
    desc: 'Confidentiality protection provision',
    recommendation: 'Ensure mutual obligations and standard exclusions (public knowledge, court orders).',
  },

  // 13. FORCE MAJEURE
  {
    pattern: /force majeure/gi,
    weight: 0.25,
    type: 'Force Majeure',
    desc: 'Force majeure excused performance clause',
    recommendation: 'Ensure prompt notification is required and payment obligations are not excused.',
  },
];

/**
 * Intelligent clause segmentation that splits documents and text inputs accurately
 * into individual clauses, sections, articles, or subclauses.
 */
export function segmentClauses(text: string): { text: string; start: number; end: number }[] {
  if (!text || text.trim().length === 0) return [];

  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  // Strategy 1: Check for Article / Section / Numbered headers
  const lines = normalized.split('\n');
  const sections: { text: string; start: number; end: number }[] = [];

  let currentBlock: string[] = [];
  let blockStart = 0;
  let charCounter = 0;

  const headerRegex = /^(?:(?:ARTICLE|SECTION|Clause|Section|Article|Schedule|Exhibit)\s+[IVXLCDM\d]+[.:\s-]?|(?:\d+\.\d*(?:\.\d+)*|\([a-z\d]+\)|\[\d+\]|[IVXLCDM]+\.)\s+|[•\-\*]\s+|[A-Z\s]{4,35}:)/i;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    const isHeader = trimmed.length > 0 && headerRegex.test(trimmed);

    // If we hit a header and already have accumulated lines in currentBlock
    if (isHeader && currentBlock.join('\n').trim().length > 25) {
      const sectionText = currentBlock.join('\n').trim();
      sections.push({
        text: sectionText,
        start: blockStart,
        end: charCounter,
      });
      currentBlock = [rawLine];
      blockStart = charCounter;
    } else {
      currentBlock.push(rawLine);
    }

    charCounter += rawLine.length + 1; // +1 for \n
  }

  // Push final remaining block
  if (currentBlock.join('\n').trim().length > 0) {
    sections.push({
      text: currentBlock.join('\n').trim(),
      start: blockStart,
      end: normalized.length,
    });
  }

  // Strategy 2: If we only got 1 section or few sections, inspect for paragraph breaks
  if (sections.length <= 1) {
    const paragraphs = normalized.split(/\n\s*\n+/);
    if (paragraphs.length > 1) {
      const paraSections: { text: string; start: number; end: number }[] = [];
      let cursor = 0;

      for (const para of paragraphs) {
        const clean = para.trim();
        if (clean.length > 15) {
          const start = normalized.indexOf(clean, cursor);
          paraSections.push({
            text: clean,
            start: start !== -1 ? start : cursor,
            end: (start !== -1 ? start : cursor) + clean.length,
          });
          cursor = (start !== -1 ? start : cursor) + clean.length;
        }
      }

      if (paraSections.length > 1) {
        return paraSections;
      }
    }
  }

  // Strategy 3: Single continuous block with multiple provisions/sentences
  // If still only 1 section and it contains multiple sentences or semicolons, split by sentence boundaries
  if (sections.length === 1 && sections[0].text.length > 100) {
    const rawSection = sections[0].text;
    // Split on sentence boundaries: period/semicolon followed by space and capital letter or digit
    const sentenceSplit = rawSection.split(/(?<=[.;!?])\s+(?=[A-Z0-9])/);
    if (sentenceSplit.length >= 2) {
      const sentenceSections: { text: string; start: number; end: number }[] = [];
      let currentSentenceGroup = '';
      let groupStart = 0;

      for (let s = 0; s < sentenceSplit.length; s++) {
        const item = sentenceSplit[s].trim();
        if (!item) continue;

        if (currentSentenceGroup.length === 0) {
          currentSentenceGroup = item;
          groupStart = rawSection.indexOf(item);
        } else if (currentSentenceGroup.length < 60) {
          // If previous sentence was very short, combine
          currentSentenceGroup += ' ' + item;
        } else {
          sentenceSections.push({
            text: currentSentenceGroup.trim(),
            start: groupStart,
            end: groupStart + currentSentenceGroup.length,
          });
          currentSentenceGroup = item;
          groupStart = rawSection.indexOf(item);
        }
      }

      if (currentSentenceGroup.trim().length > 15) {
        sentenceSections.push({
          text: currentSentenceGroup.trim(),
          start: groupStart,
          end: groupStart + currentSentenceGroup.length,
        });
      }

      if (sentenceSections.length > 1) {
        return sentenceSections;
      }
    }
  }

  // Filter out any empty administrative lines (e.g. signature lines)
  const cleanedSections = sections.filter(s => {
    const t = s.text.trim();
    if (t.length < 15) return false;
    if (/^IN WITNESS WHEREOF/i.test(t) && t.length < 60) return false;
    return true;
  });

  return cleanedSections.length > 0 ? cleanedSections : sections;
}

/**
 * Determines the most prominent clause type based on comprehensive legal domain patterns.
 */
export function identifyClauseType(text: string): string {
  const typePatterns: { type: string; patterns: RegExp[]; weight: number }[] = [
    {
      type: 'Liability & Damages',
      patterns: [/liability/gi, /damages/gi, /remedy/gi, /loss of profits/gi, /indirect damages/gi],
      weight: 1.5,
    },
    {
      type: 'Termination',
      patterns: [/terminat/gi, /cancell/gi, /notice of termination/gi, /right to revert/gi],
      weight: 1.4,
    },
    {
      type: 'Payment & Fees',
      patterns: [/payment/gi, /invoice/gi, /fee/gi, /price/gi, /penalty/gi, /interest/gi, /non.?refundable/gi],
      weight: 1.3,
    },
    {
      type: 'Indemnification',
      patterns: [/indemnif/gi, /hold harmless/gi, /duty to defend/gi],
      weight: 1.5,
    },
    {
      type: 'Auto-Renewal',
      patterns: [/auto.?renew/gi, /renewal/gi, /extension of term/gi, /evergreen/gi],
      weight: 1.4,
    },
    {
      type: 'Intellectual Property',
      patterns: [/intellectual property/gi, /copyright/gi, /patent/gi, /deliverables/gi, /work made for hire/gi, /work product/gi],
      weight: 1.4,
    },
    {
      type: 'Warranties & Disclaimers',
      patterns: [/warrant/gi, /as.?is/gi, /merchantability/gi, /fitness for/gi, /disclaimer/gi],
      weight: 1.3,
    },
    {
      type: 'Confidentiality',
      patterns: [/confidential/gi, /non.?disclosure/gi, /trade secret/gi, /proprietary/gi],
      weight: 1.2,
    },
    {
      type: 'Restrictive Covenants',
      patterns: [/non.?compete/gi, /non.?solicit/gi, /restraint of trade/gi],
      weight: 1.4,
    },
    {
      type: 'Dispute Resolution',
      patterns: [/arbitrat/gi, /class action/gi, /jury trial/gi, /dispute/gi, /litigation/gi, /attorney/gi],
      weight: 1.3,
    },
    {
      type: 'Governing Law',
      patterns: [/governing law/gi, /jurisdiction/gi, /courts of/gi, /venue/gi, /applicable law/gi],
      weight: 1.2,
    },
    {
      type: 'Force Majeure',
      patterns: [/force majeure/gi, /act of god/gi, /unforeseeable/gi],
      weight: 1.2,
    },
  ];

  let bestType = 'General Terms';
  let bestScore = 0;

  for (const { type, patterns, weight } of typePatterns) {
    let score = 0;
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * weight;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  return bestType;
}

/**
 * Analyzes a single clause against all risk patterns.
 */
export function analyzeClause(text: string): {
  score: number;
  findings: RiskFinding[];
  explanation: string;
  recommendations: string;
} {
  const findings: RiskFinding[] = [];
  const recs: string[] = [];
  let maxWeight = 0;

  for (const rule of RISK_PATTERNS) {
    if (rule.pattern.test(text)) {
      findings.push({
        type: rule.type,
        desc: rule.desc,
        weight: rule.weight,
      });
      maxWeight = Math.max(maxWeight, rule.weight);
      if (!recs.includes(rule.recommendation)) {
        recs.push(rule.recommendation);
      }
    }
  }

  // Compute composite score
  let finalScore = 0;
  if (findings.length > 0) {
    // Primary risk weight + compound factor for multiple risks in one clause
    finalScore = Math.min(1.0, maxWeight + 0.04 * (findings.length - 1));
  } else {
    // Standard safe clause baseline
    finalScore = 0.12;
  }

  // Generate explanation
  let explanation = '';
  if (findings.length > 0) {
    const list = findings.map(f => `• ${f.desc}`).join('\n');
    explanation = `Detected ${findings.length} risk factor${findings.length > 1 ? 's' : ''}:\n${list}`;
  } else {
    explanation = 'Standard contractual provision. No one-sided clauses, excessive liabilities, or high-risk legal terms detected.';
  }

  // Generate recommendation
  let recommendations = '';
  if (recs.length > 0) {
    recommendations = recs.slice(0, 3).map(r => `• ${r}`).join('\n');
  } else {
    recommendations = 'Standard clause. Review to ensure operational and commercial alignment with your goals.';
  }

  return {
    score: Math.round(finalScore * 100) / 100,
    findings,
    explanation,
    recommendations,
  };
}

/**
 * Main offline contract analyzer that processes all clauses and assigns unique IDs,
 * accurate risk levels, scores, and recommendations.
 */
export function analyzeContractOffline(text: string, contractId: string = 'offline'): Clause[] {
  const sections = segmentClauses(text);
  const clauses: Clause[] = [];

  sections.forEach((section, idx) => {
    const clauseType = identifyClauseType(section.text);
    const analysis = analyzeClause(section.text);

    const riskLevel: 'low' | 'medium' | 'high' =
      analysis.score >= 0.70 ? 'high' : analysis.score >= 0.40 ? 'medium' : 'low';

    clauses.push({
      id: `${contractId}-clause-${idx + 1}`,
      contractId,
      clauseType,
      originalText: section.text,
      riskLevel,
      riskScore: analysis.score,
      explanation: analysis.explanation,
      recommendations: analysis.recommendations,
      findings: analysis.findings,
      positionStart: section.start,
      positionEnd: section.end,
    });
  });

  return clauses;
}
