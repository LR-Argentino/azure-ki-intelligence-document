export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  uploadDate: Date;
  size: number;
  status: ProcessingStatus;
  extractionResult?: ExtractionResult;
  pdfData?: ArrayBuffer;
  thumbnailUrl?: string;
}

export enum DocumentType {
  INVOICE = 'invoice',
  CONTRACT = 'contract',
  RECEIPT = 'receipt',
  LAYOUT = 'layout',
  CUSTOM = 'custom'
}

export enum ProcessingStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface ExtractionResult {
  status: string;
  createdDateTime: string;
  lastUpdatedDateTime: string;
  analyzeResult: AnalyzeResult;
}

export interface AnalyzeResult {
  apiVersion: string;
  modelId: string;
  stringIndexType: string;
  content: string;
  pages: Page[];
  documents?: DocumentField[];
  tables?: Table[];
  keyValuePairs?: KeyValuePair[];
}

export interface Page {
  pageNumber: number;
  angle: number;
  width: number;
  height: number;
  unit: string;
  words: Word[];
  lines?: Line[];
  spans: Span[];
}

export interface Word {
  content: string;
  polygon: number[];
  confidence: number;
  span: Span;
}

export interface Line {
  content: string;
  polygon: number[];
  spans: Span[];
}

export interface Span {
  offset: number;
  length: number;
}

export interface DocumentField {
  docType: string;
  fields: { [key: string]: any };
  spans: Span[];
}

export interface Table {
  rowCount: number;
  columnCount: number;
  cells: TableCell[];
  spans: Span[];
}

export interface TableCell {
  kind: string;
  rowIndex: number;
  columnIndex: number;
  rowSpan?: number;
  columnSpan?: number;
  content: string;
  polygon: number[];
  spans: Span[];
}

export interface KeyValuePair {
  key: DocumentElement;
  value: DocumentElement;
  confidence: number;
}

export interface DocumentElement {
  content: string;
  polygon: number[];
  spans: Span[];
}