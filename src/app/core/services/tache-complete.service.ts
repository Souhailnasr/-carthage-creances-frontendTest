import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  TacheUrgente,
  CreateTacheUrgenteRequest,
  UpdateTacheUrgenteRequest,
  CompleteTacheRequest,
  AnnulerTacheRequest,
  StatutTache,
  PrioriteTache,
  TypeTache
} from '../../shared/models/tache-complete.model';

@Injectable({
  providedIn: 'root'
})
export class TacheCompleteService {
  private apiUrl = `${environment.apiUrl}/api/taches-urgentes`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || sessionStorage.getItem('auth-user');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Récupère toutes les tâches (filtrées selon le rôle)
   */
  getAllTaches(): Observable<TacheUrgente[]> {
    const headers = this.getHeaders();
    return this.http.get<TacheUrgente[]>(`${this.apiUrl}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les tâches de l'utilisateur connecté
   */
  getMesTaches(): Observable<TacheUrgente[]> {
    const headers = this.getHeaders();
    return this.http.get<TacheUrgente[]>(`${this.apiUrl}/mes-taches`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupère une tâche par son ID
   */
  getTacheById(id: number): Observable<TacheUrgente> {
    const headers = this.getHeaders();
    return this.http.get<TacheUrgente>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les tâches d'un agent
   */
  getTachesByAgent(agentId: number): Observable<TacheUrgente[]> {
    const headers = this.getHeaders();
    return this.http.get<TacheUrgente[]>(`${this.apiUrl}/agent/${agentId}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les tâches par statut
   */
  getTachesByStatut(statut: StatutTache): Observable<TacheUrgente[]> {
    const headers = this.getHeaders();
    return this.http.get<TacheUrgente[]>(`${this.apiUrl}/statut/${statut}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les tâches par priorité
   */
  getTachesByPriorite(priorite: PrioriteTache): Observable<TacheUrgente[]> {
    const headers = this.getHeaders();
    return this.http.get<TacheUrgente[]>(`${this.apiUrl}/priorite/${priorite}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les tâches urgentes (échéance dans les 3 jours)
   */
  getTachesUrgentes(dateLimite?: Date): Observable<TacheUrgente[]> {
    const headers = this.getHeaders();
    let url = `${this.apiUrl}/urgentes`;
    if (dateLimite) {
      url += `?dateLimite=${dateLimite.toISOString()}`;
    }
    return this.http.get<TacheUrgente[]>(url, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les tâches en retard
   */
  getTachesEnRetard(): Observable<TacheUrgente[]> {
    const headers = this.getHeaders();
    return this.http.get<TacheUrgente[]>(`${this.apiUrl}/en-retard`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crée une nouvelle tâche (Chefs uniquement)
   */
  createTache(request: CreateTacheUrgenteRequest): Observable<TacheUrgente> {
    const headers = this.getHeaders();
    // Convertir dateEcheance en ISO string si c'est une Date
    const body = {
      ...request,
      dateEcheance: typeof request.dateEcheance === 'string' 
        ? request.dateEcheance 
        : request.dateEcheance.toISOString()
    };
    return this.http.post<TacheUrgente>(`${this.apiUrl}`, body, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour une tâche
   */
  updateTache(id: number, request: UpdateTacheUrgenteRequest): Observable<TacheUrgente> {
    const headers = this.getHeaders();
    // Convertir dateEcheance en ISO string si c'est une Date
    const body = {
      ...request,
      dateEcheance: request.dateEcheance 
        ? (typeof request.dateEcheance === 'string' 
            ? request.dateEcheance 
            : request.dateEcheance.toISOString())
        : undefined
    };
    return this.http.put<TacheUrgente>(`${this.apiUrl}/${id}`, body, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Supprime une tâche
   */
  deleteTache(id: number): Observable<void> {
    const headers = this.getHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Marque une tâche comme terminée (Agent uniquement)
   */
  marquerComplete(id: number, request: CompleteTacheRequest): Observable<TacheUrgente> {
    const headers = this.getHeaders();
    return this.http.post<TacheUrgente>(`${this.apiUrl}/${id}/complete`, request, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Marque une tâche comme en cours (Agent uniquement)
   */
  marquerEnCours(id: number): Observable<TacheUrgente> {
    const headers = this.getHeaders();
    return this.http.post<TacheUrgente>(`${this.apiUrl}/${id}/en-cours`, {}, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Annule une tâche (Chef créateur ou SuperAdmin uniquement)
   */
  annulerTache(id: number, request: AnnulerTacheRequest): Observable<TacheUrgente> {
    const headers = this.getHeaders();
    return this.http.post<TacheUrgente>(`${this.apiUrl}/${id}/annuler`, request, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Compte les tâches par agent
   */
  countTachesByAgent(agentId: number): Observable<number> {
    const headers = this.getHeaders();
    return this.http.get<number>(`${this.apiUrl}/statistiques/agent/${agentId}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Compte les tâches par statut
   */
  countTachesByStatut(statut: StatutTache): Observable<number> {
    const headers = this.getHeaders();
    return this.http.get<number>(`${this.apiUrl}/statistiques/statut/${statut}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Compte les tâches urgentes
   */
  countTachesUrgentes(): Observable<number> {
    const headers = this.getHeaders();
    return this.http.get<number>(`${this.apiUrl}/statistiques/urgentes`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtient l'icône pour un type de tâche
   */
  getIconForType(type: TypeTache): string {
    const iconMap: { [key: string]: string } = {
      'ENQUETE': 'search',
      'RELANCE': 'send',
      'DOSSIER': 'folder',
      'AUDIENCE': 'event',
      'ACTION': 'gavel',
      'ACTION_AMIABLE': 'handshake',
      'VALIDATION': 'check_circle',
      'TRAITEMENT': 'build',
      'SUIVI': 'track_changes',
      'RAPPEL': 'notifications'
    };
    return iconMap[type] || 'assignment';
  }

  /**
   * Obtient la couleur pour une priorité
   */
  getColorForPriorite(priorite: PrioriteTache): string {
    const colorMap: { [key: string]: string } = {
      'FAIBLE': 'primary',
      'MOYENNE': 'accent',
      'ELEVEE': 'warn',
      'TRES_URGENTE': 'warn'
    };
    return colorMap[priorite] || '';
  }

  /**
   * Obtient la couleur pour un statut
   */
  getColorForStatut(statut: StatutTache): string {
    const colorMap: { [key: string]: string } = {
      'EN_ATTENTE': 'primary',
      'EN_COURS': 'accent',
      'TERMINEE': 'primary',
      'ANNULEE': ''
    };
    return colorMap[statut] || '';
  }

  /**
   * Formate la date d'échéance
   */
  formatDateEcheance(date: Date | string): string {
    const maintenant = new Date();
    const echeance = typeof date === 'string' ? new Date(date) : date;
    const diffMs = echeance.getTime() - maintenant.getTime();
    const diffJours = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffJours < 0) {
      return `En retard (${Math.abs(diffJours)} jour${Math.abs(diffJours) > 1 ? 's' : ''})`;
    } else if (diffJours === 0) {
      return 'Aujourd\'hui';
    } else if (diffJours === 1) {
      return 'Demain';
    } else if (diffJours <= 3) {
      return `Dans ${diffJours} jours`;
    } else {
      return echeance.toLocaleDateString('fr-FR');
    }
  }

  private handleError(error: any): Observable<never> {
    console.error('❌ Erreur dans TacheCompleteService:', error);
    let errorMessage = 'Une erreur inconnue est survenue.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = `Code d'erreur: ${error.status}\nMessage: ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage = `Message du serveur: ${error.error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}

