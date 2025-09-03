# Intelligence Document Processing (IDP) Frontend Architecture

## Overview

This Angular application provides a comprehensive frontend for Intelligence Document Processing using Azure Document Intelligence and Retrieval-Augmented Generation (RAG) capabilities. The application enables users to upload PDF documents, extract structured data with visual bounding boxes, and interact with documents through an intelligent chat interface.

## Key Features

- **Document Upload & Processing** - Handle PDF uploads and Azure Document Intelligence integration
- **Document Visualization** - Display PDFs with bounding box overlays for extracted data
- **RAG Chat Interface** - Chat with documents using Azure's Retrieval-Augmented Generation
- **Data Extraction Display** - Present extracted document data in a structured format

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Angular Frontend Application                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Upload        │  │   Document      │  │   Chat          │  │
│  │   Component     │  │   Viewer        │  │   Interface     │  │
│  │                 │  │   Component     │  │   Component     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Document      │  │   Azure         │  │   Chat          │  │
│  │   Service       │  │   Intelligence  │  │   Service       │  │
│  │                 │  │   Service       │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   PDF           │  │   Bounding Box  │  │   State         │  │
│  │   Renderer      │  │   Overlay       │  │   Management    │  │
│  │   Service       │  │   Service       │  │   (Signals)     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Azure Services                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐              ┌─────────────────────────────┐│
│  │   Azure         │              │   Azure RAG                 ││
│  │   Document      │              │   (Cognitive Search +       ││
│  │   Intelligence  │              │    OpenAI/Azure OpenAI)     ││
│  └─────────────────┘              └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Project Structure

```typescript
src/
├── app/
│   ├── core/                    # Singleton services, guards, interceptors
│   │   ├── services/
│   │   │   ├── azure-intelligence.service.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── document.service.ts
│   │   │   └── pdf-renderer.service.ts
│   │   ├── models/
│   │   │   ├── document.model.ts
│   │   │   ├── extraction-result.model.ts
│   │   │   ├── chat.model.ts
│   │   │   └── bounding-box.model.ts
│   │   ├── guards/
│   │   │   └── document-loaded.guard.ts
│   │   └── interceptors/
│   │       └── azure-auth.interceptor.ts
│   ├── features/                # Feature modules
│   │   ├── document-upload/
│   │   │   ├── components/
│   │   │   │   ├── file-upload/
│   │   │   │   ├── upload-progress/
│   │   │   │   └── document-list/
│   │   │   └── document-upload.module.ts
│   │   ├── document-viewer/
│   │   │   ├── components/
│   │   │   │   ├── pdf-viewer/
│   │   │   │   ├── bounding-box-overlay/
│   │   │   │   ├── extraction-results/
│   │   │   │   └── document-toolbar/
│   │   │   ├── services/
│   │   │   │   └── bounding-box.service.ts
│   │   │   └── document-viewer.module.ts
│   │   └── chat/
│   │       ├── components/
│   │       │   ├── chat-interface/
│   │       │   ├── chat-message/
│   │       │   ├── chat-input/
│   │       │   └── quick-actions/
│   │       ├── services/
│   │       │   └── rag-chat.service.ts
│   │       └── chat.module.ts
│   ├── shared/                  # Shared components, pipes, directives
│   │   ├── components/
│   │   │   ├── loading-spinner/
│   │   │   ├── error-message/
│   │   │   └── confirmation-dialog/
│   │   ├── pipes/
│   │   │   ├── file-size.pipe.ts
│   │   │   └── confidence-color.pipe.ts
│   │   ├── directives/
│   │   │   └── highlight.directive.ts
│   │   └── utils/
│   │       ├── file-validator.util.ts
│   │       └── coordinate-converter.util.ts
│   ├── layout/                  # Layout components
│   │   ├── header/
│   │   ├── sidebar/
│   │   └── main-layout/
│   └── store/                   # State management
│       ├── document.store.ts
│       ├── chat.store.ts
│       └── ui.store.ts
```

## Core Services Architecture

### Azure Intelligence Service

