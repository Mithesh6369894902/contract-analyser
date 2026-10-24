import { Clause, createClause } from '../models/contract';
import { ClauseSegment } from './clauseSegmenter';

export interface RiskPattern {
  pattern: RegExp;
  weight: number;
  description: string;
  recommendation: string;
}

const RISK_PATTERNS: RiskPattern[] = [
  // Liability
  { pattern: /unlimited liability/gi, weight: 0.95, description: 'Unlimited liability clause with no monetary cap', recommendation: 'Negotiate a mutual liability cap limited to fees paid in preceding 12 months.' },
  { pattern: /no limitation of liability|without limit(?:ation)? on liability/gi, weight: 0.90, description: 'Exclusion of liability caps', recommendation: 'Insert an express mutual limitation of liability section with defined financial caps.' },
  { pattern: /(?:shall|will) have no liability|liability.*capped at.*(?:zero|\$0\b|no amount)/gi, weight: 0.88, description: 'Total exclusion or zero liability for provider', recommendation: 'Require reasonable liability for breaches of confidentiality, IP, and gross negligence.' },
  { pattern: /sole and exclusive remedy|exclusive remedy/gi, weight: 0.75, description: 'Exclusive remedy restriction limiting legal recourse', recommendation: 'Ensure exclusive remedy exceptions exist for willful misconduct and statutory breaches.' },
  { pattern: /indirect,?\s*(?:incidental,?\s*)?(?:special,?\s*)?(?:consequential|punitive)\s+damages/gi, weight: 0.70, description: 'Broad consequential and indirect damages disclaimer', recommendation: 'Make the waiver of consequential damages strictly mutual for both parties.' },
  { pattern: /not exceed the (?:total )?fees paid/gi, weight: 0.65, description: 'Liability capped strictly at fees paid', recommendation: 'Verify liability cap covers potential breach damages and is balanced mutually.' },

  // Termination
  { pattern: /immediately\s+(?:and\s+)?without\s+notice/gi, weight: 0.88, description: 'Immediate termination without written notice', recommendation: 'Require a mandatory 15-30 day written notice with a cure period before termination.' },
  { pattern: /terminate (?:this agreement )?(?:at any time )?without (?:cause|reason|notice)/gi, weight: 0.82, description: 'Unilateral termination for convenience without reasonable notice', recommendation: 'Require mutual termination rights with at least 30 to 60 days advance written notice.' },
  { pattern: /(?:90|120|180)\s+days(?:['']|\s+)written\s+notice/gi, weight: 0.65, description: 'Excessively long termination notice period', recommendation: 'Reduce the termination notice window to a standard 30 to 45 days.' },
  { pattern: /all rights.*shall (?:immediately )?revert to (?:provider|vendor)/gi, weight: 0.78, description: 'Immediate forfeiture of all rights upon termination', recommendation: 'Ensure completed paid deliverables remain the property of the client.' },

  // Payment
  { pattern: /non.?refundable\s+under\s+any\s+circumstances|all (?:fees|payments) are strictly non.?refundable/gi, weight: 0.85, description: 'Absolute non-refundable payment policy with zero exception', recommendation: 'Insert prorated refunds if the agreement is terminated early due to provider breach.' },
  { pattern: /non.?refundable/gi, weight: 0.68, description: 'Non-refundable fee condition', recommendation: 'Add clause allowing refund for unperformed services or material failure.' },
  { pattern: /penalty (?:of )?\d+%\s+per\s+month|interest (?:of )?(?:[2-9]|\d{2,})%\s+per\s+month/gi, weight: 0.85, description: 'Excessive penalty or late payment interest (>24% APR)', recommendation: 'Cap late interest to standard statutory limits (typically 1.0% to 1.5% per month).' },
  { pattern: /penalty|late (?:payment )?fee/gi, weight: 0.60, description: 'Late payment fee and penalty provision', recommendation: 'Include a 10-day grace period following billing notice before penalties accrue.' },
  { pattern: /right to (?:increase|modify|adjust) (?:prices|fees|rates)/gi, weight: 0.80, description: 'Unilateral price increase right for vendor', recommendation: 'Require price lock for current term and cap renewal increases to CPI.' },

  // Auto-renewal
  { pattern: /automatic(?:ally)?\s+renew(?:s|al)?/gi, weight: 0.72, description: 'Automatic contract renewal clause', recommendation: 'Require provider to send written reminder 30-60 days before the renewal cutoff deadline.' },
  { pattern: /notice of non.?renewal at least (?:60|90|120) days/gi, weight: 0.75, description: 'Strict advance opt-out window to prevent unwanted rollover', recommendation: 'Shorten opt-out notification window to 30 days before contract anniversary.' },

  // Indemnification
  { pattern: /indemnif.*all.*claims/gi, weight: 0.86, description: 'Overly broad indemnity covering all claims and third parties', recommendation: 'Limit indemnification to direct third-party claims arising from gross negligence.' },
  { pattern: /(?:provider|vendor) shall have no obligation to indemnify/gi, weight: 0.92, description: 'Completely one-sided indemnification obligation', recommendation: 'Make indemnification mutual: provider must indemnify for IP infringement and data breach.' },
  { pattern: /indemnify,?\s+defend,?\s+and\s+hold\s+harmless/gi, weight: 0.78, description: 'Comprehensive duty to defend and hold harmless', recommendation: 'Exclude duty to defend from early stages and require reasonable control of defense counsel.' },

  // IP Rights
  { pattern: /all intellectual property.*exclusive property of (?:the )?(?:provider|vendor)/gi, weight: 0.88, description: 'Vendor retains complete ownership of all work product and IP', recommendation: 'Specify that custom deliverables paid for by client are owned by client upon payment.' },
  { pattern: /client shall have no right,?\s+title,?\s+or interest in any deliverables/gi, weight: 0.92, description: 'Client stripped of all rights and title to deliverables', recommendation: 'Require assignment of work product or an irrevocable worldwide perpetual license.' },

  // Dispute & Legal
  { pattern: /class action waiver|waive.*class action/gi, weight: 0.84, description: 'Waiver of class action participation rights', recommendation: 'Review consumer protection implications and retain individual lawsuit remedies.' },
  { pattern: /waive.*jury trial|waiver of trial by jury/gi, weight: 0.76, description: 'Waiver of constitutional right to jury trial', recommendation: 'Consider whether bench trial or arbitration aligns with your risk strategy.' },
  { pattern: /binding arbitration|mandatory arbitration/gi, weight: 0.65, description: 'Mandatory binding arbitration requirement', recommendation: 'Ensure arbitrator fees are shared equally and arbitration takes place in local venue.' },

  // Warranties
  { pattern: /as.?is|with all faults/gi, weight: 0.74, description: 'As-is warranty disclaimer with zero performance guarantee', recommendation: 'Require express warranty that services will conform to specifications for 90+ days.' },
  { pattern: /no warranty|disclaims all warranties/gi, weight: 0.76, description: 'Complete disclaimer of implied and express warranties', recommendation: 'Require warranty of non-infringement, compliance with law, and professional standards.' },

  // Restrictive Covenants
  { pattern: /non.?compete|not (?:engage in|participate in) any competing/gi, weight: 0.84, description: 'Restrictive covenant preventing commercial competition', recommendation: 'Narrow non-compete scope geographically and durationally, or remove entirely.' },
  { pattern: /non.?solicitation|shall not solicit (?:any )?(?:employees?|clients?)/gi, weight: 0.70, description: 'Non-solicitation of staff or clients restriction', recommendation: 'Permit general public employment solicitations and narrow to direct solicitation.' },
  { pattern: /sole discretion/gi, weight: 0.75, description: 'Unilateral sole discretion clause allowing arbitrary decisions', recommendation: 'Change "sole discretion" to "commercially reasonable discretion" or "mutual agreement".' },
  { pattern: /without notice/gi, weight: 0.76, description: 'Unilateral action permitted without advance notice', recommendation: 'Require prompt written notice for any material action or change.' },
  { pattern: /confidential/gi, weight: 0.28, description: 'Confidentiality protection provision', recommendation: 'Ensure mutual obligations and standard exclusions (public knowledge, court orders).' },
  { pattern: /force majeure/gi, weight: 0.25, description: 'Force majeure excused performance clause', recommendation: 'Ensure prompt notification is required and payment obligations are not excused.' },
];

