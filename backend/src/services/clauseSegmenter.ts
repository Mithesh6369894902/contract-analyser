export interface ClauseSegment {
  text: string;
  type: string;
  startPosition: number;
  endPosition: number;
}

const CLAUSE_PATTERNS: { type: string; patterns: RegExp[] }[] = [
  {
    type: 'Liability & Damages',
    patterns: [/liability/gi, /limitation of liability/gi, /damages/gi, /exclusive remedy/gi],
  },
  {
    type: 'Termination',
    patterns: [/terminat/gi, /cancell/gi, /notice of termination/gi, /revert to provider/gi],
  },
  {
    type: 'Payment & Fees',
    patterns: [/payment/gi, /invoice/gi, /fee/gi, /price/gi, /penalty/gi, /non.?refundable/gi],
  },
  {
    type: 'Auto-Renewal',
    patterns: [/auto.?renew/gi, /renewal/gi, /automatic extension/gi, /evergreen/gi],
  },
  {
    type: 'Indemnification',
    patterns: [/indemnif/gi, /hold harmless/gi, /duty to defend/gi],
  },
  {
    type: 'Governing Law',
    patterns: [/governing law/gi, /jurisdiction/gi, /courts of/gi, /venue/gi],
  },
  {
    type: 'Confidentiality',
    patterns: [/confidential/gi, /non.?disclosure/gi, /trade secret/gi],
  },
  {
    type: 'Intellectual Property',
    patterns: [/intellectual property/gi, /copyright/gi, /patent/gi, /deliverables/gi, /work made for hire/gi],
  },
  {
    type: 'Restrictive Covenants',
    patterns: [/non.?compete/gi, /non.?solicitation/gi, /restraint of trade/gi],
  },
  {
    type: 'Dispute Resolution',
    patterns: [/arbitrat/gi, /class action/gi, /jury trial/gi],
  },
  {
    type: 'Warranties & Disclaimers',
    patterns: [/warrant/gi, /as.?is/gi, /merchantability/gi],
  },
  {
    type: 'Force Majeure',
    patterns: [/force majeure/gi, /act of god/gi, /unforeseeable/gi],
  },
];

export function segmentClauses(text: string): ClauseSegment[] {
  const sections = splitIntoSections(text);
  const clauses: ClauseSegment[] = [];

  for (const section of sections) {
    const clauseType = identifyClauseType(section.text);
    clauses.push({
      text: section.text,
      type: clauseType || 'General Terms',
      startPosition: section.start,
      endPosition: section.end,
    });
  }

  return clauses;
}

function splitIntoSections(text: string): { text: string; start: number; end: number }[] {
  if (!text || text.trim().length === 0) return [];

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
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

    if (isHeader && currentBlock.join('\n').trim().length > 25) {
      sections.push({
        text: currentBlock.join('\n').trim(),
        start: blockStart,
        end: charCounter,
      });
      currentBlock = [rawLine];
      blockStart = charCounter;
    } else {
      currentBlock.push(rawLine);
    }

    charCounter += rawLine.length + 1;
  }

  if (currentBlock.join('\n').trim().length > 0) {
    sections.push({
      text: currentBlock.join('\n').trim(),
      start: blockStart,
      end: normalized.length,
    });
  }

  // Strategy 2: Paragraph breakdown if <= 1 section
  if (sections.length <= 1) {
    const paragraphs = normalized.split(/\n\s*\n+/);
    if (paragraphs.length > 1) {
      const paraSections: { text: string; start: number; end: number }[] = [];
      let cursor = 0;
      for (const p of paragraphs) {
        const clean = p.trim();
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
      if (paraSections.length > 1) return paraSections;
    }
  }

  // Strategy 3: Multi-sentence split for continuous blocks
  if (sections.length === 1 && sections[0].text.length > 100) {
    const rawSection = sections[0].text;
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

      if (sentenceSections.length > 1) return sentenceSections;
    }
  }

  const cleaned = sections.filter(s => {
    const t = s.text.trim();
    if (t.length < 15) return false;
    if (/^IN WITNESS WHEREOF/i.test(t) && t.length < 60) return false;
    return true;
  });

  return cleaned.length > 0 ? cleaned : sections;
}

function identifyClauseType(text: string): string {
  const scores: { type: string; score: number }[] = [];

  for (const { type, patterns } of CLAUSE_PATTERNS) {
    let score = 0;
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length;
      }
    }
    if (score > 0) {
      scores.push({ type, score });
    }
  }

  if (scores.length === 0) {
    return 'General Terms';
  }

  scores.sort((a, b) => b.score - a.score);
  return scores[0].type;
}
