import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuditLog {
  id: number;
  dateHeure: string;
  utilisateur: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  };
  typeAction: string;
  entite: string;
  entiteId: number;
  details: string;
  avant?: any;
  apres?: any;
  ip: string;
}

export interface AuditFilters {
  typeAction?: string[];
  utilisateurId?: number;
  dateDebut?: string;
  dateFin?: string;
  entite?: string;
  entiteId?: number;
  ip?: string;
  recherche?: string;
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private apiUrl = `${environment.apiUrl}/api/admin/audit`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('❌ Erreur AuditService:', error);
    return throwError(() => error);
  }

  /**
   * Récupère les logs d'audit avec filtres
   */
  getLogs(filters: AuditFilters = {}): Observable<{ content: AuditLog[]; totalElements: number; totalPages: number }> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    
    if (filters.typeAction && filters.typeAction.length > 0) {
      filters.typeAction.forEach(t => params = params.append('typeAction', t));
    }
    if (filters.utilisateurId) params = params.set('utilisateurId', filters.utilisateurId.toString());
    if (filters.dateDebut) params = params.set('dateDebut', filters.dateDebut);
    if (filters.dateFin) params = params.set('dateFin', filters.dateFin);
    if (filters.entite) params = params.set('entite', filters.entite);
    if (filters.entiteId) params = params.set('entiteId', filters.entiteId.toString());
    if (filters.ip) params = params.set('ip', filters.ip);
    if (filters.recherche) params = params.set('recherche', filters.recherche);
    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.size !== undefined) params = params.set('size', filters.size.toString());

    return this.http.get<{ content: AuditLog[]; totalElements: number; totalPages: number }>(
      `${this.apiUrl}/logs`,
      { headers, params }
    ).pipe(
      tap(data => console.log('✅ Logs récupérés:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les logs d'un utilisateur spécifique
   */
  getLogsByUser(userId: number, filters: { dateDebut?: string; dateFin?: string; page?: number; size?: number } = {}): Observable<{ content: AuditLog[]; totalElements: number; totalPages: number }> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    
    if (filters.dateDebut) params = params.set('dateDebut', filters.dateDebut);
    if (filters.dateFin) params = params.set('dateFin', filters.dateFin);
    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.size !== undefined) params = params.set('size', filters.size.toString());

    return this.http.get<{ content: AuditLog[]; totalElements: number; totalPages: number }>(
      `${this.apiUrl}/logs/utilisateur/${userId}`,
      { headers, params }
    ).pipe(
      tap(data => console.log('✅ Logs utilisateur récupérés:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère l'historique complet d'un dossier
   */
  getLogsByDossier(dossierId: number): Observable<AuditLog[]> {
    const headers = this.getHeaders();
    return this.http.get<AuditLog[]>(
      `${this.apiUrl}/logs/dossier/${dossierId}`,
      { headers }
    ).pipe(
      tap(logs => console.log('✅ Historique dossier récupéré:', logs)),
      catchError(this.handleError)
    );
  }

  /**
   * Exporte les logs en CSV
   */
  exportLogsCSV(filters: AuditFilters = {}): Observable<Blob> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    
    if (filters.typeAction && filters.typeAction.length > 0) {
      filters.typeAction.forEach(t => params = params.append('typeAction', t));
    }
    if (filters.utilisateurId) params = params.set('utilisateurId', filters.utilisateurId.toString());
    if (filters.dateDebut) params = params.set('dateDebut', filters.dateDebut);
    if (filters.dateFin) params = params.set('dateFin', filters.dateFin);
    if (filters.entite) params = params.set('entite', filters.entite);

    return this.http.get(
      `${this.apiUrl}/logs/export-csv`,
      { headers, params, responseType: 'blob' }
    ).pipe(
      tap(() => console.log('✅ CSV généré')),
      catchError(this.handleError)
    );
  }
}

