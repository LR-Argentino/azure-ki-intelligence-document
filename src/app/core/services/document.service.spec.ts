import { TestBed } from '@angular/core/testing';
import { DocumentService } from './document.service';
import { LoggingService } from './logging.service';
import { Document, DocumentType, ProcessingStatus } from '../models/document.model';
import { DocumentServiceError, DocumentErrorCode } from '../errors/service-errors';
import { of, throwError } from 'rxjs';

describe('DocumentService', () => {
  let service: DocumentService;
  let loggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['info', 'debug', 'warn', 'error']);

    TestBed.configureTestingModule({
      providers: [
        DocumentService,
        { provide: LoggingService, useValue: loggingSpy }
      ]
    });

    service = TestBed.inject(DocumentService);
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty documents', () => {
    expect(service.documentsSignal()).toEqual([]);
    expect(service.currentDocumentSignal()).toBeNull();
  });

  describe('uploadDocument', () => {
    let mockFile: File;

    beforeEach(() => {
      mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    });

    it('should upload a valid PDF file successfully', (done) => {
      service.uploadDocument(mockFile).subscribe({
        next: (document) => {
          expect(document).toBeDefined();
          expect(document.name).toBe('test.pdf');
          expect(document.type).toBe(DocumentType.LAYOUT);
          expect(document.status).toBe(ProcessingStatus.COMPLETED);
          expect(service.documentsSignal().length).toBe(1);
          done();
        },
        error: done.fail
      });
    });

    it('should reject invalid file type', (done) => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      service.uploadDocument(invalidFile).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toBeInstanceOf(DocumentServiceError);
          expect(error.code).toBe(DocumentErrorCode.INVALID_FILE_TYPE);
          done();
        }
      });
    });

    it('should reject file that is too large', (done) => {
      const largeContent = new Array(51 * 1024 * 1024).fill('a').join(''); // 51MB
      const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      
      service.uploadDocument(largeFile).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toBeInstanceOf(DocumentServiceError);
          expect(error.code).toBe(DocumentErrorCode.FILE_TOO_LARGE);
          done();
        }
      });
    });

    it('should reject empty file', (done) => {
      const emptyFile = new File([], 'empty.pdf', { type: 'application/pdf' });
      
      service.uploadDocument(emptyFile).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toBeInstanceOf(DocumentServiceError);
          expect(error.code).toBe(DocumentErrorCode.INVALID_FILE_TYPE);
          done();
        }
      });
    });

    it('should detect document type from filename', (done) => {
      const invoiceFile = new File(['test'], 'invoice-123.pdf', { type: 'application/pdf' });
      
      service.uploadDocument(invoiceFile).subscribe({
        next: (document) => {
          expect(document.type).toBe(DocumentType.INVOICE);
          done();
        },
        error: done.fail
      });
    });

    it('should log upload process', (done) => {
      service.uploadDocument(mockFile).subscribe({
        next: () => {
          expect(loggingService.info).toHaveBeenCalledWith(
            jasmine.stringMatching(/Starting document upload/),
            jasmine.any(Object),
            'DocumentService'
          );
          done();
        },
        error: done.fail
      });
    });
  });

  describe('getDocumentById', () => {
    let testDocument: Document;

    beforeEach((done) => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      service.uploadDocument(mockFile).subscribe({
        next: (doc) => {
          testDocument = doc;
          done();
        },
        error: done.fail
      });
    });

    it('should return document by ID', (done) => {
      service.getDocumentById(testDocument.id).subscribe({
        next: (document) => {
          expect(document).toEqual(testDocument);
          done();
        },
        error: done.fail
      });
    });

    it('should throw error for non-existent document', (done) => {
      service.getDocumentById('non-existent-id').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toBeInstanceOf(DocumentServiceError);
          expect(error.code).toBe(DocumentErrorCode.DOCUMENT_NOT_FOUND);
          done();
        }
      });
    });

    it('should throw error for invalid document ID', (done) => {
      service.getDocumentById('').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toBeInstanceOf(DocumentServiceError);
          expect(error.code).toBe(DocumentErrorCode.INVALID_DOCUMENT_ID);
          done();
        }
      });
    });
  });

  describe('deleteDocument', () => {
    let testDocument: Document;

    beforeEach((done) => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      service.uploadDocument(mockFile).subscribe({
        next: (doc) => {
          testDocument = doc;
          done();
        },
        error: done.fail
      });
    });

    it('should delete document by ID', (done) => {
      service.deleteDocument(testDocument.id).subscribe({
        next: () => {
          expect(service.documentsSignal().length).toBe(0);
          done();
        },
        error: done.fail
      });
    });

    it('should clear current document if deleted', (done) => {
      service.setCurrentDocument(testDocument);
      expect(service.currentDocumentSignal()).toEqual(testDocument);

      service.deleteDocument(testDocument.id).subscribe({
        next: () => {
          expect(service.currentDocumentSignal()).toBeNull();
          done();
        },
        error: done.fail
      });
    });

    it('should throw error for non-existent document', (done) => {
      service.deleteDocument('non-existent-id').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toBeInstanceOf(DocumentServiceError);
          expect(error.code).toBe(DocumentErrorCode.DOCUMENT_NOT_FOUND);
          done();
        }
      });
    });
  });

  describe('setCurrentDocument', () => {
    let testDocument: Document;

    beforeEach((done) => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      service.uploadDocument(mockFile).subscribe({
        next: (doc) => {
          testDocument = doc;
          done();
        },
        error: done.fail
      });
    });

    it('should set current document', () => {
      service.setCurrentDocument(testDocument);
      expect(service.currentDocumentSignal()).toEqual(testDocument);
    });

    it('should clear current document when set to null', () => {
      service.setCurrentDocument(testDocument);
      service.setCurrentDocument(null);
      expect(service.currentDocumentSignal()).toBeNull();
    });
  });

  describe('updateDocument', () => {
    let testDocument: Document;

    beforeEach((done) => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      service.uploadDocument(mockFile).subscribe({
        next: (doc) => {
          testDocument = doc;
          done();
        },
        error: done.fail
      });
    });

    it('should update existing document', (done) => {
      const updatedDocument = { ...testDocument, name: 'updated.pdf' };
      
      service.updateDocument(updatedDocument).subscribe({
        next: (document) => {
          expect(document.name).toBe('updated.pdf');
          expect(service.documentsSignal()[0].name).toBe('updated.pdf');
          done();
        },
        error: done.fail
      });
    });

    it('should update current document if it matches', (done) => {
      service.setCurrentDocument(testDocument);
      const updatedDocument = { ...testDocument, name: 'updated.pdf' };
      
      service.updateDocument(updatedDocument).subscribe({
        next: () => {
          expect(service.currentDocumentSignal()?.name).toBe('updated.pdf');
          done();
        },
        error: done.fail
      });
    });

    it('should throw error for document without ID', (done) => {
      const invalidDocument = { ...testDocument, id: '' };
      
      service.updateDocument(invalidDocument).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toBeInstanceOf(DocumentServiceError);
          expect(error.code).toBe(DocumentErrorCode.INVALID_DOCUMENT_ID);
          done();
        }
      });
    });
  });

  describe('clearAllDocuments', () => {
    beforeEach((done) => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      service.uploadDocument(mockFile).subscribe({
        next: (doc) => {
          service.setCurrentDocument(doc);
          done();
        },
        error: done.fail
      });
    });

    it('should clear all documents and current document', (done) => {
      expect(service.documentsSignal().length).toBe(1);
      expect(service.currentDocumentSignal()).not.toBeNull();

      service.clearAllDocuments().subscribe({
        next: () => {
          expect(service.documentsSignal().length).toBe(0);
          expect(service.currentDocumentSignal()).toBeNull();
          done();
        },
        error: done.fail
      });
    });
  });

  describe('getAllDocuments', () => {
    it('should return all documents', (done) => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      service.uploadDocument(mockFile).subscribe({
        next: () => {
          service.getAllDocuments().subscribe({
            next: (documents) => {
              expect(documents.length).toBe(1);
              expect(documents[0].name).toBe('test.pdf');
              done();
            },
            error: done.fail
          });
        },
        error: done.fail
      });
    });
  });

  describe('Signal reactivity', () => {
    it('should update signals when documents change', (done) => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      // Initial state
      expect(service.documentsSignal().length).toBe(0);
      
      service.uploadDocument(mockFile).subscribe({
        next: (document) => {
          // After upload
          expect(service.documentsSignal().length).toBe(1);
          expect(service.documentsSignal()[0]).toEqual(document);
          done();
        },
        error: done.fail
      });
    });
  });
});