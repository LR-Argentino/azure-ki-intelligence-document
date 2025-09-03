import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center justify-center p-8"
         [class.fixed]="overlay"
         [class.inset-0]="overlay"
         [class.bg-white]="overlay"
         [class.bg-opacity-90]="overlay"
         [class.z-50]="overlay">
      
      <!-- Spinner -->
      <div class="relative" [style.width.px]="size" [style.height.px]="size">
        <div class="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
        <div class="absolute inset-0 border-4 border-transparent border-t-primary-600 rounded-full animate-spin"></div>
      </div>
      
      <!-- Message -->
      <p *ngIf="message" class="mt-4 text-sm text-gray-600 text-center max-w-xs">
        {{ message }}
      </p>
    </div>
  `,
  styles: []
})
export class LoadingSpinnerComponent {
  @Input() size: number = 40;
  @Input() message: string = '';
  @Input() overlay: boolean = false;
}