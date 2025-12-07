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
      // ✅ CORRECTION : Ignorer les erreurs pour les endpoints avec le header 'X-Skip-Error-Toast'
      // Cela permet au composant de gérer l'erreur silencieusement (ex: fallback)
      if (req.headers.has('X-Skip-Error-Toast')) {
        console.warn('⚠️ Erreur ignorée par l\'intercepteur (gérée localement):', error.url, error.status);
        // Propager l'erreur sans afficher le toast
        const customError: any = new Error(error.message || 'Erreur gérée localement');
        customError.status = error.status;
        customError.statusText = error.statusText;
        customError.error = error.error;
        customError.url = error.url;
        customError.originalError = error;
        return throwError(() => customError);
      }
      
      let message = 'Une erreur est survenue';

      if (error.error instanceof ErrorEvent) {
        message = `Erreur: ${error.error.message}`;
      } else {
        switch (error.status) {
          case 0:
            message = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
            break;
          case 400:
            // Essayer plusieurs formats de message d'erreur du backend
            if (error.error) {
              if (typeof error.error === 'string') {
                message = error.error;
              } else if (error.error.message) {
                message = error.error.message;
              } else if (error.error.error) {
                message = error.error.error;
              } else if (error.error.detail) {
                message = error.error.detail;
              } else {
                message = JSON.stringify(error.error);
              }
            } else {
              message = 'Requête invalide.';
            }
            console.error('❌ Erreur 400 - Détails:', {
              error: error.error,
              errorString: typeof error.error === 'string' ? error.error : JSON.stringify(error.error),
              message: message
            });
            break;
          case 401:
            message = 'Session expirée. Veuillez vous reconnecter.';
            // ✅ CORRECTION : Ne pas rediriger vers /login si l'utilisateur est sur /reset-password ou /forgot-password
            // Ces pages gèrent elles-mêmes les erreurs 401 (token invalide/expiré)
            const currentUrl = router.url;
            if (!currentUrl.includes('/reset-password') && !currentUrl.includes('/forgot-password')) {
              router.navigate(['/login']);
            }
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
      
      // Préserver les détails de l'erreur originale dans une erreur personnalisée
      const customError: any = new Error(message);
      customError.status = error.status;
      customError.statusText = error.statusText;
      customError.error = error.error;
      customError.url = error.url;
      customError.originalError = error;
      
      return throwError(() => customError);
    })
  );
};
