import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-2xl p-6 animate-slide-up shadow-sm border"
         [class.bg-gradient-to-r]="true"
         [class.from-red-50]="type === 'error'"
         [class.to-pink-50]="type === 'error'"
         [class.border-red-200]="type === 'error'"
         [class.from-yellow-50]="type === 'warning'"
         [class.to-orange-50]="type === 'warning'"
         [class.border-yellow-200]="type === 'warning'"
         [class.from-green-50]="type === 'success'"
         [class.to-emerald-50]="type === 'success'"
         [class.border-green-200]="type === 'success'"
         [class.from-blue-50]="type === 'info'"
         [class.to-cyan-50]="type === 'info'"
         [class.border-blue-200]="type === 'info'">
      
      <div class="flex">
        <!-- Icon -->
        <div class="flex-shrink-0">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center"
               [class.bg-red-100]="type === 'error'"
               [class.text-red-600]="type === 'error'"
               [class.bg-yellow-100]="type === 'warning'"
               [class.text-yellow-600]="type === 'warning'"
               [class.bg-green-100]="type === 'success'"
               [class.text-green-600]="type === 'success'"
               [class.bg-blue-100]="type === 'info'"
               [class.text-blue-600]="type === 'info'">
            
            <!-- Error Icon -->
            <svg *ngIf="type === 'error'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            
            <!-- Warning Icon -->
            <svg *ngIf="type === 'warning'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            
            <!-- Success Icon -->
            <svg *ngIf="type === 'success'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            
            <!-- Info Icon -->
            <svg *ngIf="type === 'info'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
          </div>
        
        <!-- Content -->
        <div class="ml-4 flex-1">
          <h3 *ngIf="title" class="text-base font-semibold mb-1"
              [class.text-red-800]="type === 'error'"
              [class.text-yellow-800]="type === 'warning'"
              [class.text-green-800]="type === 'success'"
              [class.text-blue-800]="type === 'info'">
            {{ title }}
          </h3>
          
          <div class="text-sm leading-relaxed"
               [class.text-red-700]="type === 'error'"
               [class.text-yellow-700]="type === 'warning'"
               [class.text-green-700]="type === 'success'"
               [class.text-blue-700]="type === 'info'">
            <p>{{ message }}</p>
          </div>
          
          <!-- Details Section -->
          <div *ngIf="details" class="mt-4">
            <button (click)="showDetails = !showDetails"
                    class="inline-flex items-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg px-2 py-1 transition-colors"
                    [class.text-red-600]="type === 'error'"
                    [class.hover:bg-red-100]="type === 'error'"
                    [class.focus:ring-red-500]="type === 'error'"
                    [class.text-yellow-600]="type === 'warning'"
                    [class.hover:bg-yellow-100]="type === 'warning'"
                    [class.focus:ring-yellow-500]="type === 'warning'"
                    [class.text-green-600]="type === 'success'"
                    [class.hover:bg-green-100]="type === 'success'"
                    [class.focus:ring-green-500]="type === 'success'"
                    [class.text-blue-600]="type === 'info'"
                    [class.hover:bg-blue-100]="type === 'info'"
                    [class.focus:ring-blue-500]="type === 'info'">
              <svg class="w-4 h-4 mr-1 transition-transform" [class.rotate-180]="showDetails" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
              {{ showDetails ? 'Hide' : 'Show' }} Details
            </button>
            
            <div *ngIf="showDetails" class="mt-3 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap border"
                 [class.bg-red-50]="type === 'error'"
                 [class.text-red-800]="type === 'error'"
                 [class.border-red-200]="type === 'error'"
                 [class.bg-yellow-50]="type === 'warning'"
                 [class.text-yellow-800]="type === 'warning'"
                 [class.border-yellow-200]="type === 'warning'"
                 [class.bg-green-50]="type === 'success'"
                 [class.text-green-800]="type === 'success'"
                 [class.border-green-200]="type === 'success'"
                 [class.bg-blue-50]="type === 'info'"
                 [class.text-blue-800]="type === 'info'"
                 [class.border-blue-200]="type === 'info'">{{ details }}</div>
          </div>
        </div>
        
        <!-- Dismiss Button -->
        <div *ngIf="dismissible" class="ml-auto pl-3">
          <button (click)="onDismiss()"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 hover:scale-110"
                  [class.text-red-500]="type === 'error'"
                  [class.hover:bg-red-100]="type === 'error'"
                  [class.focus:ring-red-500]="type === 'error'"
                  [class.text-yellow-500]="type === 'warning'"
                  [class.hover:bg-yellow-100]="type === 'warning'"
                  [class.focus:ring-yellow-500]="type === 'warning'"
                  [class.text-green-500]="type === 'success'"
                  [class.hover:bg-green-100]="type === 'success'"
                  [class.focus:ring-green-500]="type === 'success'"
                  [class.text-blue-500]="type === 'info'"
                  [class.hover:bg-blue-100]="type === 'info'"
                  [class.focus:ring-blue-500]="type === 'info'">
            <span class="sr-only">Dismiss</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
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