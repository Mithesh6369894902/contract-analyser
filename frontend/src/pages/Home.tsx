import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getContracts, Contract } from '../services/api';
import StatsCards from '../components/StatsCards';

export default function Home() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      const data = await getContracts();
      setContracts(data);
    } catch (error) {
      console.error('Failed to load contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalContracts: contracts.length,
    highRiskCount: contracts.filter((c) => c.overallRiskScore >= 0.7).length,
    averageScore:
      contracts.length > 0
        ? contracts.reduce((sum, c) => sum + c.overallRiskScore, 0) / contracts.length
        : 0,
    recentAnalyses: contracts.filter((c) => {
      const date = new Date(c.uploadDate);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
  };

  const getRiskBadge = (score: number) => {
    if (score >= 0.7) return { bg: 'bg-red-100', text: 'text-red-700', label: 'High' };
    if (score >= 0.4) return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium' };
    return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Low' };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Contract Risk Analyzer
          </h1>
          <p className="text-gray-500 mt-1">
            Upload and analyze contracts for potential risks
          </p>
        </div>
        <Link
          to="/upload"
          className="btn-primary inline-flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Analysis
        </Link>
      </div>

      {/* Stats Cards */}
      <StatsCards {...stats} />

      {/* Recent Analyses */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Analyses</h2>
          <Link to="/history" className="text-primary-500 text-sm font-medium hover:text-primary-600">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">No contracts analyzed yet</p>
            <Link to="/upload" className="btn-primary mt-4 inline-block">
              Upload your first contract
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.slice(0, 5).map((contract) => {
              const risk = getRiskBadge(contract.overallRiskScore);
              return (
                <Link
                  key={contract.id}
                  to={`/results/${contract.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{contract.filename}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(contract.uploadDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${risk.bg} ${risk.text}`}>
                      {risk.label}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {Math.round(contract.overallRiskScore * 100)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
