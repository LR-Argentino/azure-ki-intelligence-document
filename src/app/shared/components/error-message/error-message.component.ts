import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-container" [ngClass]="'error-' + type">
      <div class="error-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" *ngIf="type === 'success'"/>
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" *ngIf="type === 'warning'"/>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" *ngIf="type === 'error'"/>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" *ngIf="type === 'info'"/>
        </svg>
      </div>
      <div class="error-content">
        <h4 *ngIf="title" class="error-title">{{ title }}</h4>
        <p class="error-message">{{ message }}</p>
        <div *ngIf="details" class="error-details">
          <button class="details-toggle" (click)="showDetails = !showDetails">
            {{ showDetails ? 'Hide' : 'Show' }} Details
          </button>
          <div *ngIf="showDetails" class="details-content">
            {{ details }}
          </div>
        </div>
      </div>
      <button *ngIf="dismissible" class="error-dismiss" (click)="onDismiss()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
      border-left: 4px solid;
    }

    .error-success {
      background-color: #f0f9ff;
      border-left-color: #10b981;
      color: #065f46;
    }

    .error-warning {
      background-color: #fffbeb;
      border-left-color: #f59e0b;
      color: #92400e;
    }

    .error-error {
      background-color: #fef2f2;
      border-left-color: #ef4444;
      color: #991b1b;
    }

    .error-info {
      background-color: #eff6ff;
      border-left-color: #3b82f6;
      color: #1e40af;
    }

    .error-icon {
      margin-right: 12px;
      flex-shrink: 0;
    }

    .error-content {
      flex: 1;
    }

    .error-title {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .error-message {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
    }

    .error-details {
      margin-top: 12px;
    }

    .details-toggle {
      background: none;
      border: none;
      color: inherit;
      text-decoration: underline;
      cursor: pointer;
      font-size: 12px;
      padding: 0;
    }

    .details-content {
      margin-top: 8px;
      padding: 8px;
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
      font-size: 12px;
      font-family: monospace;
      white-space: pre-wrap;
    }

    .error-dismiss {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 4px;
      margin-left: 12px;
      border-radius: 4px;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .error-dismiss:hover {
      opacity: 1;
    }
  `]
})
export class ErrorMessageComponent {
  @Input() type: 'success' | 'warning' | 'error' | 'info' = 'error';
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() details: string = '';
  @Input() dismissible: boolean = true;
  @Output() dismiss = new EventEmitter<void>();

  showDetails = false;

  onDismiss(): void {
    this.dismiss.emit();
  }
}