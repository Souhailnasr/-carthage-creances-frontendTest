import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ActionHuissier, ActionHuissierDTO } from '../models/huissier-action.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HuissierActionService {
  private apiUrl = `${environment.apiUrl}/api/huissier`;

  constructor(private http: HttpClient) {}

  /**
   * Crée une action huissier
   * POST /api/huissier/action
   */
  createAction(dto: ActionHuissierDTO): Observable<ActionHuissier> {
    return this.http.post<ActionHuissier>(`${this.apiUrl}/action`, dto)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère une action par son ID
   * GET /api/huissier/action/{id}
   */
  getActionById(id: number): Observable<ActionHuissier> {
    return this.http.get<ActionHuissier>(`${this.apiUrl}/action/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère toutes les actions d'un dossier
   * GET /api/huissier/actions?dossierId={id}
   */
  getActionsByDossier(dossierId: number): Observable<ActionHuissier[]> {
    const params = new HttpParams().set('dossierId', dossierId.toString());
    return this.http.get<ActionHuissier[]>(`${this.apiUrl}/actions`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Met à jour une action huissier
   * PUT /api/huissier/action/{id}
   */
  updateAction(id: number, dto: ActionHuissierDTO): Observable<ActionHuissier> {
    return this.http.put<ActionHuissier>(`${this.apiUrl}/action/${id}`, dto)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Supprime une action huissier
   * DELETE /api/huissier/action/{id}
   */
  deleteAction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/action/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('Erreur dans HuissierActionService:', error);
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur réseau: ${error.error.message}`;
    } else {
      errorMessage = `Erreur ${error.status}: ${error.error?.message || error.statusText}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}

