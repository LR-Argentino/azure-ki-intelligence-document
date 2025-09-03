import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upload-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upload-progress-container" *ngIf="isVisible">
      <div class="progress-header">
        <div class="progress-info">
          <h4>{{ title }}</h4>
          <p *ngIf="description">{{ description }}</p>
        </div>
        <div class="progress-percentage">{{ progress }}%</div>
      </div>

      <div class="progress-bar-container">
        <div class="progress-bar">
          <div class="progress-fill" 
               [style.width.%]="progress"
               [class.completed]="progress === 100"
               [class.error]="hasError">
          </div>
        </div>
      </div>

      <div class="progress-details" *ngIf="showDetails">
        <div class="detail-row" *ngIf="fileName">
          <span class="detail-label">File:</span>
          <span class="detail-value">{{ fileName }}</span>
        </div>
        <div class="detail-row" *ngIf="fileSize">
          <span class="detail-label">Size:</span>
          <span class="detail-value">{{ fileSize }}</span>
        </div>
        <div class="detail-row" *ngIf="uploadSpeed">
          <span class="detail-label">Speed:</span>
          <span class="detail-value">{{ uploadSpeed }}</span>
        </div>
        <div class="detail-row" *ngIf="timeRemaining">
          <span class="detail-label">Time remaining:</span>
          <span class="detail-value">{{ timeRemaining }}</span>
        </div>
      </div>

      <div class="progress-status">
        <div class="status-indicator" [ngClass]="statusClass">
          <svg *ngIf="status === 'uploading'" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="spinning">
            <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
          </svg>
          <svg *ngIf="status === 'processing'" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="spinning">
            <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12H16A4,4 0 0,0 12,8V6Z"/>
          </svg>
          <svg *ngIf="status === 'completed'" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
          </svg>
          <svg *ngIf="status === 'error'" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z"/>
          </svg>
        </div>
        <span class="status-text">{{ statusText }}</span>
      </div>

      <div class="progress-actions" *ngIf="showActions">
        <button *ngIf="status === 'uploading'" class="cancel-btn" (click)="onCancel()">
          Cancel
        </button>
        <button *ngIf="status === 'completed'" class="continue-btn" (click)="onContinue()">
          Continue
        </button>
        <button *ngIf="status === 'error'" class="retry-btn" (click)="onRetry()">
          Retry
        </button>
      </div>
    </div>
  `,
  styles: [`
    .upload-progress-container {
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 24px;
      margin: 16px 0;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .progress-info h4 {
      margin: 0 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }

    .progress-info p {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
    }

    .progress-percentage {
      font-size: 18px;
      font-weight: 600;
      color: #007acc;
    }

    .progress-bar-container {
      margin-bottom: 16px;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background-color: #f3f4f6;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background-color: #007acc;
      transition: width 0.3s ease;
      border-radius: 4px;
    }

    .progress-fill.completed {
      background-color: #10b981;
    }

    .progress-fill.error {
      background-color: #ef4444;
    }

    .progress-details {
      margin-bottom: 16px;
      padding: 12px;
      background-color: #f9fafb;
      border-radius: 6px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 14px;
    }

    .detail-row:last-child {
      margin-bottom: 0;
    }

    .detail-label {
      color: #6b7280;
      font-weight: 500;
    }

    .detail-value {
      color: #111827;
    }

    .progress-status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .status-indicator.uploading {
      color: #007acc;
    }

    .status-indicator.processing {
      color: #f59e0b;
    }

    .status-indicator.completed {
      color: #10b981;
    }

    .status-indicator.error {
      color: #ef4444;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .status-text {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .progress-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .cancel-btn,
    .continue-btn,
    .retry-btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .cancel-btn {
      background-color: transparent;
      color: #6b7280;
      border: 1px solid #d1d5db;
    }

    .cancel-btn:hover {
      background-color: #f9fafb;
      border-color: #9ca3af;
    }

    .continue-btn {
      background-color: #10b981;
      color: white;
      border: none;
    }

    .continue-btn:hover {
      background-color: #059669;
    }

    .retry-btn {
      background-color: #007acc;
      color: white;
      border: none;
    }

    .retry-btn:hover {
      background-color: #0056b3;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .progress-header {
        flex-direction: column;
        gap: 8px;
      }

      .progress-percentage {
        align-self: flex-end;
      }

      .progress-actions {
        flex-direction: column;
      }

      .cancel-btn,
      .continue-btn,
      .retry-btn {
        width: 100%;
      }
    }
  `]
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

  get statusClass(): string {
    return this.status;
  }

  get hasError(): boolean {
    return this.status === 'error';
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