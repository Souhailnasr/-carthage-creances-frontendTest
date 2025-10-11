import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface Avocat {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  specialite?: string;
  actif: boolean;
  dateCreation?: string;
  dateModification?: string;
}

export interface AvocatRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  specialite?: string;
  actif: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AvocatService {
  private baseUrl = 'http://localhost:8089/carthage-creance/api';
  private avocatsSubject = new BehaviorSubject<Avocat[]>([]);
  public avocats$ = this.avocatsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtenir tous les avocats depuis l'API backend
   */
  getAllAvocats(): Observable<Avocat[]> {
    return this.http.get<Avocat[]>(`${this.baseUrl}/avocats`)
      .pipe(
        tap(data => {
          console.log('✅ Avocats chargés depuis la base de données:', data);
          this.avocatsSubject.next(data);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir un avocat par ID depuis l'API backend
   */
  getAvocatById(id: number): Observable<Avocat> {
    return this.http.get<Avocat>(`${this.baseUrl}/avocats/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Créer un nouvel avocat via l'API backend
   */
  createAvocat(avocat: AvocatRequest): Observable<Avocat> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    console.log('🔵 AvocatService.createAvocat appelé');
    console.log('🔵 URL:', `${this.baseUrl}/avocats`);
    console.log('🔵 Données envoyées:', avocat);

    return this.http.post<Avocat>(`${this.baseUrl}/avocats`, avocat, { headers })
      .pipe(
        tap(newAvocat => {
          console.log('✅ Avocat créé avec succès:', newAvocat);
          // Mettre à jour la liste locale après création
          const currentAvocats = this.avocatsSubject.value;
          this.avocatsSubject.next([...currentAvocats, newAvocat]);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Mettre à jour un avocat via l'API backend
   */
  updateAvocat(id: number, avocat: AvocatRequest): Observable<Avocat> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put<Avocat>(`${this.baseUrl}/avocats/${id}`, avocat, { headers })
      .pipe(
        tap(updatedAvocat => {
          // Mettre à jour la liste locale après modification
          const currentAvocats = this.avocatsSubject.value;
          const index = currentAvocats.findIndex(a => a.id === id);
          if (index !== -1) {
            currentAvocats[index] = updatedAvocat;
            this.avocatsSubject.next([...currentAvocats]);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Supprimer un avocat via l'API backend
   */
  deleteAvocat(id: number): Observable<void> {
    const deleteUrl = `${this.baseUrl}/avocats/${id}`;
    console.log('🗑️ Suppression avocat - URL:', deleteUrl);
    console.log('🗑️ ID avocat à supprimer:', id);
    
    return this.http.delete<void>(deleteUrl)
      .pipe(
        tap(() => {
          console.log('✅ Avocat supprimé avec succès, ID:', id);
          // Mettre à jour la liste locale après suppression
          const currentAvocats = this.avocatsSubject.value;
          const filteredAvocats = currentAvocats.filter(a => a.id !== id);
          this.avocatsSubject.next(filteredAvocats);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Activer/Désactiver un avocat via l'API backend
   */
  toggleAvocatStatus(id: number, actif: boolean): Observable<Avocat> {
    return this.http.patch<Avocat>(`${this.baseUrl}/avocats/${id}/status`, { actif })
      .pipe(
        tap(updatedAvocat => {
          // Mettre à jour la liste locale après changement de statut
          const currentAvocats = this.avocatsSubject.value;
          const index = currentAvocats.findIndex(a => a.id === id);
          if (index !== -1) {
            currentAvocats[index] = updatedAvocat;
            this.avocatsSubject.next([...currentAvocats]);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Gérer les erreurs HTTP
   */
  private handleError(error: any): Observable<never> {
    console.error('❌ Erreur dans AvocatService:', error);
    console.error('❌ Status:', error.status);
    console.error('❌ StatusText:', error.statusText);
    console.error('❌ URL:', error.url);
    console.error('❌ Error body:', error.error);
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client (problème réseau, CORS, etc.)
      errorMessage = `Erreur réseau: ${error.error.message}`;
      console.error('❌ Erreur côté client:', error.error);
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
