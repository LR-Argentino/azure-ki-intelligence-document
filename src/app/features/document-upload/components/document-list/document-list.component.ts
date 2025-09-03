import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DocumentService } from '../../../../core/services/document.service';
import { Document, ProcessingStatus } from '../../../../core/models/document.model';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FileSizePipe],
  template: `
    <div class="document-list-container">
      <div class="list-header">
        <h3>Recent Documents</h3>
        <div class="list-actions">
          <button class="refresh-btn" (click)="refreshList()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div class="document-grid" *ngIf="documents().length > 0">
        <div *ngFor="let document of documents()" 
             class="document-card"
             [class.processing]="document.status === 'processing'"
             [class.failed]="document.status === 'failed'">
          
          <div class="document-header">
            <div class="document-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </div>
            <div class="document-status">
              <span class="status-badge" [class]="'status-' + document.status">
                {{ getStatusText(document.status) }}
              </span>
            </div>
          </div>

          <div class="document-content">
            <h4 class="document-name" [title]="document.name">{{ document.name }}</h4>
            <div class="document-meta">
              <span class="document-type">{{ document.type | titlecase }}</span>
              <span class="document-size">{{ document.size | fileSize }}</span>
            </div>
            <div class="document-date">
              Uploaded {{ formatDate(document.uploadDate) }}
            </div>
          </div>

          <div class="document-actions">
            <button *ngIf="document.status === 'completed'" 
                    class="action-btn primary"
                    [routerLink]="['/viewer', document.id]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
              </svg>
              View
            </button>
            
            <button *ngIf="document.status === 'completed'" 
                    class="action-btn secondary"
                    [routerLink]="['/chat', document.id]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,3C6.5,3 2,6.58 2,11A7.18,7.18 0 0,0 2.64,14.25L1,22L8.75,20.36C9.81,20.75 10.87,21 12,21C17.5,21 22,17.42 22,13S17.5,3 12,3Z"/>
              </svg>
              Chat
            </button>

            <button *ngIf="document.status === 'failed'" 
                    class="action-btn retry"
                    (click)="retryProcessing(document)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
              </svg>
              Retry
            </button>

            <button class="action-btn danger" (click)="deleteDocument(document)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
              </svg>
              Delete
            </button>
          </div>

          <div *ngIf="document.status === 'processing'" class="processing-overlay">
            <div class="processing-spinner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="spinning">
                <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
              </svg>
            </div>
            <span>Processing...</span>
          </div>
        </div>
      </div>

      <div *ngIf="documents().length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        </div>
        <h3>No documents uploaded yet</h3>
        <p>Upload your first PDF document to get started with Azure Document Intelligence.</p>
        <button class="upload-btn" (click)="onUploadClick()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
          Upload Document
        </button>
      </div>
    </div>
  `,
  styles: [`
    .document-list-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .list-header h3 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #111827;
    }

    .refresh-btn {
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

    .refresh-btn:hover {
      background-color: #f9fafb;
      border-color: #9ca3af;
    }

    .document-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .document-card {
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .document-card:hover {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border-color: #d1d5db;
    }

    .document-card.processing {
      border-color: #f59e0b;
      background-color: #fffbeb;
    }

    .document-card.failed {
      border-color: #ef4444;
      background-color: #fef2f2;
    }

    .document-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .document-icon {
      color: #007acc;
    }

    .status-badge {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }

    .status-uploading {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .status-processing {
      background-color: #fef3c7;
      color: #92400e;
    }

    .status-completed {
      background-color: #d1fae5;
      color: #065f46;
    }

    .status-failed {
      background-color: #fee2e2;
      color: #991b1b;
    }

    .document-content {
      margin-bottom: 20px;
    }

    .document-name {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .document-meta {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;
      font-size: 14px;
      color: #6b7280;
    }

    .document-date {
      font-size: 12px;
      color: #9ca3af;
    }

    .document-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      border: none;
    }

    .action-btn.primary {
      background-color: #007acc;
      color: white;
    }

    .action-btn.primary:hover {
      background-color: #0056b3;
    }

    .action-btn.secondary {
      background-color: #10b981;
      color: white;
    }

    .action-btn.secondary:hover {
      background-color: #059669;
    }

    .action-btn.retry {
      background-color: #f59e0b;
      color: white;
    }

    .action-btn.retry:hover {
      background-color: #d97706;
    }

    .action-btn.danger {
      background-color: transparent;
      color: #ef4444;
      border: 1px solid #fecaca;
    }

    .action-btn.danger:hover {
      background-color: #fef2f2;
      border-color: #ef4444;
    }

    .processing-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 14px;
      color: #f59e0b;
      font-weight: 500;
    }

    .processing-spinner .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 64px 32px;
      color: #6b7280;
    }

    .empty-state h3 {
      margin: 16px 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #374151;
    }

    .empty-state p {
      margin: 0 0 24px 0;
      font-size: 16px;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }

    .upload-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background-color: #007acc;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .upload-btn:hover {
      background-color: #0056b3;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .document-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .list-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .document-actions {
        justify-content: space-between;
      }

      .action-btn {
        flex: 1;
        justify-content: center;
      }
    }
  `]
})
export class DocumentListComponent {
  @Output() uploadClick = new EventEmitter<void>();

  constructor(private documentService: DocumentService) {}
  
  // Expose document signal
  get documents() {
    return this.documentService.documentsSignal;
  }

  refreshList(): void {
    // Refresh document list
    console.log('Refreshing document list');
  }

  retryProcessing(document: Document): void {
    // Retry processing logic
    console.log('Retrying processing for document:', document.id);
  }

  deleteDocument(document: Document): void {
    if (confirm(`Are you sure you want to delete "${document.name}"?`)) {
      this.documentService.deleteDocument(document.id).subscribe(() => {
        console.log('Document deleted:', document.id);
      });
    }
  }

  onUploadClick(): void {
    this.uploadClick.emit();
  }

  getStatusText(status: ProcessingStatus): string {
    switch (status) {
      case ProcessingStatus.UPLOADING:
        return 'Uploading';
      case ProcessingStatus.PROCESSING:
        return 'Processing';
      case ProcessingStatus.COMPLETED:
        return 'Completed';
      case ProcessingStatus.FAILED:
        return 'Failed';
      default:
        return status;
    }
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}