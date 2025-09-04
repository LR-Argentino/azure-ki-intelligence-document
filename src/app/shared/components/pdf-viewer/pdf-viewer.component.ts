import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfRendererService, PdfPageInfo } from '../../../core/services/pdf-renderer.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

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
  imports: [CommonModule, LoadingSpinnerComponent],
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

        <canvas
          #pdfCanvas
          class="pdf-canvas"
          [style.display]="state.error ? 'none' : 'block'">
        </canvas>
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
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow: auto;
      position: relative;
    }

    .pdf-canvas-container.loading {
      background-color: #f8fafc;
    }

    .pdf-canvas {
      max-width: 100%;
      max-height: 100%;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-radius: 4px;
      background-color: white;
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
export class PdfViewerComponent implements OnInit, OnDestroy {
  @Input() pdfData: ArrayBuffer | null = null;
  @Output() stateChange = new EventEmitter<PdfViewerState>();
  @Output() pageRendered = new EventEmitter<PdfPageInfo>();

  @ViewChild('pdfCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  state: PdfViewerState = {
    currentPage: 1,
    totalPages: 0,
    scale: 1.0,
    isLoading: false,
    error: null
  };

  constructor(
    private pdfRenderer: PdfRendererService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.pdfData) {
      this.loadPdf();
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  async loadPdf(): Promise<void> {
    if (!this.pdfData) {
      this.setState({ error: 'No PDF data provided' });
      return;
    }

    this.setState({ isLoading: true, error: null });

    try {
      const document = await this.pdfRenderer.loadDocument(this.pdfData);
      const docInfo = this.pdfRenderer.getDocumentInfo();

      if (docInfo) {
        this.setState({
          totalPages: docInfo.numPages,
          currentPage: 1,
          isLoading: false
        });
        await this.renderCurrentPage();
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to load PDF',
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

  // Expose Math for template
  Math = Math;
}
