import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAnalysis, AnalysisResult } from '../services/api';
import AnalysisResults from '../components/AnalysisResults';
import { exportHtmlReport } from '../utils/exportReport';

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadAnalysis(id);
    }
  }, [id]);

  const loadAnalysis = async (contractId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAnalysis(contractId);
      setResult(data);
    } catch (err) {
      setError('Failed to load analysis results. Please check if the contract was saved.');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!result) return;
    exportHtmlReport(result.contract, result.clauses);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <svg className="animate-spin h-12 w-12 text-primary-600 mb-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-gray-600 font-medium">Analyzing clauses and risks...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Contract Analysis Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">{error || 'Unable to retrieve analysis details.'}</p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn-secondary">
            Go to Dashboard
          </Link>
          <Link to="/upload" className="btn-primary">
            Upload Contract
          </Link>
        </div>
      </div>
    );
  }

  const overallScore =
    result.clauses.length > 0
      ? result.clauses.reduce((sum, c) => sum + c.riskScore, 0) / result.clauses.length
      : result.contract.overallRiskScore;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <Link
            to="/"
            className="text-primary-600 text-xs font-bold uppercase tracking-wider hover:text-primary-700 mb-1.5 inline-flex items-center gap-1"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Analysis Results
          </h1>
          <p className="text-gray-600 text-sm mt-1 flex items-center gap-2">
            <span className="font-semibold text-gray-800">{result.contract.filename}</span>
            <span>•</span>
            <span className="text-gray-400">
              {new Date(result.contract.uploadDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/upload"
            className="btn-secondary text-sm inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Analyze Another
          </Link>

          <button
            onClick={handleExport}
            className="btn-primary text-sm inline-flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Report
          </button>
        </div>
      </div>

      {/* Analysis Results View */}
      <AnalysisResults clauses={result.clauses} overallScore={overallScore} />
    </div>
  );
}
