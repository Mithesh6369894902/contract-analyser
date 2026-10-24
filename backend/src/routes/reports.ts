import express from 'express';
import { loadData } from '../utils/helpers';
import { Contract, Clause } from '../models/contract';
import { generateReport, generateHTMLReport } from '../services/reportGenerator';

const router = express.Router();

router.get('/:id', (req, res) => {
  try {
    const data = loadData<Contract & { clauses?: Clause[] }>(`${req.params.id}.json`);
    if (!data) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const { clauses, ...contract } = data;
    const report = generateReport(contract as Contract, clauses || []);

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.get('/:id/html', (req, res) => {
  try {
    const data = loadData<Contract & { clauses?: Clause[] }>(`${req.params.id}.json`);
    if (!data) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const { clauses, ...contract } = data;
    const report = generateReport(contract as Contract, clauses || []);
    const html = generateHTMLReport(report);

    res.send(html);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate HTML report' });
  }
});

export default router;
