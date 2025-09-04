import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DocumentService } from '../../core/services/document.service';
import { Document } from '../../core/models/document.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';
import { PdfViewerComponent, PdfViewerState } from '../../shared/components/pdf-viewer/pdf-viewer.component';
import { PdfPageInfo } from '../../core/services/pdf-renderer.service';
import { BoundingBox, BoundingBoxInteraction } from '../../core/models/bounding-box.model';
import { ExtractionResultsComponent, ExtractedField } from '../../shared/components/extraction-results/extraction-results.component';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, ErrorMessageComponent, PdfViewerComponent, ExtractionResultsComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <!-- Modern Header -->
      <div class="bg-white/90 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-40 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center space-x-4">
              <button (click)="goBack()" 
                      class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Back to Upload
              </button>
              
              <div class="h-8 w-px bg-gray-300"></div>
              
              <div *ngIf="currentDocument" class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div>
                  <h1 class="text-lg font-semibold text-gray-900">{{ currentDocument.name }}</h1>
                  <div class="flex items-center space-x-2 text-sm text-gray-500">
                    <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{{ currentDocument.type | titlecase }}</span>
                    <span class="px-2 py-1 rounded-full text-xs font-medium"
                          [class.bg-green-100]="currentDocument.status === 'completed'"
                          [class.text-green-700]="currentDocument.status === 'completed'"
                          [class.bg-yellow-100]="currentDocument.status === 'processing'"
                          [class.text-yellow-700]="currentDocument.status === 'processing'"
                          [class.bg-red-100]="currentDocument.status === 'failed'"
                          [class.text-red-700]="currentDocument.status === 'failed'"
                          [class.bg-blue-100]="currentDocument.status === 'uploading'"
                          [class.text-blue-700]="currentDocument.status === 'uploading'">
                      {{ currentDocument.status | titlecase }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <button [routerLink]="['/chat', documentId]" 
                    class="btn-primary">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              Chat with Document
            </button>
          </div>
        </div>
      </div>

      <!-- Document Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <app-loading-spinner 
          *ngIf="isLoading" 
          [size]="48" 
          message="Loading document...">
        </app-loading-spinner>

        <app-error-message
          *ngIf="errorMessage"
          type="error"
          title="Document Loading Error"
          [message]="errorMessage">
        </app-error-message>

        <div *ngIf="currentDocument && !isLoading && !errorMessage" class="document-content">
          <!-- Two-panel layout: PDF Viewer + Extraction Results -->
          <div class="document-panels" [class.single-panel]="!showExtractionPanel">
            <!-- PDF Viewer Panel -->
            <div class="pdf-panel" [class.full-width]="!showExtractionPanel">
              <div class="panel-header">
                <h3 class="panel-title">Document View</h3>
                <button 
                  class="toggle-panel-btn"
                  (click)="toggleExtractionPanel()"
                  [title]="showExtractionPanel ? 'Hide extraction results' : 'Show extraction results'">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          [attr.d]="showExtractionPanel ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'"/>
                  </svg>
                  {{ showExtractionPanel ? 'Hide Results' : 'Show Results' }}
                </button>
              </div>
              
              <div *ngIf="currentDocument.pdfData" class="pdf-viewer-wrapper">
                <app-pdf-viewer 
                  [pdfData]="currentDocument.pdfData"
                  [extractionResult]="currentDocument.extractionResult || null"
                  [selectedBoxId]="selectedBoundingBoxId"
                  [highlightedBoxId]="highlightedBoundingBoxId"
                  [selectedField]="selectedField"
                  (stateChange)="onPdfViewerStateChange($event)"
                  (pageRendered)="onPageRendered($event)"
                  (boundingBoxClick)="onBoundingBoxClick($event)"
                  (boundingBoxHover)="onBoundingBoxHover($event)"
                  (boundingBoxSelect)="onBoundingBoxSelect($event)">
                </app-pdf-viewer>
              </div>
            </div>
            
            <!-- Extraction Results Panel -->
            <div class="extraction-panel" *ngIf="showExtractionPanel">
              <div class="panel-header">
                <h3 class="panel-title">Extraction Results</h3>
              </div>
              
              <app-extraction-results
                [extractionResult]="currentDocument.extractionResult || null"
                [selectedFieldId]="selectedFieldId"
                [highlightedFieldId]="highlightedFieldId"
                (fieldSelected)="onFieldSelected($event)"
                (fieldHighlighted)="onFieldHighlighted($event)"
                (exportRequested)="onExportRequested($event)">
              </app-extraction-results>
            </div>
          </div>
          
          <!-- Fallback for documents without PDF data -->
          <div *ngIf="!currentDocument.pdfData" class="no-pdf-placeholder">
            <div class="placeholder-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </div>
            <h3>PDF Not Available</h3>
            <p>The PDF data for this document is not available for viewing.</p>
            <div class="document-info-card">
              <div class="info-item">
                <span class="label">Document Type:</span>
                <span class="value">{{ currentDocument.type | titlecase }}</span>
              </div>
              <div class="info-item">
                <span class="label">Status:</span>
                <span class="value">{{ currentDocument.status | titlecase }}</span>
              </div>
              <div class="info-item">
                <span class="label">Upload Date:</span>
                <span class="value">{{ currentDocument.uploadDate | date:'medium' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .document-viewer-page {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .viewer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      background-color: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background-color: transparent;
      color: #6b7280;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .back-btn:hover {
      background-color: #f9fafb;
      border-color: #9ca3af;
    }

    .document-info h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #111827;
    }

    .document-meta {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .document-type {
      font-size: 14px;
      color: #6b7280;
    }

    .document-status {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .status-completed {
      background-color: #d1fae5;
      color: #065f46;
    }

    .status-processing {
      background-color: #fef3c7;
      color: #92400e;
    }

    .status-failed {
      background-color: #fee2e2;
      color: #991b1b;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background-color: #007acc;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;
      text-decoration: none;
    }

    .action-btn:hover {
      background-color: #0056b3;
    }

    .viewer-content {
      flex: 1;
      padding: 0 24px 24px;
      overflow: auto;
    }

    .document-content {
      height: calc(100vh - 180px);
      background-color: #ffffff;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }
    
    /* Two-panel layout styles */
    .document-panels {
      display: flex;
      height: 100%;
      gap: 1px; /* Small gap between panels */
      background: #e5e7eb; /* Shows as border between panels */
    }
    
    .document-panels.single-panel {
      .pdf-panel {
        width: 100%;
      }
    }
    
    .pdf-panel {
      background: white;
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    
    .pdf-panel.full-width {
      width: 100%;
    }
    
    .extraction-panel {
      background: white;
      width: 400px;
      min-width: 350px;
      max-width: 500px;
      display: flex;
      flex-direction: column;
      resize: horizontal;
      overflow-x: hidden;
    }
    
    .panel-header {
      padding: 12px 16px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 48px;
    }
    
    .panel-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin: 0;
    }
    
    .toggle-panel-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 12px;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .toggle-panel-btn:hover {
      background: #e5e7eb;
      border-color: #9ca3af;
    }
    
    .pdf-viewer-wrapper {
      flex: 1;
      overflow: auto;
      position: relative;
    }

    .pdf-viewer-wrapper {
      height: 100%;
      width: 100%;
      min-height: 600px;
    }

    .no-pdf-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 48px;
      text-align: center;
      color: #6b7280;
    }

    .no-pdf-placeholder h3 {
      margin: 16px 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #374151;
    }

    .no-pdf-placeholder p {
      margin: 0 0 32px 0;
      font-size: 16px;
      max-width: 400px;
    }

    .document-info-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      max-width: 400px;
      width: 100%;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-item .label {
      font-weight: 500;
      color: #64748b;
    }

    .info-item .value {
      font-weight: 600;
      color: #1e293b;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .viewer-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .header-left {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .document-info h1 {
        font-size: 20px;
      }

      .viewer-content {
        padding: 0 16px 16px;
      }

      .placeholder-features {
        grid-template-columns: 1fr;
      }
      
      /* Stack panels vertically on mobile */
      .document-panels {
        flex-direction: column;
        height: auto;
      }
      
      .extraction-panel {
        width: 100%;
        max-width: none;
        min-width: auto;
        height: 300px;
        resize: vertical;
      }
      
      .pdf-panel {
        min-height: 400px;
      }
      
      .panel-header {
        padding: 8px 12px;
      }
      
      .panel-title {
        font-size: 13px;
      }
      
      .toggle-panel-btn {
        padding: 4px 8px;
        font-size: 11px;
      }
    }
  `]
})
export class DocumentViewerComponent implements OnInit, OnDestroy {
  documentId: string = '';
  currentDocument: Document | null = null;
  isLoading = true;
  errorMessage = '';
  pdfViewerState: PdfViewerState | null = null;
  
  // Panel state
  showExtractionPanel = true;
  
  // Linking state between extraction results and bounding boxes
  selectedFieldId: string | null = null;
  highlightedFieldId: string | null = null;
  selectedBoundingBoxId: string | null = null;
  highlightedBoundingBoxId: string | null = null;
  selectedField: ExtractedField | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.documentId = this.route.snapshot.paramMap.get('id') || '';
    this.loadDocument();
  }

  ngOnDestroy(): void {
    // Cleanup is handled by the PDF viewer component
  }

  private loadDocument(): void {
    if (!this.documentId) {
      this.errorMessage = 'Document ID is required';
      this.isLoading = false;
      return;
    }

    this.documentService.getDocumentById(this.documentId).subscribe({
      next: (document) => {
        this.currentDocument = document;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to load document';
        this.isLoading = false;
      }
    });
  }

  onPdfViewerStateChange(state: PdfViewerState): void {
    this.pdfViewerState = state;
  }

  onPageRendered(pageInfo: PdfPageInfo): void {
    console.log('Page rendered:', pageInfo);
    // This can be used for future features like bounding box overlays
  }
  
  onBoundingBoxClick(interaction: BoundingBoxInteraction): void {
    console.log('Bounding box clicked:', interaction);
    if (interaction && interaction.boundingBox) {
      this.selectedBoundingBoxId = interaction.boundingBox.id;
      this.selectedFieldId = interaction.boundingBox.id;
      // Clear highlight when selecting
      this.highlightedBoundingBoxId = null;
      this.highlightedFieldId = null;
    } else {
      // Clear selection when clicking empty area
      this.selectedBoundingBoxId = null;
      this.selectedFieldId = null;
    }
  }
  
  onBoundingBoxHover(interaction: BoundingBoxInteraction): void {
    console.log('Bounding box hovered:', interaction);
    if (interaction && interaction.boundingBox && !this.selectedBoundingBoxId) {
      this.highlightedBoundingBoxId = interaction.boundingBox.id;
      this.highlightedFieldId = interaction.boundingBox.id;
    } else if (!interaction || !interaction.boundingBox) {
      // Clear highlight when leaving bounding box
      this.highlightedBoundingBoxId = null;
      this.highlightedFieldId = null;
    }
  }
  
  onBoundingBoxSelect(box: BoundingBox): void {
    console.log('Bounding box selected:', box);
    if (box && box.id) {
      this.selectedBoundingBoxId = box.id;
      this.selectedFieldId = box.id;
      // Clear highlight when selecting
      this.highlightedBoundingBoxId = null;
      this.highlightedFieldId = null;
    }
  }

  // Event handlers for extraction results panel
  onFieldSelected(field: ExtractedField): void {
    console.log('Field selected:', field);
    console.log('Field bounding box:', field.boundingBox);
    this.selectedFieldId = field.id;
    this.selectedBoundingBoxId = field.id;
    // Clear highlight when selecting
    this.highlightedFieldId = null;
    this.highlightedBoundingBoxId = null;
    
    // Store the selected field for use by the PDF viewer
    this.selectedField = field;
  }
  
  onFieldHighlighted(field: ExtractedField | null): void {
    console.log('Field highlighted:', field);
    if (!this.selectedFieldId) {
      this.highlightedFieldId = field?.id || null;
      this.highlightedBoundingBoxId = field?.id || null;
    }
  }
  
  onPanelToggle(): void {
    this.showExtractionPanel = !this.showExtractionPanel;
  }
  
  toggleExtractionPanel(): void {
    this.showExtractionPanel = !this.showExtractionPanel;
  }
  
  onExportRequested(event: { format: string; data: ExtractedField[] }): void {
    console.log('Export requested:', event);
    // TODO: Implement export functionality
    // This could integrate with a service to export extraction results
    // in various formats (JSON, CSV, etc.)
    // For now, we can trigger a download of the data
    const { format, data } = event;
    console.log(`Exporting ${data.length} fields in ${format} format`);
  }

  goBack(): void {
    this.router.navigate(['/upload']);
  }
}
