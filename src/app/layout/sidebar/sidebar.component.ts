import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DocumentService } from '../../core/services/document.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.open]="isOpen">
      <div class="sidebar-content">
        <div class="sidebar-header">
          <h3>Documents</h3>
          <button class="close-btn" (click)="closeSidebar()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5 12,10.59 6.41,5 5,6.41 10.59,12 5,17.59 6.41,19 12,13.41 17.59,19 19,17.59 13.41,12z"/>
            </svg>
          </button>
        </div>

        <div class="sidebar-section">
          <h4>Recent Documents</h4>
          <div class="document-list">
            <div *ngFor="let document of documents()" 
                 class="document-item"
                 [class.active]="currentDocument()?.id === document.id"
                 (click)="selectDocument(document.id)">
              <div class="document-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
              </div>
              <div class="document-info">
                <div class="document-name">{{ document.name }}</div>
                <div class="document-meta">
                  <span class="document-type">{{ document.type }}</span>
                  <span class="document-status" [class]="'status-' + document.status">
                    {{ document.status }}
                  </span>
                </div>
              </div>
            </div>
            
            <div *ngIf="documents().length === 0" class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              <p>No documents uploaded yet</p>
              <button routerLink="/upload" class="upload-btn" (click)="closeSidebar()">
                Upload Document
              </button>
            </div>
          </div>
        </div>

        <div class="sidebar-section">
          <h4>Quick Actions</h4>
          <div class="quick-actions">
            <button routerLink="/upload" class="action-btn" (click)="closeSidebar()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              Upload New Document
            </button>
            <button class="action-btn" (click)="clearHistory()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
              </svg>
              Clear History
            </button>
          </div>
        </div>
      </div>
      
      <div class="sidebar-overlay" [class.visible]="isOpen" (click)="closeSidebar()"></div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 64px;
      left: 0;
      width: 320px;
      height: calc(100vh - 64px);
      background-color: #ffffff;
      border-right: 1px solid #e5e7eb;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
      z-index: 999;
      overflow-y: auto;
    }

    .sidebar.open {
      transform: translateX(0);
    }

    .sidebar-content {
      padding: 24px;
      height: 100%;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .sidebar-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }

    .close-btn {
      display: none;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      background-color: transparent;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background-color: #f3f4f6;
      color: #374151;
    }

    .sidebar-section {
      margin-bottom: 32px;
    }

    .sidebar-section h4 {
      margin: 0 0 16px 0;
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .document-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .document-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .document-item:hover {
      background-color: #f9fafb;
      border-color: #e5e7eb;
    }

    .document-item.active {
      background-color: #eff6ff;
      border-color: #007acc;
    }

    .document-icon {
      flex-shrink: 0;
      color: #6b7280;
    }

    .document-info {
      flex: 1;
      min-width: 0;
    }

    .document-name {
      font-size: 14px;
      font-weight: 500;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .document-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }

    .document-type {
      font-size: 12px;
      color: #6b7280;
      text-transform: capitalize;
    }

    .document-status {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      font-weight: 500;
    }

    .status-uploading {
      background-color: #fef3c7;
      color: #92400e;
    }

    .status-processing {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .status-completed {
      background-color: #d1fae5;
      color: #065f46;
    }

    .status-failed {
      background-color: #fee2e2;
      color: #991b1b;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      text-align: center;
      color: #6b7280;
    }

    .empty-state p {
      margin: 16px 0;
      font-size: 14px;
    }

    .upload-btn {
      padding: 8px 16px;
      background-color: #007acc;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease;
      text-decoration: none;
      display: inline-block;
    }

    .upload-btn:hover {
      background-color: #0056b3;
    }

    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: transparent;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      color: #374151;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .action-btn:hover {
      background-color: #f9fafb;
      border-color: #d1d5db;
    }

    .sidebar-overlay {
      display: none;
      position: fixed;
      top: 64px;
      left: 0;
      width: 100vw;
      height: calc(100vh - 64px);
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 998;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .sidebar-overlay.visible {
      opacity: 1;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .sidebar {
        width: 280px;
      }

      .close-btn {
        display: flex;
      }

      .sidebar-overlay {
        display: block;
      }
    }

    /* Desktop - always visible */
    @media (min-width: 1024px) {
      .sidebar {
        position: static;
        transform: none;
        height: calc(100vh - 64px);
        border-right: 1px solid #e5e7eb;
      }

      .sidebar-overlay {
        display: none !important;
      }
    }
  `]
})
export class SidebarComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  constructor(private documentService: DocumentService) {}

  // Expose document signals
  get documents() {
    return this.documentService.documentsSignal;
  }
  
  get currentDocument() {
    return this.documentService.currentDocumentSignal;
  }

  selectDocument(documentId: string): void {
    this.documentService.getDocumentById(documentId).subscribe(document => {
      this.documentService.setCurrentDocument(document);
      // Navigate to viewer if not already there
      // This would typically be handled by the router
    });
  }

  clearHistory(): void {
    // Implementation for clearing document history
    console.log('Clear history clicked');
  }

  closeSidebar(): void {
    this.close.emit();
  }
}