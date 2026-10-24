import { analyzeContractOffline, Clause } from './offlineAnalyzer';
import { extractTextFromFile } from './documentParserClient';

export interface Contract {
  id: string;
  filename: string;
  uploadDate: string;
  status: string;
  overallRiskScore: number;
  clauses?: Clause[];
}

const STORAGE_KEY = 'contract_ai_data';

export function getStoredContracts(): Contract[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveContracts(contracts: Contract[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export async function uploadContractOffline(file: File): Promise<{
  contractId: string;
  status: string;
  overallRiskScore: number;
  clauseCount: number;
}> {
  const contractId = 'c-' + Date.now().toString();
  let text = '';

  try {
    text = await extractTextFromFile(file);
  } catch (error) {
    console.error('File extract error:', error);
    // Fallback direct text read
    try {
      text = await file.text();
    } catch {
      throw new Error('Failed to read file content.');
    }
  }

  if (!text || text.trim().length === 0) {
    throw new Error('The uploaded file appears to be empty.');
  }

  return analyzeTextDirectly(text, file.name, contractId);
}

export async function getContractsOffline(): Promise<Contract[]> {
  return getStoredContracts().map(({ clauses, ...rest }) => rest);
}

export async function getAnalysisOffline(id: string): Promise<{ contract: Contract; clauses: Clause[] }> {
  const contracts = getStoredContracts();
  const contract = contracts.find((c) => c.id === id);
  if (!contract) {
    throw new Error(`Contract with ID ${id} not found.`);
  }
  return { contract, clauses: contract.clauses || [] };
}

export async function deleteContractOffline(id: string): Promise<void> {
  const contracts = getStoredContracts().filter((c) => c.id !== id);
  saveContracts(contracts);
}

export async function analyzeTextDirectly(
  text: string,
  filename: string,
  presetId?: string
): Promise<{
  contractId: string;
  status: string;
  overallRiskScore: number;
  clauseCount: number;
}> {
  const contractId = presetId || 'c-' + Date.now().toString();

  const clauses = analyzeContractOffline(text, contractId);

  // Overall score: calculated as weighted average or highest risks
  let overallScore = 0;
  if (clauses.length > 0) {
    const sum = clauses.reduce((acc, c) => acc + c.riskScore, 0);
    overallScore = sum / clauses.length;
  }

  const contract: Contract = {
    id: contractId,
    filename: filename || 'Untitled Contract',
    uploadDate: new Date().toISOString(),
    status: 'completed',
    overallRiskScore: Math.round(overallScore * 100) / 100,
    clauses,
  };

  const contracts = getStoredContracts();
  // Remove existing if duplicate
  const updated = [contract, ...contracts.filter((c) => c.id !== contractId)];
  saveContracts(updated);

  return {
    contractId: contract.id,
    status: 'completed',
    overallRiskScore: contract.overallRiskScore,
    clauseCount: clauses.length,
  };
}

export const SAMPLE_CONTRACTS = {
  saas: `MASTER SERVICES AGREEMENT

ARTICLE 1 - SCOPE & SERVICES
1.1 Provider shall deliver cloud software services and consulting as specified in Statements of Work.
1.2 Provider reserves the right to modify service features or specifications at its sole discretion without notice.

ARTICLE 2 - PAYMENT & BILLING
2.1 Client shall pay all invoices within 15 days of invoice date.
2.2 Late payments shall incur a penalty of 5% per month on the outstanding balance.
2.3 All fees and payments are strictly non-refundable under any circumstances.
2.4 Provider reserves the right to suspend all services if payment is overdue by more than 7 days.

ARTICLE 3 - LIMITATION OF LIABILITY
3.1 IN NO EVENT SHALL PROVIDER BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS OR DATA.
3.2 PROVIDER TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE TOTAL FEES PAID BY CLIENT IN THE 1 MONTH PRECEDING THE CLAIM.
3.3 Client acknowledges that Provider offers the services on an AS-IS basis and Provider disclaims all warranties of merchantability and fitness for a particular purpose.

ARTICLE 4 - TERMINATION & CANCELLATION
4.1 Either party may terminate with 90 days prior written notice.
4.2 Provider may terminate this Agreement immediately and without notice if Client breaches any term.
4.3 Upon termination, Client shall pay all remaining contract fees for the full unexpired term within 7 days.
4.4 All work product and licenses granted to Client shall immediately revert to Provider.

ARTICLE 5 - AUTOMATIC RENEWAL
5.1 This Agreement shall automatically renew for successive one-year periods unless Client provides written notice of non-renewal at least 90 days before the current term expires.
5.2 Provider may modify renewal pricing at any time with 30 days notice.

ARTICLE 6 - INDEMNIFICATION
6.1 Client agrees to indemnify, defend, and hold harmless Provider from and against any and all claims, liabilities, losses, damages, and attorney fees arising out of the agreement.
6.2 Provider shall have no obligation to indemnify Client for any reason whatsoever.

ARTICLE 7 - INTELLECTUAL PROPERTY RIGHTS
7.1 All intellectual property, custom deliverables, and inventions created under this Agreement shall remain the exclusive property of Provider.
7.2 Client shall have no right, title, or interest in any deliverables or work product.
7.3 Client grants Provider an irrevocable, perpetual, royalty-free license to use Client data for marketing and service enhancement.

ARTICLE 8 - RESTRICTIVE COVENANTS
8.1 Client shall not hire or solicit any employees or contractors of Provider during the term and for 2 years thereafter.
8.2 Client shall not engage in any competing software development business for a period of 1 year following termination.

ARTICLE 9 - GOVERNING LAW & DISPUTE RESOLUTION
9.1 This Agreement shall be governed by the laws of the State of Delaware.
9.2 Any dispute shall be resolved via mandatory binding arbitration in Wilmington, Delaware.
9.3 Client waives all rights to participate in class action lawsuits or trial by jury against Provider.`,

  consulting: `CONSULTING SERVICES AGREEMENT

SECTION 1 - ENGAGEMENT
Consultant shall perform independent consulting services for Client in accordance with project milestones.

SECTION 2 - COMPENSATION
2.1 Client shall pay Consultant $150 per hour. Invoices payable within 30 days.
2.2 No penalties or late fees shall apply unless overdue by more than 45 days.

SECTION 3 - INTELLECTUAL PROPERTY ASSIGNMENT
Consultant assigns to Client all right, title, and interest in all deliverables and work product created specifically for Client upon receipt of payment.

SECTION 4 - MUTUAL CONFIDENTIALITY
Each party shall protect the other party's confidential information using the same degree of care as its own information, for a period of 3 years.

SECTION 5 - MUTUAL LIABILITY LIMITATION
Neither party shall be liable for indirect or consequential damages. Each party's liability is capped at the total amount paid under this Agreement.

SECTION 6 - TERMINATION
Either party may terminate this Agreement for convenience upon 30 days written notice.`,
};
