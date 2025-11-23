import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserDiagnosticService {
  private baseUrl = 'http://localhost:8089/carthage-creance/api';

  constructor(private http: HttpClient) {}

  /**
   * Test de création d'utilisateur avec diagnostic détaillé
   */
  testCreateUser(userData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    console.log('🔍 DIAGNOSTIC - Test de création d\'utilisateur');
    console.log('🔍 URL:', `${this.baseUrl}/users`);
    console.log('🔍 Données à envoyer:', JSON.stringify(userData, null, 2));
    console.log('🔍 Headers:', headers);

    return this.http.post(`${this.baseUrl}/users`, userData, { 
      headers,
      observe: 'response' // Pour avoir accès aux headers de réponse
    }).pipe(
      tap(response => {
        console.log('🔍 DIAGNOSTIC - Réponse reçue:');
        console.log('🔍 Status:', response.status);
        console.log('🔍 Headers:', response.headers);
        console.log('🔍 Body:', response.body);
      }),
      catchError(error => {
        console.log('🔍 DIAGNOSTIC - Erreur détaillée:');
        console.log('🔍 Status:', error.status);
        console.log('🔍 StatusText:', error.statusText);
        console.log('🔍 Headers:', error.headers);
        console.log('🔍 Error body:', error.error);
        console.log('🔍 Full error:', error);
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Test de validation des rôles
   */
  testRoleValidation(): Observable<any> {
    const testRoles = [
      'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE',
      'AGENT_RECOUVREMENT_JURIDIQUE',
      'SUPER_ADMIN'
    ];

    console.log('🔍 DIAGNOSTIC - Test de validation des rôles');
    
    // Test avec un utilisateur minimal
    const testUser = {
      nom: 'Test',
      prenom: 'User',
      email: 'test@example.com',
      roleUtilisateur: 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE',
      motDePasse: 'password123',
      actif: true
    };

    return this.testCreateUser(testUser);
  }
}





























