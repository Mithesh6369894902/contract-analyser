const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

let pdfParse = null;
try {
  pdfParse = require('pdf-parse');
} catch {
  console.log('pdf-parse not loaded in root, will use fallback');
}

let mammoth = null;
try {
  mammoth = require('mammoth');
} catch {
  console.log('mammoth not loaded in root, will use fallback');
}

const app = express();
const PORT = process.env.PORT || 3000;
const IS_VERCEL = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || !!process.env.NOW_REGION;

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static frontend assets (for standalone/local node server)
if (fs.existsSync(path.join(__dirname, 'frontend/dist'))) {
  app.use(express.static(path.join(__dirname, 'frontend/dist')));
}

// Data storage (uses /tmp on Vercel serverless, local ./data elsewhere)
const DATA_DIR = IS_VERCEL ? path.join('/tmp', 'data') : path.join(__dirname, 'data');
const UPLOAD_DIR = IS_VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, 'uploads');

try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (e) {
  console.warn('DATA_DIR creation warning:', e.message);
}

try {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (e) {
  console.warn('UPLOAD_DIR creation warning:', e.message);
}

// In-memory contract cache for lightning-fast serverless execution
const inMemoryContracts = new Map();

// File upload configuration: Memory storage on Vercel, disk storage locally
const storage = IS_VERCEL
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, UPLOAD_DIR),
      filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
    });

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.docx', '.doc', '.txt'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
    }
  },
});

// Resilient data helpers with in-memory fallback
function saveData(filename, data) {
  inMemoryContracts.set(filename, data);
  try {
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
  } catch (err) {
    // Falls back to inMemoryContracts seamlessly on read-only lambda filesystems
  }
}

function loadData(filename) {
  if (inMemoryContracts.has(filename)) {
    return inMemoryContracts.get(filename);
  }
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      inMemoryContracts.set(filename, data);
      return data;
    }
  } catch {}
  return null;
}

function listData() {
  const set = new Set(inMemoryContracts.keys());
  try {
    if (fs.existsSync(DATA_DIR)) {
      fs.readdirSync(DATA_DIR)
        .filter(f => f.endsWith('.json'))
        .forEach(k => set.add(k));
    }
  } catch {}
  return Array.from(set);
}

function deleteData(filename) {
  let deleted = inMemoryContracts.delete(filename);
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      deleted = true;
    }
  } catch {}
  return deleted;
}

