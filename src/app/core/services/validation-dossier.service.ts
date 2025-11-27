import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';
import { DossierApi, UtilisateurApi } from '../../shared/models/dossier-api.model';

/**
 * Interface améliorée pour ValidationDossier
 */
export interface ValidationDossier {
  id: number;
  dossier: DossierApi; // Objet Dossier complet
  agentCreateur: UtilisateurApi; // Objet Utilisateur complet
  chefValidateur?: UtilisateurApi | null; // null si pas encore validé
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REJETE';
  commentaires: string | null;
  dateCreation: string; // ISO 8601 format
  dateValidation: string | null; // ISO 8601 format, null si EN_ATTENTE
  dateModification?: string | null;
}

export interface CreateValidationRequest {
  dossier: { id: number };
  agentCreateur: { id: number };
  commentaires?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ValidationDossierService {
  private validationApiUrl = 'http://localhost:8089/carthage-creance/api/validation/dossiers';
  private dossierApiUrl = 'http://localhost:8089/carthage-creance/api/dossiers';

  constructor(private http: HttpClient) {}

  // ==================== CRUD OPERATIONS ====================

  /**
   * Crée une nouvelle validation de dossier
   */
  createValidationDossier(validation: CreateValidationRequest): Observable<ValidationDossier> {
    return this.http.post<ValidationDossier>(`${this.validationApiUrl}`, validation)
      .pipe(
        catchError(this.handleError<ValidationDossier>('createValidationDossier'))
      );
  }

  /**
   * Met à jour une validation de dossier
   */
  updateValidationDossier(id: number, validation: Partial<ValidationDossier>): Observable<ValidationDossier> {
    return this.http.put<ValidationDossier>(`${this.validationApiUrl}/${id}`, validation)
      .pipe(
        catchError(this.handleError<ValidationDossier>('updateValidationDossier'))
      );
  }

  /**
   * Supprime une validation de dossier
   */
  deleteValidationDossier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.validationApiUrl}/${id}`)
      .pipe(
        catchError(this.handleError<void>('deleteValidationDossier'))
      );
  }

  /**
   * Récupère une validation par ID
   */
  getValidationDossierById(id: number): Observable<ValidationDossier> {
    return this.http.get<ValidationDossier>(`${this.validationApiUrl}/${id}`)
      .pipe(
        catchError(this.handleError<ValidationDossier>('getValidationDossierById'))
      );
  }

  /**
   * Récupère toutes les validations
   */
  getAllValidationsDossier(): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossier[]>(`${this.validationApiUrl}`)
      .pipe(
        catchError(this.handleError<ValidationDossier[]>('getAllValidationsDossier', []))
      );
  }

  // ==================== FILTRAGE ====================

  /**
   * Récupère les dossiers en attente de validation
   * GET /api/validation/dossiers/en-attente
   */
  getDossiersEnAttente(): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossier[]>(`${this.validationApiUrl}/en-attente`)
      .pipe(
        catchError(this.handleError<ValidationDossier[]>('getDossiersEnAttente', []))
      );
  }

  /**
   * Récupère les validations par agent créateur
   * GET /api/validation/dossiers/agent/{agentId}
   */
  getValidationsByAgent(agentId: number): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossier[]>(`${this.validationApiUrl}/agent/${agentId}`)
      .pipe(
        catchError(this.handleError<ValidationDossier[]>('getValidationsByAgent', []))
      );
  }

  /**
   * Récupère les validations par chef validateur
   */
  getValidationsByChef(chefId: number): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossier[]>(`${this.validationApiUrl}/chef/${chefId}`)
      .pipe(
        catchError(this.handleError<ValidationDossier[]>('getValidationsByChef', []))
      );
  }

  /**
   * Récupère les validations par dossier
   * GET /api/validation/dossiers/dossier/{dossierId}
   */
  getValidationsByDossier(dossierId: number): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossier[]>(`${this.validationApiUrl}/dossier/${dossierId}`)
      .pipe(
        catchError(this.handleError<ValidationDossier[]>('getValidationsByDossier', []))
      );
  }

  /**
   * Récupère les validations par statut
   */
  getValidationsByStatut(statut: string): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossier[]>(`${this.validationApiUrl}/statut/${statut}`)
      .pipe(
        catchError(this.handleError<ValidationDossier[]>('getValidationsByStatut', []))
      );
  }

  // ==================== ACTIONS ====================

  /**
   * Valide un dossier via DossierController
   * PUT /api/dossiers/{dossierId}/valider?chefId={chefId}
   * Retourne: DossierApi mis à jour avec statut VALIDE
   */
  validerDossier(dossierId: number, chefId: number): Observable<DossierApi> {
    return this.http.put<DossierApi>(`${this.dossierApiUrl}/${dossierId}/valider`, null, {
      params: { chefId: chefId.toString() }
    }).pipe(
      tap((dossier) => console.log('✅ Dossier validé avec succès:', dossier)),
      catchError(this.handleError<DossierApi>('validerDossier'))
    );
  }

  /**
   * Rejette un dossier via DossierController
   * PUT /api/dossiers/{dossierId}/rejeter?commentaire={commentaire}
   * Retourne: DossierApi mis à jour avec statut REJETE
   * Le commentaire est OBLIGATOIRE
   */
  rejeterDossier(dossierId: number, commentaire: string): Observable<DossierApi> {
    if (!commentaire || commentaire.trim() === '') {
      return throwError(() => new Error('Le commentaire est obligatoire pour rejeter un dossier'));
    }

    return this.http.put<DossierApi>(`${this.dossierApiUrl}/${dossierId}/rejeter`, null, {
      params: { commentaire: commentaire.trim() }
    }).pipe(
      tap((dossier) => console.log('✅ Dossier rejeté avec succès:', dossier)),
      catchError(this.handleError<DossierApi>('rejeterDossier'))
    );
  }

  /**
   * Remet une validation en attente
   */
  remettreEnAttente(id: number, commentaire?: string): Observable<ValidationDossier> {
    const params: any = {};
    if (commentaire) {
      params.commentaire = commentaire;
    }
    return this.http.post<ValidationDossier>(`${this.validationApiUrl}/${id}/en-attente`, null, { params })
      .pipe(
        catchError(this.handleError<ValidationDossier>('remettreEnAttente'))
      );
  }

  // ==================== STATISTIQUES ====================

  /**
   * Compte les validations par statut
   */
  countValidationsByStatut(statut: string): Observable<number> {
    return this.http.get<number>(`${this.validationApiUrl}/statistiques/statut/${statut}`)
      .pipe(
        catchError(this.handleError<number>('countValidationsByStatut', 0))
      );
  }

  /**
   * Compte les validations par agent
   */
  countValidationsByAgent(agentId: number): Observable<number> {
    return this.http.get<number>(`${this.validationApiUrl}/statistiques/agent/${agentId}`)
      .pipe(
        catchError(this.handleError<number>('countValidationsByAgent', 0))
      );
  }

  /**
   * Compte les validations par chef
   */
  countValidationsByChef(chefId: number): Observable<number> {
    return this.http.get<number>(`${this.validationApiUrl}/statistiques/chef/${chefId}`)
      .pipe(
        catchError(this.handleError<number>('countValidationsByChef', 0))
      );
  }

  /**
   * Récupère les statistiques de validation
   */
  getValidationStats(): Observable<any> {
    return this.http.get<any>(`${this.validationApiUrl}/statistiques`)
      .pipe(
        catchError(this.handleError<any>('getValidationStats', {}))
      );
  }

  // ==================== GESTION DES ERREURS ====================

  /**
   * Gestion centralisée des erreurs HTTP
   */
  private handleError<T>(operation: string = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`❌ Erreur ${operation}:`, error);

      let errorMessage = 'Une erreur est survenue';

      if (error.error instanceof ErrorEvent) {
        // Erreur côté client
        errorMessage = `Erreur: ${error.error.message}`;
      } else {
        // Erreur côté serveur
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'Données invalides';
            break;
          case 401:
            errorMessage = 'Session expirée, veuillez vous reconnecter';
            // TODO: Rediriger vers login si nécessaire
            break;
          case 403:
            errorMessage = 'Vous n\'avez pas les droits pour effectuer cette action';
            break;
          case 404:
            errorMessage = error.error?.message || 'Ressource non trouvée';
            break;
          case 500:
            errorMessage = 'Erreur serveur, veuillez réessayer plus tard';
            break;
          default:
            errorMessage = error.error?.message || `Erreur ${error.status}: ${error.statusText}`;
        }
      }

      // Retourner un Observable avec une valeur par défaut ou une erreur
      if (result !== undefined) {
        return of(result as T);
      } else {
        return throwError(() => new Error(errorMessage));
      }
    };
  }
}
