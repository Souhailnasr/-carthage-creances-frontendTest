import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DossierApi } from '../../shared/models/dossier-api.model';
import { ActionRecouvrement, TypeAction, ReponseDebiteur } from './action-recouvrement.service';

export interface AgentAmiableStats {
  totalDossiers: number;
  dossiersEnCours: number;
  dossiersClotures: number;
  totalActions: number;
  actionsReussies: number;
  montantRecupere: number;
  montantEnCours: number;
  tauxReussite: number;
}

@Injectable({
  providedIn: 'root'
})
export class AgentAmiableService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les statistiques personnelles de l'agent
   */
  getStatistiquesPersonnelles(agentId: number): Observable<AgentAmiableStats> {
    return this.http.get<AgentAmiableStats>(`${this.apiUrl}/agents-amiable/${agentId}/statistiques`).pipe(
      catchError((error) => {
        console.warn('⚠️ Endpoint statistiques non disponible, calcul côté client');
        // Fallback: calculer depuis les dossiers et actions
        return this.calculerStatistiques(agentId);
      })
    );
  }

  /**
   * Calcule les statistiques depuis les dossiers et actions
   */
  private calculerStatistiques(agentId: number): Observable<AgentAmiableStats> {
    return this.getDossiersAffectes(agentId).pipe(
      map((dossiers) => {
        const totalDossiers = dossiers.length;
        const dossiersEnCours = dossiers.filter(d => !d.dateCloture && d.dossierStatus !== 'CLOTURE').length;
        const dossiersClotures = totalDossiers - dossiersEnCours;
        const montantEnCours = dossiers
          .filter(d => !d.dateCloture)
          .reduce((sum, d) => sum + (d.montantCreance || 0), 0);
        
        // Pour les actions, on devra les charger séparément
        // Pour l'instant, valeurs par défaut
        return {
          totalDossiers,
          dossiersEnCours,
          dossiersClotures,
          totalActions: 0,
          actionsReussies: 0,
          montantRecupere: 0,
          montantEnCours,
          tauxReussite: dossiersClotures > 0 ? (dossiersClotures / totalDossiers) * 100 : 0
        };
      })
    );
  }

  /**
   * Récupère les dossiers affectés à l'agent
   */
  getDossiersAffectes(agentId: number, page: number = 0, size: number = 20): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/dossiers/agent/${agentId}`, {
      params: new HttpParams()
        .set('page', page.toString())
        .set('size', size.toString())
    }).pipe(
      catchError((error) => {
        console.warn('⚠️ Endpoint dossiers par agent non disponible, utilisation du filtre');
        // Fallback: utiliser getAllDossiers et filtrer
        return this.http.get<{content: DossierApi[], totalElements: number}>(`${this.apiUrl}/dossiers`, {
          params: new HttpParams()
            .set('page', page.toString())
            .set('size', '100')
        }).pipe(
          map((response) => {
            return response.content.filter(d => 
              d.agentResponsable?.id?.toString() === agentId.toString() ||
              d.agentCreateur?.id?.toString() === agentId.toString()
            );
          })
        );
      })
    );
  }

  /**
   * Récupère les actions d'un dossier affecté à l'agent
   */
  getActionsByDossier(dossierId: number): Observable<ActionRecouvrement[]> {
    return this.http.get<ActionRecouvrement[]>(`${this.apiUrl}/actions/dossier/${dossierId}`).pipe(
      map(actions => actions.map(action => ({
        ...action,
        dateAction: new Date(action.dateAction),
        agentId: action.agentId ?? (action as any)?.creePar?.id ?? (action as any)?.agent?.id,
        agentNom: action.agentNom ?? ((action as any)?.creePar ? `${(action as any)?.creePar?.prenom || ''} ${(action as any)?.creePar?.nom || ''}`.trim() : (action as any)?.agent?.nom)
      }))),
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des actions:', error);
        return throwError(() => new Error('Erreur lors de la récupération des actions'));
      })
    );
  }

  /**
   * Créer une action pour un dossier
   */
  createAction(dossierId: number, action: Partial<ActionRecouvrement>): Observable<ActionRecouvrement> {
    // Ne pas inclure agentId - le backend ne le reconnaît pas dans ActionRequestDTO
    const { agentId, ...actionWithoutAgentId } = action;
    const payload = {
      dossierId,
      ...actionWithoutAgentId
    };
    return this.http.post<ActionRecouvrement>(`${this.apiUrl}/actions`, payload).pipe(
      map(action => ({
        ...action,
        dateAction: new Date(action.dateAction)
      })),
      catchError((error) => {
        console.error('❌ Erreur lors de la création de l\'action:', error);
        return throwError(() => new Error('Erreur lors de la création de l\'action'));
      })
    );
  }

  /**
   * Modifier une action
   */
  updateAction(actionId: number, action: Partial<ActionRecouvrement>): Observable<ActionRecouvrement> {
    return this.http.put<ActionRecouvrement>(`${this.apiUrl}/actions/${actionId}`, action).pipe(
      map(action => ({
        ...action,
        dateAction: new Date(action.dateAction)
      })),
      catchError((error) => {
        console.error('❌ Erreur lors de la modification de l\'action:', error);
        return throwError(() => new Error('Erreur lors de la modification de l\'action'));
      })
    );
  }

  /**
   * Supprimer une action
   */
  deleteAction(actionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/actions/${actionId}`).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la suppression de l\'action:', error);
        return throwError(() => new Error('Erreur lors de la suppression de l\'action'));
      })
    );
  }
}

