import { Contract, Clause } from '../models/contract';

export interface AnalysisReport {
  contract: {
    id: string;
    filename: string;
    uploadDate: string;
    overallRiskScore: number;
  };
  summary: {
    totalClauses: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    averageScore: number;
  };
  riskBreakdown: { type: string; count: number; averageScore: number }[];
  clauses: Clause[];
}

export function generateReport(contract: Contract, clauses: Clause[]): AnalysisReport {
  const highRisk = clauses.filter((c) => c.riskLevel === 'high').length;
  const mediumRisk = clauses.filter((c) => c.riskLevel === 'medium').length;
  const lowRisk = clauses.filter((c) => c.riskLevel === 'low').length;

  const averageScore =
    clauses.length > 0
      ? clauses.reduce((sum, c) => sum + c.riskScore, 0) / clauses.length
      : 0;

  const riskBreakdown = calculateRiskBreakdown(clauses);

  return {
    contract: {
      id: contract.id,
      filename: contract.filename,
      uploadDate: contract.uploadDate.toISOString(),
      overallRiskScore: contract.overallRiskScore,
    },
    summary: {
      totalClauses: clauses.length,
      highRisk,
      mediumRisk,
      lowRisk,
      averageScore: Math.round(averageScore * 100) / 100,
    },
    riskBreakdown,
    clauses,
  };
}

function calculateRiskBreakdown(clauses: Clause[]): { type: string; count: number; averageScore: number }[] {
  const typeMap = new Map<string, { count: number; totalScore: number }>();

  for (const clause of clauses) {
    const existing = typeMap.get(clause.clauseType) || { count: 0, totalScore: 0 };
    typeMap.set(clause.clauseType, {
      count: existing.count + 1,
      totalScore: existing.totalScore + clause.riskScore,
    });
  }

  return Array.from(typeMap.entries()).map(([type, data]) => ({
    type,
    count: data.count,
    averageScore: Math.round((data.totalScore / data.count) * 100) / 100,
  }));
}

export function generateHTMLReport(report: AnalysisReport): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Contract Risk Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat { padding: 15px; border-radius: 8px; text-align: center; }
    .high { background: #FEE2E2; color: #991B1B; }
    .medium { background: #FEF3C7; color: #92400E; }
    .low { background: #D1FAE5; color: #065F46; }
    .clause { margin-bottom: 20px; padding: 15px; border: 1px solid #E5E7EB; border-radius: 8px; }
    .clause.high-risk { border-left: 4px solid #EF4444; }
    .clause.medium-risk { border-left: 4px solid #F59E0B; }
    .clause.low-risk { border-left: 4px solid #10B981; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge.high { background: #FEE2E2; color: #991B1B; }
    .badge.medium { background: #FEF3C7; color: #92400E; }
    .badge.low { background: #D1FAE5; color: #065F46; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Contract Risk Analysis Report</h1>
    <p>${report.contract.filename}</p>
    <p>Generated: ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="summary">
    <div class="stat high">
      <h3>${report.summary.highRisk}</h3>
      <p>High Risk</p>
    </div>
    <div class="stat medium">
      <h3>${report.summary.mediumRisk}</h3>
      <p>Medium Risk</p>
    </div>
    <div class="stat low">
      <h3>${report.summary.lowRisk}</h3>
      <p>Low Risk</p>
    </div>
    <div class="stat">
      <h3>${report.summary.averageScore.toFixed(2)}</h3>
      <p>Avg Score</p>
    </div>
  </div>

  <h2>Flagged Clauses</h2>
  ${report.clauses
    .filter((c) => c.riskLevel !== 'low')
    .map(
      (clause) => `
    <div class="clause ${clause.riskLevel}-risk">
      <div>
        <span class="badge ${clause.riskLevel}">${clause.riskLevel.toUpperCase()}</span>
        <strong>${clause.clauseType}</strong>
      </div>
      <p><em>"${clause.originalText.substring(0, 200)}${clause.originalText.length > 200 ? '...' : ''}"</em></p>
      <p><strong>Explanation:</strong> ${clause.explanation}</p>
      <p><strong>Recommendations:</strong> ${clause.recommendations}</p>
    </div>
  `
    )
    .join('')}
</body>
</html>
  `;
}