// Comprehensive legal risk pattern library
const RISK_PATTERNS = [
  // 1. Liability
  { pattern: /unlimited liability/gi, weight: 0.95, type: 'Liability & Damages', desc: 'Unlimited liability clause with no monetary cap', rec: 'Negotiate a mutual liability cap limited to fees paid in preceding 12 months.' },
  { pattern: /no limitation of liability|without limit(?:ation)? on liability/gi, weight: 0.90, type: 'Liability & Damages', desc: 'Exclusion of liability limitation', rec: 'Insert an express mutual limitation of liability section.' },
  { pattern: /(?:shall|will) have no liability|liability.*capped at.*(?:zero|\$0\b|no amount)/gi, weight: 0.88, type: 'Liability & Damages', desc: 'Total exclusion or zero liability for provider', rec: 'Require reasonable liability for gross negligence, data breaches, and IP infringement.' },
  { pattern: /sole and exclusive remedy|exclusive remedy/gi, weight: 0.75, type: 'Liability & Damages', desc: 'Exclusive remedy limitation restriction', rec: 'Ensure exclusive remedy exceptions exist for material breach and willful misconduct.' },
  { pattern: /indirect,?\s*(?:incidental,?\s*)?(?:special,?\s*)?(?:consequential|punitive)\s+damages/gi, weight: 0.70, type: 'Liability & Damages', desc: 'Broad consequential and indirect damages disclaimer', rec: 'Make waiver of consequential damages mutual.' },
  { pattern: /not exceed the (?:total )?fees paid/gi, weight: 0.65, type: 'Liability & Damages', desc: 'Liability capped strictly at fees paid', rec: 'Verify liability cap covers potential breach damages.' },

  // 2. Termination
  { pattern: /immediately\s+(?:and\s+)?without\s+notice/gi, weight: 0.88, type: 'Termination', desc: 'Immediate termination without written notice', rec: 'Require a mandatory 15-30 day written notice with a cure period.' },
  { pattern: /terminate (?:this agreement )?(?:at any time )?without (?:cause|reason|notice)/gi, weight: 0.82, type: 'Termination', desc: 'Unilateral termination for convenience without reasonable notice', rec: 'Require mutual termination rights with at least 30 days notice.' },
  { pattern: /(?:90|120|180)\s+days(?:['']|\s+)written\s+notice/gi, weight: 0.65, type: 'Termination', desc: 'Excessively long termination notice period', rec: 'Shorten notice period to 30 to 45 days.' },
  { pattern: /all rights.*shall (?:immediately )?revert to (?:provider|vendor)/gi, weight: 0.78, type: 'Termination', desc: 'Immediate forfeiture of all rights upon termination', rec: 'Ensure completed paid deliverables remain client property.' },

  // 3. Payment
  { pattern: /non.?refundable\s+under\s+any\s+circumstances|all (?:fees|payments) are strictly non.?refundable/gi, weight: 0.85, type: 'Payment & Fees', desc: 'Absolute non-refundable payment policy', rec: 'Add clause allowing refund for unperformed services or material failure.' },
  { pattern: /non.?refundable/gi, weight: 0.68, type: 'Payment & Fees', desc: 'Non-refundable terms', rec: 'Add prorated refund exceptions.' },
  { pattern: /penalty (?:of )?\d+%\s+per\s+month|interest (?:of )?(?:[2-9]|\d{2,})%\s+per\s+month/gi, weight: 0.85, type: 'Payment & Fees', desc: 'Excessive penalty or late interest rate', rec: 'Cap late interest to standard 1.0% to 1.5% per month.' },
  { pattern: /penalty|late (?:payment )?fee/gi, weight: 0.60, type: 'Payment & Fees', desc: 'Late payment fee and penalty provision', rec: 'Include a 10-day grace period before penalties accrue.' },
  { pattern: /right to (?:increase|modify|adjust) (?:prices|fees|rates)/gi, weight: 0.80, type: 'Payment & Fees', desc: 'Unilateral price increase right', rec: 'Lock pricing for initial term and cap annual increases.' },

  // 4. Auto-Renewal
  { pattern: /automatic(?:ally)?\s+renew(?:s|al)?/gi, weight: 0.72, type: 'Auto-Renewal', desc: 'Automatic contract renewal clause', rec: 'Require provider to send written reminder 30-60 days before cutoff.' },
  { pattern: /notice of non.?renewal at least (?:60|90|120) days/gi, weight: 0.75, type: 'Auto-Renewal', desc: 'Strict opt-out window to prevent unwanted rollover', rec: 'Shorten opt-out window to 30 days.' },

  // 5. Indemnification
  { pattern: /indemnif.*all.*claims/gi, weight: 0.86, type: 'Indemnification', desc: 'Broad indemnification covering all claims', rec: 'Limit indemnification to direct third-party claims from gross negligence.' },
  { pattern: /(?:provider|vendor) shall have no obligation to indemnify/gi, weight: 0.92, type: 'Indemnification', desc: 'One-sided indemnification obligation', rec: 'Make indemnification mutual.' },
  { pattern: /indemnify,?\s+defend,?\s+and\s+hold\s+harmless/gi, weight: 0.78, type: 'Indemnification', desc: 'Duty to defend and hold harmless', rec: 'Exclude duty to defend from early stages.' },

  // 6. IP Rights
  { pattern: /all intellectual property.*exclusive property of (?:the )?(?:provider|vendor)/gi, weight: 0.88, type: 'Intellectual Property', desc: 'Vendor retains complete ownership of all work product', rec: 'Ensure custom deliverables paid for belong to client.' },
  { pattern: /client shall have no right,?\s+title,?\s+or interest in any deliverables/gi, weight: 0.92, type: 'Intellectual Property', desc: 'Client stripped of all rights to deliverables', rec: 'Require assignment of deliverables upon payment.' },

  // 7. Dispute Resolution & Legal
  { pattern: /class action waiver|waive.*class action/gi, weight: 0.84, type: 'Dispute Resolution', desc: 'Waiver of class action participation rights', rec: 'Review consumer rights implications.' },
  { pattern: /waive.*jury trial|waiver of trial by jury/gi, weight: 0.76, type: 'Dispute Resolution', desc: 'Waiver of jury trial', rec: 'Confirm bench trial or arbitration aligns with your strategy.' },
  { pattern: /binding arbitration|mandatory arbitration/gi, weight: 0.65, type: 'Dispute Resolution', desc: 'Mandatory binding arbitration requirement', rec: 'Ensure arbitrator fees are shared equally and venue is reasonable.' },

  // 8. Warranties
  { pattern: /as.?is|with all faults/gi, weight: 0.74, type: 'Warranties & Disclaimers', desc: 'As-is warranty disclaimer with zero guarantee', rec: 'Require express warranty that services conform to specifications.' },
  { pattern: /no warranty|disclaims all warranties/gi, weight: 0.76, type: 'Warranties & Disclaimers', desc: 'Complete disclaimer of implied and express warranties', rec: 'Require warranty of non-infringement and professional standards.' },

  // 9. Discretion & Restrictive Covenants
  { pattern: /sole discretion/gi, weight: 0.75, type: 'General Terms', desc: 'Sole discretion clause allowing unilateral decisions', rec: 'Change to "commercially reasonable discretion" or "mutual agreement".' },
  { pattern: /without notice/gi, weight: 0.76, type: 'General Terms', desc: 'Unilateral action permitted without notice', rec: 'Require written notice before action.' },
  { pattern: /non.?compete|not (?:engage in|participate in) any competing/gi, weight: 0.84, type: 'Restrictive Covenants', desc: 'Non-compete covenant', rec: 'Narrow geographic and duration scope or remove.' },
  { pattern: /non.?solicitation|shall not solicit (?:any )?(?:employees?|clients?)/gi, weight: 0.70, type: 'Restrictive Covenants', desc: 'Non-solicitation restriction', rec: 'Limit to direct solicitation.' },
  { pattern: /confidential/gi, weight: 0.28, type: 'Confidentiality', desc: 'Confidentiality protection provision', rec: 'Ensure mutual obligations and standard exclusions.' },
  { pattern: /force majeure/gi, weight: 0.25, type: 'Force Majeure', desc: 'Force majeure clause', rec: 'Ensure prompt notification is required.' },
];

