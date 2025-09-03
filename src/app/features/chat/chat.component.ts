import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DocumentService } from '../../core/services/document.service';
import { ChatService } from '../../core/services/chat.service';
import { Document } from '../../core/models/document.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent, ErrorMessageComponent],
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
                Back to Viewer
              </button>
              
              <div class="h-8 w-px bg-gray-300"></div>
              
              <div *ngIf="currentDocument" class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                </div>
                <div>
                  <h1 class="text-lg font-semibold text-gray-900">Chat with {{ currentDocument.name }}</h1>
                  <div class="flex items-center space-x-2 text-sm text-gray-500">
                    <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{{ currentDocument.type | titlecase }}</span>
                    <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">RAG-enabled</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button [routerLink]="['/viewer', documentId]" 
                    class="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              View Document
            </button>
          </div>
        </div>
      </div>

      <!-- Chat Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <app-loading-spinner 
          *ngIf="isLoading" 
          [size]="48" 
          message="Loading chat interface...">
        </app-loading-spinner>

        <app-error-message
          *ngIf="errorMessage"
          type="error"
          title="Chat Loading Error"
          [message]="errorMessage">
        </app-error-message>

        <div *ngIf="currentDocument && !isLoading && !errorMessage" class="chat-interface">
          <div class="chat-placeholder">
            <div class="placeholder-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                <path d="M12,3C6.5,3 2,6.58 2,11A7.18,7.18 0 0,0 2.64,14.25L1,22L8.75,20.36C9.81,20.75 10.87,21 12,21C17.5,21 22,17.42 22,13S17.5,3 12,3Z"/>
              </svg>
            </div>
            <h3>RAG-Enabled Chat Interface</h3>
            <p>Intelligent chat interface with document context will be implemented here.</p>
            <div class="placeholder-features">
              <div class="feature-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,3C6.5,3 2,6.58 2,11A7.18,7.18 0 0,0 2.64,14.25L1,22L8.75,20.36C9.81,20.75 10.87,21 12,21C17.5,21 22,17.42 22,13S17.5,3 12,3M12,19C11,19 10.03,18.75 9.18,18.32L8.5,18L4.42,19.25L5.67,15.17L5.34,14.5C4.78,13.57 4.5,12.54 4.5,11.5C4.5,7.92 7.86,5 12,5S19.5,7.92 19.5,11.5 16.14,19 12,19Z"/>
                </svg>
                Real-time Chat Messages
              </div>
              <div class="feature-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"/>
                </svg>
                Document Context Awareness
              </div>
              <div class="feature-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
                </svg>
                Source Citation & References
              </div>
              <div class="feature-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                </svg>
                Contract Analysis Tools
              </div>
            </div>
            
            <div class="sample-queries">
              <h4>Try asking:</h4>
              <div class="query-examples">
                <button class="query-btn" disabled>
                  "What are the key terms in this contract?"
                </button>
                <button class="query-btn" disabled>
                  "Summarize the payment terms"
                </button>
                <button class="query-btn" disabled>
                  "What are the potential risks?"
                </button>
                <button class="query-btn" disabled>
                  "Extract all dates and amounts"
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-page {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .chat-header {
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

    .chat-status {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 12px;
      background-color: #eff6ff;
      color: #1e40af;
      text-transform: uppercase;
      font-weight: 600;
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

    .chat-content {
      flex: 1;
      padding: 0 24px 24px;
      overflow: auto;
    }

    .chat-interface {
      height: 100%;
      background-color: #ffffff;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .chat-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 48px;
      text-align: center;
      color: #6b7280;
    }

    .chat-placeholder h3 {
      margin: 16px 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #374151;
    }

    .chat-placeholder p {
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
      margin-bottom: 32px;
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

    .sample-queries {
      width: 100%;
      max-width: 600px;
    }

    .sample-queries h4 {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: #374151;
    }

    .query-examples {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .query-btn {
      padding: 12px 16px;
      background-color: #f3f4f6;
      color: #6b7280;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 14px;
      cursor: not-allowed;
      text-align: left;
      transition: all 0.2s ease;
    }

    .query-btn:not(:disabled):hover {
      background-color: #e5e7eb;
      border-color: #d1d5db;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .chat-header {
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

      .chat-content {
        padding: 0 16px 16px;
      }

      .placeholder-features {
        grid-template-columns: 1fr;
      }

      .query-examples {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ChatComponent implements OnInit {
  documentId: string = '';
  currentDocument: Document | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentService: DocumentService,
    private chatService: ChatService
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
        this.initializeChat();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to load document';
        this.isLoading = false;
      }
    });
  }

  private initializeChat(): void {
    if (this.documentId) {
      this.chatService.startChatSession(this.documentId).subscribe({
        next: (session) => {
          console.log('Chat session started:', session.id);
        },
        error: (error) => {
          console.error('Failed to start chat session:', error);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/viewer', this.documentId]);
  }
}