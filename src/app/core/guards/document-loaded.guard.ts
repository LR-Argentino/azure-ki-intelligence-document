import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DocumentService } from '../services/document.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentLoadedGuard implements CanActivate {

  constructor(
    private documentService: DocumentService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const documentId = route.paramMap.get('id');
    
    if (!documentId) {
      this.router.navigate(['/upload']);
      return of(false);
    }

    return this.documentService.getDocumentById(documentId).pipe(
      map(document => {
        if (document) {
          this.documentService.setCurrentDocument(document);
          return true;
        } else {
          this.router.navigate(['/upload']);
          return false;
        }
      }),
      catchError(() => {
        this.router.navigate(['/upload']);
        return of(false);
      })
    );
  }
}