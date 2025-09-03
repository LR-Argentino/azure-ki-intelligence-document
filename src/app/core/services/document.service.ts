import { Injectable, signal } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Document, ProcessingStatus, DocumentType } from '../models/document.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private documents = signal<Document[]>([]);
  private currentDocument = signal<Document | null>(null);

  // Computed signals
  readonly documentsSignal = this.documents.asReadonly();
  readonly currentDocumentSignal = this.currentDocument.asReadonly();

  /**
   * Upload and process document
   */
  uploadDocument(file: File): Observable<Document> {
    // Validate file
    const validationError = this.validateFile(file);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

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

    // Simulate file upload and processing
    return from(this.processFile(file, document)).pipe(
      tap(processedDoc => {
        this.updateDocument(processedDoc);
      }),
      catchError(error => {
        document.status = ProcessingStatus.FAILED;
        this.updateDocument(document);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get document by ID
   */
  getDocumentById(id: string): Observable<Document> {
    const document = this.documents().find(doc => doc.id === id);
    if (document) {
      return of(document);
    }
    return throwError(() => new Error(`Document with id ${id} not found`));
  }

  /**
   * Delete document
   */
  deleteDocument(id: string): Observable<void> {
    this.documents.update(docs => docs.filter(doc => doc.id !== id));
    
    // Clear current document if it's the one being deleted
    if (this.currentDocument()?.id === id) {
      this.currentDocument.set(null);
    }

    return of(void 0);
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
    return of(this.documents());
  }

  private validateFile(file: File): string | null {
    // Check file type
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are supported';
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'File size must be less than 50MB';
    }

    return null;
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

  private updateDocument(updatedDocument: Document): void {
    this.documents.update(docs => 
      docs.map(doc => doc.id === updatedDocument.id ? updatedDocument : doc)
    );
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}