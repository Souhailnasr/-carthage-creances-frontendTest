import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../services/toast.service';

export const ErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'Une erreur est survenue';

      if (error.error instanceof ErrorEvent) {
        message = `Erreur: ${error.error.message}`;
      } else {
        switch (error.status) {
          case 0:
            message = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
            break;
          case 400:
            message = error.error?.error || 'Requête invalide.';
            break;
          case 401:
            message = 'Session expirée. Veuillez vous reconnecter.';
            router.navigate(['/login']);
            break;
          case 403:
            message = 'Accès interdit pour cette ressource.';
            break;
          case 404:
            message = error.error?.error || 'Ressource introuvable.';
            break;
          case 500:
            message = 'Erreur interne du serveur. Réessayez plus tard.';
            break;
          default:
            message = error.error?.error || `Erreur ${error.status}`;
        }
      }

      console.error('HTTP Error:', message, error);
      toastService.showError(message);
      return throwError(() => new Error(message));
    })
  );
};
