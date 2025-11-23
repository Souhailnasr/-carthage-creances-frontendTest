import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface TacheUrgente {
  id: number;
  titre: string;
  description: string;
  type: 'ENQUETE' | 'RELANCE' | 'DOSSIER' | 'AUDIENCE' | 'ACTION' | 'ACTION_AMIABLE' | 'VALIDATION' | 'TRAITEMENT' | 'SUIVI' | 'RAPPEL';
  priorite: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE';
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  agentAssigné: {
    id: number;
    nom: string;
    prenom: string;
  };
  chefCreateur: {
    id: number;
    nom: string;
    prenom: string;
  };
  dateCreation: string; // ISO 8601
  dateEcheance: string; // ISO 8601
  dateCompletion?: string; // ISO 8601
  dossier?: { id: number; numeroDossier: string };
  commentaires?: string;
  // Propriétés de compatibilité avec l'ancien code
  agentId?: number;
  agentNom?: string;
  dossierTitre?: string;
  montant?: number;
  dateCloture?: Date | string;
}

export interface TacheRequest {
  titre: string;
  description: string;
  type: string;
  priorite: string;
  agentAssigné?: { id: number };
  chefCreateur?: { id: number };
  dateEcheance: string;
  dossier?: { id: number };
}

export interface TacheAffectationMultiples {
  titre: string;
  description: string;
  type: string;
  priorite: string;
  agentIds: number[];
  chefCreateurId: number;
  dateEcheance: string;
}

@Injectable({
  providedIn: 'root'
})
export class TacheUrgenteService {
  private baseUrl = `${environment.apiUrl}/api/taches-urgentes`;

  constructor(private http: HttpClient) {}

  /**
   * Créer une tâche (Chef ou Super Admin)
   */
  createTache(tache: TacheRequest): Observable<TacheUrgente> {
    return this.http.post<TacheUrgente>(this.baseUrl, tache)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Affecter une tâche à plusieurs agents (Chef)
   */
  affecterTacheMultiples(data: TacheAffectationMultiples): Observable<TacheUrgente[]> {
    return this.http.post<TacheUrgente[]>(`${this.baseUrl}/affecter-multiples`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Affecter une tâche à tous les agents d'un chef
   */
  affecterTacheAAgentsChef(chefId: number, data: Omit<TacheAffectationMultiples, 'agentIds' | 'chefCreateurId'> & { chefCreateurId: number }): Observable<TacheUrgente[]> {
    return this.http.post<TacheUrgente[]>(`${this.baseUrl}/chef/${chefId}/affecter-agents`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Affecter une tâche à tous les utilisateurs (Super Admin)
   */
  affecterTacheATous(data: Omit<TacheAffectationMultiples, 'agentIds' | 'chefCreateurId'> & { chefCreateurId: number }): Observable<TacheUrgente[]> {
    return this.http.post<TacheUrgente[]>(`${this.baseUrl}/super-admin/affecter-tous`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer les tâches d'un agent
   */
  getTachesAgent(agentId: number): Observable<TacheUrgente[]> {
    return this.http.get<TacheUrgente[]>(`${this.baseUrl}/agent/${agentId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer les tâches d'un chef
   */
  getTachesChef(chefId: number): Observable<TacheUrgente[]> {
    return this.http.get<TacheUrgente[]>(`${this.baseUrl}/chef/${chefId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer toutes les tâches (Super Admin)
   */
  getAllTaches(): Observable<TacheUrgente[]> {
    return this.http.get<TacheUrgente[]>(this.baseUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer une tâche par ID
   */
  getTacheById(id: number): Observable<TacheUrgente> {
    return this.http.get<TacheUrgente>(`${this.baseUrl}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Marquer une tâche comme terminée
   */
  marquerTerminee(tacheId: number, commentaires?: string): Observable<TacheUrgente> {
    return this.http.put<TacheUrgente>(`${this.baseUrl}/${tacheId}/terminer`, { commentaires })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Mettre à jour une tâche
   */
  updateTache(tacheId: number, tache: Partial<TacheRequest>): Observable<TacheUrgente> {
    return this.http.put<TacheUrgente>(`${this.baseUrl}/${tacheId}`, tache)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Supprimer une tâche
   */
  deleteTache(tacheId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${tacheId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Gestion des erreurs
   */
  private handleError = (error: any): Observable<never> => {
    console.error('Erreur dans TacheUrgenteService:', error);
    return throwError(() => error);
  };
}