function identifyClauseType(text) {
  const typePatterns = [
    { type: 'Liability & Damages', patterns: [/liability/gi, /damages/gi, /remedy/gi] },
    { type: 'Termination', patterns: [/terminat/gi, /cancell/gi, /notice of termination/gi] },
    { type: 'Payment & Fees', patterns: [/payment/gi, /invoice/gi, /fee/gi, /price/gi, /penalty/gi, /non.?refundable/gi] },
    { type: 'Indemnification', patterns: [/indemnif/gi, /hold harmless/gi, /defend/gi] },
    { type: 'Auto-Renewal', patterns: [/auto.?renew/gi, /renewal/gi, /evergreen/gi] },
    { type: 'Intellectual Property', patterns: [/intellectual property/gi, /copyright/gi, /patent/gi, /deliverables/gi] },
    { type: 'Warranties & Disclaimers', patterns: [/warrant/gi, /as.?is/gi, /merchantability/gi, /disclaimer/gi] },
    { type: 'Confidentiality', patterns: [/confidential/gi, /non.?disclosure/gi, /trade secret/gi] },
    { type: 'Restrictive Covenants', patterns: [/non.?compete/gi, /non.?solicit/gi] },
    { type: 'Dispute Resolution', patterns: [/arbitrat/gi, /class action/gi, /jury trial/gi, /dispute/gi] },
    { type: 'Governing Law', patterns: [/governing law/gi, /jurisdiction/gi, /courts of/gi] },
    { type: 'Force Majeure', patterns: [/force majeure/gi, /act of god/gi] },
  ];

  let bestType = 'General Terms';
  let bestScore = 0;

  for (const { type, patterns } of typePatterns) {
    let score = 0;
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) score += matches.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  return bestType;
}

