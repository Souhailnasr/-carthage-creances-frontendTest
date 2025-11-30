import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DocumentHuissier, DocumentHuissierDTO } from '../models/huissier-document.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HuissierDocumentService {
  private apiUrl = `${environment.apiUrl}/api/huissier`;

  constructor(private http: HttpClient) {}

  /**
   * Crée un document huissier
   * POST /api/huissier/document
   */
  createDocument(dto: DocumentHuissierDTO): Observable<DocumentHuissier> {
    return this.http.post<DocumentHuissier>(`${this.apiUrl}/document`, dto)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère un document par son ID
   * GET /api/huissier/document/{id}
   */
  getDocumentById(id: number): Observable<DocumentHuissier> {
    return this.http.get<DocumentHuissier>(`${this.apiUrl}/document/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère tous les documents d'un dossier
   * GET /api/huissier/documents?dossierId={id}
   */
  getDocumentsByDossier(dossierId: number): Observable<DocumentHuissier[]> {
    const params = new HttpParams().set('dossierId', dossierId.toString());
    return this.http.get<DocumentHuissier[]>(`${this.apiUrl}/documents`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Met à jour un document huissier
   * PUT /api/huissier/document/{id}
   */
  updateDocument(id: number, dto: DocumentHuissierDTO): Observable<DocumentHuissier> {
    return this.http.put<DocumentHuissier>(`${this.apiUrl}/document/${id}`, dto)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Supprime un document huissier
   * DELETE /api/huissier/document/{id}
   */
  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/document/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Marque un document comme expiré
   * PUT /api/huissier/document/{id}/expire
   */
  markDocumentAsExpired(id: number): Observable<DocumentHuissier> {
    return this.http.put<DocumentHuissier>(`${this.apiUrl}/document/${id}/expire`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('Erreur dans HuissierDocumentService:', error);
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur réseau: ${error.error.message}`;
    } else {
      errorMessage = `Erreur ${error.status}: ${error.error?.message || error.statusText}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}

