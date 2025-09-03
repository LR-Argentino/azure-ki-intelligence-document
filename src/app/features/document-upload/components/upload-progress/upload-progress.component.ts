import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border border-gray-100 rounded-2xl p-8 shadow-lg animate-slide-up" *ngIf="isVisible">
      <!-- Progress Header -->
      <div class="flex justify-between items-start mb-6">
        <div class="flex-1">
          <div class="flex items-center space-x-3 mb-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center"
                 [class.bg-blue-100]="status === 'uploading' || status === 'processing'"
                 [class.bg-green-100]="status === 'completed'"
                 [class.bg-red-100]="status === 'error'">
              <svg class="w-4 h-4"
                   [class.text-blue-600]="status === 'uploading' || status === 'processing'"
                   [class.text-green-600]="status === 'completed'"
                   [class.text-red-600]="status === 'error'"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path *ngIf="status === 'uploading' || status === 'processing'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                <path *ngIf="status === 'completed'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                <path *ngIf="status === 'error'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h4 class="text-xl font-bold text-gray-900">{{ title }}</h4>
          </div>
          <p *ngIf="description" class="text-gray-600 ml-11">{{ description }}</p>
        </div>
        <div class="text-3xl font-bold ml-4"
             [class.text-blue-600]="status === 'uploading' || status === 'processing'"
             [class.text-green-600]="status === 'completed'"
             [class.text-red-600]="status === 'error'">{{ progress }}%</div>
      </div>

      <!-- Progress Bar -->
      <div class="mb-6">
        <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div class="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
               [style.width.%]="progress"
               [class.bg-gradient-to-r]="status === 'uploading' || status === 'processing'"
               [class.from-blue-500]="status === 'uploading' || status === 'processing'"
               [class.to-purple-500]="status === 'uploading' || status === 'processing'"
               [class.bg-green-500]="status === 'completed'"
               [class.bg-red-500]="status === 'error'">
            <div *ngIf="status === 'uploading' || status === 'processing'" 
                 class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          </div>
        </div>
      </div>

      <!-- File Details -->
      <div class="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-5 mb-6" *ngIf="showDetails && (fileName || fileSize)">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div *ngIf="fileName" class="flex items-center justify-between">
            <span class="text-gray-600 font-medium flex items-center">
              <svg class="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              File:
            </span>
            <span class="text-gray-900 font-semibold truncate ml-2">{{ fileName }}</span>
          </div>
          <div *ngIf="fileSize" class="flex items-center justify-between">
            <span class="text-gray-600 font-medium flex items-center">
              <svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M21,9V7L15,1H5C3.89,1 3,1.89 3,3V7H21M21,16H3V10H21M21,21V19H3V21A2,2 0 0,0 5,23H19A2,2 0 0,0 21,21Z"/>
              </svg>
              Size:
            </span>
            <span class="text-gray-900 font-semibold">{{ fileSize }}</span>
          </div>
          <div *ngIf="uploadSpeed" class="flex items-center justify-between">
            <span class="text-gray-600 font-medium flex items-center">
              <svg class="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Speed:
            </span>
            <span class="text-gray-900 font-semibold">{{ uploadSpeed }}</span>
          </div>
          <div *ngIf="timeRemaining" class="flex items-center justify-between">
            <span class="text-gray-600 font-medium flex items-center">
              <svg class="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Time remaining:
            </span>
            <span class="text-gray-900 font-semibold">{{ timeRemaining }}</span>
          </div>
        </div>
      </div>

      <!-- Status Indicator -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <!-- Status Icon -->
          <div class="flex items-center justify-center w-8 h-8 rounded-full"
               [class.bg-primary-100]="status === 'uploading' || status === 'processing'"
               [class.bg-green-100]="status === 'completed'"
               [class.bg-red-100]="status === 'error'">
            
            <!-- Uploading Icon -->
            <svg *ngIf="status === 'uploading'" 
                 class="w-4 h-4 text-primary-600 animate-spin" 
                 fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
            </svg>
            
            <!-- Processing Icon -->
            <svg *ngIf="status === 'processing'" 
                 class="w-4 h-4 text-primary-600 animate-spin" 
                 fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12H16A4,4 0 0,0 12,8V6Z"/>
            </svg>
            
            <!-- Completed Icon -->
            <svg *ngIf="status === 'completed'" 
                 class="w-4 h-4 text-green-600" 
                 fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
            </svg>
            
            <!-- Error Icon -->
            <svg *ngIf="status === 'error'" 
                 class="w-4 h-4 text-red-600" 
                 fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
            </svg>
          </div>
          
          <!-- Status Text -->
          <span class="text-sm font-medium text-gray-700">{{ statusText }}</span>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-2" *ngIf="showActions">
          <button *ngIf="status === 'uploading'" 
                  (click)="onCancel()"
                  class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
            Cancel
          </button>
          
          <button *ngIf="status === 'completed'" 
                  (click)="onContinue()"
                  class="px-3 py-1.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
            Continue
          </button>
          
          <button *ngIf="status === 'error'" 
                  (click)="onRetry()"
                  class="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
            Retry
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class UploadProgressComponent {
  @Input() isVisible = false;
  @Input() progress = 0;
  @Input() status: 'uploading' | 'processing' | 'completed' | 'error' = 'uploading';
  @Input() title = 'Uploading document...';
  @Input() description = '';
  @Input() fileName = '';
  @Input() fileSize = '';
  @Input() uploadSpeed = '';
  @Input() timeRemaining = '';
  @Input() showDetails = true;
  @Input() showActions = true;

  @Output() cancel = new EventEmitter<void>();
  @Output() continue = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();

  get statusText(): string {
    switch (this.status) {
      case 'uploading':
        return 'Uploading file...';
      case 'processing':
        return 'Processing document...';
      case 'completed':
        return 'Upload completed successfully';
      case 'error':
        return 'Upload failed';
      default:
        return '';
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onContinue(): void {
    this.continue.emit();
  }

  onRetry(): void {
    this.retry.emit();
  }
}