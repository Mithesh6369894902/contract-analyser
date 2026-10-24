import { useState, useMemo } from 'react';
import { Clause } from '../services/api';
import RiskCard from './RiskCard';

interface AnalysisResultsProps {
  clauses: Clause[];
  overallScore: number;
}

export default function AnalysisResults({ clauses, overallScore }: AnalysisResultsProps) {
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'riskDesc' | 'riskAsc' | 'order'>('riskDesc');

  const highRisk = useMemo(() => clauses.filter((c) => c.riskLevel === 'high'), [clauses]);
  const mediumRisk = useMemo(() => clauses.filter((c) => c.riskLevel === 'medium'), [clauses]);
  const lowRisk = useMemo(() => clauses.filter((c) => c.riskLevel === 'low'), [clauses]);

  // Extract all unique clause types
  const clauseTypes = useMemo(() => {
    const types = new Set<string>();
    clauses.forEach((c) => types.add(c.clauseType));
    return Array.from(types).sort();
  }, [clauses]);

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-rose-600';
    if (score >= 0.4) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 0.7) return 'bg-rose-50 border-rose-200 text-rose-700';
    if (score >= 0.4) return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.7) return 'High Risk Contract';
    if (score >= 0.4) return 'Medium Risk Contract';
    return 'Low Risk Contract';
  };

  // Filtered and sorted clauses
  const filteredClauses = useMemo(() => {
    let result = [...clauses];

    // Filter by level
    if (filterLevel !== 'all') {
      result = result.filter((c) => c.riskLevel === filterLevel);
    }

    // Filter by type
    if (selectedType !== 'all') {
      result = result.filter((c) => c.clauseType === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.originalText.toLowerCase().includes(q) ||
          c.clauseType.toLowerCase().includes(q) ||
          c.explanation.toLowerCase().includes(q) ||
          c.recommendations.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'riskDesc') {
      result.sort((a, b) => b.riskScore - a.riskScore);
    } else if (sortBy === 'riskAsc') {
      result.sort((a, b) => a.riskScore - b.riskScore);
    }

    return result;
  }, [clauses, filterLevel, selectedType, searchQuery, sortBy]);

  return (
    <div className="space-y-8">
      {/* Overall Score & Summary Card */}
      <div className="card shadow-md border-gray-200/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Main Score Badge */}
          <div className="text-center md:border-r border-gray-100 pr-0 md:pr-6">
            <div className="inline-flex items-center justify-center w-36 h-36 rounded-full bg-slate-50 border-4 border-white shadow-inner mb-3">
              <div className="text-center">
                <span className={`text-5xl font-black tracking-tight ${getScoreColor(overallScore)}`}>
                  {Math.round(overallScore * 100)}
                </span>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                  Risk Score
                </p>
              </div>
            </div>
            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold border ${getScoreBg(overallScore)}`}>
              {getScoreLabel(overallScore)}
            </div>
          </div>

          {/* Breakdown Stats */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-base font-bold text-gray-900">Contract Analysis Overview</span>
                <span className="text-sm font-semibold text-primary-600">
                  {clauses.length} {clauses.length === 1 ? 'Clause' : 'Clauses'} Identified
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Identified {highRisk.length} critical risks, {mediumRisk.length} moderate concerns, and{' '}
                {lowRisk.length} standard terms.
              </p>
            </div>

            {/* Proportion Bar */}
            <div className="space-y-1.5">
              <div className="flex h-3.5 rounded-full overflow-hidden bg-gray-100 p-0.5">
                {highRisk.length > 0 && (
                  <div
                    className="bg-rose-500 rounded-l-full transition-all duration-500"
                    style={{ width: `${(highRisk.length / (clauses.length || 1)) * 100}%` }}
                    title={`High Risk: ${highRisk.length}`}
                  />
                )}
                {mediumRisk.length > 0 && (
                  <div
                    className="bg-amber-500 transition-all duration-500"
                    style={{ width: `${(mediumRisk.length / (clauses.length || 1)) * 100}%` }}
                    title={`Medium Risk: ${mediumRisk.length}`}
                  />
                )}
                {lowRisk.length > 0 && (
                  <div
                    className="bg-emerald-500 rounded-r-full transition-all duration-500"
                    style={{ width: `${(lowRisk.length / (clauses.length || 1)) * 100}%` }}
                    title={`Low Risk: ${lowRisk.length}`}
                  />
                )}
              </div>
            </div>

            {/* Level Selector Pills */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFilterLevel(filterLevel === 'high' ? 'all' : 'high')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  filterLevel === 'high'
                    ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-300'
                    : 'border-rose-200 bg-rose-50/50 hover:bg-rose-50'
                }`}
              >
                <div className="text-xs font-semibold text-rose-700">High Risk</div>
                <div className="text-xl font-black text-rose-900">{highRisk.length}</div>
              </button>

              <button
                type="button"
                onClick={() => setFilterLevel(filterLevel === 'medium' ? 'all' : 'medium')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  filterLevel === 'medium'
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-300'
                    : 'border-amber-200 bg-amber-50/50 hover:bg-amber-50'
                }`}
              >
                <div className="text-xs font-semibold text-amber-700">Medium Risk</div>
                <div className="text-xl font-black text-amber-900">{mediumRisk.length}</div>
              </button>

              <button
                type="button"
                onClick={() => setFilterLevel(filterLevel === 'low' ? 'all' : 'low')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  filterLevel === 'low'
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300'
                    : 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                }`}
              >
                <div className="text-xs font-semibold text-emerald-700">Low Risk</div>
                <div className="text-xl font-black text-emerald-900">{lowRisk.length}</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="card space-y-4 p-5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search in clauses, explanations, or advice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-gray-700"
            >
              <option value="all">All Categories ({clauseTypes.length})</option>
              {clauseTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-gray-700"
            >
              <option value="riskDesc">Highest Risk First</option>
              <option value="riskAsc">Lowest Risk First</option>
              <option value="order">Document Order</option>
            </select>
          </div>
        </div>

        {/* Level Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
            Filter:
          </span>
          {[
            { id: 'all', label: `All (${clauses.length})` },
            { id: 'high', label: `High Risk (${highRisk.length})` },
            { id: 'medium', label: `Medium Risk (${mediumRisk.length})` },
            { id: 'low', label: `Low Risk (${lowRisk.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterLevel(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterLevel === tab.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {(filterLevel !== 'all' || selectedType !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setFilterLevel('all');
                setSelectedType('all');
                setSearchQuery('');
              }}
              className="ml-auto text-xs text-primary-600 hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Clauses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>Analyzed Clauses</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
              Showing {filteredClauses.length} of {clauses.length}
            </span>
          </h3>
        </div>

        {filteredClauses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">No clauses match the selected filters.</p>
            <button
              onClick={() => {
                setFilterLevel('all');
                setSelectedType('all');
                setSearchQuery('');
              }}
              className="mt-3 text-sm text-primary-600 font-semibold hover:underline"
            >
              Clear filters to view all {clauses.length} clauses
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClauses.map((clause) => (
              <RiskCard key={clause.id} clause={clause} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
