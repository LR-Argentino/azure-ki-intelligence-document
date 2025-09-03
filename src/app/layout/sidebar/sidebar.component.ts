import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DocumentService } from '../../core/services/document.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Desktop Sidebar -->
    <aside class="hidden lg:flex lg:flex-col lg:w-80 lg:fixed lg:inset-y-16 lg:z-50 lg:bg-white lg:border-r lg:border-gray-200">
      <div class="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div class="flex-1 px-4 py-6">
          <!-- Documents Section -->
          <div class="mb-8">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
            
            <div class="space-y-2">
              <div *ngFor="let document of documents()" 
                   class="group flex items-center p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                   [class.bg-primary-50]="currentDocument()?.id === document.id"
                   [class.border-primary-200]="currentDocument()?.id === document.id"
                   (click)="selectDocument(document.id)">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-gray-400 group-hover:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <div class="ml-3 flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ document.name }}</p>
                  <div class="flex items-center mt-1 space-x-2">
                    <span class="text-xs text-gray-500 capitalize">{{ document.type }}</span>
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          [ngClass]="{
                            'bg-yellow-100 text-yellow-800': document.status === 'uploading',
                            'bg-blue-100 text-blue-800': document.status === 'processing',
                            'bg-green-100 text-green-800': document.status === 'completed',
                            'bg-red-100 text-red-800': document.status === 'failed'
                          }">
                      {{ document.status }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Empty State -->
              <div *ngIf="documents().length === 0" class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <h3 class="mt-4 text-sm font-medium text-gray-900">No documents</h3>
                <p class="mt-2 text-sm text-gray-500">Get started by uploading a document.</p>
                <div class="mt-6">
                  <button routerLink="/upload" 
                          class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
                    <svg class="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    Upload Document
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div>
            <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h4>
            <div class="space-y-2">
              <button routerLink="/upload" 
                      class="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <svg class="mr-3 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                Upload New Document
              </button>
              <button (click)="clearHistory()" 
                      class="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <svg class="mr-3 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                </svg>
                Clear History
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Mobile Sidebar -->
    <div class="lg:hidden">
      <div *ngIf="isOpen" class="fixed inset-0 flex z-40">
        <!-- Overlay -->
        <div class="fixed inset-0 bg-gray-600 bg-opacity-75" (click)="closeSidebar()"></div>
        
        <!-- Sidebar -->
        <div class="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div class="absolute top-0 right-0 -mr-12 pt-2">
            <button (click)="closeSidebar()" 
                    class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div class="px-4">
              <!-- Mobile Documents Section -->
              <div class="mb-8">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
                
                <div class="space-y-2">
                  <div *ngFor="let document of documents()" 
                       class="group flex items-center p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                       [class.bg-primary-50]="currentDocument()?.id === document.id"
                       (click)="selectDocument(document.id); closeSidebar()">
                    <div class="flex-shrink-0">
                      <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                    </div>
                    <div class="ml-3 flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ document.name }}</p>
                      <div class="flex items-center mt-1 space-x-2">
                        <span class="text-xs text-gray-500 capitalize">{{ document.type }}</span>
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                              [ngClass]="{
                                'bg-yellow-100 text-yellow-800': document.status === 'uploading',
                                'bg-blue-100 text-blue-800': document.status === 'processing',
                                'bg-green-100 text-green-800': document.status === 'completed',
                                'bg-red-100 text-red-800': document.status === 'failed'
                              }">
                          {{ document.status }}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Mobile Empty State -->
                  <div *ngIf="documents().length === 0" class="text-center py-8">
                    <svg class="mx-auto h-12 w-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    <h3 class="mt-4 text-sm font-medium text-gray-900">No documents</h3>
                    <p class="mt-2 text-sm text-gray-500">Get started by uploading a document.</p>
                    <div class="mt-4">
                      <button routerLink="/upload" 
                              (click)="closeSidebar()"
                              class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                        Upload Document
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Mobile Quick Actions -->
              <div>
                <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h4>
                <div class="space-y-2">
                  <button routerLink="/upload" 
                          (click)="closeSidebar()"
                          class="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                    <svg class="mr-3 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    Upload New Document
                  </button>
                  <button (click)="clearHistory()" 
                          class="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                    <svg class="mr-3 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                    </svg>
                    Clear History
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
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