export async function analyzeClauses(
  clauses: ClauseSegment[],
  contractId: string
): Promise<Clause[]> {
  const results: Clause[] = [];

  for (const clause of clauses) {
    const ruleBasedResult = applyRuleBasedAnalysis(clause.text);
    let finalScore = ruleBasedResult.score;
    let finalExplanation = ruleBasedResult.explanation;
    let finalRecommendations = ruleBasedResult.recommendations;

    // Only invoke AI if configured and available
    if (process.env.OLLAMA_BASE_URL || process.env.GEMINI_API_KEY) {
      try {
        const aiResult = await applyAIAnalysis(clause.text, clause.type);
        if (aiResult && aiResult.score > 0) {
          finalScore = Math.min(1, ruleBasedResult.score * 0.4 + aiResult.score * 0.6);
          if (aiResult.explanation) finalExplanation = aiResult.explanation;
          if (aiResult.recommendations) finalRecommendations = aiResult.recommendations;
        }
      } catch (err) {
        console.warn('AI analysis skipped, using rule-based score:', err);
      }
    }

    const riskLevel = getRiskLevel(finalScore);

    results.push(
      createClause({
        contractId,
        clauseType: clause.type,
        originalText: clause.text,
        riskLevel,
        riskScore: Math.round(finalScore * 100) / 100,
        explanation: finalExplanation,
        recommendations: finalRecommendations,
        positionStart: clause.startPosition,
        positionEnd: clause.endPosition,
      })
    );
  }

  return results;
}