```typescript
@Injectable({ providedIn: 'root' })
export class AzureIntelligenceService {
  private client = DocumentIntelligenceRestClient(
    endpoint,
    new AzureKeyCredential(apiKey)
  );

  /**
   * Analyze document using Azure Document Intelligence
   */
  analyzeDocument(file: File, modelId?: string): Observable<ExtractionResult> {
    // Implementation using @azure-rest/ai-document-intelligence
  }

  /**
   * Process different document types with specialized models
   */
  analyzeInvoice(file: File): Observable<InvoiceResult> {
    return this.analyzeDocument(file, 'prebuilt-invoice');
  }

  analyzeContract(file: File): Observable<ContractResult> {
    return this.analyzeDocument(file, 'prebuilt-contract');
  }

  analyzeLayout(file: File): Observable<LayoutResult> {
    return this.analyzeDocument(file, 'prebuilt-layout');
  }

  /**
   * Get operation status for long-running operations
   */
  getOperationStatus(operationId: string): Observable<OperationStatus> {
    // Poll operation status
  }
}
```

### Document Service

```typescript
@Injectable({ providedIn: 'root' })
export class DocumentService {
  private documents = signal<Document[]>([]);
  private currentDocument = signal<Document | null>(null);

  /**
   * Upload and process document
   */
  uploadDocument(file: File): Observable<Document> {
    // Validate file, upload, and trigger processing
  }

  /**
   * Get document by ID
   */
  getDocumentById(id: string): Observable<Document> {
    // Retrieve document from store or API
  }

  /**
   * Delete document
   */
  deleteDocument(id: string): Observable<void> {
    // Remove document and cleanup resources
  }

  /**
   * Render PDF using PDF.js
   */
  renderPDF(file: File): Observable<PDFDocument> {
    // Load and render PDF with PDF.js
  }

  // Computed signals
  readonly documentsSignal = this.documents.asReadonly();
  readonly currentDocumentSignal = this.currentDocument.asReadonly();
}
```

### Chat Service

```typescript
@Injectable({ providedIn: 'root' })
export class ChatService {
  private chatHistory = signal<ChatMessage[]>([]);

  /**
   * Send message with document context for RAG
   */
  sendMessage(
    message: string, 
    documentContext: ExtractionResult
  ): Observable<ChatResponse> {
    // Implement RAG chat with Azure OpenAI/Cognitive Search
  }

  /**
   * Get chat history for document
   */
  getChatHistory(documentId: string): Observable<ChatMessage[]> {
    // Retrieve chat history
  }

  /**
   * Specialized contract analysis
   */
  analyzeContract(
    query: string, 
    contractData: ExtractionResult
  ): Observable<ContractAnalysis> {
    // Specialized contract clause analysis
  }

  /**
   * Extract key information based on document type
   */
  extractKeyInfo(
    documentType: DocumentType,
    extractionResult: ExtractionResult
  ): Observable<KeyInfo[]> {
    // Extract and format key information
  }

  readonly chatHistorySignal = this.chatHistory.asReadonly();
}
```

### PDF Renderer Service

```typescript
@Injectable({ providedIn: 'root' })
export class PdfRendererService {
  /**
   * Load PDF document
   */
  loadPDF(file: File): Observable<PDFDocumentProxy> {
    // Load PDF using PDF.js
  }

  /**
   * Render specific page
   */
  renderPage(
    pdf: PDFDocumentProxy, 
    pageNumber: number, 
    canvas: HTMLCanvasElement,
    scale: number = 1
  ): Observable<void> {
    // Render page to canvas
  }

  /**
   * Get page dimensions
   */
  getPageDimensions(
    pdf: PDFDocumentProxy, 
    pageNumber: number
  ): Observable<PageDimensions> {
    // Get page width/height for bounding box calculations
  }
}
```

### Bounding Box Service

