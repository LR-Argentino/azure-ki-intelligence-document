import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <button class="menu-toggle" (click)="toggleSidebar()" [class.active]="sidebarOpen">
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </button>
          <div class="logo">
            <h1 routerLink="/">Azure Document Intelligence</h1>
          </div>
        </div>
        
        <nav class="header-nav">
          <a routerLink="/upload" routerLinkActive="active" class="nav-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            Upload
          </a>
          <a routerLink="/viewer" routerLinkActive="active" class="nav-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
            </svg>
            Viewer
          </a>
          <a routerLink="/chat" routerLinkActive="active" class="nav-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,3C6.5,3 2,6.58 2,11A7.18,7.18 0 0,0 2.64,14.25L1,22L8.75,20.36C9.81,20.75 10.87,21 12,21C17.5,21 22,17.42 22,13S17.5,3 12,3M12,19C11,19 10.03,18.75 9.18,18.32L8.5,18L4.42,19.25L5.67,15.17L5.34,14.5C4.78,13.57 4.5,12.54 4.5,11.5C4.5,7.92 7.86,5 12,5S19.5,7.92 19.5,11.5 16.14,19 12,19Z"/>
            </svg>
            Chat
          </a>
        </nav>

        <div class="header-right">
          <button class="theme-toggle" (click)="toggleTheme()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,18C11.11,18 10.26,17.8 9.5,17.45C11.56,16.5 13,14.42 13,12C13,9.58 11.56,7.5 9.5,6.55C10.26,6.2 11.11,6 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31L23.31,12L20,8.69Z"/>
            </svg>
          </button>
          <div class="user-menu">
            <button class="user-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background-color: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 64px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .menu-toggle {
      display: none;
      flex-direction: column;
      justify-content: space-around;
      width: 24px;
      height: 24px;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
    }

    .hamburger-line {
      width: 100%;
      height: 2px;
      background-color: #374151;
      transition: all 0.3s ease;
    }

    .menu-toggle.active .hamburger-line:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }

    .menu-toggle.active .hamburger-line:nth-child(2) {
      opacity: 0;
    }

    .menu-toggle.active .hamburger-line:nth-child(3) {
      transform: rotate(-45deg) translate(7px, -6px);
    }

    .logo h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #007acc;
      cursor: pointer;
      text-decoration: none;
    }

    .header-nav {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 6px;
      text-decoration: none;
      color: #6b7280;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .nav-link:hover {
      color: #007acc;
      background-color: #f3f4f6;
    }

    .nav-link.active {
      color: #007acc;
      background-color: #eff6ff;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .theme-toggle,
    .user-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 8px;
      background-color: transparent;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .theme-toggle:hover,
    .user-avatar:hover {
      background-color: #f3f4f6;
      color: #374151;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .header-content {
        padding: 0 16px;
      }

      .menu-toggle {
        display: flex;
      }

      .header-nav {
        display: none;
      }

      .logo h1 {
        font-size: 18px;
      }

      .header-right {
        gap: 8px;
      }
    }

    @media (max-width: 480px) {
      .header-content {
        padding: 0 12px;
      }

      .logo h1 {
        font-size: 16px;
      }

      .theme-toggle,
      .user-avatar {
        width: 36px;
        height: 36px;
      }
    }
  `]
})
export class HeaderComponent {
  @Output() sidebarToggle = new EventEmitter<void>();
  
  sidebarOpen = false;

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.sidebarToggle.emit();
  }

  toggleTheme(): void {
    // Theme toggle functionality can be implemented here
    console.log('Theme toggle clicked');
  }
}