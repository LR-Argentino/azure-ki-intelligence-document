import { Observable } from 'rxjs';
import { ExtractionResult } from '../models/document.model';

/**
 * Operation status for long-running Azure operations
 */
export interface OperationStatus {
  status: string;
  createdDateTime: string;
  lastUpdatedDateTime: string;
  percentCompleted?: number;
  error?: any;
}

/**
 * Invoice-specific extraction result
 */
export interface InvoiceResult extends ExtractionResult {
  invoiceData: {
    vendorName?: string;
    customerName?: string;
    invoiceId?: string;
    invoiceDate?: string;
    totalAmount?: number;
    currency?: string;
  };
}

/**
 * Contract-specific extraction result
 */
export interface ContractResult extends ExtractionResult {
  contractData: {
    parties?: string[];
    effectiveDate?: string;
    expirationDate?: string;
    contractType?: string;
    keyTerms?: string[];
  };
}

/**
 * Layout analysis result
 */
export interface LayoutResult extends ExtractionResult {
  layoutData: {
    pageCount: number;
    hasImages: boolean;
    hasTables: boolean;
    textDensity: number;
  };
}

/**
 * Interface for Azure Document Intelligence operations
 */
export interface IAzureIntelligenceService {
  /**
   * Analyze document using Azure Document Intelligence
   * @param file The file to analyze
   * @param modelId Optional model ID to use for analysis
   * @returns Observable of the extraction result
   */
  analyzeDocument(file: File, modelId?: string): Observable<ExtractionResult>;

  /**
   * Analyze invoice document with specialized model
   * @param file The invoice file to analyze
   * @returns Observable of the invoice-specific result
   */
  analyzeInvoice(file: File): Observable<InvoiceResult>;

  /**
   * Analyze contract document with specialized model
   * @param file The contract file to analyze
   * @returns Observable of the contract-specific result
   */
  analyzeContract(file: File): Observable<ContractResult>;

  /**
   * Analyze document layout
   * @param file The file to analyze for layout
   * @returns Observable of the layout analysis result
   */
  analyzeLayout(file: File): Observable<LayoutResult>;

  /**
   * Get the status of a long-running operation
   * @param operationId The operation ID to check
   * @returns Observable of the operation status
   */
  getOperationStatus(operationId: string): Observable<OperationStatus>;

  /**
   * Check if the service is properly configured
   * @returns True if the service is configured and ready to use
   */
  isConfigured(): boolean;
}