function analyzeClause(text) {
  const findings = [];
  const recs = [];
  let maxWeight = 0;

  for (const rule of RISK_PATTERNS) {
    if (rule.pattern.test(text)) {
      findings.push({ type: rule.type, desc: rule.desc, weight: rule.weight });
      maxWeight = Math.max(maxWeight, rule.weight);
      if (!recs.includes(rule.rec)) {
        recs.push(rule.rec);
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
      findings.map(f => `• ${f.desc}`).join('\n');
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
    findings,
    explanation,
    recommendations,
  };
}

function segmentClauses(text) {
  if (!text || text.trim().length === 0) return [];

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const lines = normalized.split('\n');
  const sections = [];

  let currentBlock = [];
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
      const paraSections = [];
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
      const sentenceSections = [];
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

async function extractTextFromUploadedFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const buffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
  if (!buffer) throw new Error('No document content available.');

  if (ext === '.pdf') {
    const header = buffer.slice(0, 5).toString('ascii');
    if (header !== '%PDF-') {
      return buffer.toString('utf-8');
    }
    if (pdfParse) {
      try {
        const data = await pdfParse(buffer);
        if (data && data.text && data.text.trim().length > 0) {
          return data.text;
        }
      } catch (pdfErr) {
        console.warn('pdf-parse failed, falling back:', pdfErr);
      }
    }
    const raw = buffer.toString('latin1');
    const matches = raw.match(/[A-Za-z0-9 ,.;:!?'"()\-]{15,}/g);
    if (matches && matches.length > 3) {
      return matches.join('\n');
    }
    return buffer.toString('utf-8');
  }

  if (ext === '.docx' || ext === '.doc') {
    if (mammoth) {
      try {
        const res = await mammoth.extractRawText({ buffer });
        if (res && res.value && res.value.trim().length > 0) {
          return res.value;
        }
      } catch (docErr) {
        console.warn('mammoth failed, falling back:', docErr);
      }
    }
    return buffer.toString('utf-8');
  }

  return buffer.toString('utf-8');
}

function processContractText(text, filename, contractId) {
  const sections = segmentClauses(text);
  const clauses = sections.map((clause, idx) => {
    const clauseType = identifyClauseType(clause.text);
    const analysis = analyzeClause(clause.text);
    const riskLevel = analysis.score >= 0.70 ? 'high' : analysis.score >= 0.40 ? 'medium' : 'low';

    return {
      id: `${contractId}-clause-${idx + 1}`,
      contractId,
      clauseType,
      originalText: clause.text,
      riskLevel,
      riskScore: analysis.score,
      explanation: analysis.explanation,
      recommendations: analysis.recommendations,
      findings: analysis.findings,
      positionStart: clause.start,
      positionEnd: clause.end,
    };
  });

  const overallScore = clauses.length > 0
    ? clauses.reduce((sum, c) => sum + c.riskScore, 0) / clauses.length
    : 0;

  const contract = {
    id: contractId,
    filename,
    uploadDate: new Date().toISOString(),
    status: 'completed',
    overallRiskScore: Math.round(overallScore * 100) / 100,
    clauses,
  };

  saveData(`${contractId}.json`, contract);

  return {
    contractId,
    status: 'completed',
    overallRiskScore: contract.overallRiskScore,
    clauseCount: clauses.length,
  };
}

// Route Handlers (Dual mounted for /api/* and /* for total Vercel compatibility)
const handleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const contractId = 'c-' + Date.now().toString();
    const text = await extractTextFromUploadedFile(req.file);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from document.' });
    }

    const result = processContractText(text, req.file.originalname, contractId);
    res.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to analyze contract: ' + error.message });
  }
};

const handleAnalyzeText = (req, res) => {
  try {
    const { text, filename } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No contract text provided' });
    }

    const contractId = 'c-' + Date.now().toString();
    const result = processContractText(text, filename || 'Pasted Contract', contractId);
    res.json(result);
  } catch (error) {
    console.error('Analyze text error:', error);
    res.status(500).json({ error: 'Failed to analyze contract text' });
  }
};

const handleListContracts = (req, res) => {
  try {
    const files = listData();
    const contracts = files.map(file => {
      const data = loadData(file);
      if (data) {
        const { clauses, ...contract } = data;
        return contract;
      }
      return null;
    }).filter(Boolean);

    contracts.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list contracts' });
  }
};

const handleGetContract = (req, res) => {
  try {
    const data = loadData(`${req.params.id}.json`);
    if (!data) return res.status(404).json({ error: 'Contract not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get contract' });
  }
};

