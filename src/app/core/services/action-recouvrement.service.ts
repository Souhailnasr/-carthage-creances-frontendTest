import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export enum TypeAction {
  APPEL = 'APPEL',
  EMAIL = 'EMAIL',
  VISITE = 'VISITE',
  LETTRE = 'LETTRE',
  AUTRE = 'AUTRE'
}

export enum ReponseDebiteur {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  EN_ATTENTE = 'EN_ATTENTE'
}

export interface ActionRecouvrement {
  id?: number;
  type: TypeAction;
  reponseDebiteur: ReponseDebiteur | null;
  dateAction: Date | string;
  nbOccurrences: number;
  dossier: { id: number };
  // PAS de coutUnitaire ni totalCout
}

export interface StatistiquesActions {
  total: number;
  positives: number;
  negatives: number;
  sansReponse: number;
  parType: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class ActionRecouvrementService {
  private apiUrl = `${environment.apiUrl}/api/actions`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer toutes les actions d'un dossier (sans coûts)
   */
  getActionsByDossier(dossierId: number): Observable<ActionRecouvrement[]> {
    return this.http.get<ActionRecouvrement[]>(`${this.apiUrl}/dossier/${dossierId}`).pipe(
      map(actions => actions.map(action => ({
        ...action,
        dateAction: new Date(action.dateAction)
      }))),
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des actions:', error);
        return throwError(() => new Error('Erreur lors de la récupération des actions'));
      })
    );
  }

  /**
   * Créer une action (sans coût unitaire)
   */
  createAction(dossierId: number, action: Partial<ActionRecouvrement>): Observable<ActionRecouvrement> {
    const actionToSend = {
      ...action,
      dossier: { id: dossierId }
    };
    return this.http.post<ActionRecouvrement>(this.apiUrl, actionToSend).pipe(
      map(action => ({
        ...action,
        dateAction: new Date(action.dateAction)
      })),
      catchError((error) => {
        console.error('❌ Erreur lors de la création de l\'action:', error);
        const errorMessage = error.error?.message || error.message || 'Erreur lors de la création de l\'action';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Modifier une action
   */
  updateAction(actionId: number, action: Partial<ActionRecouvrement>): Observable<ActionRecouvrement> {
    return this.http.put<ActionRecouvrement>(`${this.apiUrl}/${actionId}`, action).pipe(
      map(action => ({
        ...action,
        dateAction: new Date(action.dateAction)
      })),
      catchError((error) => {
        console.error('❌ Erreur lors de la modification de l\'action:', error);
        const errorMessage = error.error?.message || error.message || 'Erreur lors de la modification de l\'action';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Supprimer une action
   */
  deleteAction(actionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${actionId}`).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la suppression de l\'action:', error);
        const errorMessage = error.error?.message || error.message || 'Erreur lors de la suppression de l\'action';
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Filtrer par type
   */
  getActionsByType(dossierId: number, type: TypeAction): Observable<ActionRecouvrement[]> {
    return this.http.get<ActionRecouvrement[]>(`${this.apiUrl}/type/${type}/dossier/${dossierId}`).pipe(
      map(actions => actions.map(action => ({
        ...action,
        dateAction: new Date(action.dateAction)
      }))),
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des actions par type:', error);
        return throwError(() => new Error('Erreur lors de la récupération des actions par type'));
      })
    );
  }

  /**
   * Filtrer par réponse
   */
  getActionsByReponse(dossierId: number, reponse: ReponseDebiteur): Observable<ActionRecouvrement[]> {
    return this.http.get<ActionRecouvrement[]>(`${this.apiUrl}/dossier/${dossierId}/reponse/${reponse}`).pipe(
      map(actions => actions.map(action => ({
        ...action,
        dateAction: new Date(action.dateAction)
      }))),
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération des actions par réponse:', error);
        return throwError(() => new Error('Erreur lors de la récupération des actions par réponse'));
      })
    );
  }

  /**
   * Calculer les statistiques
   */
  getStatistiquesActions(dossierId: number): Observable<StatistiquesActions> {
    return this.getActionsByDossier(dossierId).pipe(
      map(actions => {
        const stats: StatistiquesActions = {
          total: actions.length,
          positives: actions.filter(a => a.reponseDebiteur === ReponseDebiteur.POSITIVE).length,
          negatives: actions.filter(a => a.reponseDebiteur === ReponseDebiteur.NEGATIVE).length,
          sansReponse: actions.filter(a => !a.reponseDebiteur || a.reponseDebiteur === ReponseDebiteur.EN_ATTENTE).length,
          parType: {}
        };
        
        actions.forEach(action => {
          stats.parType[action.type] = (stats.parType[action.type] || 0) + 1;
        });
        
        return stats;
      }),
      catchError((error) => {
        console.error('❌ Erreur lors du calcul des statistiques:', error);
        // Retourner des statistiques vides en cas d'erreur
        return throwError(() => new Error('Erreur lors du calcul des statistiques'));
      })
    );
  }
}

