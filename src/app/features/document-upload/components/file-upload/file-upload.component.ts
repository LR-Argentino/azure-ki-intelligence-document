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
    <div class="w-full">
      <!-- Upload Area -->
      <div class="relative">
        <div class="file-drop-zone border-2 border-dashed border-gray-300/60 rounded-3xl p-16 text-center transition-all duration-500 ease-out hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50/30 hover:to-purple-50/30 cursor-pointer group relative overflow-hidden"
             [class.drag-over]="isDragOver"
             [class.border-red-300]="validationError"
             [class.bg-red-50/30]="validationError"
             [class.border-blue-500]="isDragOver"
             [class.bg-gradient-to-br]="isDragOver"
             [class.from-blue-100/50]="isDragOver"
             [class.to-purple-100/50]="isDragOver"
             [class.scale-105]="isDragOver"
             (dragover)="onDragOver($event)"
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event)"
             (click)="fileInput.click()">

          <!-- Background decoration -->
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <input #fileInput
                 type="file"
                 accept=".pdf"
                 (change)="onFileSelected($event)"
                 class="hidden">

          <div class="relative z-10 space-y-8">
            <!-- Upload Icon -->
            <div class="flex justify-center">
              <div class="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg group-hover:shadow-xl"
                   [class.from-blue-200]="isDragOver"
                   [class.to-purple-200]="isDragOver"
                   [class.from-red-100]="validationError"
                   [class.to-red-200]="validationError"
                   [class.animate-pulse-glow]="isDragOver">
                <svg class="w-12 h-12 text-blue-600 transition-all duration-300"
                     [class.text-blue-700]="isDragOver"
                     [class.text-red-500]="validationError"
                     [class.scale-110]="isDragOver"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
              </div>
            </div>

            <!-- Upload Text -->
            <div class="space-y-4">
              <h3 class="text-2xl font-bold text-gray-900">
                Drop your PDF file here
              </h3>
              <p class="text-gray-600 text-lg">
                or <span class="text-primary-600 font-medium hover:text-primary-700 transition-colors">click to browse</span>
              </p>
            </div>

            <!-- Upload Info -->
            <div class="flex flex-col sm:flex-row sm:justify-center sm:space-x-8 space-y-2 sm:space-y-0 text-sm text-gray-500">
              <div class="flex items-center justify-center space-x-2">
                <div class="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg class="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <span>PDF format only</span>
              </div>
              <div class="flex items-center justify-center space-x-2">
                <div class="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <svg class="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M21,9V7L15,1H5C3.89,1 3,1.89 3,3V7H21M21,16H3V10H21M21,21V19H3V21A2,2 0 0,0 5,23H19A2,2 0 0,0 21,21Z"/>
                  </svg>
                </div>
                <span>Max 10MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div class="mt-4">
        <app-error-message
          *ngIf="validationError"
          type="error"
          title="File Validation Error"
          [message]="validationError.errors.join(', ')"
          (dismiss)="clearError()">
        </app-error-message>
      </div>

      <!-- Selected File -->
      <div *ngIf="selectedFile" class="mt-8 animate-slide-up">
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-base font-semibold text-gray-900 truncate">
                  {{ selectedFile.name }}
                </p>
                <div class="flex items-center space-x-4 mt-1">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {{ selectedFile.size | fileSize }}
                  </span>
                  <span class="text-sm text-gray-600">
                    PDF Document
                  </span>
                </div>
              </div>
            </div>
            <button (click)="removeFile()"
                    class="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19,6.41L17.59,5 12,10.59 6.41,5 5,6.41 10.59,12 5,17.59 6.41,19 12,13.41 17.59,19 19,17.59 13.41,12z"/>
              </svg>
            </button>
          </div>

          <!-- Upload Actions -->
          <div class="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-blue-200">
            <button (click)="removeFile()"
                    class="inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
              Cancel
            </button>
            <button (click)="uploadFile()"
                    [disabled]="!selectedFile"
                    class="inline-flex justify-center items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              Upload Document
            </button>
          </div>
        </div>
      </div>
  `,
  styles: []
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
