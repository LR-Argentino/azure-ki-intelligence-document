import { Component, Output, EventEmitter, OnInit } from '@angular/core';
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
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Your Documents</h2>
          <p class="text-sm text-gray-600 mt-1">Manage and view your uploaded documents</p>
        </div>
        <button (click)="refreshList()" 
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
          </svg>
          Refresh
        </button>
      </div>

      <!-- Document Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" *ngIf="documents().length > 0">
        <div *ngFor="let document of documents()" 
             class="group relative bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
             [class.border-yellow-200]="document.status === 'processing'"
             [class.bg-gradient-to-br]="document.status === 'processing'"
             [class.from-yellow-50]="document.status === 'processing'"
             [class.to-orange-50]="document.status === 'processing'"
             [class.border-red-200]="document.status === 'failed'"
             [class.from-red-50]="document.status === 'failed'"
             [class.to-pink-50]="document.status === 'failed'">
          
          <!-- Status Indicator -->
          <div class="absolute top-4 right-4 z-10">
            <div class="w-3 h-3 rounded-full"
                 [class.bg-green-400]="document.status === 'completed'"
                 [class.bg-yellow-400]="document.status === 'processing'"
                 [class.bg-red-400]="document.status === 'failed'"
                 [class.animate-pulse]="document.status === 'processing'">
            </div>
          </div>
          
          <!-- Document Header -->
          <div class="p-6 pb-4">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-4">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-base font-semibold text-gray-900 truncate mb-1" [title]="document.name">
                    {{ document.name }}
                  </h3>
                  <div class="flex items-center space-x-2 mt-1">
                    <span class="text-xs text-gray-500">{{ document.type | titlecase }}</span>
                    <span class="text-xs text-gray-400">•</span>
                    <span class="text-xs text-gray-500">{{ document.size | fileSize }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Status Badge -->
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    [class.bg-blue-100]="document.status === 'uploading'"
                    [class.text-blue-800]="document.status === 'uploading'"
                    [class.bg-yellow-100]="document.status === 'processing'"
                    [class.text-yellow-800]="document.status === 'processing'"
                    [class.bg-green-100]="document.status === 'completed'"
                    [class.text-green-800]="document.status === 'completed'"
                    [class.bg-red-100]="document.status === 'failed'"
                    [class.text-red-800]="document.status === 'failed'">
                {{ getStatusText(document.status) }}
              </span>
            </div>
            
            <!-- Upload Date -->
            <p class="text-xs text-gray-500 mb-4">
              Uploaded {{ formatDate(document.uploadDate) }}
            </p>
          </div>

          <!-- Actions -->
          <div class="px-6 pb-6">
            <div class="flex flex-wrap gap-2">
              <!-- View Button -->
              <button *ngIf="document.status === 'completed'" 
                      [routerLink]="['/viewer', document.id]"
                      class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
                </svg>
                View
              </button>
              
              <!-- Chat Button -->
              <button *ngIf="document.status === 'completed'" 
                      [routerLink]="['/chat', document.id]"
                      class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,3C6.5,3 2,6.58 2,11A7.18,7.18 0 0,0 2.64,14.25L1,22L8.75,20.36C9.81,20.75 10.87,21 12,21C17.5,21 22,17.42 22,13S17.5,3 12,3Z"/>
                </svg>
                Chat
              </button>

              <!-- Retry Button -->
              <button *ngIf="document.status === 'failed'" 
                      (click)="retryProcessing(document)"
                      class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                </svg>
                Retry
              </button>

              <!-- Delete Button -->
              <button (click)="deleteDocument(document)"
                      class="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                </svg>
                Delete
              </button>
            </div>
          </div>

          <!-- Processing Overlay -->
          <div *ngIf="document.status === 'processing'" 
               class="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mb-2"></div>
            <span class="text-sm font-medium text-yellow-800">Processing...</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="documents().length === 0" class="text-center py-12">
        <div class="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <svg class="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
        <p class="text-gray-600 mb-6 max-w-sm mx-auto">
          Upload your first PDF document to get started with Azure Document Intelligence analysis.
        </p>
        <button (click)="onUploadClick()" 
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
          <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
          Upload Your First Document
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class DocumentListComponent implements OnInit {
  @Output() uploadClick = new EventEmitter<void>();

  documents!: any;

  constructor(private documentService: DocumentService) {}

  ngOnInit(): void {
    this.documents = this.documentService.documentsSignal;
  }

  getStatusText(status: ProcessingStatus): string {
    switch (status) {
      case 'uploading':
        return 'Uploading';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Ready';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInHours / 24;

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      const days = Math.floor(diffInDays);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  refreshList(): void {
    // Refresh the document list by getting all documents
    this.documentService.getAllDocuments().subscribe();
  }

  retryProcessing(document: Document): void {
    // For now, just update the status to processing
    // In a real implementation, this would retry the Azure processing
    const updatedDocument = { ...document, status: 'processing' as ProcessingStatus };
    this.documentService.updateDocument(updatedDocument).subscribe();
  }

  deleteDocument(document: Document): void {
    if (confirm(`Are you sure you want to delete "${document.name}"?`)) {
      this.documentService.deleteDocument(document.id);
    }
  }

  onUploadClick(): void {
    this.uploadClick.emit();
  }
}