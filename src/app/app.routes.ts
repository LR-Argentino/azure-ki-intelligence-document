import { Routes } from '@angular/router';
import { DocumentLoadedGuard } from './core/guards/document-loaded.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/upload',
    pathMatch: 'full'
  },
  {
    path: 'upload',
    loadComponent: () => import('./features/document-upload/document-upload.component').then(m => m.DocumentUploadComponent),
    title: 'Upload Document - Azure Document Intelligence'
  },
  {
    path: 'viewer/:id',
    loadComponent: () => import('./features/document-viewer/document-viewer.component').then(m => m.DocumentViewerComponent),
    canActivate: [DocumentLoadedGuard],
    title: 'Document Viewer - Azure Document Intelligence'
  },
  {
    path: 'chat/:id',
    loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent),
    canActivate: [DocumentLoadedGuard],
    title: 'Document Chat - Azure Document Intelligence'
  },
  {
    path: '**',
    redirectTo: '/upload'
  }
];
