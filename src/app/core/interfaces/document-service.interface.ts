import { Observable } from 'rxjs';
import { Document } from '../models/document.model';

/**
 * Interface for document management operations
 */
export interface IDocumentService {
  /**
   * Signal containing all documents
   */
  readonly documentsSignal: () => Document[];

  /**
   * Signal containing the currently selected document
   */
  readonly currentDocumentSignal: () => Document | null;

  /**
   * Upload and process a document
   * @param file The file to upload
   * @returns Observable of the processed document
   */
  uploadDocument(file: File): Observable<Document>;

  /**
   * Get a document by its ID
   * @param id The document ID
   * @returns Observable of the document
   */
  getDocumentById(id: string): Observable<Document>;

  /**
   * Delete a document
   * @param id The document ID to delete
   * @returns Observable that completes when deletion is done
   */
  deleteDocument(id: string): Observable<void>;

  /**
   * Set the current active document
   * @param document The document to set as current, or null to clear
   */
  setCurrentDocument(document: Document | null): void;

  /**
   * Get all documents
   * @returns Observable of all documents
   */
  getAllDocuments(): Observable<Document[]>;

  /**
   * Update an existing document
   * @param document The document to update
   * @returns Observable of the updated document
   */
  updateDocument(document: Document): Observable<Document>;

  /**
   * Clear all documents
   * @returns Observable that completes when clearing is done
   */
  clearAllDocuments(): Observable<void>;
}