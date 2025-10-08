import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Audience, AudienceRequest } from '../models/audience.model';

@Injectable({
  providedIn: 'root'
})
export class AudienceService {
  private baseUrl = 'http://localhost:8089/carthage-creance/api';
  private audiencesSubject = new BehaviorSubject<Audience[]>([]);
  public audiences$ = this.audiencesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtenir toutes les audiences depuis l'API backend
   */
  getAllAudiences(): Observable<Audience[]> {
    return this.http.get<Audience[]>(`${this.baseUrl}/audiences`)
      .pipe(
        tap(data => {
          this.audiencesSubject.next(data);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les audiences d'un dossier spécifique
   */
  getAudiencesByDossier(dossierId: number): Observable<Audience[]> {
    return this.http.get<Audience[]>(`${this.baseUrl}/audiences/dossier/${dossierId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir une audience par ID depuis l'API backend
   */
  getAudienceById(id: number): Observable<Audience> {
    return this.http.get<Audience>(`${this.baseUrl}/audiences/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Créer une nouvelle audience via l'API backend
   */
  createAudience(audience: AudienceRequest): Observable<Audience> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    console.log('🔵 AudienceService.createAudience appelé');
    console.log('🔵 URL:', `${this.baseUrl}/audiences`);
    console.log('🔵 Données envoyées:', audience);

    return this.http.post<Audience>(`${this.baseUrl}/audiences`, audience, { headers })
      .pipe(
        tap(newAudience => {
          console.log('✅ Audience créée avec succès:', newAudience);
          // Mettre à jour la liste locale après création
          const currentAudiences = this.audiencesSubject.value;
          this.audiencesSubject.next([...currentAudiences, newAudience]);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Mettre à jour une audience via l'API backend
   */
  updateAudience(id: number, audience: AudienceRequest): Observable<Audience> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put<Audience>(`${this.baseUrl}/audiences/${id}`, audience, { headers })
      .pipe(
        tap(updatedAudience => {
          // Mettre à jour la liste locale après modification
          const currentAudiences = this.audiencesSubject.value;
          const index = currentAudiences.findIndex(a => a.id === id);
          if (index !== -1) {
            currentAudiences[index] = updatedAudience;
            this.audiencesSubject.next([...currentAudiences]);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Supprimer une audience via l'API backend
   */
  deleteAudience(id: number): Observable<void> {
    const deleteUrl = `${this.baseUrl}/audiences/${id}`;
    console.log('🗑️ Suppression audience - URL:', deleteUrl);
    console.log('🗑️ ID audience à supprimer:', id);
    
    return this.http.delete<void>(deleteUrl)
      .pipe(
        tap(() => {
          console.log('✅ Audience supprimée avec succès, ID:', id);
          // Mettre à jour la liste locale après suppression
          const currentAudiences = this.audiencesSubject.value;
          const filteredAudiences = currentAudiences.filter(a => a.id !== id);
          this.audiencesSubject.next(filteredAudiences);
        }),
        catchError((error) => {
          console.error('❌ Erreur lors de la suppression:', error);
          return this.handleError(error);
        })
      );
  }

  /**
   * Rechercher des audiences via l'API backend
   */
  searchAudiences(searchTerm: string): Observable<Audience[]> {
    return this.http.get<Audience[]>(`${this.baseUrl}/audiences/search?q=${encodeURIComponent(searchTerm)}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les audiences par tribunal
   */
  getAudiencesByTribunal(tribunalType: string): Observable<Audience[]> {
    return this.http.get<Audience[]>(`${this.baseUrl}/audiences/tribunal/${tribunalType}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les audiences par avocat
   */
  getAudiencesByAvocat(avocatId: number): Observable<Audience[]> {
    return this.http.get<Audience[]>(`${this.baseUrl}/audiences/avocat/${avocatId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir les audiences par huissier
   */
  getAudiencesByHuissier(huissierId: number): Observable<Audience[]> {
    return this.http.get<Audience[]>(`${this.baseUrl}/audiences/huissier/${huissierId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Gérer les erreurs HTTP
   */
  private handleError(error: any): Observable<never> {
    console.error('❌ Erreur dans AudienceService:', error);
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client (problème réseau, CORS, etc.)
      errorMessage = `Erreur réseau: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      if (error.status === 0) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
      } else if (error.status === 404) {
        errorMessage = 'Endpoint non trouvé. Vérifiez l\'URL du backend.';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur interne.';
      } else {
        errorMessage = `Erreur ${error.status}: ${error.error?.message || error.statusText}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
