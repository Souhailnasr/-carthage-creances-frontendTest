import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const ErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError(error => {
      // Ignorer les 404 pour les endpoints de vérification (c'est attendu qu'ils n'existent pas toujours)
      // Par exemple : /api/enquettes/dossier/{id} - un dossier peut ne pas avoir d'enquête
      if (error.status === 404 && req.url.includes('/api/enquettes/dossier/')) {
        // Ne pas logger les 404 pour les vérifications d'existence d'enquête
        // Ces erreurs sont gérées silencieusement dans le service
        return throwError(() => error);
      }
      
      // Logger les autres erreurs
      console.error('HTTP Error:', error);
      // You can add more sophisticated error handling here, e.g., show a toast notification
      return throwError(() => error);
    })
  );
};
