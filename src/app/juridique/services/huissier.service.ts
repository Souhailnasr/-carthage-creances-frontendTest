import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Huissier, HuissierRequest } from '../models/huissier.model';

@Injectable({
  providedIn: 'root'
})
export class HuissierService {
  private baseUrl = 'http://localhost:8089/carthage-creance/api';
  private huissiersSubject = new BehaviorSubject<Huissier[]>([]);
  public huissiers$ = this.huissiersSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtenir tous les huissiers depuis l'API backend
   */
  getAllHuissiers(): Observable<Huissier[]> {
    return this.http.get<Huissier[]>(`${this.baseUrl}/huissiers`)
      .pipe(
        tap(data => {
          this.huissiersSubject.next(data);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir un huissier par ID depuis l'API backend
   */
  getHuissierById(id: number): Observable<Huissier> {
    return this.http.get<Huissier>(`${this.baseUrl}/huissiers/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Créer un nouvel huissier via l'API backend
   */
  createHuissier(huissier: HuissierRequest): Observable<Huissier> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    console.log('🔵 HuissierService.createHuissier appelé');
    console.log('🔵 URL:', `${this.baseUrl}/huissiers`);
    console.log('🔵 Données envoyées:', huissier);

    return this.http.post<Huissier>(`${this.baseUrl}/huissiers`, huissier, { headers })
      .pipe(
        tap(newHuissier => {
          console.log('✅ Huissier créé avec succès:', newHuissier);
          // Mettre à jour la liste locale après création
          const currentHuissiers = this.huissiersSubject.value;
          this.huissiersSubject.next([...currentHuissiers, newHuissier]);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Mettre à jour un huissier via l'API backend
   */
  updateHuissier(id: number, huissier: HuissierRequest): Observable<Huissier> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put<Huissier>(`${this.baseUrl}/huissiers/${id}`, huissier, { headers })
      .pipe(
        tap(updatedHuissier => {
          // Mettre à jour la liste locale après modification
          const currentHuissiers = this.huissiersSubject.value;
          const index = currentHuissiers.findIndex(h => h.id === id);
          if (index !== -1) {
            currentHuissiers[index] = updatedHuissier;
            this.huissiersSubject.next([...currentHuissiers]);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Supprimer un huissier via l'API backend
   */
  deleteHuissier(id: number): Observable<void> {
    const deleteUrl = `${this.baseUrl}/huissiers/${id}`;
    console.log('🗑️ Suppression huissier - URL:', deleteUrl);
    console.log('🗑️ ID huissier à supprimer:', id);
    
    return this.http.delete<void>(deleteUrl)
      .pipe(
        tap(() => {
          console.log('✅ Huissier supprimé avec succès, ID:', id);
          // Mettre à jour la liste locale après suppression
          const currentHuissiers = this.huissiersSubject.value;
          const filteredHuissiers = currentHuissiers.filter(h => h.id !== id);
          this.huissiersSubject.next(filteredHuissiers);
        }),
        catchError((error) => {
          console.error('❌ Erreur lors de la suppression:', error);
          return this.handleError(error);
        })
      );
  }

  /**
   * Rechercher des huissiers via l'API backend
   */
  searchHuissiers(searchTerm: string): Observable<Huissier[]> {
    return this.http.get<Huissier[]>(`${this.baseUrl}/huissiers/search?q=${encodeURIComponent(searchTerm)}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Activer/Désactiver un huissier via l'API backend
   */
  toggleHuissierStatus(id: number, actif: boolean): Observable<Huissier> {
    return this.http.patch<Huissier>(`${this.baseUrl}/huissiers/${id}/status`, { actif })
      .pipe(
        tap(updatedHuissier => {
          // Mettre à jour la liste locale après changement de statut
          const currentHuissiers = this.huissiersSubject.value;
          const index = currentHuissiers.findIndex(h => h.id === id);
          if (index !== -1) {
            currentHuissiers[index] = updatedHuissier;
            this.huissiersSubject.next([...currentHuissiers]);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Gérer les erreurs HTTP
   */
  private handleError(error: any): Observable<never> {
    console.error('❌ Erreur dans HuissierService:', error);
    
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
