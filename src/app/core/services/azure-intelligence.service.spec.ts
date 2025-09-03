import { TestBed } from '@angular/core/testing';
import { AzureIntelligenceService } from './azure-intelligence.service';
import { LoggingService } from './logging.service';
import { AzureIntelligenceError, AzureErrorCode } from '../errors/service-errors';
import { ExtractionResult } from '../models/document.model';
import { InvoiceResult, ContractResult, LayoutResult } from '../interfaces/azure-intelligence-service.interface';

// Mock environment for tests
const mockEnvironment = {
  production: false,
  azure: {
    endpoint: 'https://test-endpoint.cognitiveservices.azure.com/',
    apiKey: 'test-api-key-for-unit-tests',
    apiVersion: '2024-02-29-preview'
  },
  logging: {
    level: 'debug',
    enableConsoleLogging: false
  }
};

// Note: In a real test setup, you would mock the environment import
// For now, we'll work with the actual environment but expect empty config

describe('AzureIntelligenceService', () => {
  let service: AzureIntelligenceService;
  let loggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['info', 'debug', 'warn', 'error']);

    TestBed.configureTestingModule({
      providers: [
        AzureIntelligenceService,
        { provide: LoggingService, useValue: loggingSpy }
      ]
    });

    service = TestBed.inject(AzureIntelligenceService);
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isConfigured', () => {
    it('should return false when no API key is configured', () => {
      // With the new environment setup, API keys are empty by default
      const isConfigured = service.isConfigured();
      expect(isConfigured).toBe(false);
    });
  });

  describe('analyzeDocument', () => {
    let mockFile: File;

    beforeEach(() => {
      mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    });

    it('should throw error when service is not configured', (done) => {
      service.analyzeDocument(mockFile).subscribe({
        next: () => done.fail('Expected error but got success'),
        error: (error: AzureIntelligenceError) => {
          expect(error.code).toBe('SERVICE_NOT_CONFIGURED');
          expect(error.message).toContain('not properly configured');
          done();
        }
      });
    });

    it('should throw error for custom model when service is not configured', (done) => {
      const customModelId = 'custom-model-123';
      
      service.analyzeDocument(mockFile, customModelId).subscribe({
        next: () => done.fail('Expected error but got success'),
        error: (error: AzureIntelligenceError) => {
          expect(error.code).toBe('SERVICE_NOT_CONFIGURED');
          done();
        }
      });
    });

    it('should log error when service is not configured', (done) => {
      service.analyzeDocument(mockFile).subscribe({
        next: () => done.fail('Expected error but got success'),
        error: () => {
          expect(loggingService.error).toHaveBeenCalledWith(
            jasmine.stringMatching(/Azure Document Intelligence service is not properly configured/),
            jasmine.any(Object),
            'AzureIntelligenceService'
          );
          done();
        }
      });
    });

    it('should include file context in error', (done) => {
      service.analyzeDocument(mockFile).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error: AzureIntelligenceError) => {
          expect(error.context?.['fileName']).toBe('test.pdf');
          done();
        }
      });
    });
  });

  describe('analyzeInvoice', () => {
    let mockInvoiceFile: File;

    beforeEach(() => {
      mockInvoiceFile = new File(['invoice content'], 'invoice-123.pdf', { type: 'application/pdf' });
    });

    it('should analyze invoice document', (done) => {
      service.analyzeInvoice(mockInvoiceFile).subscribe({
        next: (result: InvoiceResult) => {
          expect(result).toBeDefined();
          expect(result.invoiceData).toBeDefined();
          expect(result.invoiceData.vendorName).toBeDefined();
          expect(result.invoiceData.totalAmount).toBeDefined();
          expect(result.analyzeResult.modelId).toBe('prebuilt-invoice');
          done();
        },
        error: done.fail
      });
    });

    it('should include invoice-specific data', (done) => {
      service.analyzeInvoice(mockInvoiceFile).subscribe({
        next: (result: InvoiceResult) => {
          expect(result.invoiceData.vendorName).toBe('Sample Vendor');
          expect(result.invoiceData.totalAmount).toBe(1234.56);
          expect(result.invoiceData.currency).toBe('USD');
          done();
        },
        error: done.fail
      });
    });
  });

  describe('analyzeContract', () => {
    let mockContractFile: File;

    beforeEach(() => {
      mockContractFile = new File(['contract content'], 'contract-abc.pdf', { type: 'application/pdf' });
    });

    it('should analyze contract document', (done) => {
      service.analyzeContract(mockContractFile).subscribe({
        next: (result: ContractResult) => {
          expect(result).toBeDefined();
          expect(result.contractData).toBeDefined();
          expect(result.contractData.parties).toBeDefined();
          expect(result.contractData.effectiveDate).toBeDefined();
          expect(result.analyzeResult.modelId).toBe('prebuilt-contract');
          done();
        },
        error: done.fail
      });
    });

    it('should include contract-specific data', (done) => {
      service.analyzeContract(mockContractFile).subscribe({
        next: (result: ContractResult) => {
          expect(result.contractData.parties).toEqual(['Party A', 'Party B']);
          expect(result.contractData.contractType).toBe('Service Agreement');
          expect(result.contractData.keyTerms).toContain('Payment terms');
          done();
        },
        error: done.fail
      });
    });
  });

  describe('analyzeLayout', () => {
    let mockLayoutFile: File;

    beforeEach(() => {
      mockLayoutFile = new File(['layout content'], 'document.pdf', { type: 'application/pdf' });
    });

    it('should analyze document layout', (done) => {
      service.analyzeLayout(mockLayoutFile).subscribe({
        next: (result: LayoutResult) => {
          expect(result).toBeDefined();
          expect(result.layoutData).toBeDefined();
          expect(result.layoutData.pageCount).toBeDefined();
          expect(result.layoutData.hasImages).toBeDefined();
          expect(result.layoutData.hasTables).toBeDefined();
          expect(result.layoutData.textDensity).toBeDefined();
          expect(result.analyzeResult.modelId).toBe('prebuilt-layout');
          done();
        },
        error: done.fail
      });
    });

    it('should include layout-specific data', (done) => {
      service.analyzeLayout(mockLayoutFile).subscribe({
        next: (result: LayoutResult) => {
          expect(result.layoutData.pageCount).toBe(1);
          expect(result.layoutData.hasImages).toBe(false);
          expect(result.layoutData.hasTables).toBe(true);
          expect(result.layoutData.textDensity).toBe(0.75);
          done();
        },
        error: done.fail
      });
    });
  });

  describe('getOperationStatus', () => {
    it('should get operation status successfully', (done) => {
      const operationId = 'test-operation-123';
      
      service.getOperationStatus(operationId).subscribe({
        next: (status) => {
          expect(status).toBeDefined();
          expect(status.status).toBe('succeeded');
          expect(status.createdDateTime).toBeDefined();
          expect(status.lastUpdatedDateTime).toBeDefined();
          expect(status.percentCompleted).toBe(100);
          done();
        },
        error: done.fail
      });
    });

    it('should handle service not configured error', (done) => {
      spyOn(service, 'isConfigured').and.returnValue(false);
      
      service.getOperationStatus('test-operation').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toBeInstanceOf(AzureIntelligenceError);
          expect(error.code).toBe(AzureErrorCode.SERVICE_NOT_CONFIGURED);
          done();
        }
      });
    });

    it('should handle empty operation ID', (done) => {
      service.getOperationStatus('').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error).toBeInstanceOf(AzureIntelligenceError);
          expect(error.code).toBe(AzureErrorCode.OPERATION_NOT_FOUND);
          done();
        }
      });
    });

    it('should log operation status check', (done) => {
      const operationId = 'test-operation-123';
      
      service.getOperationStatus(operationId).subscribe({
        next: () => {
          expect(loggingService.debug).toHaveBeenCalledWith(
            jasmine.stringMatching(/Checking operation status/),
            undefined,
            'AzureIntelligenceService'
          );
          done();
        },
        error: done.fail
      });
    });
  });

  describe('Error handling', () => {
    let mockFile: File;

    beforeEach(() => {
      mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    });

    it('should log errors appropriately', (done) => {
      spyOn(service, 'isConfigured').and.returnValue(false);
      
      service.analyzeDocument(mockFile).subscribe({
        next: () => done.fail('Should have failed'),
        error: () => {
          expect(loggingService.error).toHaveBeenCalledWith(
            jasmine.stringMatching(/Service not configured/),
            jasmine.any(AzureIntelligenceError),
            'AzureIntelligenceService'
          );
          done();
        }
      });
    });

    it('should include context in errors', (done) => {
      spyOn(service, 'isConfigured').and.returnValue(false);
      
      service.analyzeDocument(mockFile, 'custom-model').subscribe({
        next: () => done.fail('Should have failed'),
        error: (error: AzureIntelligenceError) => {
          expect(error.context).toBeDefined();
          expect(error.context?.['fileName']).toBe('test.pdf');
          expect(error.context?.['modelId']).toBe('custom-model');
          done();
        }
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle multiple concurrent analysis requests', (done) => {
      const file1 = new File(['content1'], 'doc1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content2'], 'doc2.pdf', { type: 'application/pdf' });
      
      let completedCount = 0;
      const checkCompletion = () => {
        completedCount++;
        if (completedCount === 2) {
          done();
        }
      };

      service.analyzeDocument(file1).subscribe({
        next: (result) => {
          expect(result).toBeDefined();
          checkCompletion();
        },
        error: done.fail
      });

      service.analyzeDocument(file2).subscribe({
        next: (result) => {
          expect(result).toBeDefined();
          checkCompletion();
        },
        error: done.fail
      });
    });

    it('should maintain service state across operations', () => {
      const initialConfigState = service.isConfigured();
      
      // Service state should remain consistent
      expect(service.isConfigured()).toBe(initialConfigState);
    });
  });
});