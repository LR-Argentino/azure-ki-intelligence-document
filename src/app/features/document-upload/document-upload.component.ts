import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { UploadProgressComponent } from './components/upload-progress/upload-progress.component';
import { DocumentListComponent } from './components/document-list/document-list.component';
import { DocumentService } from '../../core/services/document.service';
import { AzureIntelligenceService } from '../../core/services/azure-intelligence.service';
import { ErrorMessageComponent } from '../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [
    CommonModule,
    FileUploadComponent,
    UploadProgressComponent,
    DocumentListComponent,
    ErrorMessageComponent
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Hero Section -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl mb-8 shadow-2xl animate-float">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
          </div>
          <h1 class="text-5xl font-bold mb-6">
            <span class="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Upload Documents
            </span>
          </h1>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transform your documents with AI-powered intelligence. Upload PDFs to extract text,
            tables, and key insights automatically with Azure Document Intelligence.
          </p>


          <button
            (click)="getModels()"
            class="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
            Gete Modell
          </button>

          <!-- Feature highlights -->
          <div class="flex flex-wrap justify-center gap-6 mt-8">
            <div class="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-sm font-medium text-gray-700">Text Extraction</span>
            </div>
            <div class="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-sm font-medium text-gray-700">Table Detection</span>
            </div>
            <div class="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <svg class="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-sm font-medium text-gray-700">Key-Value Pairs</span>
            </div>
          </div>
        </div>

        <!-- Upload Section -->
        <div class="max-w-4xl mx-auto">
          <div class="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8">
            <app-file-upload
              (fileSelected)="onFileSelected($event)"
              (fileUploaded)="onFileUploaded($event)">
            </app-file-upload>

            <!-- Progress Component -->
            <div class="mt-8" *ngIf="showProgress">
              <app-upload-progress
                [isVisible]="showProgress"
                [progress]="uploadProgress"
              [status]="uploadStatus"
              [title]="progressTitle"
              [description]="progressDescription"
              [fileName]="currentFileName"
              [fileSize]="currentFileSize">
            </app-upload-progress>
          </div>

          <!-- Error Message -->
          <div class="mt-6">
            <app-error-message
              *ngIf="errorMessage"
              type="error"
              title="Upload Error"
              [message]="errorMessage"
              (dismiss)="clearError()">
            </app-error-message>
          </div>
      </div>

      <!-- Progress Component -->
      <div *ngIf="showProgress" class="max-w-2xl mx-auto">
        <app-upload-progress
          [isVisible]="showProgress"
          [progress]="uploadProgress"
          [status]="uploadStatus"
          [title]="progressTitle"
          [description]="progressDescription"
          [fileName]="currentFileName"
          [fileSize]="currentFileSize">
        </app-upload-progress>
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage" class="max-w-2xl mx-auto">
        <app-error-message
          type="error"
          title="Upload Error"
          [message]="errorMessage"
          (dismiss)="clearError()">
        </app-error-message>
      </div>

      <!-- Features Section -->
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Powerful Document Analysis</h2>
          <p class="text-gray-600">Leverage Azure's AI to extract insights from your documents</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-4">
              <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4,6H20V16H4M20,18A2,2 0 0,0 22,16V6C22,4.89 21.1,4 20,4H4C2.89,4 2,4.89 2,6V16A2,2 0 0,0 4,18H0V20H24V18H20Z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Text Extraction</h3>
            <p class="text-gray-600">Extract all text content with high accuracy, including handwritten text</p>
          </div>

          <div class="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4">
              <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3,3H21V5H3V3M3,7H15V9H3V7M3,11H21V13H3V11M3,15H15V17H3V15M3,19H21V21H3V19Z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Table Detection</h3>
            <p class="text-gray-600">Automatically identify and extract structured data from tables</p>
          </div>

          <div class="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-4">
              <svg class="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Key-Value Pairs</h3>
            <p class="text-gray-600">Identify form fields and extract key-value relationships</p>
          </div>
        </div>
      </div>

      <!-- Documents Section -->
      <div class="max-w-6xl mx-auto">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 class="text-lg font-semibold text-gray-900">Your Documents</h2>
            <p class="text-sm text-gray-600 mt-1">Manage and view your uploaded documents</p>
          </div>
          <div class="p-6">
            <app-document-list
              (uploadClick)="scrollToUpload()">
            </app-document-list>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DocumentUploadComponent {
  showProgress = false;
  uploadProgress = 0;
  uploadStatus: 'uploading' | 'processing' | 'completed' | 'error' = 'uploading';
  progressTitle = 'Uploading document...';
  progressDescription = '';
  currentFileName = '';
  currentFileSize = '';
  errorMessage = '';

  constructor(
    private documentService: DocumentService,
    private azureService: AzureIntelligenceService,
    private router: Router
  ) {}

  onFileSelected(file: File): void {
    this.currentFileName = file.name;
    this.currentFileSize = this.formatFileSize(file.size);
    this.clearError();
  }

  onFileUploaded(file: File): void {
    this.startUpload(file);
  }

  private startUpload(file: File): void {
    this.showProgress = true;
    this.uploadProgress = 0;
    this.uploadStatus = 'uploading';
    this.progressTitle = 'Uploading document...';
    this.progressDescription = 'Preparing file for processing';

    // Simulate upload progress
    this.simulateUploadProgress().then(() => {
      // Start document processing
      this.processDocument(file);
    }).catch(error => {
      this.handleUploadError(error);
    });
  }

  private async simulateUploadProgress(): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        this.uploadProgress += 10;

        if (this.uploadProgress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 200);
    });
  }

  private processDocument(file: File): void {
    this.uploadStatus = 'processing';
    this.progressTitle = 'Processing document...';
    this.progressDescription = 'Analyzing document with Azure Document Intelligence';

    // Upload document to service
    this.documentService.uploadDocument(file).subscribe({
      next: (document) => {
        // Start Azure analysis
        this.azureService.analyzeInvoice(file).subscribe({
          next: (result) => {
            // Update document with extraction result
            document.extractionResult = result;
            this.uploadStatus = 'completed';
            this.progressTitle = 'Processing completed!';
            this.progressDescription = 'Document is ready for viewing and analysis';

            // Auto-hide progress after 3 seconds
            setTimeout(() => {
              this.showProgress = false;
              // Navigate to viewer
              this.router.navigate(['/viewer', document.id]);
            }, 3000);
          },
          error: (error) => {
            this.handleProcessingError(error);
          }
        });
      },
      error: (error) => {
        this.handleUploadError(error);
      }
    });
  }

  private handleUploadError(error: any): void {
    this.uploadStatus = 'error';
    this.progressTitle = 'Upload failed';
    this.progressDescription = '';
    this.errorMessage = error.message || 'An error occurred during upload';
  }

  private handleProcessingError(error: any): void {
    this.uploadStatus = 'error';
    this.progressTitle = 'Processing failed';
    this.progressDescription = '';
    this.errorMessage = error.message || 'An error occurred during document processing';
  }

  clearError(): void {
    this.errorMessage = '';
  }

  scrollToUpload(): void {
    // Scroll to top of page where upload section is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async getModels(): Promise<void> {
    await this.azureService.getModelLists()
  }
}
