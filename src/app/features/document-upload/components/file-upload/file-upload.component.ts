import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileValidatorUtil, ValidationResult } from '../../../../shared/utils/file-validator.util';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';
import { ErrorMessageComponent } from '../../../../shared/components/error-message/error-message.component';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, FileSizePipe, ErrorMessageComponent],
  template: `
    <div class="file-upload-container">
      <div class="upload-area" 
           [class.dragover]="isDragOver"
           [class.has-error]="validationError"
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave($event)"
           (drop)="onDrop($event)"
           (click)="fileInput.click()">
        
        <input #fileInput
               type="file"
               accept=".pdf"
               (change)="onFileSelected($event)"
               style="display: none;">

        <div class="upload-content">
          <div class="upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </div>
          
          <div class="upload-text">
            <h3>Drop your PDF file here</h3>
            <p>or <span class="upload-link">click to browse</span></p>
            <div class="upload-info">
              <span>Supported format: PDF</span>
              <span>Maximum size: 50MB</span>
            </div>
          </div>
        </div>
      </div>

      <app-error-message 
        *ngIf="validationError"
        type="error"
        title="File Validation Error"
        [message]="validationError.errors.join(', ')"
        (dismiss)="clearError()">
      </app-error-message>

      <div *ngIf="selectedFile" class="selected-file">
        <div class="file-info">
          <div class="file-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </div>
          <div class="file-details">
            <div class="file-name">{{ selectedFile.name }}</div>
            <div class="file-meta">
              <span>{{ selectedFile.size | fileSize }}</span>
              <span>{{ selectedFile.type }}</span>
            </div>
          </div>
          <button class="remove-file" (click)="removeFile()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5 12,10.59 6.41,5 5,6.41 10.59,12 5,17.59 6.41,19 12,13.41 17.59,19 19,17.59 13.41,12z"/>
            </svg>
          </button>
        </div>
        
        <div class="upload-actions">
          <button class="upload-btn" (click)="uploadFile()" [disabled]="!selectedFile">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z"/>
            </svg>
            Upload Document
          </button>
          <button class="cancel-btn" (click)="removeFile()">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .file-upload-container {
      max-width: 600px;
      margin: 0 auto;
    }

    .upload-area {
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 48px 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background-color: #ffffff;
    }

    .upload-area:hover {
      border-color: #007acc;
      background-color: #f8fafc;
    }

    .upload-area.dragover {
      border-color: #007acc;
      background-color: #eff6ff;
      transform: scale(1.02);
    }

    .upload-area.has-error {
      border-color: #ef4444;
      background-color: #fef2f2;
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .upload-icon {
      color: #9ca3af;
      transition: color 0.3s ease;
    }

    .upload-area:hover .upload-icon {
      color: #007acc;
    }

    .upload-text h3 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 600;
      color: #111827;
    }

    .upload-text p {
      margin: 0 0 16px 0;
      color: #6b7280;
      font-size: 16px;
    }

    .upload-link {
      color: #007acc;
      font-weight: 500;
    }

    .upload-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 14px;
      color: #9ca3af;
    }

    .selected-file {
      margin-top: 24px;
      padding: 20px;
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .file-icon {
      color: #007acc;
      flex-shrink: 0;
    }

    .file-details {
      flex: 1;
    }

    .file-name {
      font-size: 16px;
      font-weight: 500;
      color: #111827;
      margin-bottom: 4px;
    }

    .file-meta {
      display: flex;
      gap: 16px;
      font-size: 14px;
      color: #6b7280;
    }

    .remove-file {
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .remove-file:hover {
      color: #ef4444;
      background-color: #fef2f2;
    }

    .upload-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .upload-btn {
      display: flex;
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

    .upload-btn:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .upload-btn:disabled {
      background-color: #9ca3af;
      cursor: not-allowed;
    }

    .cancel-btn {
      padding: 12px 24px;
      background-color: transparent;
      color: #6b7280;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .cancel-btn:hover {
      background-color: #f9fafb;
      border-color: #9ca3af;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .upload-area {
        padding: 32px 16px;
      }

      .upload-text h3 {
        font-size: 18px;
      }

      .upload-actions {
        flex-direction: column;
      }

      .upload-btn,
      .cancel-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class FileUploadComponent {
  @Output() fileSelected = new EventEmitter<File>();
  @Output() fileUploaded = new EventEmitter<File>();

  selectedFile: File | null = null;
  isDragOver = false;
  validationError: ValidationResult | null = null;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    this.clearError();
    
    const validation = FileValidatorUtil.validateFile(file);
    if (!validation.isValid) {
      this.validationError = validation;
      return;
    }

    this.selectedFile = file;
    this.fileSelected.emit(file);
  }

  uploadFile(): void {
    if (this.selectedFile) {
      this.fileUploaded.emit(this.selectedFile);
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.clearError();
  }

  clearError(): void {
    this.validationError = null;
  }
}