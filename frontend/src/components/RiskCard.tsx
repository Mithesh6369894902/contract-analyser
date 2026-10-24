import { useState } from 'react';
import { Clause } from '../services/api';

interface RiskCardProps {
  clause: Clause;
}

export default function RiskCard({ clause }: RiskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const riskColors = {
    low: {
      bg: 'bg-emerald-50/60',
      hover: 'hover:bg-emerald-50',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
      accent: 'bg-emerald-600',
      text: 'text-emerald-700',
    },
    medium: {
      bg: 'bg-amber-50/60',
      hover: 'hover:bg-amber-50',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-800 border border-amber-300',
      accent: 'bg-amber-600',
      text: 'text-amber-700',
    },
    high: {
      bg: 'bg-rose-50/60',
      hover: 'hover:bg-rose-50',
      border: 'border-rose-200',
      badge: 'bg-rose-100 text-rose-800 border border-rose-300',
      accent: 'bg-rose-600',
      text: 'text-rose-700',
    },
  };

  const colors = riskColors[clause.riskLevel] || riskColors.low;

  const copyText = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-2xl border ${colors.border} ${colors.bg} shadow-sm overflow-hidden transition-all duration-200`}
    >
      <div
        className="p-5 cursor-pointer hover:bg-white/40 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${colors.badge}`}>
                {clause.riskLevel} Risk
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/80 text-gray-700 border border-gray-200">
                {clause.clauseType}
              </span>
              {clause.findings && clause.findings.length > 0 && (
                <span className="text-xs text-gray-500 font-medium">
                  {clause.findings.length} risk indicator{clause.findings.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <p className={`text-sm text-gray-800 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
              {clause.originalText}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div
              className={`w-14 h-14 rounded-2xl ${colors.accent} flex flex-col items-center justify-center text-white shadow-sm`}
            >
              <span className="text-lg font-black leading-none">
                {Math.round(clause.riskScore * 100)}
              </span>
              <span className="text-[10px] uppercase font-bold opacity-80 mt-0.5">Risk</span>
            </div>

            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-5 pb-5 pt-3 border-t border-gray-200/60 bg-white/70 space-y-4">
          {/* Original Text Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Original Clause Text
              </h4>
              <button
                onClick={(e) => copyText(e, clause.originalText)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>
            <div className="text-sm text-gray-900 bg-white p-3.5 rounded-xl border border-gray-200 whitespace-pre-wrap font-serif leading-relaxed">
              "{clause.originalText}"
            </div>
          </div>

          {/* Risk Explanation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Risk Analysis & Explanation
            </h4>
            <div className="text-sm text-gray-800 bg-rose-50/50 p-3.5 rounded-xl border border-rose-100 whitespace-pre-line leading-relaxed">
              {clause.explanation}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Negotiation Advice & Mitigation
            </h4>
            <div className="text-sm text-gray-800 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 whitespace-pre-line leading-relaxed">
              {clause.recommendations}
            </div>
          </div>
        </div>
      )}

      <div className="px-5 py-2.5 bg-black/[0.02] border-t border-black/[0.04] flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1"
        >
          {isExpanded ? 'Hide Details' : 'View Full Details & Recommendations'}
          <svg
            className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <span className="text-xs text-gray-500">
          ID: {clause.id}
        </span>
      </div>
    </div>
  );
}