const handleGetAnalysis = (req, res) => {
  try {
    const data = loadData(`${req.params.id}.json`);
    if (!data) return res.status(404).json({ error: 'Contract not found' });
    res.json({
      contract: {
        id: data.id,
        filename: data.filename,
        overallRiskScore: data.overallRiskScore,
        uploadDate: data.uploadDate,
      },
      clauses: data.clauses || [],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get analysis' });
  }
};

const handleGetReportHtml = (req, res) => {
  try {
    const data = loadData(`${req.params.id}.json`);
    if (!data) return res.status(404).send('<h1>Contract not found</h1>');

    const clauses = data.clauses || [];
    const highRisk = clauses.filter(c => c.riskLevel === 'high');
    const mediumRisk = clauses.filter(c => c.riskLevel === 'medium');
    const lowRisk = clauses.filter(c => c.riskLevel === 'low');
    const score = Math.round((data.overallRiskScore || 0) * 100);

    const clausesHtml = clauses.map((c, i) => `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <div>
            <strong>#${i + 1}</strong>
            <span style="margin-left:8px;font-size:12px;padding:3px 8px;border-radius:6px;background:${c.riskLevel === 'high' ? '#ffe4e6;color:#9f1239;' : c.riskLevel === 'medium' ? '#fef3c7;color:#92400e;' : '#d1fae5;color:#065f46;'}">${c.riskLevel.toUpperCase()} RISK</span>
            <span style="margin-left:8px;font-size:12px;color:#475569;">${c.clauseType}</span>
          </div>
          <div><strong>${Math.round(c.riskScore * 100)} / 100</strong></div>
        </div>
        <p style="font-family:Georgia,serif;background:#f8fafc;padding:10px;border-radius:6px;font-size:13px;color:#1e293b;">"${c.originalText.replace(/</g, '&lt;')}"</p>
        <p style="font-size:13px;color:#be123c;"><strong>Risk:</strong> ${c.explanation.replace(/</g, '&lt;')}</p>
        <p style="font-size:13px;color:#047857;"><strong>Advice:</strong> ${c.recommendations.replace(/</g, '&lt;')}</p>
      </div>
    `).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Report - ${data.filename}</title>
  <style>body{font-family:sans-serif;background:#f8fafc;padding:30px;max-width:800px;margin:0 auto;}</style>
</head>
<body>
  <div style="background:#fff;padding:24px;border-radius:12px;margin-bottom:20px;border:1px solid #e2e8f0;">
    <h1>Contract Risk Report</h1>
    <p>Document: <strong>${data.filename}</strong></p>
    <p>Overall Risk Score: <strong style="font-size:24px;color:${score >= 70 ? '#e11d48' : score >= 40 ? '#d97706' : '#059669'};">${score} / 100</strong></p>
    <p>High: ${highRisk.length} | Medium: ${mediumRisk.length} | Low: ${lowRisk.length}</p>
  </div>
  ${clausesHtml}
</body>
</html>`;

    res.send(html);
  } catch (error) {
    res.status(500).send('<h1>Failed to generate report</h1>');
  }
};

const handleDeleteContract = (req, res) => {
  try {
    const deleted = deleteData(`${req.params.id}.json`);
    if (!deleted) return res.status(404).json({ error: 'Contract not found' });
    res.json({ message: 'Contract deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contract' });
  }
};

const handleHealth = (req, res) => {
  res.json({
    status: 'ok',
    environment: IS_VERCEL ? 'vercel-serverless' : 'node-server',
    timestamp: new Date().toISOString(),
  });
};

// Mount endpoints on both /api/* and root paths
['/api/contracts/upload', '/contracts/upload'].forEach(p => app.post(p, upload.single('file'), handleUpload));
['/api/contracts/analyze-text', '/contracts/analyze-text'].forEach(p => app.post(p, handleAnalyzeText));
['/api/contracts', '/contracts'].forEach(p => app.get(p, handleListContracts));
['/api/contracts/:id', '/contracts/:id'].forEach(p => app.get(p, handleGetContract));
['/api/contracts/:id/analysis', '/contracts/:id/analysis'].forEach(p => app.get(p, handleGetAnalysis));
['/api/reports/:id/html', '/reports/:id/html'].forEach(p => app.get(p, handleGetReportHtml));
['/api/contracts/:id', '/contracts/:id'].forEach(p => app.delete(p, handleDeleteContract));
['/api/health', '/health'].forEach(p => app.get(p, handleHealth));

// Serve frontend for all other routes when running standalone
app.get('*', (req, res) => {
  const indexFile = path.join(__dirname, 'frontend/dist/index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.send('SmartReviewAI API Server running.');
  }
});

// Start listening only when executed directly (not in Vercel Serverless)
if (require.main === module && !IS_VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
========================================
  AI Contract Risk Analyzer
========================================
  Server running on port ${PORT}
  Computer: http://localhost:${PORT}
========================================
    `);
  });
}

module.exports = app;
