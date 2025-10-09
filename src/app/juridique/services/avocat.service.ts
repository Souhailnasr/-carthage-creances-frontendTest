import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Avocat, AvocatRequest } from '../models/avocat.model';

@Injectable({
  providedIn: 'root'
})
export class AvocatService {
  private baseUrl = 'http://localhost:8089/carthage-creance/api';
  private avocatsSubject = new BehaviorSubject<Avocat[]>([]);
  public avocats$ = this.avocatsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ==================== CRUD OPERATIONS ====================

  /**
   * POST /api/avocats → créer un avocat
   */
  createAvocat(avocat: AvocatRequest): Observable<Avocat> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    // Conform to backend: ensure telephone is 8 digits
    const payload: AvocatRequest = {
      ...avocat,
      telephone: (avocat.telephone || '').replace(/\D/g, '').slice(-8)
    };

    return this.http.post<Avocat>(`${this.baseUrl}/avocats`, payload, { headers })
      .pipe(
        tap(newAvocat => {
          const currentAvocats = this.avocatsSubject.value;
          this.avocatsSubject.next([...currentAvocats, newAvocat]);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * GET /api/avocats/{id} → obtenir un avocat par ID
   */
  getAvocatById(id: number): Observable<Avocat> {
    return this.http.get<Avocat>(`${this.baseUrl}/avocats/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * GET /api/avocats → obtenir tous les avocats
   */
  getAllAvocats(): Observable<Avocat[]> {
    return this.http.get<Avocat[]>(`${this.baseUrl}/avocats`)
      .pipe(
        tap(data => {
          this.avocatsSubject.next(data);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * PUT /api/avocats/{id} → modifier un avocat
   */
  updateAvocat(id: number, avocat: AvocatRequest): Observable<Avocat> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const payload: AvocatRequest = {
      ...avocat,
      telephone: (avocat.telephone || '').replace(/\D/g, '').slice(-8)
    };

    return this.http.put<Avocat>(`${this.baseUrl}/avocats/${id}`, payload, { headers })
      .pipe(
        tap(updatedAvocat => {
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
   * DELETE /api/avocats/{id} → supprimer un avocat
   */
  deleteAvocat(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/avocats/${id}`)
      .pipe(
        tap(() => {
          const currentAvocats = this.avocatsSubject.value;
          const filteredAvocats = currentAvocats.filter(a => a.id !== id);
          this.avocatsSubject.next(filteredAvocats);
        }),
        catchError(this.handleError)
      );
  }

  // ==================== SEARCH OPERATIONS ====================

  /**
   * GET /api/avocats/search/name?name= → recherche par nom
   */
  searchByName(name: string): Observable<Avocat[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<Avocat[]>(`${this.baseUrl}/avocats/search/name`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * GET /api/avocats/search/firstname?firstName= → recherche par prénom
   */
  searchByFirstName(firstName: string): Observable<Avocat[]> {
    const params = new HttpParams().set('firstName', firstName);
    return this.http.get<Avocat[]>(`${this.baseUrl}/avocats/search/firstname`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * GET /api/avocats/search/fullname?name=&firstName= → recherche par nom et prénom
   */
  searchByFullName(name: string, firstName: string): Observable<Avocat[]> {
    const params = new HttpParams()
      .set('name', name)
      .set('firstName', firstName);
    return this.http.get<Avocat[]>(`${this.baseUrl}/avocats/search/fullname`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * GET /api/avocats/email/{email} → rechercher par email
   */
  searchByEmail(email: string): Observable<Avocat> {
    return this.http.get<Avocat>(`${this.baseUrl}/avocats/email/${encodeURIComponent(email)}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * GET /api/avocats/phone/{phone} → rechercher par téléphone
   */
  searchByPhone(phone: string): Observable<Avocat> {
    return this.http.get<Avocat>(`${this.baseUrl}/avocats/phone/${encodeURIComponent(phone)}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * GET /api/avocats/specialty/{specialty} → rechercher par spécialité
   */
  searchBySpecialty(specialty: string): Observable<Avocat[]> {
    return this.http.get<Avocat[]>(`${this.baseUrl}/avocats/specialty/${encodeURIComponent(specialty)}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * GET /api/avocats/search?searchTerm= → recherche globale (nom ou prénom)
   */
  globalSearch(searchTerm: string): Observable<Avocat[]> {
    const params = new HttpParams().set('searchTerm', searchTerm);
    return this.http.get<Avocat[]>(`${this.baseUrl}/avocats/search`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  // ==================== EXISTENCE CHECKS ====================

  /**
   * GET /api/avocats/exists/email/{email} → vérifier existence email
   */
  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/avocats/exists/email/${encodeURIComponent(email)}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * GET /api/avocats/exists/phone/{phone} → vérifier existence téléphone
   */
  checkPhoneExists(phone: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/avocats/exists/phone/${encodeURIComponent(phone)}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Méthode de recherche avancée avec filtres multiples
   */
  advancedSearch(filters: {
    name?: string;
    firstName?: string;
    email?: string;
    phone?: string;
    specialty?: string;
    searchTerm?: string;
  }): Observable<Avocat[]> {
    let searchObservable: Observable<Avocat[]>;

    if (filters.searchTerm) {
      searchObservable = this.globalSearch(filters.searchTerm);
    } else if (filters.name && filters.firstName) {
      searchObservable = this.searchByFullName(filters.name, filters.firstName);
    } else if (filters.name) {
      searchObservable = this.searchByName(filters.name);
    } else if (filters.firstName) {
      searchObservable = this.searchByFirstName(filters.firstName);
    } else if (filters.specialty) {
      searchObservable = this.searchBySpecialty(filters.specialty);
    } else {
      searchObservable = this.getAllAvocats();
    }

    return searchObservable.pipe(
      map(avocats => {
        // Filtrage côté client pour les critères supplémentaires
        return avocats.filter(avocat => {
          if (filters.email && !avocat.email.toLowerCase().includes(filters.email.toLowerCase())) {
            return false;
          }
          if (filters.phone && avocat.telephone && !avocat.telephone.includes(filters.phone)) {
            return false;
          }
          return true;
        });
      })
    );
  }

  /**
   * Obtenir les avocats actifs uniquement
   */
  getActiveAvocats(): Observable<Avocat[]> {
    return this.getAllAvocats().pipe(
      map(avocats => avocats.filter(avocat => avocat.actif))
    );
  }

  /**
   * Obtenir les avocats par spécialité avec pagination côté client
   */
  getAvocatsBySpecialty(specialty: string, page: number = 0, size: number = 10): Observable<{
    content: Avocat[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
  }> {
    return this.searchBySpecialty(specialty).pipe(
      map(avocats => {
        const startIndex = page * size;
        const endIndex = startIndex + size;
        const content = avocats.slice(startIndex, endIndex);
        
        return {
          content,
          totalElements: avocats.length,
          totalPages: Math.ceil(avocats.length / size),
          currentPage: page
        };
      })
    );
  }

  /**
   * Bonus: Récupérer les avocats ayant le plus de dossiers (si endpoint existe)
   */
  getTopAvocats(): Observable<Avocat[]> {
    return this.http.get<Avocat[]>(`${this.baseUrl}/avocats/top`)
      .pipe(
        catchError(error => {
          // Si l'endpoint n'existe pas, retourner une liste vide
          if (error.status === 404) {
            return [];
          }
          return this.handleError(error);
        })
      );
  }

  /**
   * Gérer les erreurs HTTP
   */
  private handleError(error: any): Observable<never> {
    console.error('❌ Erreur dans AvocatService:', error);
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur réseau: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
          break;
        case 400:
          errorMessage = error.error?.message || 'Données invalides';
          break;
        case 404:
          errorMessage = error.error?.message || 'Ressource non trouvée';
          break;
        case 409:
          errorMessage = error.error?.message || 'Conflit: cette ressource existe déjà';
          break;
        case 500:
          errorMessage = 'Erreur serveur interne';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.error?.message || error.statusText}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