```typescript
@Injectable({ providedIn: 'root' })
export class BoundingBoxService {
  /**
   * Convert Azure coordinates to canvas coordinates
   */
  convertCoordinates(
    azurePolygon: number[],
    pageWidth: number,
    pageHeight: number,
    canvasWidth: number,
    canvasHeight: number
  ): CanvasCoordinates {
    // Convert Azure's normalized coordinates to canvas pixels
  }

  /**
   * Create bounding box elements from extraction results
   */
  createBoundingBoxes(
    extractionResult: ExtractionResult,
    pageNumber: number
  ): BoundingBox[] {
    // Process extraction results and create bounding box data
  }

  /**
   * Handle bounding box interactions
   */
  onBoundingBoxClick(boundingBox: BoundingBox): void {
    // Handle click events on bounding boxes
  }
}
```

## Data Models

### Core Models

```typescript
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
```

### Azure Document Intelligence Models

```typescript
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

export interface BoundingBox {
  id: string;
  polygon: number[];
  content: string;
  confidence: number;
  fieldType: string;
  pageNumber: number;
  canvasCoordinates?: CanvasCoordinates;
  isHighlighted?: boolean;
}

export interface CanvasCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### Chat Models

```typescript
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  documentId: string;
  confidence?: number;
  sources?: DocumentReference[];
}

export interface ChatResponse {
  message: string;
  confidence: number;
  sources?: DocumentReference[];
  suggestedQuestions?: string[];
}

export interface DocumentReference {
  pageNumber: number;
  content: string;
  boundingBox?: BoundingBox;
}

export interface ContractAnalysis {
  clauses: ContractClause[];
  risks: RiskAssessment[];
  recommendations: string[];
}

