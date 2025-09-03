import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <div class="main-layout">
      <app-header (sidebarToggle)="toggleSidebar()"></app-header>
      
      <div class="layout-body">
        <app-sidebar 
          [isOpen]="sidebarOpen" 
          (close)="closeSidebar()">
        </app-sidebar>
        
        <main class="main-content" [class.sidebar-open]="sidebarOpen">
          <div class="content-container">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .main-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: #f9fafb;
    }

    .layout-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: margin-left 0.3s ease;
    }

    .content-container {
      flex: 1;
      overflow: auto;
      padding: 24px;
    }

    /* Desktop layout adjustments */
    @media (min-width: 1024px) {
      .main-content {
        margin-left: 320px;
      }

      .main-content.sidebar-open {
        margin-left: 320px;
      }
    }

    /* Mobile layout */
    @media (max-width: 1023px) {
      .content-container {
        padding: 16px;
      }
    }

    @media (max-width: 480px) {
      .content-container {
        padding: 12px;
      }
    }
  `]
})
export class MainLayoutComponent {
  sidebarOpen = false;

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }
}