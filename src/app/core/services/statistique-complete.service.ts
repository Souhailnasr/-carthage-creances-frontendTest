import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  StatistiquesGlobales,
  StatistiquesAgent,
  StatistiquesChef,
  StatistiquesDossiers,
  StatistiquesActionsAmiables,
  StatistiquesAudiences,
  StatistiquesTaches,
  StatistiquesFinancieres,
  StatistiquesTousChefs,
  StatistiquesRecouvrementParPhase
} from '../../shared/models/statistique-complete.model';

@Injectable({
  providedIn: 'root'
})
export class StatistiqueCompleteService {
  private apiUrl = `${environment.apiUrl}/api/statistiques`;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || sessionStorage.getItem('auth-user');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Récupère toutes les statistiques globales (SuperAdmin uniquement)
   */
  getStatistiquesGlobales(): Observable<StatistiquesGlobales> {
    const headers = this.getHeaders();
    return this.http.get<StatistiquesGlobales>(`${this.apiUrl}/globales`, { headers }).pipe(
      tap(stats => console.log('✅ Statistiques globales récupérées:', stats)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les statistiques pour une période donnée (SuperAdmin uniquement)
   */
  getStatistiquesParPeriode(dateDebut: Date, dateFin: Date): Observable<StatistiquesGlobales> {
    const headers = this.getHeaders();
    const params = new HttpParams()
      .set('dateDebut', dateDebut.toISOString().split('T')[0])
      .set('dateFin', dateFin.toISOString().split('T')[0]);
    return this.http.get<StatistiquesGlobales>(`${this.apiUrl}/periode`, { headers, params }).pipe(
      tap(stats => console.log('✅ Statistiques par période récupérées:', stats)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les statistiques de tous les chefs (SuperAdmin uniquement)
   */
  getStatistiquesTousChefs(): Observable<StatistiquesTousChefs> {
    const headers = this.getHeaders();
    return this.http.get<StatistiquesTousChefs>(`${this.apiUrl}/chefs`, { headers }).pipe(
      tap(stats => console.log('✅ Statistiques des chefs récupérées:', stats)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les statistiques des dossiers (SuperAdmin uniquement)
   */
  getStatistiquesDossiers(): Observable<StatistiquesDossiers> {
    const headers = this.getHeaders();
    return this.http.get<StatistiquesDossiers>(`${this.apiUrl}/dossiers`, { headers }).pipe(
      tap(stats => console.log('✅ Statistiques des dossiers récupérées:', stats)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les statistiques des actions amiables (SuperAdmin uniquement)
   */
  getStatistiquesActionsAmiables(): Observable<StatistiquesActionsAmiables> {
    const headers = this.getHeaders();
    return this.http.get<StatistiquesActionsAmiables>(`${this.apiUrl}/actions-amiables`, { headers }).pipe(
      tap(stats => console.log('✅ Statistiques des actions amiables récupérées:', stats)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les statistiques des audiences (SuperAdmin uniquement)
   */
  getStatistiquesAudiences(): Observable<StatistiquesAudiences> {
    const headers = this.getHeaders();
    return this.http.get<StatistiquesAudiences>(`${this.apiUrl}/audiences`, { headers }).pipe(
      tap(stats => console.log('✅ Statistiques des audiences récupérées:', stats)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les statistiques des tâches (SuperAdmin uniquement)
   */
  getStatistiquesTaches(): Observable<StatistiquesTaches> {
    const headers = this.getHeaders();
    return this.http.get<StatistiquesTaches>(`${this.apiUrl}/taches`, { headers }).pipe(
      tap(stats => console.log('✅ Statistiques des tâches récupérées:', stats)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les statistiques financières (SuperAdmin uniquement)
   */
  getStatistiquesFinancieres(): Observable<StatistiquesFinancieres> {
    const headers = this.getHeaders();
    return this.http.get<StatistiquesFinancieres>(`${this.apiUrl}/financieres`, { headers }).pipe(
      tap(stats => console.log('✅ Statistiques financières récupérées:', stats)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les statistiques du département (Chefs uniquement)
   * Retourne les statistiques du département avec les actions amiables, taux de réussite, etc.
   */
  getStatistiquesDepartement(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.apiUrl}/departement`, { headers }).pipe(
      tap(stats => console.log('✅ Statistiques du département récupérées:', stats)),
      catchError(this.handleError)
    );
  }

  /**
   * ❌ SUPPRIMÉ : Cette méthode n'est plus utilisée car l'endpoint n'existe pas
   * Les statistiques par type sont incluses dans getStatistiquesActionsAmiables()
   */

  /**
   * Récupère les statistiques des agents du chef (Chefs uniquement)
   */
  getStatistiquesMesAgents(): Observable<StatistiquesChef> {
    const headers = this.getHeaders();
    return this.http.get<StatistiquesChef>(`${this.apiUrl}/mes-agents`, { headers }).pipe(
      tap(stats => console.log('✅ Statistiques des agents récupérées:', stats)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les statistiques de l'agent connecté (Agents uniquement)
   */
  getStatistiquesMesDossiers(): Observable<StatistiquesAgent> {
    const headers = this.getHeaders();
    return this.http.get<StatistiquesAgent>(`${this.apiUrl}/mes-dossiers`, { headers }).pipe(
      tap(stats => console.log('✅ Statistiques de mes dossiers récupérées:', stats)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les statistiques d'un agent spécifique (Chefs et SuperAdmin)
   */
  getStatistiquesAgent(agentId: number): Observable<StatistiquesAgent> {
    const headers = this.getHeaders();
    return this.http.get<StatistiquesAgent>(`${this.apiUrl}/agent/${agentId}`, { headers }).pipe(
      tap(stats => console.log(`✅ Statistiques de l'agent ${agentId} récupérées:`, stats)),
      catchError(this.handleError)
    );
  }

  /**
   * ✅ NOUVEAU : Récupère les statistiques de recouvrement par phase (SuperAdmin, Chefs)
   */
  getStatistiquesRecouvrementParPhase(): Observable<StatistiquesRecouvrementParPhase> {
    const headers = this.getHeaders();
    return this.http.get<StatistiquesRecouvrementParPhase>(`${this.apiUrl}/recouvrement-par-phase`, { headers }).pipe(
      tap(stats => console.log('✅ Statistiques recouvrement par phase récupérées:', stats)),
      catchError(this.handleError)
    );
  }

  /**
   * ✅ NOUVEAU : Récupère les statistiques de recouvrement par phase pour le département (Chefs uniquement)
   */
  getStatistiquesRecouvrementParPhaseDepartement(): Observable<StatistiquesRecouvrementParPhase> {
    const headers = this.getHeaders();
    return this.http.get<StatistiquesRecouvrementParPhase>(`${this.apiUrl}/recouvrement-par-phase/departement`, { headers }).pipe(
      tap(stats => console.log('✅ Statistiques recouvrement par phase département récupérées:', stats)),
      catchError(this.handleError)
    );
  }

  /**
   * Force le recalcul des statistiques (SuperAdmin uniquement)
   */
  recalculerStatistiques(): Observable<string> {
    const headers = this.getHeaders();
    return this.http.post<any>(`${this.apiUrl}/recalculer`, {}, { 
      headers,
      responseType: 'json'
    }).pipe(
      map((response) => {
        // Gérer différents formats de réponse
        if (typeof response === 'string') {
          return response;
        } else if (response && response.message) {
          return response.message;
        } else if (response && typeof response === 'object') {
          return 'Statistiques recalculées avec succès';
        }
        return 'Statistiques recalculées avec succès';
      }),
      tap(message => console.log('✅ Recalcul des statistiques:', message)),
      catchError((error) => {
        console.error('❌ Erreur lors du recalcul des statistiques:', error);
        // Si c'est une erreur de parsing JSON (HTML reçu), extraire le message
        let errorMessage = 'Erreur lors du recalcul des statistiques';
        
        if (error.error) {
          // Si c'est une string (HTML ou texte), essayer d'extraire un message
          if (typeof error.error === 'string') {
            // Si ça commence par HTML, c'est une page d'erreur
            if (error.error.trim().startsWith('<')) {
              errorMessage = 'L\'endpoint de recalcul n\'existe pas ou renvoie une erreur HTML';
            } else {
              errorMessage = error.error;
            }
          } else if (error.error.message) {
            errorMessage = error.error.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('❌ Erreur dans StatistiqueCompleteService:', error);
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

