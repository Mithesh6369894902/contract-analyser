import {
  uploadContractOffline,
  getContractsOffline,
  getAnalysisOffline,
  deleteContractOffline,
  analyzeTextDirectly as analyzeTextOffline,
  Contract as OfflineContract,
} from './offlineApi';
import { Clause } from './offlineAnalyzer';

export type { Clause };
export type Contract = OfflineContract;

export interface AnalysisResult {
  contract: Contract;
  clauses: Clause[];
}

const API_BASE = '/api';

/**
 * Checks if the backend server is reachable.
 */
async function isBackendReachable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

export async function uploadContract(file: File): Promise<{
  contractId: string;
  status: string;
  overallRiskScore: number;
  clauseCount: number;
}> {
  // If backend is up, attempt server-side upload
  if (await isBackendReachable()) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/contracts/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Also fetch full analysis to cache in offline storage
        try {
          const detailRes = await fetch(`${API_BASE}/contracts/${data.contractId}/analysis`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            const contracts = (await import('./offlineApi')).getStoredContracts();
            const updated = [
              {
                ...detailData.contract,
                uploadDate: detailData.contract.uploadDate || new Date().toISOString(),
                status: 'completed',
                clauses: detailData.clauses,
              },
              ...contracts.filter((c: any) => c.id !== data.contractId),
            ];
            (await import('./offlineApi')).saveContracts(updated);
          }
        } catch (cacheErr) {
          console.warn('Caching server contract to offline storage warning:', cacheErr);
        }

        return data;
      }
    } catch (serverErr) {
      console.warn('Server upload failed, falling back to client-side extraction:', serverErr);
    }
  }

  // Graceful client-side extraction and offline analysis
  return uploadContractOffline(file);
}

export async function analyzeText(
  text: string,
  filename: string = 'Pasted Contract.txt'
): Promise<{
  contractId: string;
  status: string;
  overallRiskScore: number;
  clauseCount: number;
}> {
  // If backend is up and supports analyze-text, try server first
  if (await isBackendReachable()) {
    try {
      const response = await fetch(`${API_BASE}/contracts/analyze-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, filename }),
      });

      if (response.ok) {
        const data = await response.json();
        try {
          const detailRes = await fetch(`${API_BASE}/contracts/${data.contractId}/analysis`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            const contracts = (await import('./offlineApi')).getStoredContracts();
            const updated = [
              {
                ...detailData.contract,
                uploadDate: detailData.contract.uploadDate || new Date().toISOString(),
                status: 'completed',
                clauses: detailData.clauses,
              },
              ...contracts.filter((c: any) => c.id !== data.contractId),
            ];
            (await import('./offlineApi')).saveContracts(updated);
          }
        } catch {
          // ignore cache error
        }
        return data;
      }
    } catch (err) {
      console.warn('Backend analyze-text failed, using client engine:', err);
    }
  }

  return analyzeTextOffline(text, filename);
}

export async function getContracts(): Promise<Contract[]> {
  if (await isBackendReachable()) {
    try {
      const res = await fetch(`${API_BASE}/contracts`);
      if (res.ok) {
        const serverContracts = await res.json();
        // Merge with offline contracts
        const offlineList = await getContractsOffline();
        const mergedMap = new Map<string, Contract>();
        serverContracts.forEach((c: Contract) => mergedMap.set(c.id, c));
        offlineList.forEach((c: Contract) => {
          if (!mergedMap.has(c.id)) mergedMap.set(c.id, c);
        });
        return Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
      }
    } catch (err) {
      console.warn('Failed to fetch contracts from backend, using offline list:', err);
    }
  }
  return getContractsOffline();
}

export async function getContract(id: string): Promise<Contract & { clauses?: Clause[] }> {
  const { contract, clauses } = await getAnalysis(id);
  return { ...contract, clauses };
}

export async function getAnalysis(id: string): Promise<AnalysisResult> {
  // Check offline storage first (instant response)
  try {
    const offlineResult = await getAnalysisOffline(id);
    if (offlineResult && offlineResult.clauses && offlineResult.clauses.length > 0) {
      return offlineResult;
    }
  } catch {
    // Not found in offline storage, query server
  }

  if (await isBackendReachable()) {
    try {
      const res = await fetch(`${API_BASE}/contracts/${id}/analysis`);
      if (res.ok) {
        const data = await res.json();
        return {
          contract: data.contract,
          clauses: data.clauses || [],
        };
      }
    } catch (err) {
      console.warn(`Server analysis fetch failed for ${id}:`, err);
    }
  }

  // Fallback attempt to offline
  return getAnalysisOffline(id);
}

export async function deleteContract(id: string): Promise<void> {
  if (await isBackendReachable()) {
    try {
      await fetch(`${API_BASE}/contracts/${id}`, { method: 'DELETE' });
    } catch {
      // ignore server delete error
    }
  }
  return deleteContractOffline(id);
}
