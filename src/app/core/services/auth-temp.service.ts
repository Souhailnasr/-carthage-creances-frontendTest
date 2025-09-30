import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthTempService {
  private baseUrl = 'http://localhost:8089/carthage-creance';

  constructor(private http: HttpClient) { }

  /**
   * Méthode temporaire pour contourner l'authentification JWT
   * En attendant la configuration complète de l'authentification
   */
  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
  }

  /**
   * Test de connectivité avec le backend
   */
  testConnection(): Observable<boolean> {
    return this.http.get(`${this.baseUrl}/api/creanciers`, { 
      headers: this.getAuthHeaders(),
      observe: 'response'
    }).pipe(
      map(response => response.status === 200),
      catchError(error => {
        console.log('Backend non accessible, utilisation des données mock:', error.status);
        return of(false);
      })
    );
  }

  /**
   * Vérifier si le backend est accessible
   */
  isBackendAvailable(): Observable<boolean> {
    return this.testConnection();
  }
}
