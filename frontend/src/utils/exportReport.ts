import { Contract, Clause } from '../services/api';

/**
 * Generates and downloads or opens a beautifully formatted HTML report.
 */
export function exportHtmlReport(contract: Contract, clauses: Clause[]): void {
  const highRisk = clauses.filter((c) => c.riskLevel === 'high');
  const mediumRisk = clauses.filter((c) => c.riskLevel === 'medium');
  const lowRisk = clauses.filter((c) => c.riskLevel === 'low');

  const overallScoreNum = Math.round(contract.overallRiskScore * 100);

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#e11d48';
    if (score >= 40) return '#d97706';
    return '#059669';
  };

  const getRiskBadge = (level: string) => {
    if (level === 'high') return '<span style="background:#ffe4e6;color:#9f1239;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase;">High Risk</span>';
    if (level === 'medium') return '<span style="background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase;">Medium Risk</span>';
    return '<span style="background:#d1fae5;color:#065f46;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase;">Low Risk</span>';
  };

  const clausesHtml = clauses
    .map(
      (c, idx) => `
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid #f1f5f9;padding-bottom:10px;">
        <div>
          <span style="font-size:12px;color:#64748b;font-weight:700;margin-right:8px;">#${idx + 1}</span>
          ${getRiskBadge(c.riskLevel)}
          <span style="margin-left:8px;font-size:13px;font-weight:600;color:#334155;background:#f8fafc;padding:3px 8px;border-radius:6px;border:1px solid #e2e8f0;">${c.clauseType}</span>
        </div>
        <div style="font-weight:800;font-size:16px;color:${getScoreColor(c.riskScore * 100)};">
          ${Math.round(c.riskScore * 100)} / 100
        </div>
      </div>

      <div style="margin-bottom:14px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#475569;margin-bottom:4px;letter-spacing:0.5px;">Clause Text</div>
        <div style="background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #edf2f7;font-size:13px;line-height:1.6;color:#1e293b;font-family:Georgia,serif;">
          "${c.originalText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}"
        </div>
      </div>

      <div style="margin-bottom:10px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#be123c;margin-bottom:4px;letter-spacing:0.5px;">Risk Explanation</div>
        <div style="font-size:13px;line-height:1.5;color:#334155;white-space:pre-line;">
          ${c.explanation.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </div>
      </div>

      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#047857;margin-bottom:4px;letter-spacing:0.5px;">Negotiation Advice</div>
        <div style="font-size:13px;line-height:1.5;color:#334155;white-space:pre-line;">
          ${c.recommendations.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </div>
      </div>
    </div>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Contract Risk Report - ${contract.filename}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 40px 20px; }
    .container { max-width: 860px; margin: 0 auto; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="no-print" style="margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
      <a href="javascript:history.back()" style="color:#2563eb;text-decoration:none;font-weight:600;font-size:14px;">← Back to App</a>
      <button onclick="window.print()" style="background:#2563eb;color:#ffffff;border:none;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;">Print / Save as PDF</button>
    </div>

    <div style="background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);border:1px solid #e2e8f0;margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #e2e8f0;padding-bottom:20px;margin-bottom:20px;">
        <div>
          <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0 0 6px 0;">Contract Risk Analysis Report</h1>
          <p style="font-size:14px;color:#64748b;margin:0;">Document: <strong>${contract.filename}</strong></p>
          <p style="font-size:12px;color:#94a3b8;margin:4px 0 0 0;">Date: ${new Date(contract.uploadDate).toLocaleString()}</p>
        </div>
        <div style="text-align:center;background:#f8fafc;padding:12px 20px;border-radius:12px;border:1px solid #e2e8f0;">
          <div style="font-size:32px;font-weight:900;color:${getScoreColor(overallScoreNum)};line-height:1;">
            ${overallScoreNum}
          </div>
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;margin-top:4px;">Risk Score</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;text-align:center;">
        <div style="background:#fff1f2;padding:14px;border-radius:10px;border:1px solid #fecdd3;">
          <div style="font-size:22px;font-weight:800;color:#be123c;">${highRisk.length}</div>
          <div style="font-size:12px;font-weight:700;color:#9f1239;">High Risk Clauses</div>
        </div>
        <div style="background:#fefce8;padding:14px;border-radius:10px;border:1px solid #fef08a;">
          <div style="font-size:22px;font-weight:800;color:#a16207;">${mediumRisk.length}</div>
          <div style="font-size:12px;font-weight:700;color:#854d0e;">Medium Risk Clauses</div>
        </div>
        <div style="background:#f0fdf4;padding:14px;border-radius:10px;border:1px solid #bbf7d0;">
          <div style="font-size:22px;font-weight:800;color:#15803d;">${lowRisk.length}</div>
          <div style="font-size:12px;font-weight:700;color:#166534;">Low Risk Clauses</div>
        </div>
      </div>
    </div>

    <div>
      <h2 style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:16px;">Detailed Clause Breakdown (${clauses.length} Clauses Analyzed)</h2>
      ${clausesHtml}
    </div>

    <div style="text-align:center;padding:30px;color:#94a3b8;font-size:12px;">
      Generated by SmartReviewAI Contract Risk Analyzer • ${new Date().toLocaleDateString()}
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    // Popup blocked, fallback download
    const a = document.createElement('a');
    a.href = url;
    a.download = `Risk-Report-${contract.filename.replace(/\.[^/.]+$/, '')}.html`;
    a.click();
  }
}
