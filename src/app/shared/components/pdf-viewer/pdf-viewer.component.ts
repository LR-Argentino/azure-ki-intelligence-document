import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfRendererService, PdfPageInfo } from '../../../core/services/pdf-renderer.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { BoundingBoxOverlayComponent } from '../bounding-box-overlay/bounding-box-overlay.component';
import { BoundingBox, BoundingBoxType, BoundingBoxInteraction, OverlaySettings } from '../../../core/models/bounding-box.model';
import { BoundingBoxService } from '../../../core/services/bounding-box.service';
import { ExtractionResult } from '../../../core/models/document.model';

export interface PdfViewerState {
  currentPage: number;
  totalPages: number;
  scale: number;
  isLoading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, BoundingBoxOverlayComponent],
  template: `
    <div class="pdf-viewer-container">
      <!-- PDF Viewer Controls -->
      <div class="pdf-controls" *ngIf="!state.error && state.totalPages > 0">
        <div class="navigation-controls">
          <button
            class="control-btn"
            [disabled]="state.currentPage <= 1 || state.isLoading"
            (click)="previousPage()"
            title="Previous page">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <div class="page-info">
            <span class="page-current">{{ state.currentPage }}</span>
            <span class="page-separator">of</span>
            <span class="page-total">{{ state.totalPages }}</span>
          </div>

          <button
            class="control-btn"
            [disabled]="state.currentPage >= state.totalPages || state.isLoading"
            (click)="nextPage()"
            title="Next page">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <div class="zoom-controls">
          <button
            class="control-btn"
            [disabled]="state.scale <= 0.5 || state.isLoading"
            (click)="zoomOut()"
            title="Zoom out">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
            </svg>
          </button>

          <span class="zoom-level">{{ Math.round(state.scale * 100) }}%</span>

          <button
            class="control-btn"
            [disabled]="state.scale >= 3.0 || state.isLoading"
            (click)="zoomIn()"
            title="Zoom in">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>

          <button
            class="control-btn"
            [disabled]="state.isLoading"
            (click)="resetZoom()"
            title="Reset zoom">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          
          <button
            class="control-btn"
            [disabled]="state.isLoading"
            (click)="fitToWidth()"
            title="Fit to width">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
            </svg>
          </button>
          
          <div class="controls-separator"></div>
          
          <button
            *ngIf="extractionResult"
            class="control-btn"
            [class.active]="showBoundingBoxes"
            (click)="toggleBoundingBoxes()"
            title="Toggle bounding boxes">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- PDF Canvas Container -->
      <div class="pdf-canvas-container" [class.loading]="state.isLoading">
        <app-loading-spinner
          *ngIf="state.isLoading"
          [size]="32"
          message="Rendering PDF...">
        </app-loading-spinner>

        <div class="error-message" *ngIf="state.error">
          <div class="error-icon">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3>PDF Rendering Error</h3>
          <p>{{ state.error }}</p>
          <button class="retry-btn" (click)="retryRender()">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Retry
          </button>
        </div>

        <div class="pdf-canvas-wrapper" [style.position]="'relative'">
          <canvas
            #pdfCanvas
            class="pdf-canvas"
            [style.display]="state.error ? 'none' : 'block'">
          </canvas>
          
          <!-- Bounding Box Overlay -->
          <app-bounding-box-overlay
            *ngIf="extractionResult && showBoundingBoxes && !state.error && !state.isLoading"
            [boundingBoxes]="currentPageBoundingBoxes"
            [canvasWidth]="canvasWidth"
            [canvasHeight]="canvasHeight"
            [overlaySettings]="overlaySettings"
            [selectedBoxId]="selectedBoxId"
            [highlightedBoxId]="highlightedBoxId"
            (boxClick)="onBoundingBoxClick($event)"
            (boxHover)="onBoundingBoxHover($event)"
            (boxSelect)="onBoundingBoxSelect($event)"
            (boxDeselect)="onBoundingBoxDeselect()">
          </app-bounding-box-overlay>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pdf-viewer-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: #f8fafc;
      border-radius: 8px;
      overflow: hidden;
    }

    .pdf-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background-color: white;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .navigation-controls,
    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .control-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .control-btn:hover:not(:disabled) {
      background-color: #e2e8f0;
      border-color: #94a3b8;
      color: #334155;
    }

    .control-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .control-btn.active {
      background-color: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }
    
    .controls-separator {
      width: 1px;
      height: 20px;
      background-color: #cbd5e1;
      margin: 0 8px;
    }

    .page-info {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 12px;
      font-size: 14px;
      font-weight: 500;
      color: #475569;
    }

    .page-current {
      color: #1e293b;
      font-weight: 600;
    }

    .page-separator {
      color: #94a3b8;
    }

    .zoom-level {
      font-size: 14px;
      font-weight: 500;
      color: #475569;
      min-width: 50px;
      text-align: center;
    }

    .pdf-canvas-container {
      flex: 1;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 20px;
      overflow: auto;
      position: relative;
      min-height: 500px;
    }

    .pdf-canvas-container.loading {
      background-color: #f8fafc;
    }

    .pdf-canvas {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-radius: 4px;
      background-color: white;
      display: block;
      /* Allow canvas to grow beyond container when zoomed */
    }

    .error-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #64748b;
      max-width: 400px;
    }

    .error-icon {
      color: #ef4444;
      margin-bottom: 16px;
    }

    .error-message h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }

    .error-message p {
      margin: 0 0 20px 0;
      font-size: 14px;
      line-height: 1.5;
    }

    .retry-btn {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .retry-btn:hover {
      background-color: #2563eb;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .pdf-controls {
        flex-direction: column;
        gap: 12px;
        padding: 12px;
      }

      .navigation-controls,
      .zoom-controls {
        width: 100%;
        justify-content: center;
      }

      .pdf-canvas-container {
        padding: 12px;
      }
    }

    /* Scrollbar styling */
    .pdf-canvas-container::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    .pdf-canvas-container::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    .pdf-canvas-container::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    .pdf-canvas-container::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class PdfViewerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() pdfData: ArrayBuffer | null = null;
  @Input() extractionResult: ExtractionResult | null = null;
  @Input() showBoundingBoxes: boolean = true;
  @Input() selectedBoxId: string | null = null;
  @Input() highlightedBoxId: string | null = null;
  @Input() overlaySettings: OverlaySettings = {
    showWords: false,
    showLines: true,
    showTables: true,
    showKeyValuePairs: true,
    showDocumentFields: true,
    opacity: 0.3,
    highlightColor: '#3b82f6',
    selectedColor: '#ef4444'
  };
  
  @Output() stateChange = new EventEmitter<PdfViewerState>();
  @Output() pageRendered = new EventEmitter<PdfPageInfo>();
  @Output() boundingBoxClick = new EventEmitter<BoundingBoxInteraction>();
  @Output() boundingBoxHover = new EventEmitter<BoundingBoxInteraction>();
  @Output() boundingBoxSelect = new EventEmitter<BoundingBox>();

  @ViewChild('pdfCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  state: PdfViewerState = {
    currentPage: 1,
    totalPages: 0,
    scale: 1.5, // Start with a larger default scale
    isLoading: false,
    error: null
  };
  
  // Bounding box related properties
  currentPageBoundingBoxes: BoundingBox[] = [];
  canvasWidth: number = 0;
  canvasHeight: number = 0;

  constructor(
    private pdfRenderer: PdfRendererService,
    private cdr: ChangeDetectorRef,
    private boundingBoxService: BoundingBoxService
  ) {}

  ngOnInit(): void {
    if (this.pdfData) {
      this.loadPdf();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pdfData'] && changes['pdfData'].currentValue && !changes['pdfData'].isFirstChange()) {
      this.loadPdf();
    }
    
    // Handle changes to selection/highlight inputs
    if (changes['selectedBoxId'] || changes['highlightedBoxId']) {
      // Trigger change detection for the bounding box overlay component
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.cleanup().catch(error => {
      console.warn('Error during component cleanup:', error);
    });
  }

  async loadPdf(): Promise<void> {
    if (!this.pdfData) {
      this.setState({ error: 'No PDF data provided' });
      return;
    }

    // Ensure we clean up any existing document first
    await this.cleanup();
    
    this.setState({ isLoading: true, error: null });

    try {
      // Verify the ArrayBuffer is valid
      if (this.pdfData.byteLength === 0) {
        throw new Error('PDF data is empty');
      }
      
      const document = await this.pdfRenderer.loadDocument(this.pdfData);
      const docInfo = this.pdfRenderer.getDocumentInfo();

      if (docInfo) {
        this.setState({
          totalPages: docInfo.numPages,
          currentPage: 1,
          isLoading: false
        });
        
        // Calculate optimal scale for first render
        await this.calculateOptimalScale();
        
        await this.renderCurrentPage();
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      let errorMessage = 'Failed to load PDF';
      
      if (error instanceof Error) {
        if (error.message.includes('DataCloneError') || error.message.includes('detached')) {
          errorMessage = 'PDF data is no longer available. Please try uploading the file again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      this.setState({
        error: errorMessage,
        isLoading: false
      });
    }
  }

  async renderCurrentPage(): Promise<void> {
    if (!this.canvasRef?.nativeElement || this.state.totalPages === 0) {
      return;
    }

    this.setState({ isLoading: true, error: null });

    try {
      const pageInfo = await this.pdfRenderer.renderPage(
        this.state.currentPage,
        this.canvasRef.nativeElement,
        { scale: this.state.scale, rotation: 0 }
      );

      this.setState({ isLoading: false });
      
      // Update canvas dimensions
      this.updateCanvasDimensions();
      
      // Update bounding boxes for current page
      this.updateCurrentPageBoundingBoxes();
      
      this.pageRendered.emit(pageInfo);
    } catch (error) {
      console.error('Error rendering page:', error);
      if (error instanceof Error && error.name === 'RenderingCancelledException') {
        this.setState({
          error: error instanceof Error ? error.message : 'Failed to render page',
          isLoading: false
        });
      }
    }
  }

  async nextPage(): Promise<void> {
    if (this.state.currentPage < this.state.totalPages && !this.state.isLoading) {
      this.setState({ currentPage: this.state.currentPage + 1 });
      await this.renderCurrentPage();
    }
  }

  async previousPage(): Promise<void> {
    if (this.state.currentPage > 1 && !this.state.isLoading) {
      this.setState({ currentPage: this.state.currentPage - 1 });
      await this.renderCurrentPage();
    }
  }

  async goToPage(pageNumber: number): Promise<void> {
    if (pageNumber >= 1 && pageNumber <= this.state.totalPages && !this.state.isLoading) {
      this.setState({ currentPage: pageNumber });
      await this.renderCurrentPage();
    }
  }

  async zoomIn(): Promise<void> {
    if (this.state.scale < 3.0 && !this.state.isLoading) {
      const newScale = Math.min(3.0, this.state.scale + 0.25);
      this.setState({ scale: newScale });
      await this.renderCurrentPage();
    }
  }

  async zoomOut(): Promise<void> {
    if (this.state.scale > 0.5 && !this.state.isLoading) {
      const newScale = Math.max(0.5, this.state.scale - 0.25);
      this.setState({ scale: newScale });
      await this.renderCurrentPage();
    }
  }

  async resetZoom(): Promise<void> {
    if (this.state.scale !== 1.0 && !this.state.isLoading) {
      this.setState({ scale: 1.0 });
      await this.renderCurrentPage();
    }
  }
  
  async fitToWidth(): Promise<void> {
    if (!this.state.isLoading) {
      await this.calculateOptimalScale();
      await this.renderCurrentPage();
    }
  }
  
  private async calculateOptimalScale(): Promise<void> {
    try {
      const page = await this.pdfRenderer.getPage(this.state.currentPage);
      if (!page) return;
      
      const viewport = page.getViewport({ scale: 1 });
      const container = this.canvasRef.nativeElement.parentElement;
      
      if (container) {
        const containerWidth = container.clientWidth - 40; // Account for padding
        const containerHeight = container.clientHeight - 40;
        
        // Calculate scale to fit width with some margin
        const scaleToFitWidth = containerWidth / viewport.width;
        const scaleToFitHeight = containerHeight / viewport.height;
        
        // Use the smaller scale to ensure it fits in both dimensions
        const optimalScale = Math.min(scaleToFitWidth, scaleToFitHeight, 2.5); // Cap at 2.5x
        const finalScale = Math.max(optimalScale, 0.5); // Minimum 0.5x
        
        this.setState({ scale: finalScale });
      }
    } catch (error) {
      console.warn('Could not calculate optimal scale:', error);
    }
  }

  async retryRender(): Promise<void> {
    await this.renderCurrentPage();
  }

  private setState(updates: Partial<PdfViewerState>): void {
    this.state = { ...this.state, ...updates };
    this.stateChange.emit(this.state);
    this.cdr.detectChanges();
  }

  private async cleanup(): Promise<void> {
    try {
      await this.pdfRenderer.cleanup();
    } catch (error) {
      console.warn('Error during PDF viewer cleanup:', error);
    }
  }
  
  // Bounding box methods
  toggleBoundingBoxes(): void {
    this.showBoundingBoxes = !this.showBoundingBoxes;
  }
  
  onBoundingBoxClick(interaction: BoundingBoxInteraction): void {
    this.boundingBoxClick.emit(interaction);
  }
  
  onBoundingBoxHover(interaction: BoundingBoxInteraction): void {
    this.boundingBoxHover.emit(interaction);
  }
  
  onBoundingBoxSelect(box: BoundingBox): void {
    this.boundingBoxSelect.emit(box);
  }
  
  onBoundingBoxDeselect(): void {
    // Emit null box to indicate deselection
    const nullBox: BoundingBox = {
      id: '',
      polygon: [],
      content: '',
      confidence: 0,
      type: BoundingBoxType.WORD,
      pageNumber: this.state.currentPage
    };
    this.boundingBoxSelect.emit(nullBox);
  }
  
  private updateCanvasDimensions(): void {
    if (this.canvasRef?.nativeElement) {
      const canvas = this.canvasRef.nativeElement;
      this.canvasWidth = canvas.width;
      this.canvasHeight = canvas.height;
    }
  }
  
  private updateCurrentPageBoundingBoxes(): void {
    if (this.extractionResult) {
      this.currentPageBoundingBoxes = this.boundingBoxService.createBoundingBoxes(
        this.extractionResult,
        this.state.currentPage,
        this.canvasWidth,
        this.canvasHeight,
        this.state.scale
      );
    } else {
      this.currentPageBoundingBoxes = [];
    }
  }

  // Expose Math for template
  Math = Math;
}
