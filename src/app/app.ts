import { Component, signal } from '@angular/core';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

@Component({
  selector: 'app-root',
  imports: [MainLayoutComponent],
  template: `<app-main-layout></app-main-layout>`,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Azure Document Intelligence');
}
