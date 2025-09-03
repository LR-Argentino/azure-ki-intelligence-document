import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DocumentService } from '../../core/services/document.service';
import { Document } from '../../core/models/document.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, ErrorMessageComponent],
  template: `
    <div class="document-viewer-page">
      <div class="viewer-header">
        <div class="header-left">
          <button class="back-btn" (click)="goBack()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
            </svg>
            Back to Upload
          </button>
          <div class="document-info" *ngIf="currentDocument">
            <h1>{{ currentDocument.name }}</h1>
            <div class="document-meta">
              <span class="document-type">{{ currentDocument.type | titlecase }}</span>
              <span class="document-status" [class]="'status-' + currentDocument.status">
                {{ currentDocument.status | titlecase }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="header-actions">
          <button class="action-btn" [routerLink]="['/chat', documentId]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,3C6.5,3 2,6.58 2,11A7.18,7.18 0 0,0 2.64,14.25L1,22L8.75,20.36C9.81,20.75 10.87,21 12,21C17.5,21 22,17.42 22,13S17.5,3 12,3Z"/>
            </svg>
            Chat with Document
          </button>
        </div>
      </div>

      <div class="viewer-content">
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
          <div class="viewer-placeholder">
            <div class="placeholder-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </div>
            <h3>Document Viewer</h3>
            <p>PDF viewer and bounding box overlay will be implemented here.</p>
            <div class="placeholder-features">
              <div class="feature-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
                </svg>
                PDF Rendering with PDF.js
              </div>
              <div class="feature-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A2,2 0 0,1 14,4C14,5.5 13,6.19 13,7.5V9A1,1 0 0,1 12,10A1,1 0 0,1 11,9V7.5C11,6.19 10,5.5 10,4A2,2 0 0,1 12,2M21,9V7H15L13.5,7.5C13.1,7.65 12.6,7.5 12.3,7.1C11.95,6.75 11.95,6.25 12.3,5.9L14,4.5V2A4,4 0 0,0 8,6C8,7.5 9,8.5 9,10V11A2,2 0 0,0 7,13H6V21A1,1 0 0,0 7,22H17A1,1 0 0,0 18,21V13H17A2,2 0 0,0 15,11V10C15,8.5 16,7.5 16,6H21V4A2,2 0 0,1 23,6V9A2,2 0 0,1 21,9Z"/>
                </svg>
                Interactive Bounding Box Overlays
              </div>
              <div class="feature-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"/>
                </svg>
                Extraction Results Display
              </div>
              <div class="feature-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                </svg>
                Zoom and Pan Controls
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
      height: 100%;
      background-color: #ffffff;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .viewer-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 48px;
      text-align: center;
      color: #6b7280;
    }

    .viewer-placeholder h3 {
      margin: 16px 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #374151;
    }

    .viewer-placeholder p {
      margin: 0 0 32px 0;
      font-size: 16px;
      max-width: 400px;
    }

    .placeholder-features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      max-width: 600px;
      width: 100%;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background-color: #f9fafb;
      border-radius: 8px;
      font-size: 14px;
      color: #374151;
    }

    .feature-item svg {
      color: #007acc;
      flex-shrink: 0;
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
    }
  `]
})
export class DocumentViewerComponent implements OnInit {
  documentId: string = '';
  currentDocument: Document | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.documentId = this.route.snapshot.paramMap.get('id') || '';
    this.loadDocument();
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

  goBack(): void {
    this.router.navigate(['/upload']);
  }
}