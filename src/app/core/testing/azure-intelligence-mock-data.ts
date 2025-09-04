import { ExtractionResult, DocumentType } from '../models/document.model';

/**
 * Mock data for Azure Document Intelligence service testing
 * Contains all mock responses and data generation functions
 */

/**
 * Determine document type from file name for mock data
 */
export function determineDocumentTypeFromFileName(fileName: string): DocumentType {
  const name = fileName.toLowerCase();
  
  if (name.includes('invoice') || name.includes('rechnung') || name.includes('bill')) {
    return DocumentType.INVOICE;
  } else if (name.includes('contract') || name.includes('vertrag') || name.includes('agreement')) {
    return DocumentType.CONTRACT;
  } else {
    return DocumentType.LAYOUT;
  }
}

/**
 * Generate mock content based on document type
 */
export function generateMockContent(documentType: DocumentType): string {
  switch (documentType) {
    case DocumentType.INVOICE:
      return `INVOICE

Invoice Number: INV-2024-001
Date: ${new Date().toLocaleDateString()}

Bill To:
John Doe
123 Main Street
Anytown, ST 12345

Description                 Qty    Price    Total
Web Development Services     1    $2,500   $2,500
Hosting Setup               1      $150     $150

Subtotal:                                  $2,650
Tax (8%):                                   $212
Total:                                    $2,862`;

    case DocumentType.CONTRACT:
      return `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into on ${new Date().toLocaleDateString()}

PARTIES:
Client: ABC Corporation
Service Provider: XYZ Services LLC

SCOPE OF WORK:
The Service Provider agrees to provide web development services including:
- Frontend development
- Backend API development
- Database design and implementation

TERMS:
Duration: 6 months
Payment: $5,000 per month
Start Date: ${new Date().toLocaleDateString()}

SIGNATURES:
Client: _________________
Service Provider: _________________`;

    default:
      return `DOCUMENT CONTENT

This is a sample document with various text elements.

Header Section
This document contains multiple paragraphs and sections.

Main Content
Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Footer Section
Document processed on ${new Date().toLocaleDateString()}`;
  }
}

/**
 * Generate mock pages
 */
export function generateMockPages(): any[] {
  return [
    {
      pageNumber: 1,
      text: 'Page 1 content with various text elements',
      tables: [],
      keyValuePairs: []
    }
  ];
}

/**
 * Generate mock tables based on document type
 */
export function generateMockTables(documentType: DocumentType): any[] {
  if (documentType === DocumentType.INVOICE) {
    return [
      {
        rowCount: 3,
        columnCount: 4,
        cells: [
          { rowIndex: 0, columnIndex: 0, text: 'Description', confidence: 0.99 },
          { rowIndex: 0, columnIndex: 1, text: 'Qty', confidence: 0.99 },
          { rowIndex: 0, columnIndex: 2, text: 'Price', confidence: 0.99 },
          { rowIndex: 0, columnIndex: 3, text: 'Total', confidence: 0.99 },
          { rowIndex: 1, columnIndex: 0, text: 'Web Development', confidence: 0.95 },
          { rowIndex: 1, columnIndex: 1, text: '1', confidence: 0.98 },
          { rowIndex: 1, columnIndex: 2, text: '$2,500', confidence: 0.97 },
          { rowIndex: 1, columnIndex: 3, text: '$2,500', confidence: 0.97 },
          { rowIndex: 2, columnIndex: 0, text: 'Hosting Setup', confidence: 0.94 },
          { rowIndex: 2, columnIndex: 1, text: '1', confidence: 0.98 },
          { rowIndex: 2, columnIndex: 2, text: '$150', confidence: 0.96 },
          { rowIndex: 2, columnIndex: 3, text: '$150', confidence: 0.96 }
        ]
      }
    ];
  }
  return [];
}

/**
 * Generate mock key-value pairs based on document type
 */
export function generateMockKeyValuePairs(documentType: DocumentType): any[] {
  switch (documentType) {
    case DocumentType.INVOICE:
      return [
        { key: 'Invoice Number', value: 'INV-2024-001', confidence: 0.98 },
        { key: 'Date', value: new Date().toLocaleDateString(), confidence: 0.97 },
        { key: 'Total', value: '$2,862', confidence: 0.99 },
        { key: 'Tax', value: '$212', confidence: 0.96 }
      ];

    case DocumentType.CONTRACT:
      return [
        { key: 'Agreement Type', value: 'Service Agreement', confidence: 0.98 },
        { key: 'Duration', value: '6 months', confidence: 0.95 },
        { key: 'Monthly Payment', value: '$5,000', confidence: 0.97 },
        { key: 'Start Date', value: new Date().toLocaleDateString(), confidence: 0.96 }
      ];

    default:
      return [
        { key: 'Document Type', value: 'General Document', confidence: 0.90 },
        { key: 'Processed Date', value: new Date().toLocaleDateString(), confidence: 0.99 }
      ];
  }
}

/**
 * Generate complete mock extraction result
 */
export async function generateMockExtractionResult(file: File, modelId?: string): Promise<ExtractionResult> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  const documentType = determineDocumentTypeFromFileName(file.name);
  
  return {
    status: 'succeeded',
    createdDateTime: new Date().toISOString(),
    lastUpdatedDateTime: new Date().toISOString(),
    analyzeResult: {
      apiVersion: '2024-02-29-preview',
      modelId: modelId || 'prebuilt-layout',
      stringIndexType: 'textElements',
      content: generateMockContent(documentType),
      pages: generateMockPages(),
      tables: generateMockTables(documentType),
      keyValuePairs: generateMockKeyValuePairs(documentType)
    }
  };
}

/**
 * Mock invoice data for testing
 */
export const MOCK_INVOICE_DATA = {
  vendorName: 'Sample Vendor',
  customerName: 'Sample Customer',
  invoiceId: 'INV-001',
  invoiceDate: '2024-01-15',
  totalAmount: 1234.56,
  currency: 'USD'
};

/**
 * Mock contract data for testing
 */
export const MOCK_CONTRACT_DATA = {
  parties: ['Party A', 'Party B'],
  effectiveDate: '2024-01-01',
  expirationDate: '2024-12-31',
  contractType: 'Service Agreement',
  keyTerms: ['Payment terms', 'Termination Clause', 'Confidentiality']
};

/**
 * Mock layout data for testing
 */
export const MOCK_LAYOUT_DATA = {
  pageCount: 1,
  hasImages: false,
  hasTables: true,
  textDensity: 0.75
};