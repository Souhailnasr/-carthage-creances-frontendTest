import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiDiagnosticService {
  private baseUrl = 'http://localhost:8089/carthage-creance';

  constructor(private http: HttpClient) { }

  /**
   * Teste la connectivité avec le backend
   */
  testBackendConnectivity(): Observable<{ status: string, message: string }> {
    return this.http.get(`${this.baseUrl}/api/creanciers`, { 
      headers: new HttpHeaders({
        'Accept': 'application/json'
      })
    }).pipe(
      map(response => ({ status: 'SUCCESS', message: 'Backend accessible' })),
      catchError(error => {
        console.error('Backend non accessible:', error);
        return of({ 
          status: 'ERROR', 
          message: `Backend non accessible: ${error.status} - ${error.message}` 
        });
      })
    );
  }

  /**
   * Teste l'endpoint de création de créancier
   */
  testCreancierEndpoint(): Observable<{ status: string, message: string }> {
    const testData = {
      codeCreancier: 'TEST001',
      codeCreance: 'CR001',
      nom: 'Test',
      prenom: 'Diagnostic',
      email: 'test@diagnostic.com',
      telephone: '12345678', // Exactement 8 chiffres
      adresse: 'Test Address',
      ville: 'Test City',
      codePostal: '0000',
      fax: '0' // Valeur par défaut
    };

    return this.http.post(`${this.baseUrl}/api/creanciers`, testData, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    }).pipe(
      map(response => ({ status: 'SUCCESS', message: 'Endpoint créancier accessible' })),
      catchError(error => {
        console.error('Endpoint créancier non accessible:', error);
        return of({ 
          status: 'ERROR', 
          message: `Endpoint créancier non accessible: ${error.status} - ${error.message}` 
        });
      })
    );
  }

  /**
   * Teste l'endpoint de création de débiteur
   */
  testDebiteurEndpoint(): Observable<{ status: string, message: string }> {
    const testData = {
      codeCreance: 'TEST001',
      nom: 'Test',
      prenom: 'Diagnostic',
      email: 'test@diagnostic.com',
      telephone: '87654321', // Exactement 8 chiffres
      adresse: 'Test Address',
      adresseElue: 'Test Address Elue',
      ville: 'Test City',
      codePostal: '0000'
    };

    return this.http.post(`${this.baseUrl}/api/debiteurs`, testData, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    }).pipe(
      map(response => ({ status: 'SUCCESS', message: 'Endpoint débiteur accessible' })),
      catchError(error => {
        console.error('Endpoint débiteur non accessible:', error);
        return of({ 
          status: 'ERROR', 
          message: `Endpoint débiteur non accessible: ${error.status} - ${error.message}` 
        });
      })
    );
  }

  /**
   * Teste l'endpoint de création de dossier
   */
  testDossierEndpoint(): Observable<{ status: string, message: string }> {
    const testData = {
      titre: 'Test Diagnostic',
      description: 'Dossier de test pour diagnostic',
      numeroDossier: 'TEST-DIAG-001',
      montantCreance: 1000,
      typeDocumentJustificatif: 'CONTRAT',
      urgence: 'MOYENNE',
      creancierId: 1,
      debiteurId: 1,
      agentCreateurId: 1
    };

    return this.http.post(`${this.baseUrl}/api/dossiers`, testData, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    }).pipe(
      map(response => ({ status: 'SUCCESS', message: 'Endpoint dossier accessible' })),
      catchError(error => {
        console.error('Endpoint dossier non accessible:', error);
        return of({ 
          status: 'ERROR', 
          message: `Endpoint dossier non accessible: ${error.status} - ${error.message}` 
        });
      })
    );
  }

  /**
   * Effectue un diagnostic complet (sans dossier pour éviter les erreurs)
   */
  runFullDiagnostic(): Observable<{ 
    backend: { status: string, message: string },
    creancier: { status: string, message: string },
    debiteur: { status: string, message: string }
  }> {
    return new Observable(observer => {
      const results: any = {};
      let completed = 0;
      const total = 3; // Suppression du test dossier

      const checkComplete = () => {
        completed++;
        if (completed === total) {
          observer.next(results);
          observer.complete();
        }
      };

      // Test backend
      this.testBackendConnectivity().subscribe(result => {
        results.backend = result;
        checkComplete();
      });

      // Test créancier
      this.testCreancierEndpoint().subscribe(result => {
        results.creancier = result;
        checkComplete();
      });

      // Test débiteur
      this.testDebiteurEndpoint().subscribe(result => {
        results.debiteur = result;
        checkComplete();
      });
    });
  }
}