export interface ContractClause {
  type: string;
  content: string;
  riskLevel: 'low' | 'medium' | 'high';
  location: BoundingBox;
}
```

## Component Architecture

### Main Layout Component

```typescript
@Component({
  selector: 'app-main-layout',
  template: `
    <div class="layout-container">
      <app-header 
        [currentDocument]="currentDocument()"
        (documentSelect)="onDocumentSelect($event)">
      </app-header>
      
      <div class="main-content">
        <app-sidebar 
          [documents]="documents()"
          [selectedDocument]="currentDocument()"
          (documentSelect)="onDocumentSelect($event)"
          (documentDelete)="onDocumentDelete($event)">
        </app-sidebar>
        
        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {
  private documentStore = inject(DocumentStore);
  
  documents = this.documentStore.documents;
  currentDocument = this.documentStore.currentDocument;

  onDocumentSelect(document: Document): void {
    this.documentStore.setCurrentDocument(document);
  }

  onDocumentDelete(documentId: string): void {
    this.documentStore.deleteDocument(documentId);
  }
}
```

### Document Viewer Component

```typescript
@Component({
  selector: 'app-document-viewer',
  template: `
    <div class="document-viewer">
      <app-document-toolbar
        [scale]="currentScale()"
        [pageNumber]="currentPage()"
        [totalPages]="totalPages()"
        (scaleChange)="onScaleChange($event)"
        (pageChange)="onPageChange($event)"
        (toggleExtractionPanel)="toggleExtractionPanel()">
      </app-document-toolbar>

      <div class="viewer-content" [class.panel-open]="showExtractionPanel()">
        <div class="pdf-container" #pdfContainer>
          <canvas #pdfCanvas></canvas>
          
          <app-bounding-box-overlay 
            [boundingBoxes]="boundingBoxes()"
            [scale]="currentScale()"
            [canvasWidth]="canvasWidth()"
            [canvasHeight]="canvasHeight()"
            (boxClick)="onBoundingBoxClick($event)"
            (boxHover)="onBoundingBoxHover($event)">
          </app-bounding-box-overlay>
        </div>

        @if (showExtractionPanel()) {
          <div class="extraction-panel">
            <app-extraction-results 
              [results]="extractionResults()"
              [selectedField]="selectedField()"
              (fieldSelect)="onFieldSelect($event)">
            </app-extraction-results>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentViewerComponent implements OnInit, OnDestroy {
  private documentStore = inject(DocumentStore);
  private pdfRenderer = inject(PdfRendererService);
  private boundingBoxService = inject(BoundingBoxService);

  // Signals
  currentScale = signal(1);
  currentPage = signal(1);
  totalPages = signal(0);
  showExtractionPanel = signal(true);
  canvasWidth = signal(0);
  canvasHeight = signal(0);
  selectedField = signal<string | null>(null);

  // Computed signals
  document = this.documentStore.currentDocument;
  extractionResults = this.documentStore.extractionResults;
  boundingBoxes = computed(() => {
    const results = this.extractionResults();
    const page = this.currentPage();
    return results ? this.boundingBoxService.createBoundingBoxes(results, page) : [];
  });

  @ViewChild('pdfCanvas', { static: true }) 
  pdfCanvas!: ElementRef<HTMLCanvasElement>;

  ngOnInit(): void {
    // Initialize PDF viewer and load document
    this.loadDocument();
  }

  private async loadDocument(): Promise<void> {
    const document = this.document();
    if (document?.pdfData) {
      // Load and render PDF
      const pdf = await this.pdfRenderer.loadPDF(new File([document.pdfData], document.name));
      this.totalPages.set(pdf.numPages);
      await this.renderCurrentPage(pdf);
    }
  }

  onBoundingBoxClick(boundingBox: BoundingBox): void {
    this.selectedField.set(boundingBox.id);
    // Highlight corresponding field in extraction panel
  }

  onScaleChange(scale: number): void {
    this.currentScale.set(scale);
    // Re-render page with new scale
  }
}
```

### Chat Interface Component

```typescript
@Component({
  selector: 'app-chat-interface',
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <h3>Chat with Document</h3>
        <span class="document-name">{{ currentDocument()?.name }}</span>
      </div>

      <div class="chat-messages" #messagesContainer>
        @for (message of messages(); track message.id) {
          <app-chat-message 
            [message]="message"
            (sourceClick)="onSourceClick($event)">
          </app-chat-message>
        }
        
        @if (isLoading()) {
          <app-loading-spinner></app-loading-spinner>
        }
      </div>

      <div class="quick-actions">
        <button 
          class="action-btn"
          (click)="analyzeContract()"
          [disabled]="isLoading()">
          Analyze Contract Clauses
        </button>
        <button 
          class="action-btn"
          (click)="extractKeyInfo()"
          [disabled]="isLoading()">
          Extract Key Information
        </button>
        <button 
          class="action-btn"
          (click)="summarizeDocument()"
          [disabled]="isLoading()">
          Summarize Document
        </button>
      </div>

      <div class="chat-input">
        <app-chat-input 
          [placeholder]="'Ask questions about the document...'"
          [disabled]="isLoading()"
          (messageSubmit)="onMessageSubmit($event)">
        </app-chat-input>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatInterfaceComponent {
  private chatStore = inject(ChatStore);
  private documentStore = inject(DocumentStore);
  private chatService = inject(ChatService);

  // Signals
  isLoading = signal(false);
  
  // Computed signals
  messages = this.chatStore.messages;
  currentDocument = this.documentStore.currentDocument;

  async onMessageSubmit(message: string): Promise<void> {
    const document = this.currentDocument();
    if (!document?.extractionResult) return;

    this.isLoading.set(true);
    
    try {
      // Add user message
      this.chatStore.addMessage({
        id: crypto.randomUUID(),
        content: message,
        role: 'user',
        timestamp: new Date(),
        documentId: document.id
      });

      // Get AI response
      const response = await firstValueFrom(
        this.chatService.sendMessage(message, document.extractionResult)
      );

      // Add assistant message
      this.chatStore.addMessage({
        id: crypto.randomUUID(),
        content: response.message,
        role: 'assistant',
        timestamp: new Date(),
        documentId: document.id,
        confidence: response.confidence,
        sources: response.sources
      });
    } catch (error) {
      console.error('Chat error:', error);
      // Handle error
    } finally {
      this.isLoading.set(false);
    }
  }

  async analyzeContract(): Promise<void> {
    const document = this.currentDocument();
    if (document?.type === DocumentType.CONTRACT) {
      await this.onMessageSubmit('Analyze this contract for potential risks and important clauses');
    }
  }

  onSourceClick(source: DocumentReference): void {
    // Navigate to document viewer and highlight source
    this.documentStore.highlightBoundingBox(source.boundingBox);
  }
}
```

## State Management with Signals

### Document Store

```typescript
@Injectable({ providedIn: 'root' })
export class DocumentStore {
  // Private signals
  private _documents = signal<Document[]>([]);
  private _currentDocument = signal<Document | null>(null);
  private _extractionResults = signal<ExtractionResult | null>(null);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly documents = this._documents.asReadonly();
  readonly currentDocument = this._currentDocument.asReadonly();
  readonly extractionResults = this._extractionResults.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly hasDocuments = computed(() => this.documents().length > 0);
  readonly currentDocumentName = computed(() => this.currentDocument()?.name ?? '');

  constructor(
    private documentService: DocumentService,
    private azureIntelligence: AzureIntelligenceService
  ) {}

  // Actions
  async uploadDocument(file: File): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Upload document
      const document = await firstValueFrom(this.documentService.uploadDocument(file));
      this._documents.update(docs => [...docs, document]);

      // Process with Azure Document Intelligence
      const extractionResult = await firstValueFrom(
        this.azureIntelligence.analyzeDocument(file)
      );

      // Update document with extraction results
      const updatedDocument = { ...document, extractionResult, status: ProcessingStatus.COMPLETED };
      this._documents.update(docs => 
        docs.map(d => d.id === document.id ? updatedDocument : d)
      );

      this.setCurrentDocument(updatedDocument);
    } catch (error) {
      this._error.set('Failed to upload and process document');
      console.error('Upload error:', error);
    } finally {
      this._isLoading.set(false);
    }
  }

  setCurrentDocument(document: Document): void {
    this._currentDocument.set(document);
    this._extractionResults.set(document.extractionResult || null);
  }

  deleteDocument(documentId: string): void {
    this._documents.update(docs => docs.filter(d => d.id !== documentId));
    
    // Clear current document if it was deleted
    if (this.currentDocument()?.id === documentId) {
      this._currentDocument.set(null);
      this._extractionResults.set(null);
    }
  }

  highlightBoundingBox(boundingBox?: BoundingBox): void {
    // Implementation for highlighting specific bounding box
  }
}
```

### Chat Store

```typescript
@Injectable({ providedIn: 'root' })
export class ChatStore {
  // Private signals
  private _messages = signal<ChatMessage[]>([]);
  private _isLoading = signal(false);

  // Public readonly signals
  readonly messages = this._messages.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  // Computed signals
  readonly hasMessages = computed(() => this.messages().length > 0);
  readonly lastMessage = computed(() => {
    const messages = this.messages();
    return messages[messages.length - 1] || null;
  });

  // Actions
  addMessage(message: ChatMessage): void {
    this._messages.update(messages => [...messages, message]);
  }

  clearMessages(): void {
    this._messages.set([]);
  }

  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  loadChatHistory(documentId: string): void {
    // Load chat history for specific document
  }
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Objectives**: Set up core infrastructure and basic functionality

**Tasks**:
- [ ] Set up Angular project structure with feature modules
- [ ] Implement core services (DocumentService, AzureIntelligenceService)
- [ ] Create basic document upload functionality
- [ ] Set up Azure Document Intelligence integration
- [ ] Implement basic PDF viewer with PDF.js
- [ ] Create document store with Signals

**Deliverables**:
- Working document upload
- Basic PDF display
- Azure Document Intelligence integration
- Core project structure

### Phase 2: Document Visualization (Week 3-4)
**Objectives**: Implement advanced document visualization with bounding boxes

**Tasks**:
- [ ] Implement bounding box overlay system
- [ ] Create coordinate conversion utilities
- [ ] Build extraction results display components
- [ ] Add interactive features for extracted data
- [ ] Implement document type-specific layouts
- [ ] Add zoom and navigation controls

**Deliverables**:
- Interactive PDF viewer with bounding boxes
- Extraction results panel
- Document navigation controls
- Field highlighting and selection

### Phase 3: RAG Chat Integration (Week 5-6)
**Objectives**: Implement intelligent chat functionality

**Tasks**:
- [ ] Set up Azure RAG service integration
- [ ] Implement chat interface components
- [ ] Create chat store and message management
- [ ] Add predefined query templates
- [ ] Implement context-aware chat functionality
- [ ] Add source referencing and highlighting

**Deliverables**:
- Working chat interface
- RAG integration with document context
- Source highlighting and navigation
- Predefined query actions

### Phase 4: Enhancement & Polish (Week 7-8)
**Objectives**: Add advanced features and optimize performance

**Tasks**:
- [ ] Add advanced filtering and search
- [ ] Implement document comparison features
- [ ] Add export functionality (PDF annotations, chat history)
- [ ] Performance optimization and lazy loading
- [ ] Error handling and user feedback
- [ ] Unit and integration testing
- [ ] Documentation and deployment preparation

**Deliverables**:
- Production-ready application
- Comprehensive testing suite
- Performance optimizations
- User documentation

## Technical Considerations

### Security
- **File Validation**: Implement comprehensive file type and size validation
- **Azure Authentication**: Use Azure AD for secure API access
- **Input Sanitization**: Sanitize all user inputs for chat functionality
- **CORS Configuration**: Proper CORS setup for Azure services
- **API Key Management**: Secure handling of Azure API keys

### Performance
- **Lazy Loading**: Implement lazy loading for PDF pages and large documents
- **Virtual Scrolling**: Use virtual scrolling for chat messages and document lists
- **Change Detection**: Use OnPush strategy and Signals for optimal performance
- **Canvas Optimization**: Optimize bounding box rendering with efficient Canvas API usage
- **Memory Management**: Proper cleanup of PDF.js resources and large files

### Scalability
- **Modular Architecture**: Feature-based modules for easy scaling
- **Service Architecture**: Separation of concerns for maintainability
- **State Management**: Efficient state management with Angular Signals
- **Component Reusability**: Shared components for consistent UI

### Browser Compatibility
- **PDF.js Support**: Works across all modern browsers
- **Canvas API**: Well-supported across browsers
- **Modern JavaScript**: Use Angular's built-in compatibility features
- **Progressive Enhancement**: Graceful degradation for older browsers

### Error Handling
- **Network Errors**: Robust handling of Azure service failures
- **File Processing Errors**: User-friendly error messages for processing failures
- **Chat Service Errors**: Fallback mechanisms for RAG service issues
- **Validation Errors**: Clear feedback for invalid inputs

## Dependencies

### Current Dependencies
```json
{
  "@azure-rest/ai-document-intelligence": "^1.1.0",
  "pdfjs-dist": "^5.4.149",
  "@angular/core": "^20.2.0",
  "@angular/common": "^20.2.0",
  "@angular/forms": "^20.2.0",
  "@angular/router": "^20.2.0"
}
```

### Additional Dependencies Needed
```json
{
  "@azure/identity": "^4.0.0",
  "@azure/openai": "^1.0.0",
  "@azure/search-documents": "^12.0.0",
  "uuid": "^9.0.0",
  "@types/uuid": "^9.0.0",
  "file-saver": "^2.0.5",
  "@types/file-saver": "^2.0.5"
}
```

## Configuration

### Environment Configuration
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  azure: {
    documentIntelligence: {
      endpoint: 'https://your-resource.cognitiveservices.azure.com/',
      apiKey: 'your-api-key'
    },
    openai: {
      endpoint: 'https://your-openai.openai.azure.com/',
      apiKey: 'your-openai-key',
      deploymentName: 'your-deployment'
    },
    search: {
      endpoint: 'https://your-search.search.windows.net',
      apiKey: 'your-search-key',
      indexName: 'documents-index'
    }
  }
};
```

### Angular Configuration
```json
// angular.json - Add to assets array
"assets": [
  "src/favicon.ico",
  "src/assets",
  "public",
  {
    "glob": "**/*",
    "input": "node_modules/pdfjs-dist/build/",
    "output": "/assets/pdfjs/"
  }
]
```

This architecture provides a solid foundation for building a comprehensive Intelligence Document Processing application with Angular, Azure Document Intelligence, and RAG capabilities. The modular design allows for incremental development and easy maintenance while providing excellent user experience and performance.