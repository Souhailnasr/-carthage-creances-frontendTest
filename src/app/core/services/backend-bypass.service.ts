import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BackendBypassService {
  private baseUrl = 'http://localhost:8089/carthage-creance';

  constructor(private http: HttpClient) { }

  /**
   * Tester si le backend est accessible sans authentification
   */
  testBackendAccess(): Observable<boolean> {
    // Essayer d'accéder à un endpoint public ou de santé
    return this.http.get(`${this.baseUrl}/actuator/health`, { 
      headers: this.getBypassHeaders(),
      observe: 'response'
    }).pipe(
      map(response => response.status === 200),
      catchError(error => {
        console.log('Backend non accessible sans auth:', error.status);
        return of(false);
      })
    );
  }

  /**
   * Headers pour contourner l'authentification (temporaire)
   */
  getBypassHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Bypass-Auth': 'true', // Header personnalisé pour le développement
      'X-Development-Mode': 'true'
    });
  }

  /**
   * Vérifier si le backend a un endpoint de santé
   */
  checkHealthEndpoint(): Observable<any> {
    return this.http.get(`${this.baseUrl}/actuator/health`, { 
      headers: this.getBypassHeaders()
    }).pipe(
      catchError(error => {
        console.log('Endpoint de santé non disponible:', error);
        return of({ status: 'DOWN', error: error.message });
      })
    );
  }

  /**
   * Essayer de créer un utilisateur de test
   */
  createTestUser(): Observable<any> {
    const testUser = {
      email: 'admin@carthage-creance.com',
      password: 'admin123',
      nom: 'Admin',
      prenom: 'System',
      role: 'SUPER_ADMIN'
    };

    return this.http.post(`${this.baseUrl}/auth/register`, testUser, {
      headers: this.getBypassHeaders()
    }).pipe(
      catchError(error => {
        console.log('Impossible de créer un utilisateur de test:', error);
        return of({ error: 'Registration endpoint not available' });
      })
    );
  }
}
