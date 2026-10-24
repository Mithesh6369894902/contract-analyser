import { v4 as uuidv4 } from 'uuid';

export interface Clause {
  id: string;
  contractId: string;
  clauseType: string;
  originalText: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  explanation: string;
  recommendations: string;
  positionStart: number;
  positionEnd: number;
}

export interface Contract {
  id: string;
  filename: string;
  uploadDate: Date;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  overallRiskScore: number;
  filePath: string;
  clauses?: Clause[];
}

export function createClause(data: Omit<Clause, 'id'>): Clause {
  return {
    id: uuidv4(),
    ...data,
  };
}

export function createContract(data: Omit<Contract, 'id' | 'uploadDate'>): Contract {
  return {
    id: uuidv4(),
    uploadDate: new Date(),
    ...data,
  };
}
