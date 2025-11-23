import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface StatistiquesGlobales {
  totalDossiers: number;
  dossiersEnCours: number;
  dossiersValides: number;
  dossiersRejetes: number;
  dossiersClotures: number;
  dossiersCreesCeMois: number;
  totalEnquetes: number;
  enquetesCompletees: number;
  totalActionsAmiables: number;
  totalAudiences: number;
  audiencesProchaines: number;
  totalTaches: number;
  tachesCompletees: number;
  tachesEnCours: number;
  tauxReussiteGlobal: number;
  montantRecouvre: number;
  montantEnCours: number;
}

export interface StatistiquesAgent {
  agentId: number;
  agentNom: string;
  agentPrenom: string;
  dossiersCrees: number;
  dossiersAssignes: number;
  dossiersValides: number;
  enquetesCompletees: number;
  tachesCompletees: number;
  actionsAmiables: number;
  audiencesGerees: number;
  scorePerformance: number;
  tauxReussite: number;
}

export interface StatistiquesChef {
  chefId: number;
  chefNom: string;
  chefPrenom: string;
  nombreAgents: number;
  statistiquesAgents: StatistiquesAgent[];
  moyenneScoreAgents: number;
  totalDossiersAgents: number;
  totalTachesAgents: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatistiqueService {
  private baseUrl = `${environment.apiUrl}/api/statistiques`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer les statistiques globales
   */
  getStatistiquesGlobales(): Observable<StatistiquesGlobales> {
    return this.http.get<StatistiquesGlobales>(`${this.baseUrl}/globales`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer les statistiques d'un agent
   */
  getStatistiquesAgent(agentId: number): Observable<StatistiquesAgent> {
    return this.http.get<StatistiquesAgent>(`${this.baseUrl}/agent/${agentId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer les statistiques d'un chef et de ses agents
   */
  getStatistiquesChef(chefId: number): Observable<StatistiquesChef> {
    return this.http.get<StatistiquesChef>(`${this.baseUrl}/chef/${chefId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer les statistiques de tous les chefs (Super Admin)
   */
  getStatistiquesChefs(): Observable<StatistiquesChef[]> {
    return this.http.get<StatistiquesChef[]>(`${this.baseUrl}/chefs`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer les statistiques par période
   */
  getStatistiquesParPeriode(dateDebut: string, dateFin: string): Observable<StatistiquesGlobales> {
    const params = new HttpParams()
      .set('dateDebut', dateDebut)
      .set('dateFin', dateFin);
    
    return this.http.get<StatistiquesGlobales>(`${this.baseUrl}/periode`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Gestion des erreurs
   */
  private handleError = (error: any): Observable<never> => {
    console.error('Erreur dans StatistiqueService:', error);
    return throwError(() => error);
  };
}

