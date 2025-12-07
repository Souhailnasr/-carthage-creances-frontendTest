import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { JwtAuthService } from '../services/jwt-auth.service';

/**
 * Extrait le token JWT depuis sessionStorage
 * Gère le cas où auth-user contient un objet JSON au lieu du token directement
 */
function extractJwtToken(): string | null {
  const authUser = sessionStorage.getItem('auth-user');
  if (!authUser) {
    return null;
  }

  // Si c'est déjà un token JWT (commence par "eyJ" pour JWT standard)
  if (authUser.startsWith('eyJ')) {
    return authUser;
  }

  // Si c'est un objet JSON stringifié, essayer de le parser
  try {
    const parsed = JSON.parse(authUser);
    // Chercher le token dans différentes propriétés possibles
    const token = parsed.accessToken || parsed.token || parsed.access_token || parsed.jwt;
    if (token && typeof token === 'string' && token.startsWith('eyJ')) {
      console.warn('⚠️ Token trouvé dans un objet JSON, extraction du token JWT');
      return token;
    }
  } catch (e) {
    // Ce n'est pas du JSON, retourner tel quel
  }

  // Si ce n'est ni un token JWT ni un objet JSON valide, retourner null
  console.warn('⚠️ Format de token invalide dans auth-user:', authUser.substring(0, 50));
  return null;
}

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const jwtAuthService = inject(JwtAuthService);
  const router = inject(Router);
  const token = extractJwtToken(); // Extraire le token JWT correctement

  // Log pour debug - TOUTES les requêtes
  console.log('🔍 AuthInterceptor - Requête vers:', req.url);
  console.log('🔍 Token disponible:', !!token);
  
  if (token) {
    // Log les premiers caractères du token pour vérification (sans exposer le token complet)
    const tokenPreview = token.length > 20 ? token.substring(0, 20) + '...' : token.substring(0, token.length);
    console.log('🔍 Token JWT (premiers caractères):', tokenPreview);
  } else {
    console.warn('⚠️ AuthInterceptor - Aucun token disponible');
  }

  if (token) {
    // 🔧 CORRECTION: Gestion spéciale pour FormData
    let cloned;
    if (req.body instanceof FormData) {
      // Pour FormData, on peut ajouter le token mais NE PAS modifier le Content-Type
      // Le navigateur définit automatiquement le Content-Type avec le bon boundary
      cloned = req.clone({
        setHeaders: {
          'Authorization': `Bearer ${token}`
          // ❌ NE PAS ajouter 'Content-Type' ici - le navigateur le fait automatiquement
        }
      });
      console.log('📋 FormData détecté - Token JWT ajouté, Content-Type géré par le navigateur');
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
          
          // Nettoyer complètement (logOut() gère déjà la redirection dans finalize())
          jwtAuthService.logOut().subscribe({
            next: () => console.log('✅ Logout automatique effectué (401)'),
            error: (logoutError) => console.error('❌ Erreur lors du logout automatique:', logoutError)
          });
          
          return throwError(() => new Error('Session expirée. Veuillez vous reconnecter.'));
        }
        
        // Pour toutes les autres erreurs, les renvoyer telles quelles
        return throwError(() => error);
      })
    );
  }
  
  // ✅ CORRECTION : Autoriser les endpoints de réinitialisation de mot de passe sans token
  // Si pas de token et que la requête n'est pas pour /auth (login/register/logout/reset-password), rediriger
  // Note: /auth/logout peut être appelé sans token si le token a déjà été supprimé, on l'autorise quand même
  // Note: /auth/reset-password ne nécessite pas de token (le token est dans l'URL en query param)
  if (!req.url.includes('/auth/authenticate') && 
      !req.url.includes('/auth/register') && 
      !req.url.includes('/auth/logout') && 
      !req.url.includes('/auth/reset-password') && 
      !req.url.includes('/login')) {
    console.warn('⚠️ AuthInterceptor - Requête non authentifiée, redirection vers login');
    // ✅ CORRECTION : Ne pas rediriger si l'utilisateur est déjà sur /reset-password ou /forgot-password
    const currentUrl = router.url;
    if (!currentUrl.includes('/login') && 
        !currentUrl.includes('/reset-password') && 
        !currentUrl.includes('/forgot-password')) {
      router.navigate(['/login'], {
        queryParams: { returnUrl: router.url }
      });
    }
  }
  
  // Pour /auth/logout, permettre la requête même sans token (cas où le token a déjà été supprimé)
  if (req.url.includes('/auth/logout')) {
    console.log('🔐 AuthInterceptor - Requête /auth/logout détectée');
    if (token) {
      const tokenPreview = token.length > 20 ? token.substring(0, 20) + '...' : token.substring(0, token.length);
      console.log('✅ Token disponible pour logout:', tokenPreview);
      console.log('✅ Header Authorization: Bearer {token} sera ajouté automatiquement');
    } else {
      console.warn('⚠️ Pas de token pour logout, requête envoyée sans header Authorization');
      console.warn('⚠️ Le backend ne pourra pas mettre à jour derniere_deconnexion sans token');
    }
  } else {
    console.warn('⚠️ AuthInterceptor - Requête envoyée sans token');
  }
  
  return next(req);
};
