import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { extractText, cleanText } from '../services/documentParser';
import { segmentClauses } from '../services/clauseSegmenter';
import { analyzeClauses } from '../services/riskAnalyzer';
import { createContract, Contract, Clause } from '../models/contract';
import { saveData, loadData, deleteData, listData } from '../utils/helpers';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const contract = createContract({
      filename: req.file.originalname,
      status: 'analyzing',
      overallRiskScore: 0,
      filePath: req.file.path,
    });

    saveData(`${contract.id}.json`, contract);

    const rawText = await extractText(req.file.path);
    const cleanedText = cleanText(rawText);
    const clauses = segmentClauses(cleanedText);

    const analyzedClauses = await analyzeClauses(clauses, contract.id);

    const overallScore =
      analyzedClauses.length > 0
        ? analyzedClauses.reduce((sum, c) => sum + c.riskScore, 0) / analyzedClauses.length
        : 0;

    contract.overallRiskScore = Math.round(overallScore * 100) / 100;
    contract.status = 'completed';

    saveData(`${contract.id}.json`, { ...contract, clauses: analyzedClauses });

    res.json({
      contractId: contract.id,
      status: 'completed',
      overallRiskScore: contract.overallRiskScore,
      clauseCount: analyzedClauses.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to analyze contract' });
  }
});

router.post('/analyze-text', async (req, res) => {
  try {
    const { text, filename } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No contract text provided' });
    }

    const contract = createContract({
      filename: filename || 'Pasted Contract.txt',
      status: 'analyzing',
      overallRiskScore: 0,
      filePath: '',
    });

    saveData(`${contract.id}.json`, contract);

    const cleanedText = cleanText(text);
    const clauses = segmentClauses(cleanedText);
    const analyzedClauses = await analyzeClauses(clauses, contract.id);

    const overallScore =
      analyzedClauses.length > 0
        ? analyzedClauses.reduce((sum, c) => sum + c.riskScore, 0) / analyzedClauses.length
        : 0;

    contract.overallRiskScore = Math.round(overallScore * 100) / 100;
    contract.status = 'completed';

    saveData(`${contract.id}.json`, { ...contract, clauses: analyzedClauses });

    res.json({
      contractId: contract.id,
      status: 'completed',
      overallRiskScore: contract.overallRiskScore,
      clauseCount: analyzedClauses.length,
    });
  } catch (error) {
    console.error('Analyze text error:', error);
    res.status(500).json({ error: 'Failed to analyze contract text' });
  }
});

router.get('/', (req, res) => {
  try {
    const files = listData();
    const contracts: Contract[] = [];

    for (const file of files) {
      const data = loadData<Contract & { clauses?: Clause[] }>(file);
      if (data) {
        const { clauses, ...contract } = data;
        contracts.push(contract as Contract);
      }
    }

    contracts.sort(
      (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );

    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list contracts' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const data = loadData<Contract & { clauses?: Clause[] }>(`${req.params.id}.json`);
    if (!data) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get contract' });
  }
});

router.get('/:id/analysis', (req, res) => {
  try {
    const data = loadData<Contract & { clauses?: Clause[] }>(`${req.params.id}.json`);
    if (!data) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json({
      contract: {
        id: data.id,
        filename: data.filename,
        overallRiskScore: data.overallRiskScore,
      },
      clauses: data.clauses || [],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get analysis' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const deleted = deleteData(`${req.params.id}.json`);
    if (!deleted) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json({ message: 'Contract deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contract' });
  }
});

export default router;
