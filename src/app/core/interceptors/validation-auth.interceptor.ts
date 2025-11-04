import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { JwtAuthService } from '../services/jwt-auth.service';

@Injectable()
export class ValidationAuthInterceptor implements HttpInterceptor {
  
  constructor(
    private jwtAuthService: JwtAuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Vérifier si la requête est pour l'API de validation
    if (req.url.includes('/api/validation/')) {
      // Ajouter le token d'authentification
      const token = sessionStorage.getItem('auth-user');;
      if (token) {
        req = req.clone({
          setHeaders: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Gestion des erreurs d'authentification
        if (error.status === 401) {
          console.warn('Token expiré ou invalide - redirection vers login');
          this.jwtAuthService.logout()s;
          this.router.navigate(['/login'], { 
            queryParams: { returnUrl: this.router.url } 
          });
          return throwError(() => new Error('Session expirée. Veuillez vous reconnecter.'));
        }
        
        if (error.status === 403) {
          console.warn('Accès refusé - redirection vers dashboard');
          this.router.navigate(['/dashboard'], { 
            queryParams: { error: 'access_denied' } 
          });
          return throwError(() => new Error('Accès refusé. Vous n\'avez pas les permissions nécessaires.'));
        }

        // Gestion des erreurs de validation
        if (error.status === 400) {
          const errorMessage = error.error?.message || 'Données invalides';
          return throwError(() => new Error(errorMessage));
        }

        // Gestion des erreurs serveur
        if (error.status >= 500) {
          return throwError(() => new Error('Erreur serveur. Veuillez réessayer plus tard.'));
        }

        // Erreur générique
        return throwError(() => new Error(error.message || 'Une erreur est survenue'));
      })
    );
  }
}









