export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  sender: MessageSender;
  documentId?: string;
  confidence?: number;
  sources?: DocumentSource[];
}

export enum MessageSender {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface ChatResponse {
  message: ChatMessage;
  sources: DocumentSource[];
  confidence: number;
  processingTime: number;
}

export interface DocumentSource {
  documentId: string;
  pageNumber: number;
  content: string;
  boundingBox?: number[];
  confidence: number;
}

export interface ChatSession {
  id: string;
  documentId: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastActivity: Date;
}

export interface ContractAnalysis {
  clauses: ContractClause[];
  keyTerms: KeyTerm[];
  risks: RiskAssessment[];
  summary: string;
}

export interface ContractClause {
  type: string;
  content: string;
  location: DocumentLocation;
  importance: ClauseImportance;
}

export interface KeyTerm {
  term: string;
  definition: string;
  occurrences: DocumentLocation[];
}

export interface RiskAssessment {
  type: RiskType;
  description: string;
  severity: RiskSeverity;
  location: DocumentLocation;
}

export interface DocumentLocation {
  pageNumber: number;
  boundingBox: number[];
  textSpan: { start: number; end: number };
}

export enum ClauseImportance {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum RiskType {
  LEGAL = 'legal',
  FINANCIAL = 'financial',
  OPERATIONAL = 'operational',
  COMPLIANCE = 'compliance'
}

export enum RiskSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface KeyInfo {
  label: string;
  value: string;
  confidence: number;
  location?: DocumentLocation;
}