function applyRuleBasedAnalysis(text: string): {
  score: number;
  explanation: string;
  recommendations: string;
  findings: string[];
} {
  let maxWeight = 0;
  const findings: string[] = [];
  const recs: string[] = [];

  for (const rule of RISK_PATTERNS) {
    if (rule.pattern.test(text)) {
      maxWeight = Math.max(maxWeight, rule.weight);
      findings.push(rule.description);
      if (!recs.includes(rule.recommendation)) {
        recs.push(rule.recommendation);
      }
    }
  }

  let finalScore = 0;
  if (findings.length > 0) {
    finalScore = Math.min(1.0, maxWeight + 0.04 * (findings.length - 1));
  } else {
    finalScore = 0.12;
  }

  let explanation = '';
  if (findings.length > 0) {
    explanation = `Detected ${findings.length} risk factor${findings.length > 1 ? 's' : ''}:\n` +
      findings.map(f => `• ${f}`).join('\n');
  } else {
    explanation = 'Standard contractual provision. No significant risk indicators or one-sided obligations detected.';
  }

  let recommendations = '';
  if (recs.length > 0) {
    recommendations = recs.slice(0, 3).map(r => `• ${r}`).join('\n');
  } else {
    recommendations = 'Standard clause. Review to ensure operational and commercial alignment with your goals.';
  }

  return {
    score: Math.round(finalScore * 100) / 100,
    explanation,
    recommendations,
    findings,
  };
}

async function applyAIAnalysis(
  text: string,
  clauseType: string
): Promise<{ score: number; explanation: string; recommendations: string }> {
  if (process.env.OLLAMA_BASE_URL) {
    try {
      return await analyzeWithOllama(text, clauseType);
    } catch {
      // fallback
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      return await analyzeWithGemini(text, clauseType);
    } catch {
      // fallback
    }
  }

  return { score: 0, explanation: '', recommendations: '' };
}

async function analyzeWithOllama(
  text: string,
  clauseType: string
): Promise<{ score: number; explanation: string; recommendations: string }> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama2';

  const prompt = `Analyze this ${clauseType} contract clause for risks. Rate 0.0 (safe) to 1.0 (high risk).
Respond ONLY with JSON: {"score": 0.0-1.0, "explanation": "brief explanation", "recommendations": "brief advice"}

Clause: "${text.substring(0, 1000)}"`;

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.3, num_predict: 200 },
    }),
  });

  if (!response.ok) throw new Error('Ollama request failed');

  const data: any = await response.json();
  const content = data.response || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      score: Math.min(1, Math.max(0, parsed.score || 0)),
      explanation: parsed.explanation || '',
      recommendations: parsed.recommendations || '',
    };
  }

  return { score: 0, explanation: '', recommendations: '' };
}

async function analyzeWithGemini(
  text: string,
  clauseType: string
): Promise<{ score: number; explanation: string; recommendations: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('No Gemini API key');

  const prompt = `Analyze this ${clauseType} contract clause for risks. Rate 0.0 (safe) to 1.0 (high risk).
Respond ONLY with JSON: {"score": 0.0-1.0, "explanation": "brief explanation", "recommendations": "brief advice"}

Clause: "${text.substring(0, 1000)}"`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  if (!response.ok) throw new Error('Gemini request failed');

  const data: any = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      score: Math.min(1, Math.max(0, parsed.score || 0)),
      explanation: parsed.explanation || '',
      recommendations: parsed.recommendations || '',
    };
  }

  return { score: 0, explanation: '', recommendations: '' };
}

function getRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 0.70) return 'high';
  if (score >= 0.40) return 'medium';
  return 'low';
}
