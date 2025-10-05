import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class JwtAuthService {
  private baseUrl = 'http://localhost:8089/carthage-creance';
  private tokenKey = 'authToken';
  private currentTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {
    // Charger le token depuis le localStorage au démarrage
    const savedToken = localStorage.getItem(this.tokenKey);
    if (savedToken) {
      this.currentTokenSubject.next(savedToken);
    }
  }

  /**
   * Obtenir le token actuel
   */
  getCurrentToken(): string | null {
    return this.currentTokenSubject.value;
  }

  /**
   * Obtenir les headers avec authentification
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getCurrentToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (token) {
      return headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Se connecter et obtenir un token JWT
   */
  login(email: string, password: string): Observable<LoginResponse> {
    const loginRequest: LoginRequest = { email, password };
    
    return this.http.post<LoginResponse>(`${this.baseUrl}/api/auth/login`, loginRequest)
      .pipe(
        tap(response => {
          // Sauvegarder le token
          localStorage.setItem(this.tokenKey, response.token);
          this.currentTokenSubject.next(response.token);
          console.log('Token JWT obtenu:', response.token);
        }),
        catchError(error => {
          console.error('Erreur de connexion:', error);
          throw error;
        })
      );
  }

  /**
   * Se connecter avec des credentials de développement
   */
  loginDev(): Observable<LoginResponse> {
    // Essayer plusieurs credentials possibles
    const credentials = [
      { email: 'admin@carthage-creance.com', password: 'admin123' },
      { email: 'admin', password: 'admin' },
      { email: 'user@test.com', password: 'password' },
      { email: 'test@test.com', password: 'test123' }
    ];
    
    // Pour l'instant, utiliser le premier set de credentials
    return this.login(credentials[0].email, credentials[0].password);
  }

  /**
   * Se déconnecter
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentTokenSubject.next(null);
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return this.getCurrentToken() !== null;
  }

  /**
   * Obtenir le token pour les requêtes API
   */
  getTokenForApi(): string {
    const token = this.getCurrentToken();
    if (!token) {
      console.warn('Aucun token JWT disponible');
    }
    return token || '';
  }

  // Obtenir l'utilisateur courant (mock minimal pour éviter les erreurs au runtime)
  getCurrentUser(): any {
    return {
      id: 1,
      nom: 'Smith',
      prenom: 'Jane',
      email: 'jane.smith@carthage-creance.tn',
      role: 'CHEF_DEPARTEMENT_DOSSIER',
      actif: true
    };
  }

  // Alias pratique
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }
}
