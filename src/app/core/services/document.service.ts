import { Injectable, signal } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, tap, retry, delay } from 'rxjs/operators';
import { Document, ProcessingStatus, DocumentType } from '../models/document.model';
import { IDocumentService } from '../interfaces/document-service.interface';
import { DocumentServiceError, DocumentErrorCode, ErrorHandler } from '../errors/service-errors';
import { LoggingService } from './logging.service';

/**
 * Service for managing document operations with Signal-based state management
 * Implements comprehensive error handling and logging
 */
@Injectable({
  providedIn: 'root'
})
export class DocumentService implements IDocumentService {
  private documents = signal<Document[]>([]);
  private currentDocument = signal<Document | null>(null);

  // Computed signals
  readonly documentsSignal = this.documents.asReadonly();
  readonly currentDocumentSignal = this.currentDocument.asReadonly();

  constructor(private loggingService: LoggingService) {
    this.loggingService.info('DocumentService initialized', undefined, 'DocumentService');
  }

  /**
   * Upload and process document with comprehensive error handling and retry logic
   * @param file The file to upload and process
   * @returns Observable of the processed document
   */
  uploadDocument(file: File): Observable<Document> {
    this.loggingService.info(`Starting document upload: ${file.name}`, { size: file.size }, 'DocumentService');

    try {
      // Validate file
      this.validateFile(file);

      const document: Document = {
        id: this.generateId(),
        name: file.name,
        type: this.detectDocumentType(file.name),
        uploadDate: new Date(),
        size: file.size,
        status: ProcessingStatus.UPLOADING
      };

      // Add to documents list
      this.documents.update(docs => [...docs, document]);
      this.loggingService.info(`Document added to collection: ${document.id}`, document, 'DocumentService');

      // Process file with retry logic
      return from(this.processFile(file, document)).pipe(
        retry({
          count: 3,
          delay: (error, retryCount) => {
            this.loggingService.warn(`Upload attempt ${retryCount} failed, retrying...`, error, 'DocumentService');
            return of(null).pipe(delay(1000 * retryCount));
          }
        }),
        tap(processedDoc => {
          this.updateDocument(processedDoc);
          this.loggingService.info(`Document processed successfully: ${processedDoc.id}`, processedDoc, 'DocumentService');
        }),
        catchError(error => {
          document.status = ProcessingStatus.FAILED;
          this.updateDocument(document);
          
          const serviceError = new DocumentServiceError(
            DocumentErrorCode.PROCESSING_FAILED,
            `Failed to process document: ${file.name}`,
            error,
            { documentId: document.id, fileName: file.name }
          );
          
          this.loggingService.error('Document processing failed', serviceError, 'DocumentService');
          return throwError(() => serviceError);
        })
      );
    } catch (error) {
      const serviceError = ErrorHandler.createError(error, { fileName: file.name });
      this.loggingService.error('Document upload validation failed', serviceError, 'DocumentService');
      return throwError(() => serviceError);
    }
  }

  /**
   * Get document by ID
   */
  getDocumentById(id: string): Observable<Document> {
    try {
      if (!id || id.trim() === '') {
        throw new DocumentServiceError(
          DocumentErrorCode.INVALID_DOCUMENT_ID,
          'Document ID cannot be empty',
          undefined,
          { documentId: id }
        );
      }

      const document = this.documents().find(doc => doc.id === id);
      if (document) {
        return of(document);
      }
      
      throw new DocumentServiceError(
        DocumentErrorCode.DOCUMENT_NOT_FOUND,
        `Document with id ${id} not found`,
        undefined,
        { documentId: id }
      );
    } catch (error) {
      if (error instanceof DocumentServiceError) {
        this.loggingService.error('Document retrieval failed', error, 'DocumentService');
        return throwError(() => error);
      }
      
      const serviceError = ErrorHandler.createError(error, { documentId: id });
      this.loggingService.error('Document retrieval failed', serviceError, 'DocumentService');
      return throwError(() => serviceError);
    }
  }

  /**
   * Delete document
   */
  deleteDocument(id: string): Observable<void> {
    try {
      if (!id || id.trim() === '') {
        throw new DocumentServiceError(
          DocumentErrorCode.INVALID_DOCUMENT_ID,
          'Document ID cannot be empty',
          undefined,
          { documentId: id }
        );
      }

      const document = this.documents().find(doc => doc.id === id);
      if (!document) {
        throw new DocumentServiceError(
          DocumentErrorCode.DOCUMENT_NOT_FOUND,
          `Document with id ${id} not found`,
          undefined,
          { documentId: id }
        );
      }

      this.documents.update(docs => docs.filter(doc => doc.id !== id));
      
      // Clear current document if it's the one being deleted
      if (this.currentDocument()?.id === id) {
        this.currentDocument.set(null);
      }

      this.loggingService.info(`Document deleted: ${id}`, undefined, 'DocumentService');
      return of(void 0);
    } catch (error) {
      if (error instanceof DocumentServiceError) {
        this.loggingService.error('Document deletion failed', error, 'DocumentService');
        return throwError(() => error);
      }
      
      const serviceError = ErrorHandler.createError(error, { documentId: id });
      this.loggingService.error('Document deletion failed', serviceError, 'DocumentService');
      return throwError(() => serviceError);
    }
  }

