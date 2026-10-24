import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadContract, analyzeText } from '../services/api';
import { SAMPLE_CONTRACTS } from '../services/offlineApi';

export default function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contractText, setContractText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setError(null);
  };

  const processFile = async (fileToProcess?: File) => {
    const file = fileToProcess || selectedFile;
    if (!file) {
      setError('Please select a file to analyze.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingStatus('Extracting document text...');

    try {
      setProcessingStatus('Segmenting clauses and analyzing legal risks...');
      const result = await uploadContract(file);
      navigate(`/results/${result.contractId}`);
    } catch (err: any) {
      console.error('File analysis error:', err);
      setError(err?.message || 'Failed to process document. Please try pasting the text directly.');
      setIsProcessing(false);
    }
  };

  const processPastedText = async (customText?: string, customName?: string) => {
    const textToAnalyze = customText !== undefined ? customText : contractText;
    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      setError('Please enter or paste your contract text.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingStatus('Segmenting clauses and scoring risks...');

    try {
      const result = await analyzeText(
        textToAnalyze,
        customName || 'Pasted Contract'
      );
      navigate(`/results/${result.contractId}`);
    } catch (err: any) {
      console.error('Text analysis error:', err);
      setError(err?.message || 'Analysis failed. Please verify your input and try again.');
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileChange(file);
      processFile(file);
    }
  };

  const loadSample = (type: 'saas' | 'consulting' | 'short') => {
    if (type === 'saas') {
      setContractText(SAMPLE_CONTRACTS.saas);
      setMode('text');
      processPastedText(SAMPLE_CONTRACTS.saas, 'SaaS Master Services Agreement (High Risk)');
    } else if (type === 'consulting') {
      setContractText(SAMPLE_CONTRACTS.consulting);
      setMode('text');
      processPastedText(SAMPLE_CONTRACTS.consulting, 'Consulting Services Agreement (Balanced)');
    } else {
      const shortTest = `1. Limitation of Liability: Total liability under this agreement is strictly limited to $100. In no event shall provider be liable for any consequential or indirect damages.
2. Termination for Convenience: Provider reserves the right to immediately terminate this contract at any time without prior written notice.
3. Restrictive Covenants: Customer agrees not to engage in any competing business for a period of 2 years following termination.
4. Non-Refundable Payments: All payments and setup fees are non-refundable under any circumstances.`;
      setContractText(shortTest);
      setMode('text');
      processPastedText(shortTest, 'Multi-Clause Risk Test (4 Clauses)');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Analyze Contract for Risks
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Upload PDF, DOCX, or TXT documents, or paste contract terms directly to detect legal liabilities.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex p-1 bg-gray-100 rounded-2xl border border-gray-200/80">
        <button
          type="button"
          onClick={() => { setMode('file'); setError(null); }}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            mode === 'file'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload Document
        </button>
        <button
          type="button"
          onClick={() => { setMode('text'); setError(null); }}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            mode === 'text'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Paste Contract Text
        </button>
      </div>

      {/* Mode 1: File Upload */}
      {mode === 'file' && (
        <div className="card space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileChange(file);
                processFile(file);
              }
            }}
          />

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-primary-500 bg-primary-50/50 scale-[1.01]'
                : 'border-gray-200 hover:border-primary-400 hover:bg-slate-50/60'
            }`}
          >
            <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-900">
              {selectedFile ? selectedFile.name : 'Choose a file or drag & drop here'}
            </h3>
            <p className="text-xs text-gray-500 mt-1.5 font-medium">
              Supported Formats: PDF, DOCX, TXT (Up to 10 MB)
            </p>

            {selectedFile && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-lg text-primary-700 text-xs font-semibold">
                <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span>Click to change file</span>
              </div>
            )}
          </div>

          {selectedFile && !isProcessing && (
            <button
              onClick={() => processFile()}
              className="w-full btn-primary font-bold flex items-center justify-center gap-2"
            >
              Analyze {selectedFile.name}
            </button>
          )}
        </div>
      )}

      {/* Mode 2: Paste Text */}
      {mode === 'text' && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Type or paste any agreement, clauses, or provisions below:</span>
            <span>
              {contractText.length} characters • {contractText.split('\n').filter(Boolean).length} lines
            </span>
          </div>

          <textarea
            rows={10}
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            placeholder={`Paste contract text here...\n\nExample:\nARTICLE 1 - PAYMENT TERMS\n1.1 Client shall pay all invoices within 30 days.\n1.2 Late payments incur 5% penalty per month.\n1.3 All fees are strictly non-refundable.\n\nARTICLE 2 - LIABILITY\n2.1 In no event shall Provider be liable for any indirect damages.\n2.2 Provider liability capped at $0.`}
            className="w-full p-4 border border-gray-200 rounded-xl font-mono text-xs text-gray-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500 bg-slate-50/40"
          />

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setContractText('')}
              disabled={!contractText || isProcessing}
              className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-40 font-medium"
            >
              Clear Text
            </button>

            <button
              type="button"
              onClick={() => processPastedText()}
              disabled={!contractText.trim() || isProcessing}
              className="btn-primary font-bold px-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? 'Analyzing...' : 'Analyze Contract'}
            </button>
          </div>
        </div>
      )}

      {/* Processing Spinner */}
      {isProcessing && (
        <div className="card text-center py-8 bg-primary-50/40 border-primary-100">
          <svg className="animate-spin h-10 w-10 text-primary-600 mx-auto mb-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-900 font-bold text-base">{processingStatus || 'Analyzing Contract...'}</p>
          <p className="text-gray-500 text-xs mt-1">Identifying individual clauses, scoring legal liabilities, and preparing recommendations.</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-800 flex items-start gap-3">
          <svg className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold">{error}</p>
            {mode === 'file' && (
              <button
                type="button"
                onClick={() => setMode('text')}
                className="mt-1.5 text-xs text-primary-700 font-bold underline hover:text-primary-800"
              >
                Switch to Paste Text Mode
              </button>
            )}
          </div>
        </div>
      )}

      {/* Instant Demo Samples Section */}
      <div className="card bg-gradient-to-r from-slate-50 to-indigo-50/30 border-gray-200">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <span>Quick Test Samples</span>
            <span className="text-[10px] font-bold bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full">
              Instant Analysis
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Select a pre-built contract sample to test multi-clause risk detection:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => loadSample('saas')}
            className="p-3.5 rounded-xl bg-white border border-rose-200/80 hover:border-rose-400 hover:shadow-sm text-left transition-all disabled:opacity-50"
          >
            <div className="text-xs font-bold text-rose-700 flex items-center justify-between">
              <span>SaaS Master Agreement</span>
              <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">High Risk</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              9 Articles, non-refundable fees, broad indemnities & unlimited liability.
            </p>
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => loadSample('consulting')}
            className="p-3.5 rounded-xl bg-white border border-emerald-200/80 hover:border-emerald-400 hover:shadow-sm text-left transition-all disabled:opacity-50"
          >
            <div className="text-xs font-bold text-emerald-700 flex items-center justify-between">
              <span>Consulting Contract</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Balanced</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              6 Sections, mutual liability cap, fair 30-day termination.
            </p>
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => loadSample('short')}
            className="p-3.5 rounded-xl bg-white border border-amber-200/80 hover:border-amber-400 hover:shadow-sm text-left transition-all disabled:opacity-50"
          >
            <div className="text-xs font-bold text-amber-700 flex items-center justify-between">
              <span>Short 4-Clause Test</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Multi-Risk</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              4 distinct numbered clauses testing penalties, liability & termination.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
