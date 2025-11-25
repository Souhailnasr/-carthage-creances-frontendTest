import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { User } from '../../shared/models';
import { Router } from '@angular/router';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class JwtAuthService {
  private baseUrl = 'http://localhost:8089/carthage-creance';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/auth/authenticate`,
      {
        email,
        password,
      },
      httpOptions
    );
  }

  getDecodedAccessToken(token: string | null): any {
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (error) {
    return null;
  }
}


  isUserLoggedIn() {
    const token = this.getToken(); // Utilise extractJwtToken() qui gère les objets JSON
    return token !== null;
  }

  loggedUserAuthority() {
  if (this.isUserLoggedIn()) {
    const token = this.getToken(); // Utilise extractJwtToken() qui gère les objets JSON
    if (!token) return null; // 🔒 handle the null case
    const decoded = this.getDecodedAccessToken(token);
    return decoded?.roles?.[0]?.authority || decoded?.role?.[0]?.authority || null;
  }
  return null;
}

getCurrentUser(): Observable<User> {
    const token = this.getToken(); // Utilise extractJwtToken() qui gère les objets JSON
    const currentUser = this.getDecodedAccessToken(token);
    return this.http.get<User>(`${this.baseUrl}/api/users/email/${currentUser?.sub}`);
  }

  /**
   * Extrait l'ID de l'utilisateur depuis le token JWT
   * @returns L'ID de l'utilisateur connecté ou null si non disponible
   */
  getCurrentUserId(): number | null {
    const token = this.getToken(); // Utilise extractJwtToken() qui gère les objets JSON
    if (!token) {
      console.warn('⚠️ Aucun token JWT trouvé dans sessionStorage');
      return null;
    }
    
    const decoded = this.getDecodedAccessToken(token);
    if (!decoded) {
      console.warn('⚠️ Impossible de décoder le token JWT');
      return null;
    }
    
    // Le token JWT contient userId dans le payload
    const userId = decoded.userId || decoded.sub || decoded.id;
    if (!userId) {
      console.warn('⚠️ userId non trouvé dans le token JWT décodé:', decoded);
      return null;
    }
    
    const userIdNumber = Number(userId);
    if (isNaN(userIdNumber) || userIdNumber <= 0) {
      console.warn('⚠️ userId invalide dans le token JWT:', userId);
      return null;
    }
    
    console.log('✅ ID utilisateur extrait du token JWT:', userIdNumber);
    return userIdNumber;
  }

  /**
   * Déconnexion de l'utilisateur
   * Appelle l'endpoint /auth/logout avec le token JWT (ajouté automatiquement par l'interceptor)
   * Nettoie tous les tokens du storage après le logout
   */
  logOut(): Observable<any> {
    console.log('🔄 Début du processus de logout');
    
    // Récupérer le token avant de le supprimer (utilise extractJwtToken() qui gère les objets JSON)
    const token = this.getToken();
    
    if (!token) {
      console.warn('⚠️ Aucun token trouvé, nettoyage du storage uniquement');
      this.clearAllStorage();
      this.router.navigate(['/login'], { replaceUrl: true });
      return of({ message: 'Déconnexion locale effectuée (pas de token)' });
    }

    // Log les premiers caractères du token pour vérification (sans exposer le token complet)
    const tokenPreview = token.length > 20 ? token.substring(0, 20) + '...' : token.substring(0, token.length);
    console.log('🔄 Appel logout avec token:', tokenPreview);
    console.log('🔄 URL de logout:', `${this.baseUrl}/auth/logout`);
    
    // L'interceptor AuthInterceptor ajoutera automatiquement le header Authorization: Bearer {token}
    // pour toutes les requêtes, y compris /auth/logout
    return this.http.post(`${this.baseUrl}/auth/logout`, {}, httpOptions).pipe(
      tap((response) => {
        console.log('✅ Logout réussi côté backend:', response);
      }),
      catchError((error) => {
        // Même si le backend échoue, on nettoie quand même le frontend
        console.error('❌ Erreur lors du logout backend (non bloquant):', error);
        console.error('❌ Détails de l\'erreur:', {
          status: error?.status,
          statusText: error?.statusText,
          message: error?.message,
          url: error?.url
        });
        console.warn('⚠️ Nettoyage du storage malgré l\'erreur backend');
        return of({ message: 'Déconnexion locale effectuée (erreur backend ignorée)' });
      }),
      finalize(() => {
        // Toujours nettoyer le storage et rediriger, même en cas d'erreur
        this.clearAllStorage();
        console.log('✅ Storage nettoyé, redirection vers /login');
        this.router.navigate(['/login'], { replaceUrl: true });
      })
    );
  }

  /**
   * Nettoie tous les tokens et données utilisateur du storage
   */
  private clearAllStorage(): void {
    console.log('🧹 Nettoyage complet du storage...');
    
    // Supprimer tous les tokens possibles
    sessionStorage.removeItem('auth-user');
    sessionStorage.removeItem('auth-token');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('email');
    
    // Nettoyer aussi localStorage au cas où
    localStorage.removeItem('auth-user');
    localStorage.removeItem('auth-token');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('email');
    
    console.log('✅ Storage complètement nettoyé');
  }

  /**
   * Extrait le token JWT depuis sessionStorage
   * Gère le cas où auth-user contient un objet JSON au lieu du token directement
   */
  private extractJwtToken(): string | null {
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
      // Ce n'est pas du JSON, retourner null
    }

    // Si ce n'est ni un token JWT ni un objet JSON valide, retourner null
    console.warn('⚠️ Format de token invalide dans auth-user:', authUser.substring(0, 50));
    return null;
  }

  /**
   * Récupère le token JWT depuis le storage
   */
  getToken(): string | null {
    return this.extractJwtToken();
  }

}