  /**
   * Set current document
   */
  setCurrentDocument(document: Document | null): void {
    this.currentDocument.set(document);
  }

  /**
   * Get all documents
   */
  getAllDocuments(): Observable<Document[]> {
    this.loggingService.debug('Getting all documents', { count: this.documents().length }, 'DocumentService');
    return of(this.documents());
  }

  /**
   * Update an existing document
   * @param document The document to update
   * @returns Observable of the updated document
   */
  updateDocument(document: Document): Observable<Document> {
    try {
      if (!document.id) {
        throw new DocumentServiceError(
          DocumentErrorCode.INVALID_DOCUMENT_ID,
          'Document ID is required for update',
          undefined,
          { document }
        );
      }

      this.documents.update(docs => 
        docs.map(doc => doc.id === document.id ? { ...document } : doc)
      );

      // Update current document if it's the same
      if (this.currentDocument()?.id === document.id) {
        this.currentDocument.set({ ...document });
      }

      this.loggingService.info(`Document updated: ${document.id}`, document, 'DocumentService');
      return of(document);
    } catch (error) {
      const serviceError = ErrorHandler.createError(error, { documentId: document.id });
      this.loggingService.error('Document update failed', serviceError, 'DocumentService');
      return throwError(() => serviceError);
    }
  }

  /**
   * Clear all documents
   * @returns Observable that completes when clearing is done
   */
  clearAllDocuments(): Observable<void> {
    try {
      const count = this.documents().length;
      this.documents.set([]);
      this.currentDocument.set(null);
      
      this.loggingService.info(`Cleared ${count} documents`, undefined, 'DocumentService');
      return of(void 0);
    } catch (error) {
      const serviceError = ErrorHandler.createError(error);
      this.loggingService.error('Failed to clear documents', serviceError, 'DocumentService');
      return throwError(() => serviceError);
    }
  }

  /**
   * Validate uploaded file with comprehensive checks
   * @param file The file to validate
   * @throws DocumentServiceError if validation fails
   */
  private validateFile(file: File): void {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['application/pdf'];
    const allowedExtensions = ['.pdf'];

    if (!file) {
      throw new DocumentServiceError(
        DocumentErrorCode.INVALID_FILE_TYPE,
        'No file provided',
        undefined,
        { fileName: 'null' }
      );
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      throw new DocumentServiceError(
        DocumentErrorCode.INVALID_FILE_TYPE,
        `Invalid file type: ${file.type}. Only PDF files are allowed.`,
        undefined,
        { fileName: file.name, fileType: file.type }
      );
    }

    // Check file extension as backup
    const hasValidExtension = allowedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension) {
      throw new DocumentServiceError(
        DocumentErrorCode.INVALID_FILE_TYPE,
        `Invalid file extension. Only PDF files are allowed.`,
        undefined,
        { fileName: file.name }
      );
    }

    // Check file size
    if (file.size > maxSize) {
      throw new DocumentServiceError(
        DocumentErrorCode.FILE_TOO_LARGE,
        `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (50MB).`,
        undefined,
        { fileName: file.name, fileSize: file.size, maxSize }
      );
    }

    // Check if file is empty
    if (file.size === 0) {
      throw new DocumentServiceError(
        DocumentErrorCode.INVALID_FILE_TYPE,
        'File is empty',
        undefined,
        { fileName: file.name }
      );
    }
  }

  private detectDocumentType(fileName: string): DocumentType {
    const name = fileName.toLowerCase();
    
    if (name.includes('invoice')) {
      return DocumentType.INVOICE;
    } else if (name.includes('contract')) {
      return DocumentType.CONTRACT;
    } else if (name.includes('receipt')) {
      return DocumentType.RECEIPT;
    }
    
    return DocumentType.LAYOUT;
  }

  private async processFile(file: File, document: Document): Promise<Document> {
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Update document status
    document.status = ProcessingStatus.PROCESSING;
    document.pdfData = arrayBuffer;
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update status to completed
    document.status = ProcessingStatus.COMPLETED;
    
    return document;
  }



  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}