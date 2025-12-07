import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { HistoriqueRecouvrement, ResumeRecouvrement } from '../../shared/models/historique-recouvrement.model';

@Injectable({
  providedIn: 'root'
})
export class HistoriqueRecouvrementService {
  private apiUrl = `${environment.apiUrl}/api/historique-recouvrement`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || sessionStorage.getItem('auth-user');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Récupère l'historique complet d'un dossier
   */
  getHistoriqueByDossier(dossierId: number): Observable<HistoriqueRecouvrement[]> {
    const headers = this.getHeaders();
    return this.http.get<HistoriqueRecouvrement[]>(
      `${this.apiUrl}/dossier/${dossierId}`,
      { headers }
    ).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération de l\'historique:', error);
        return [];
      })
    );
  }

  /**
   * Récupère l'historique d'un dossier par phase
   */
  getHistoriqueByDossierAndPhase(
    dossierId: number, 
    phase: 'AMIABLE' | 'JURIDIQUE'
  ): Observable<HistoriqueRecouvrement[]> {
    const headers = this.getHeaders();
    return this.http.get<HistoriqueRecouvrement[]>(
      `${this.apiUrl}/dossier/${dossierId}/phase/${phase}`,
      { headers }
    ).pipe(
      catchError((error) => {
        console.error(`❌ Erreur lors de la récupération de l'historique pour la phase ${phase}:`, error);
        return [];
      })
    );
  }

  /**
   * Récupère le résumé des montants par phase
   */
  getResumeByDossier(dossierId: number): Observable<ResumeRecouvrement | null> {
    const headers = this.getHeaders();
    return this.http.get<ResumeRecouvrement>(
      `${this.apiUrl}/dossier/${dossierId}/resume`,
      { headers }
    ).pipe(
      catchError((error) => {
        console.error('❌ Erreur lors de la récupération du résumé:', error);
        return null;
      })
    );
  }
}

