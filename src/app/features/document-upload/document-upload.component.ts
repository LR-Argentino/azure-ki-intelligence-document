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
    <div class="document-upload-page">
      <div class="page-header">
        <h1>Document Upload</h1>
        <p>Upload PDF documents for analysis with Azure Document Intelligence</p>
      </div>

      <div class="upload-section">
        <app-file-upload
          (fileSelected)="onFileSelected($event)"
          (fileUploaded)="onFileUploaded($event)">
        </app-file-upload>

        <app-upload-progress
          [isVisible]="showProgress"
          [progress]="uploadProgress"
          [status]="uploadStatus"
          [title]="progressTitle"
          [description]="progressDescription"
          [fileName]="currentFileName"
          [fileSize]="currentFileSize">
        </app-upload-progress>

        <app-error-message
          *ngIf="errorMessage"
          type="error"
          title="Upload Error"
          [message]="errorMessage"
          (dismiss)="clearError()">
        </app-error-message>
      </div>

      <div class="documents-section">
        <app-document-list
          (uploadClick)="scrollToUpload()">
        </app-document-list>
      </div>
    </div>
  `,
  styles: [`
    .document-upload-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }

    .page-header {
      text-align: center;
      margin-bottom: 48px;
    }

    .page-header h1 {
      margin: 0 0 16px 0;
      font-size: 32px;
      font-weight: 700;
      color: #111827;
    }

    .page-header p {
      margin: 0;
      font-size: 18px;
      color: #6b7280;
      max-width: 600px;
      margin: 0 auto;
    }

    .upload-section {
      margin-bottom: 64px;
    }

    .documents-section {
      margin-bottom: 48px;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .document-upload-page {
        padding: 0 16px;
      }

      .page-header {
        margin-bottom: 32px;
      }

      .page-header h1 {
        font-size: 28px;
      }

      .page-header p {
        font-size: 16px;
      }

      .upload-section {
        margin-bottom: 48px;
      }
    }

    @media (max-width: 480px) {
      .document-upload-page {
        padding: 0 12px;
      }

      .page-header h1 {
        font-size: 24px;
      }
    }
  `]
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
        this.azureService.analyzeDocument(file).subscribe({
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
    // Scroll to upload section
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}