import { Injectable } from '@angular/core';
import { Observable, from, throwError, of, timer } from 'rxjs';
import { map, catchError, tap, retry, delay, switchMap, takeWhile, concatMap, take } from 'rxjs/operators';
import { ExtractionResult, DocumentType } from '../models/document.model';
import {
  IAzureIntelligenceService,
  OperationStatus,
  InvoiceResult,
  ContractResult,
  LayoutResult
} from '../interfaces/azure-intelligence-service.interface';
import { AzureIntelligenceError, AzureErrorCode, ErrorHandler } from '../errors/service-errors';
import { LoggingService } from './logging.service';

// Azure SDK imports
import DocumentIntelligenceRestClient, { 
  DocumentIntelligenceClient
} from '@azure-rest/ai-document-intelligence';
import { AzureKeyCredential } from '@azure/core-auth';
import { environment } from '../../../environments/environment.local';

/**
 * Configuration interface for Azure Document Intelligence
 */
interface AzureConfig {
  endpoint: string;
  apiKey: string;
  apiVersion?: string;
}

/**
 * Service for Azure Document Intelligence operations with comprehensive error handling
 * Implements real Azure SDK integration with retry logic and proper configuration management
 */
@Injectable({
  providedIn: 'root'
})
export class AzureIntelligenceService implements IAzureIntelligenceService {
  private client: DocumentIntelligenceClient | null = null;
  private config: AzureConfig | null = null;

  constructor(private loggingService: LoggingService) {
    this.initializeService();
  }

