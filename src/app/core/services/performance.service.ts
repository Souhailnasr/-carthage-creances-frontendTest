import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface PerformanceAgent {
  id: number;
  agent: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  periode: string; // Format: "2024-01" ou "2024-Q1"
  dossiersTraites: number;
  dossiersValides: number;
  enquetesCompletees: number;
  score: number; // 0-100
  tauxReussite: number; // 0-100
  dateCalcul: string; // ISO 8601
  commentaires?: string;
  objectif?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private baseUrl = `${environment.apiUrl}/api/performance-agents`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer les performances d'un agent
   */
  getPerformancesAgent(agentId: number): Observable<PerformanceAgent[]> {
    return this.http.get<PerformanceAgent[]>(`${this.baseUrl}/agent/${agentId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer les performances des agents d'un chef
   */
  getPerformancesChef(chefId: number): Observable<PerformanceAgent[]> {
    return this.http.get<PerformanceAgent[]>(`${this.baseUrl}/chef/${chefId}/agents`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer toutes les performances (Super Admin)
   */
  getToutesPerformances(): Observable<PerformanceAgent[]> {
    return this.http.get<PerformanceAgent[]>(`${this.baseUrl}/tous`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Calculer les performances pour une période
   */
  calculerPerformancesPeriode(periode: string): Observable<PerformanceAgent[]> {
    return this.http.post<PerformanceAgent[]>(`${this.baseUrl}/calculer/periode/${periode}`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Gestion des erreurs
   */
  private handleError = (error: any): Observable<never> => {
    console.error('Erreur dans PerformanceService:', error);
    return throwError(() => error);
  };
}

