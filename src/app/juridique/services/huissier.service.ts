import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Huissier, HuissierRequest } from '../models/huissier.model';

@Injectable({
  providedIn: 'root'
})
export class HuissierService {
  private readonly baseUrl = `${environment.apiUrl}/api/huissiers`;
  private huissiersSubject = new BehaviorSubject<Huissier[]>([]);
  public huissiers$ = this.huissiersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // CRUD Operations
  createHuissier(huissier: HuissierRequest): Observable<Huissier> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    // Clean phone number to match backend's 8-digit requirement
    const payload: HuissierRequest = { ...huissier, telephone: (huissier.telephone || '').replace(/\D/g, '').slice(-8) };

    return this.http.post<Huissier>(`${this.baseUrl}`, payload, { headers })
      .pipe(
        tap(newHuissier => {
          const currentHuissiers = this.huissiersSubject.value;
          this.huissiersSubject.next([...currentHuissiers, newHuissier]);
        }),
        catchError(this.handleError)
      );
  }

  getHuissierById(id: number): Observable<Huissier> {
    return this.http.get<Huissier>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  getAllHuissiers(): Observable<Huissier[]> {
    return this.http.get<Huissier[]>(`${this.baseUrl}`)
      .pipe(
        tap(huissiers => this.huissiersSubject.next(huissiers)),
        catchError(this.handleError)
      );
  }

  updateHuissier(id: number, huissier: HuissierRequest): Observable<Huissier> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    // Clean phone number to match backend's 8-digit requirement
    const payload: HuissierRequest = { ...huissier, telephone: (huissier.telephone || '').replace(/\D/g, '').slice(-8) };

    return this.http.put<Huissier>(`${this.baseUrl}/${id}`, payload, { headers })
      .pipe(
        tap(updatedHuissier => {
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

  deleteHuissier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(
        tap(() => {
          const currentHuissiers = this.huissiersSubject.value;
          const filteredHuissiers = currentHuissiers.filter(h => h.id !== id);
          this.huissiersSubject.next(filteredHuissiers);
        }),
        catchError(this.handleError)
      );
  }

  // Search Operations
  searchByName(name: string): Observable<Huissier[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<Huissier[]>(`${this.baseUrl}/search/name`, { params })
      .pipe(catchError(this.handleError));
  }

  searchByFirstName(firstName: string): Observable<Huissier[]> {
    const params = new HttpParams().set('firstName', firstName);
    return this.http.get<Huissier[]>(`${this.baseUrl}/search/firstname`, { params })
      .pipe(catchError(this.handleError));
  }

  searchByFullName(name: string, firstName: string): Observable<Huissier[]> {
    const params = new HttpParams()
      .set('name', name)
      .set('firstName', firstName);
    return this.http.get<Huissier[]>(`${this.baseUrl}/search/fullname`, { params })
      .pipe(catchError(this.handleError));
  }

  searchByEmail(email: string): Observable<Huissier> {
    return this.http.get<Huissier>(`${this.baseUrl}/email/${email}`)
      .pipe(catchError(this.handleError));
  }

  searchByPhone(phone: string): Observable<Huissier> {
    return this.http.get<Huissier>(`${this.baseUrl}/phone/${phone}`)
      .pipe(catchError(this.handleError));
  }

  searchBySpecialty(specialty: string): Observable<Huissier[]> {
    return this.http.get<Huissier[]>(`${this.baseUrl}/specialty/${specialty}`)
      .pipe(catchError(this.handleError));
  }

  globalSearch(searchTerm: string): Observable<Huissier[]> {
    const params = new HttpParams().set('searchTerm', searchTerm);
    return this.http.get<Huissier[]>(`${this.baseUrl}/search`, { params })
      .pipe(catchError(this.handleError));
  }

  // Existence Checks
  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/exists/email/${email}`)
      .pipe(catchError(this.handleError));
  }

  checkPhoneExists(phone: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/exists/phone/${phone}`)
      .pipe(catchError(this.handleError));
  }

  // Utility Methods
  /**
   * Récupère les huissiers qui ont au moins un dossier affecté
   * Note: Utilise getAllHuissiers et filtre côté client en vérifiant via l'API des dossiers
   */
  getHuissiersWithDossiers(): Observable<Huissier[]> {
    // Pour l'instant, retourner tous les huissiers
    // Le filtrage réel devrait être fait via l'API des dossiers
    // Si le backend fournit un endpoint spécifique, l'utiliser
    return this.http.get<Huissier[]>(`${this.baseUrl}/with-dossiers`).pipe(
      catchError((error) => {
        // Si l'endpoint n'existe pas, retourner tous les huissiers
        // Le composant pourra filtrer en utilisant getDossiersByHuissier
        if (error.status === 404) {
          console.warn('⚠️ Endpoint /with-dossiers non disponible, retour de tous les huissiers');
          return this.getAllHuissiers();
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Récupère les huissiers qui n'ont aucun dossier affecté
   * Note: Utilise getAllHuissiers et filtre côté client en vérifiant via l'API des dossiers
   */
  getHuissiersWithoutDossiers(): Observable<Huissier[]> {
    // Pour l'instant, retourner tous les huissiers
    // Le filtrage réel devrait être fait via l'API des dossiers
    // Si le backend fournit un endpoint spécifique, l'utiliser
    return this.http.get<Huissier[]>(`${this.baseUrl}/without-dossiers`).pipe(
      catchError((error) => {
        // Si l'endpoint n'existe pas, retourner tous les huissiers
        // Le composant pourra filtrer en utilisant getDossiersByHuissier
        if (error.status === 404) {
          console.warn('⚠️ Endpoint /without-dossiers non disponible, retour de tous les huissiers');
          return this.getAllHuissiers();
        }
        return this.handleError(error);
      })
    );
  }

  // Advanced search with multiple criteria
  advancedSearch(criteria: {
    name?: string;
    firstName?: string;
    email?: string;
    phone?: string;
    specialty?: string;
    searchTerm?: string;
  }): Observable<Huissier[]> {
    let params = new HttpParams();
    
    if (criteria.searchTerm) {
      return this.globalSearch(criteria.searchTerm);
    }
    
    if (criteria.name && criteria.firstName) {
      return this.searchByFullName(criteria.name, criteria.firstName);
    }
    
    if (criteria.name) {
      return this.searchByName(criteria.name);
    }
    
    if (criteria.firstName) {
      return this.searchByFirstName(criteria.firstName);
    }
    
    if (criteria.email) {
      return this.searchByEmail(criteria.email).pipe(
        map(huissier => [huissier])
      );
    }
    
    if (criteria.phone) {
      return this.searchByPhone(criteria.phone).pipe(
        map(huissier => [huissier])
      );
    }
    
    if (criteria.specialty) {
      return this.searchBySpecialty(criteria.specialty);
    }
    
    return this.getAllHuissiers();
  }

  // Get current huissiers from BehaviorSubject
  getCurrentHuissiers(): Huissier[] {
    return this.huissiersSubject.value;
  }

  // Refresh huissiers list
  refreshHuissiers(): void {
    this.getAllHuissiers().subscribe();
  }

  private handleError = (error: any): Observable<never> => {
    console.error('❌ HuissierService Error:', error);
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 400) {
      errorMessage = 'Données invalides';
    } else if (error.status === 404) {
      errorMessage = 'Huissier non trouvé';
    } else if (error.status === 409) {
      errorMessage = 'Conflit: Email ou téléphone déjà utilisé';
    } else if (error.status === 500) {
      errorMessage = 'Erreur serveur';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  };
}