  /**
   * Initialize the Azure service with configuration from environment
   */
  private initializeService(): void {
    try {
      // Load configuration from environment
      this.config = {
        endpoint: environment.azure.endpoint,
        apiKey: environment.azure.apiKey,
        apiVersion: environment.azure.apiVersion
      };

      if (this.config.endpoint && this.config.apiKey) {
        // Initialize the real Azure Document Intelligence client
        const credential = new AzureKeyCredential(this.config.apiKey);
        this.client = DocumentIntelligenceRestClient(this.config.endpoint, credential, {
          apiVersion: this.config.apiVersion
        });
        this.loggingService.info('Azure Document Intelligence service initialized', 
          { endpoint: this.config.endpoint, apiVersion: this.config.apiVersion }, 
          'AzureIntelligenceService');
      } else {
        this.loggingService.warn('Azure service not configured - missing endpoint or API key', undefined, 'AzureIntelligenceService');
      }
    } catch (error: any) {
      this.loggingService.error('Failed to initialize Azure service', error as Error, 'AzureIntelligenceService');
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return this.client !== null && this.config !== null;
  }

  /**
   * Analyze document using Azure Document Intelligence with comprehensive error handling
   * @param file The file to analyze
   * @param modelId Optional model ID to use for analysis
   * @returns Observable of the extraction result
   */
  analyzeDocument(file: File, modelId?: string): Observable<ExtractionResult> {
    this.loggingService.info(`Starting document analysis: ${file.name}`, { modelId }, 'AzureIntelligenceService');

    if (!this.isConfigured()) {
      const error = new AzureIntelligenceError(
        AzureErrorCode.SERVICE_NOT_CONFIGURED,
        'Azure Document Intelligence service is not properly configured',
        undefined,
        { fileName: file.name, modelId }
      );
      this.loggingService.error('Service not configured', error, 'AzureIntelligenceService');
      return throwError(() => error);
    }

    const model = modelId || 'prebuilt-layout';
    
    return from(this.analyzeDocumentWithAzure(file, model)).pipe(
      retry({
        count: 2,
        delay: (error, retryCount) => {
          this.loggingService.warn(`Analysis attempt ${retryCount} failed, retrying...`, error, 'AzureIntelligenceService');
          return of(null).pipe(delay(2000 * retryCount));
        }
      }),
      tap(result => {
        this.loggingService.info(`Document analysis completed: ${file.name}`, result, 'AzureIntelligenceService');
      }),
      catchError(error => {
        const serviceError = new AzureIntelligenceError(
          AzureErrorCode.ANALYSIS_FAILED,
          `Failed to analyze document: ${file.name}`,
          error,
          { fileName: file.name, modelId: model }
        );
        this.loggingService.error('Document analysis failed', serviceError, 'AzureIntelligenceService');
        return throwError(() => serviceError);
      })
    );
  }

  /**
   * Process different document types with specialized models
   */
  analyzeInvoice(file: File): Observable<InvoiceResult> {
    return this.analyzeDocument(file, 'prebuilt-invoice').pipe(
      map(result => ({
        ...result,
        invoiceData: this.extractInvoiceData(result.analyzeResult)
      }))
    );
  }

  analyzeContract(file: File): Observable<ContractResult> {
    return this.analyzeDocument(file, 'prebuilt-contract').pipe(
      map(result => ({
        ...result,
        contractData: this.extractContractData(result.analyzeResult)
      }))
    );
  }

  analyzeLayout(file: File): Observable<LayoutResult> {
    return this.analyzeDocument(file, 'prebuilt-layout').pipe(
      map(result => ({
        ...result,
        layoutData: this.extractLayoutData(result.analyzeResult)
      }))
    );
  }

  /**
   * Get operation status for long-running operations
   * @param operationId The operation ID to check
   * @returns Observable of the operation status
   */
  getOperationStatus(operationId: string): Observable<OperationStatus> {
    this.loggingService.debug(`Checking operation status: ${operationId}`, undefined, 'AzureIntelligenceService');

    if (!this.isConfigured()) {
      const error = new AzureIntelligenceError(
        AzureErrorCode.SERVICE_NOT_CONFIGURED,
        'Azure Document Intelligence service is not properly configured',
        undefined,
        { operationId }
      );
      return throwError(() => error);
    }

    if (!operationId) {
      const error = new AzureIntelligenceError(
        AzureErrorCode.OPERATION_NOT_FOUND,
        'Operation ID is required',
        undefined,
        { operationId }
      );
      return throwError(() => error);
    }

    // Use real Azure API to get operation status
    return from(this.getOperationResult(operationId)).pipe(
      map(result => ({
        status: result.status as 'notStarted' | 'running' | 'succeeded' | 'failed',
        createdDateTime: new Date().toISOString(), // Azure doesn't always provide this
        lastUpdatedDateTime: new Date().toISOString(), // Azure doesn't always provide this
        percentCompleted: result.status === 'succeeded' ? 100 : 
                         result.status === 'running' ? 50 : 
                         result.status === 'failed' ? 0 : 0
      })),
      tap(status => {
        this.loggingService.debug(`Operation status retrieved: ${operationId}`, status, 'AzureIntelligenceService');
      }),
      catchError(error => {
        const serviceError = new AzureIntelligenceError(
          AzureErrorCode.OPERATION_NOT_FOUND,
          `Failed to get operation status: ${operationId}`,
          error,
          { operationId }
        );
        this.loggingService.error('Failed to get operation status', serviceError, 'AzureIntelligenceService');
        return throwError(() => serviceError);
      })
    );
  }

  /**
   * Analyze document with Azure API
   * @param file The file to analyze
   * @param modelId The model ID to use
   * @returns Promise with extraction result
   */
  private async analyzeDocumentWithAzure(file: File, modelId: string): Promise<ExtractionResult> {
    if (!this.client) {
      throw new Error('Azure client not initialized');
    }

    try {
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Submit document for analysis
      const response = await this.client.pathUnchecked('/documentModels/{modelId}:analyze', modelId).post({
        contentType: 'application/octet-stream',
        body: arrayBuffer
      });

      if (response.status !== '202') {
        throw new Error(`Failed to submit document for analysis: ${response.status}`);
      }

      // Extract operation ID from response headers
      const operationLocation = response.headers['operation-location'] || response.headers['Operation-Location'];
      if (!operationLocation) {
        throw new Error('No operation location header found in response');
      }

      // Extract operation ID from the operation location URL
      const operationId = operationLocation.split('/').pop();
      if (!operationId) {
        throw new Error('Could not extract operation ID from operation location');
      }

      this.loggingService.info(`Document submitted for analysis`, { 
        fileName: file.name, 
        modelId, 
        operationId 
      }, 'AzureIntelligenceService');

      // Poll for completion
      return await new Promise<ExtractionResult>((resolve, reject) => {
        this.pollOperationUntilComplete(operationId).pipe(take(1)).subscribe({
          next: (result) => resolve(result),
          error: (err) => reject(err)
        });
      });
    } catch (error: any) {
      this.loggingService.error('Failed to analyze document with Azure', error, 'AzureIntelligenceService');
      throw error;
    }
  }



  /**
   * Poll operation until complete
   * @param operationId The operation ID to poll
   * @returns Observable that emits the final result
   */
  private pollOperationUntilComplete(operationId: string): Observable<ExtractionResult> {
    return timer(0, 2000).pipe(
      concatMap(() => from(this.getOperationResult(operationId))),
      takeWhile(result => result.status === 'running' || result.status === 'notStarted', true),
      map(result => {
        if (result.status === 'succeeded') {
          return this.mapAzureResultToExtractionResult(result.result);
        } else if (result.status === 'failed') {
          throw new Error(`Document analysis failed: ${result.error || 'Unknown error'}`);
        }
        // Still running, return null to continue polling
        return null;
      }),
      // Filter out null values (still running) and only emit when we have a result
      switchMap(result => {
        if (result === null) {
          return of(); // Empty observable, continue polling
        }
        return of(result); // Emit the final result
      })
    );
  }

  /**
   * Get operation result from Azure
   * @param operationId The operation ID
   * @returns Promise with operation status and result
   */
  private async getOperationResult(operationId: string): Promise<{
    status: 'notStarted' | 'running' | 'succeeded' | 'failed';
    result?: any;
    error?: string;
  }> {
    if (!this.client) {
      throw new Error('Azure client not initialized');
    }

    try {
      // Use pathUnchecked to bypass strict typing constraints
      const response = await this.client.pathUnchecked('/documentModels/operations/{operationId}', operationId).get();

      if (response.status !== '200') {
        throw new Error(`Failed to get operation result: ${response.status}`);
      }

      const body = response.body as any;
      
      return {
        status: body.status,
        result: body.status === 'succeeded' ? body.analyzeResult : undefined,
        error: body.status === 'failed' ? body.error?.message : undefined
      };
    } catch (error: any) {
      this.loggingService.error('Failed to get operation result', error, 'AzureIntelligenceService');
      throw error;
    }
  }

  /**
   * Map Azure Document Intelligence result to our ExtractionResult format
   * @param azureResult The result from Azure
   * @returns Mapped ExtractionResult
   */
  private mapAzureResultToExtractionResult(azureResult: any): ExtractionResult {
    return {
      status: 'succeeded',
      createdDateTime: new Date().toISOString(),
      lastUpdatedDateTime: new Date().toISOString(),
      analyzeResult: {
        apiVersion: azureResult.apiVersion || '2024-02-29-preview',
        modelId: azureResult.modelId || 'prebuilt-layout',
        stringIndexType: azureResult.stringIndexType || 'textElements',
        content: this.extractAllText(azureResult),
        pages: this.mapPages(azureResult.pages || []),
        tables: this.mapTables(azureResult.tables || []),
        keyValuePairs: this.mapKeyValuePairs(azureResult.keyValuePairs || [])
      }
    };
  }

  /**
   * Extract all text from Azure result
   */
  private extractAllText(azureResult: any): string {
    if (azureResult.content) {
      return azureResult.content;
    }
    
    // Fallback: concatenate text from all pages
    if (azureResult.pages) {
      return azureResult.pages
        .map((page: any) => page.lines?.map((line: any) => line.content).join('\n') || '')
        .join('\n\n');
    }
    
    return '';
  }

  /**
   * Map Azure pages to our format
   */
  private mapPages(azurePages: any[]): any[] {
    return azurePages.map((page, index) => ({
      pageNumber: page.pageNumber || index + 1,
      text: page.lines?.map((line: any) => line.content).join('\n') || '',
      tables: [], // Tables are handled separately
      keyValuePairs: [] // Key-value pairs are handled separately
    }));
  }

  /**
   * Map Azure tables to our format
   */
  private mapTables(azureTables: any[]): any[] {
    return azureTables.map(table => ({
      rowCount: table.rowCount || 0,
      columnCount: table.columnCount || 0,
      cells: table.cells?.map((cell: any) => ({
        rowIndex: cell.rowIndex || 0,
        columnIndex: cell.columnIndex || 0,
        text: cell.content || '',
        confidence: cell.confidence || 0.0
      })) || []
    }));
  }

  /**
   * Map Azure key-value pairs to our format
   */
  private mapKeyValuePairs(azureKeyValuePairs: any[]): any[] {
    return azureKeyValuePairs.map(pair => ({
      key: pair.key?.content || '',
      value: pair.value?.content || '',
      confidence: pair.confidence || 0.0
    }));
  }

  /**
   * Determine document type from Azure result
   */
  private determineDocumentTypeFromResult(azureResult: any): DocumentType {
    const modelId = azureResult.modelId?.toLowerCase() || '';
    
    if (modelId.includes('invoice')) {
      return DocumentType.INVOICE;
    } else if (modelId.includes('contract')) {
      return DocumentType.CONTRACT;
    } else {
      return DocumentType.LAYOUT;
    }
  }

  /**
   * Extract invoice-specific data from Azure result
   */
  private extractInvoiceData(analyzeResult: any): any {
    // Extract invoice data from Azure Document Intelligence result
    // This would parse the actual Azure response for invoice fields
    const documents = analyzeResult.documents || [];
    const invoiceDoc = documents.find((doc: any) => doc.docType === 'invoice') || documents[0];
    
    if (!invoiceDoc) {
      throw new Error('No invoice document found in analysis result');
    }

    const fields = invoiceDoc.fields || {};
    
    return {
      vendorName: fields.VendorName?.content || fields.VendorAddress?.content || 'Unknown Vendor',
      customerName: fields.CustomerName?.content || fields.CustomerAddress?.content || 'Unknown Customer',
      invoiceId: fields.InvoiceId?.content || fields.InvoiceNumber?.content || 'Unknown',
      invoiceDate: fields.InvoiceDate?.content || new Date().toISOString().split('T')[0],
      totalAmount: parseFloat(fields.InvoiceTotal?.content || fields.TotalAmount?.content || '0'),
      currency: fields.Currency?.content || 'USD'
    };
  }

  /**
   * Extract contract-specific data from Azure result
   */
  private extractContractData(analyzeResult: any): any {
    // Extract contract data from Azure Document Intelligence result
    const documents = analyzeResult.documents || [];
    const contractDoc = documents.find((doc: any) => doc.docType === 'contract') || documents[0];
    
    if (!contractDoc) {
      throw new Error('No contract document found in analysis result');
    }

    const fields = contractDoc.fields || {};
    
    return {
      parties: this.extractParties(fields),
      effectiveDate: fields.EffectiveDate?.content || fields.StartDate?.content || 'Unknown',
      expirationDate: fields.ExpirationDate?.content || fields.EndDate?.content || 'Unknown',
      contractType: fields.ContractType?.content || 'Unknown Agreement',
      keyTerms: this.extractKeyTerms(analyzeResult.content || '')
    };
  }

  /**
   * Extract layout-specific data from Azure result
   */
  private extractLayoutData(analyzeResult: any): any {
    const pages = analyzeResult.pages || [];
    const tables = analyzeResult.tables || [];
    
    return {
      pageCount: pages.length,
      hasImages: pages.some((page: any) => page.images && page.images.length > 0),
      hasTables: tables.length > 0,
      textDensity: this.calculateTextDensity(analyzeResult.content || '')
    };
  }

  /**
   * Extract parties from contract fields
   */
  private extractParties(fields: any): string[] {
    const parties: string[] = [];
    
    if (fields.Parties?.valueArray) {
      return fields.Parties.valueArray.map((party: any) => party.content || 'Unknown Party');
    }
    
    // Fallback: look for common party field names
    if (fields.Party1?.content) parties.push(fields.Party1.content);
    if (fields.Party2?.content) parties.push(fields.Party2.content);
    if (fields.Client?.content) parties.push(fields.Client.content);
    if (fields.Vendor?.content) parties.push(fields.Vendor.content);
    
    return parties.length > 0 ? parties : ['Unknown Party A', 'Unknown Party B'];
  }

  /**
   * Extract key terms from contract content
   */
  private extractKeyTerms(content: string): string[] {
    const terms: string[] = [];
    const commonTerms = [
      'payment', 'termination', 'confidentiality', 'liability', 'warranty',
      'intellectual property', 'force majeure', 'governing law', 'dispute resolution'
    ];
    
    const lowerContent = content.toLowerCase();
    commonTerms.forEach(term => {
      if (lowerContent.includes(term)) {
        terms.push(term.charAt(0).toUpperCase() + term.slice(1));
      }
    });
    
    return terms.length > 0 ? terms : ['Standard Terms'];
  }

  /**
   * Calculate text density for layout analysis
   */
  private calculateTextDensity(content: string): number {
    if (!content) return 0;
    
    const totalChars = content.length;
    const nonWhitespaceChars = content.replace(/\s/g, '').length;
    
    return totalChars > 0 ? nonWhitespaceChars / totalChars : 0;
  }
}
