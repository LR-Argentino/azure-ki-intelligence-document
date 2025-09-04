import { 
  generateMockExtractionResult, 
  generateMockContent,
  generateMockPages,
  generateMockTables,
  generateMockKeyValuePairs,
  determineDocumentTypeFromFileName,
  MOCK_INVOICE_DATA, 
  MOCK_CONTRACT_DATA, 
  MOCK_LAYOUT_DATA 
} from './azure-intelligence-mock-data';
import { DocumentType } from '../models/document.model';

describe('Azure Intelligence Mock Data', () => {
  describe('determineDocumentTypeFromFileName', () => {
    it('should identify invoice documents', () => {
      expect(determineDocumentTypeFromFileName('invoice-123.pdf')).toBe(DocumentType.INVOICE);
      expect(determineDocumentTypeFromFileName('rechnung-456.pdf')).toBe(DocumentType.INVOICE);
      expect(determineDocumentTypeFromFileName('bill-789.pdf')).toBe(DocumentType.INVOICE);
    });

    it('should identify contract documents', () => {
      expect(determineDocumentTypeFromFileName('contract-abc.pdf')).toBe(DocumentType.CONTRACT);
      expect(determineDocumentTypeFromFileName('vertrag-def.pdf')).toBe(DocumentType.CONTRACT);
      expect(determineDocumentTypeFromFileName('agreement-ghi.pdf')).toBe(DocumentType.CONTRACT);
    });

    it('should default to layout for unknown documents', () => {
      expect(determineDocumentTypeFromFileName('document.pdf')).toBe(DocumentType.LAYOUT);
      expect(determineDocumentTypeFromFileName('unknown-file.pdf')).toBe(DocumentType.LAYOUT);
    });
  });

  describe('generateMockContent', () => {
    it('should generate invoice content', () => {
      const content = generateMockContent(DocumentType.INVOICE);
      expect(content).toContain('INVOICE');
      expect(content).toContain('Invoice Number: INV-2024-001');
      expect(content).toContain('Web Development Services');
    });

    it('should generate contract content', () => {
      const content = generateMockContent(DocumentType.CONTRACT);
      expect(content).toContain('SERVICE AGREEMENT');
      expect(content).toContain('ABC Corporation');
      expect(content).toContain('XYZ Services LLC');
    });

    it('should generate layout content', () => {
      const content = generateMockContent(DocumentType.LAYOUT);
      expect(content).toContain('DOCUMENT CONTENT');
      expect(content).toContain('Lorem ipsum');
    });
  });

  describe('generateMockPages', () => {
    it('should generate page data', () => {
      const pages = generateMockPages();
      expect(pages.length).toBe(1);
      expect(pages[0].pageNumber).toBe(1);
      expect(pages[0].text).toContain('Page 1 content');
    });
  });

  describe('generateMockTables', () => {
    it('should generate tables for invoice documents', () => {
      const tables = generateMockTables(DocumentType.INVOICE);
      expect(tables.length).toBe(1);
      expect(tables[0].rowCount).toBe(3);
      expect(tables[0].columnCount).toBe(4);
      expect(tables[0].cells.length).toBe(12);
    });

    it('should generate empty tables for non-invoice documents', () => {
      expect(generateMockTables(DocumentType.CONTRACT)).toEqual([]);
      expect(generateMockTables(DocumentType.LAYOUT)).toEqual([]);
    });
  });

  describe('generateMockKeyValuePairs', () => {
    it('should generate invoice key-value pairs', () => {
      const pairs = generateMockKeyValuePairs(DocumentType.INVOICE);
      expect(pairs.length).toBe(4);
      expect(pairs.find(p => p.key === 'Invoice Number')).toBeDefined();
      expect(pairs.find(p => p.key === 'Total')).toBeDefined();
    });

    it('should generate contract key-value pairs', () => {
      const pairs = generateMockKeyValuePairs(DocumentType.CONTRACT);
      expect(pairs.length).toBe(4);
      expect(pairs.find(p => p.key === 'Agreement Type')).toBeDefined();
      expect(pairs.find(p => p.key === 'Duration')).toBeDefined();
    });

    it('should generate layout key-value pairs', () => {
      const pairs = generateMockKeyValuePairs(DocumentType.LAYOUT);
      expect(pairs.length).toBe(2);
      expect(pairs.find(p => p.key === 'Document Type')).toBeDefined();
    });
  });

  describe('generateMockExtractionResult', () => {
    it('should generate complete extraction result for invoice', async () => {
      const file = new File(['content'], 'invoice-123.pdf', { type: 'application/pdf' });
      const result = await generateMockExtractionResult(file, 'prebuilt-invoice');
      
      expect(result.status).toBe('succeeded');
      expect(result.analyzeResult.modelId).toBe('prebuilt-invoice');
      expect(result.analyzeResult.content).toContain('INVOICE');
      expect(result.analyzeResult.pages?.length).toBe(1);
      expect(result.analyzeResult.tables?.length).toBe(1);
      expect(result.analyzeResult.keyValuePairs?.length).toBe(4);
    });

    it('should generate complete extraction result for contract', async () => {
      const file = new File(['content'], 'contract-abc.pdf', { type: 'application/pdf' });
      const result = await generateMockExtractionResult(file, 'prebuilt-contract');
      
      expect(result.status).toBe('succeeded');
      expect(result.analyzeResult.modelId).toBe('prebuilt-contract');
      expect(result.analyzeResult.content).toContain('SERVICE AGREEMENT');
      expect(result.analyzeResult.keyValuePairs?.length).toBe(4);
    });

    it('should use default model when not specified', async () => {
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const result = await generateMockExtractionResult(file);
      
      expect(result.analyzeResult.modelId).toBe('prebuilt-layout');
    });
  });

  describe('Mock Data Constants', () => {
    it('should provide invoice mock data', () => {
      expect(MOCK_INVOICE_DATA.vendorName).toBe('Sample Vendor');
      expect(MOCK_INVOICE_DATA.totalAmount).toBe(1234.56);
      expect(MOCK_INVOICE_DATA.currency).toBe('USD');
    });

    it('should provide contract mock data', () => {
      expect(MOCK_CONTRACT_DATA.parties).toEqual(['Party A', 'Party B']);
      expect(MOCK_CONTRACT_DATA.contractType).toBe('Service Agreement');
      expect(MOCK_CONTRACT_DATA.keyTerms).toContain('Payment terms');
    });

    it('should provide layout mock data', () => {
      expect(MOCK_LAYOUT_DATA.pageCount).toBe(1);
      expect(MOCK_LAYOUT_DATA.hasImages).toBe(false);
      expect(MOCK_LAYOUT_DATA.hasTables).toBe(true);
      expect(MOCK_LAYOUT_DATA.textDensity).toBe(0.75);
    });
  });
});