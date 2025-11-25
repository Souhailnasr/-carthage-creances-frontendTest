import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreancierApi, CreancierRequest } from '../../shared/models/creancier-api.model';

@Injectable({
  providedIn: 'root'
})
export class CreancierApiService {
  private apiUrl = 'http://localhost:8089/carthage-creance/api/creanciers';

  constructor(
    private http: HttpClient,
    
  ) {}

  /**private getHeaders(): HttpHeaders {
    // Pour test sans JWT
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }**/

  private mapPayload(creancier: CreancierRequest): any {
    // Créer un payload propre avec uniquement les champs attendus par le backend
    const payload: any = {
      type: creancier.typeCreancier || 'PERSONNE_PHYSIQUE',
      codeCreancier: creancier.codeCreancier || '',
      codeCreance: creancier.codeCreance || '',
      nom: creancier.nom || '',
      prenom: creancier.prenom || '',
      email: creancier.email || '',
      telephone: creancier.telephone || '',
      adresse: creancier.adresse || '',
      ville: creancier.ville || '',
      codePostal: creancier.codePostal || '',
      fax: creancier.fax || ''
    };
    
    // Log pour déboguer
    console.log('📤 Payload envoyé au backend:', payload);
    
    return payload;
  }

  // ===== CRUD =====
  createCreancier(creancier: CreancierRequest): Observable<CreancierApi> {
    const payload = this.mapPayload(creancier);
    return this.http.post<CreancierApi>(this.apiUrl, payload)
      .pipe(
        catchError(error => {
          console.error('❌ Erreur lors de la création du créancier:', error);
          console.error('📋 Payload envoyé:', payload);
          console.error('📋 Réponse backend:', error.error);
          console.error('📋 Status:', error.status, error.statusText);
          return throwError(() => error);
        })
      );
  }

  getCreancierById(id: number): Observable<CreancierApi> {
    return this.http.get<CreancierApi>(`${this.apiUrl}/${id}`)
      .pipe(catchError(error => throwError(() => error)));
  }

  getAllCreanciers(): Observable<CreancierApi[]> {
    return this.http.get<CreancierApi[]>(this.apiUrl)
      .pipe(catchError(error => throwError(() => error)));
  }

  updateCreancier(id: number, creancier: CreancierRequest): Observable<CreancierApi> {
    const payload = this.mapPayload(creancier);
    return this.http.put<CreancierApi>(`${this.apiUrl}/${id}`, payload)
      .pipe(
        catchError(error => {
          console.error('❌ Erreur lors de la mise à jour du créancier:', error);
          console.error('📋 Payload envoyé:', payload);
          console.error('📋 Réponse backend:', error.error);
          return throwError(() => error);
        })
      );
  }

  deleteCreancier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(error => throwError(() => error)));
  }

  // ===== RECHERCHE =====
  getCreancierByCode(codeCreancier: string): Observable<CreancierApi> {
    return this.http.get<CreancierApi>(`${this.apiUrl}/code/${codeCreancier}`)
      .pipe(catchError(error => throwError(() => error)));
  }

  getCreanciersByName(name: string): Observable<CreancierApi[]> {
    return this.http.get<CreancierApi[]>(`${this.apiUrl}/search/name?name=${name}`)
      .pipe(catchError(error => throwError(() => error)));
  }

  getCreanciersByFirstName(firstName: string): Observable<CreancierApi[]> {
    return this.http.get<CreancierApi[]>(`${this.apiUrl}/search/firstname?firstName=${firstName}`)
      .pipe(catchError(error => throwError(() => error)));
  }

  getCreanciersByFullName(name: string, firstName: string): Observable<CreancierApi[]> {
    return this.http.get<CreancierApi[]>(`${this.apiUrl}/search/fullname?name=${name}&firstName=${firstName}`)
      .pipe(catchError(error => throwError(() => error)));
  }

  getCreancierByEmail(email: string): Observable<CreancierApi> {
    return this.http.get<CreancierApi>(`${this.apiUrl}/email/${email}`)
      .pipe(catchError(error => throwError(() => error)));
  }

  getCreancierByPhone(phone: string): Observable<CreancierApi> {
    return this.http.get<CreancierApi>(`${this.apiUrl}/phone/${phone}`)
      .pipe(catchError(error => throwError(() => error)));
  }

  getCreanciersByCity(city: string): Observable<CreancierApi[]> {
    return this.http.get<CreancierApi[]>(`${this.apiUrl}/city/${city}`)
      .pipe(catchError(error => throwError(() => error)));
  }

  getCreanciersByPostalCode(postalCode: string): Observable<CreancierApi[]> {
    return this.http.get<CreancierApi[]>(`${this.apiUrl}/postal-code/${postalCode}`)
      .pipe(catchError(error => throwError(() => error)));
  }

  getCreanciersByCityAndPostalCode(city: string, postalCode: string): Observable<CreancierApi[]> {
    return this.http.get<CreancierApi[]>(`${this.apiUrl}/city-postal?city=${city}&postalCode=${postalCode}`)
      .pipe(catchError(error => throwError(() => error)));
  }

  searchCreanciers(searchTerm: string): Observable<CreancierApi[]> {
    return this.http.get<CreancierApi[]>(`${this.apiUrl}/search?searchTerm=${searchTerm}`)
      .pipe(catchError(error => throwError(() => error)));
  }

  // ===== VALIDATION =====
  existsByEmail(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists/email/${email}`)
      .pipe(catchError(error => throwError(() => error)));
  }

  existsByPhone(phone: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists/phone/${phone}`)
      .pipe(catchError(error => throwError(() => error)));
  }

  existsByCode(codeCreancier: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists/code/${codeCreancier}`)
      .pipe(catchError(error => throwError(() => error)));
  }
}
