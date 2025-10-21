import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { 
  ValidationDossier, 
  ValidationDossierRequest, 
  ValidationDossierResponse, 
  ValidationStats,
  ValidationFilter,
  StatutValidation 
} from '../../shared/models/validation-dossier.model';
import { User } from '../../shared/models/user.model';
import { Dossier } from '../../shared/models/dossier.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ValidationDossierService {
  private readonly baseUrl = 'http://localhost:8089/carthage-creance/api/validation/dossiers';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('Erreur dans ValidationDossierService:', error);
    
    if (error.status === 401) {
      this.authService.logout();
      return throwError(() => new Error('Session expirée. Veuillez vous reconnecter.'));
    }
    
    if (error.status === 403) {
      return throwError(() => new Error('Accès refusé. Vous n\'avez pas les permissions nécessaires.'));
    }
    
    const errorMessage = error.error?.message || error.message || 'Une erreur est survenue';
    return throwError(() => new Error(errorMessage));
  }

  // ==================== CRUD DE BASE ====================

  /**
   * Crée une nouvelle validation de dossier
   */
  createValidationDossier(validation: ValidationDossierRequest): Observable<ValidationDossier> {
    return this.http.post<ValidationDossierResponse>(this.baseUrl, validation, {
      headers: this.getHeaders()
    }).pipe(
      map(response => this.mapResponseToValidation(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Met à jour une validation existante
   */
  updateValidationDossier(id: number, validation: Partial<ValidationDossierRequest>): Observable<ValidationDossier> {
    return this.http.put<ValidationDossierResponse>(`${this.baseUrl}/${id}`, validation, {
      headers: this.getHeaders()
    }).pipe(
      map(response => this.mapResponseToValidation(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Supprime une validation
   */
  deleteValidationDossier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Récupère une validation par ID
   */
  getValidationDossierById(id: number): Observable<ValidationDossier> {
    return this.http.get<ValidationDossierResponse>(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => this.mapResponseToValidation(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Récupère toutes les validations
   */
  getAllValidationsDossier(): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossierResponse[]>(this.baseUrl, {
      headers: this.getHeaders()
    }).pipe(
      map(responses => responses.map(response => this.mapResponseToValidation(response))),
      catchError(this.handleError.bind(this))
    );
  }

  // ==================== FILTRES ====================

  /**
   * Récupère les dossiers en attente de validation
   */
  getDossiersEnAttente(): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossierResponse[]>(`${this.baseUrl}/en-attente`, {
      headers: this.getHeaders()
    }).pipe(
      map(responses => responses.map(response => this.mapResponseToValidation(response))),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Récupère les validations par agent
   */
  getValidationsByAgent(agentId: number): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossierResponse[]>(`${this.baseUrl}/agent/${agentId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(responses => responses.map(response => this.mapResponseToValidation(response))),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Récupère les validations par chef
   */
  getValidationsByChef(chefId: number): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossierResponse[]>(`${this.baseUrl}/chef/${chefId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(responses => responses.map(response => this.mapResponseToValidation(response))),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Récupère les validations par dossier
   */
  getValidationsByDossier(dossierId: number): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossierResponse[]>(`${this.baseUrl}/dossier/${dossierId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(responses => responses.map(response => this.mapResponseToValidation(response))),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Récupère les validations par statut
   */
  getValidationsByStatut(statut: StatutValidation): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossierResponse[]>(`${this.baseUrl}/statut/${statut}`, {
      headers: this.getHeaders()
    }).pipe(
      map(responses => responses.map(response => this.mapResponseToValidation(response))),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Récupère les validations avec filtres avancés
   */
  getValidationsWithFilters(filters: ValidationFilter): Observable<ValidationDossier[]> {
    let params = new HttpParams();
    
    if (filters.statut) params = params.set('statut', filters.statut);
    if (filters.agentId) params = params.set('agentId', filters.agentId.toString());
    if (filters.chefId) params = params.set('chefId', filters.chefId.toString());
    if (filters.dossierId) params = params.set('dossierId', filters.dossierId.toString());
    if (filters.dateDebut) params = params.set('dateDebut', filters.dateDebut.toISOString());
    if (filters.dateFin) params = params.set('dateFin', filters.dateFin.toISOString());
    if (filters.searchTerm) params = params.set('searchTerm', filters.searchTerm);

    return this.http.get<ValidationDossierResponse[]>(this.baseUrl, {
      headers: this.getHeaders(),
      params
    }).pipe(
      map(responses => responses.map(response => this.mapResponseToValidation(response))),
      catchError(this.handleError.bind(this))
    );
  }

  // ==================== ACTIONS ====================

  /**
   * Valide un dossier
   */
  validerDossier(id: number, chefId: number, commentaire?: string): Observable<ValidationDossier> {
    const body = { chefId, commentaire };
    return this.http.post<ValidationDossierResponse>(`${this.baseUrl}/${id}/valider`, body, {
      headers: this.getHeaders()
    }).pipe(
      map(response => this.mapResponseToValidation(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Rejette un dossier
   */
  rejeterDossier(id: number, chefId: number, commentaire?: string): Observable<ValidationDossier> {
    const body = { chefId, commentaire };
    return this.http.post<ValidationDossierResponse>(`${this.baseUrl}/${id}/rejeter`, body, {
      headers: this.getHeaders()
    }).pipe(
      map(response => this.mapResponseToValidation(response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Remet un dossier en attente
   */
  remettreEnAttente(id: number, commentaire?: string): Observable<ValidationDossier> {
    const body = { commentaire };
    return this.http.post<ValidationDossierResponse>(`${this.baseUrl}/${id}/en-attente`, body, {
      headers: this.getHeaders()
    }).pipe(
      map(response => this.mapResponseToValidation(response)),
      catchError(this.handleError.bind(this))
    );
  }

  // ==================== STATISTIQUES ====================

  /**
   * Compte les validations par statut
   */
  countValidationsByStatut(statut: StatutValidation): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/statistiques/statut/${statut}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Compte les validations par agent
   */
  countValidationsByAgent(agentId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/statistiques/agent/${agentId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Compte les validations par chef
   */
  countValidationsByChef(chefId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/statistiques/chef/${chefId}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Récupère les statistiques complètes
   */
  getValidationStats(): Observable<ValidationStats> {
    return this.http.get<ValidationStats>(`${this.baseUrl}/statistiques`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // ==================== MÉTHODES UTILITAIRES ====================

  /**
   * Mappe la réponse API vers le modèle local
   */
  private mapResponseToValidation(response: ValidationDossierResponse): ValidationDossier {
    return {
      id: response.id,
      dossier: new Dossier({
        id: response.dossier.id.toString(),
        titre: response.dossier.titre,
        numeroDossier: response.dossier.numeroDossier,
        montantCreance: response.dossier.montantCreance,
        description: '',
        dateCreation: new Date(),
        statut: 'EN_COURS' as any,
        dossierStatus: 'ENCOURSDETRAITEMENT' as any,
        urgence: 'FAIBLE' as any,
        creancier: {} as any,
        debiteur: {} as any,
        agentResponsable: '',
        typeDocumentJustificatif: 'FACTURE' as any,
        pouvoir: false,
        contratSigne: false,
        agentCreateur: '',
        valide: false,
        typeCreancier: '',
        typeDebiteur: ''
      }),
      agentCreateur: new User({
        id: response.agentCreateur.id.toString(),
        nom: response.agentCreateur.nom,
        prenom: response.agentCreateur.prenom,
        email: response.agentCreateur.email,
        role: 'AGENT_DOSSIER' as any,
        actif: true
      }),
      chefValidateur: response.chefValidateur ? new User({
        id: response.chefValidateur.id.toString(),
        nom: response.chefValidateur.nom,
        prenom: response.chefValidateur.prenom,
        email: response.chefValidateur.email,
        role: 'CHEF_DEPARTEMENT_DOSSIER' as any,
        actif: true
      }) : undefined,
      dateValidation: response.dateValidation ? new Date(response.dateValidation) : undefined,
      statut: response.statut,
      commentaires: response.commentaires,
      dateCreation: new Date(response.dateCreation),
      dateModification: response.dateModification ? new Date(response.dateModification) : undefined
    };
  }
}
