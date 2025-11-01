import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { JwtAuthService } from '../services/jwt-auth.service';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const jwtAuthService = inject(JwtAuthService);
  const router = inject(Router);
  const token = sessionStorage.getItem('auth-user');; // getToken() vérifie déjà l'expiration

  // Log pour debug - TOUTES les requêtes
  console.log('🔍 AuthInterceptor - Requête vers:', req.url);
  console.log('🔍 Token disponible:', !!token);
  
  if (token) {
    console.log('🔍 Token (premiers caractères):', token);
  } else {
    console.warn('⚠️ AuthInterceptor - Aucun token disponible');
  }

  if (token) {
    // 🔧 CORRECTION: Gestion spéciale pour FormData
    let cloned;
    if (req.body instanceof FormData) {
      // Pour FormData, on ne peut pas modifier les headers de la même manière
      // Le token doit être ajouté explicitement dans le service
      console.log('📋 FormData détecté - Token doit être ajouté explicitement dans le service');
      cloned = req;
    } else {
      // Pour les requêtes JSON normales
      cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      console.log('✅ AuthInterceptor - Token JWT ajouté à la requête JSON');
    }
    
    // 🔧 CORRECTION: Gérer les erreurs 401 (token expiré)
    return next(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.error('❌ 401 Unauthorized - Token expiré ou invalide');
          
          // Nettoyer complètement
          jwtAuthService.logOut();
          
          // Rediriger vers login (sauf si on est déjà sur /login)
          if (!router.url.includes('/login')) {
            router.navigate(['/login'], {
              queryParams: { returnUrl: router.url, expired: 'true' }
            });
          }
          
          return throwError(() => new Error('Session expirée. Veuillez vous reconnecter.'));
        }
        
        // Pour toutes les autres erreurs, les renvoyer telles quelles
        return throwError(() => error);
      })
    );
  }
  
  // Si pas de token et que la requête n'est pas pour /auth (login/register), rediriger
  if (!req.url.includes('/auth/authenticate') && !req.url.includes('/auth/register') && !req.url.includes('/login')) {
    console.warn('⚠️ AuthInterceptor - Requête non authentifiée, redirection vers login');
    if (!router.url.includes('/login')) {
      router.navigate(['/login'], {
        queryParams: { returnUrl: router.url }
      });
    }
  }
  
  console.warn('⚠️ AuthInterceptor - Requête envoyée sans token');
  return next(req);
};
