import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FluxFrais, StatutFrais, PhaseFrais, ValidationFraisDTO } from '../../shared/models/finance.models';

@Injectable({
  providedIn: 'root'
})
export class FluxFraisService {
  private apiUrl = `${environment.apiUrl}/api/frais`;

  constructor(private http: HttpClient) {}

  // CRUD
  createFluxFrais(frais: Partial<FluxFrais>): Observable<FluxFrais> {
    return this.http.post<FluxFrais>(this.apiUrl, frais).pipe(
      catchError(this.handleError)
    );
  }

  getFluxFraisById(id: number): Observable<FluxFrais> {
    return this.http.get<FluxFrais>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getAllFluxFrais(): Observable<FluxFrais[]> {
    return this.http.get<FluxFrais[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getFluxFraisByDossier(dossierId: number): Observable<FluxFrais[]> {
    return this.http.get<FluxFrais[]>(`${this.apiUrl}/dossier/${dossierId}`).pipe(
      catchError(this.handleError)
    );
  }

  updateFluxFrais(id: number, frais: Partial<FluxFrais>): Observable<FluxFrais> {
    return this.http.put<FluxFrais>(`${this.apiUrl}/${id}`, frais).pipe(
      catchError(this.handleError)
    );
  }

  deleteFluxFrais(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Validation
  validerFrais(id: number, dto?: ValidationFraisDTO): Observable<FluxFrais> {
    return this.http.put<FluxFrais>(`${this.apiUrl}/${id}/valider`, dto || {}).pipe(
      catchError(this.handleError)
    );
  }

  rejeterFrais(id: number, dto: ValidationFraisDTO): Observable<FluxFrais> {
    return this.http.put<FluxFrais>(`${this.apiUrl}/${id}/rejeter`, dto).pipe(
      catchError(this.handleError)
    );
  }

  // Filtres
  getFluxFraisEnAttente(): Observable<FluxFrais[]> {
    return this.http.get<FluxFrais[]>(`${this.apiUrl}/en-attente`).pipe(
      catchError(this.handleError)
    );
  }

  getFluxFraisByStatut(statut: StatutFrais): Observable<FluxFrais[]> {
    return this.http.get<FluxFrais[]>(`${this.apiUrl}/statut/${statut}`).pipe(
      catchError(this.handleError)
    );
  }

  getFluxFraisByPhase(phase: PhaseFrais): Observable<FluxFrais[]> {
    return this.http.get<FluxFrais[]>(`${this.apiUrl}/phase/${phase}`).pipe(
      catchError(this.handleError)
    );
  }

  getFluxFraisByDateRange(startDate: string, endDate: string): Observable<FluxFrais[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<FluxFrais[]>(`${this.apiUrl}/date-range`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // Calculs
  calculerTotalFraisByDossier(dossierId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/dossier/${dossierId}/total`).pipe(
      catchError(this.handleError)
    );
  }

  // Import CSV
  importerFraisDepuisCSV(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/import-csv`, formData).pipe(
      catchError(this.handleError)
    );
  }

  // Création automatique
  creerFraisDepuisAction(actionId: number): Observable<FluxFrais> {
    return this.http.post<FluxFrais>(`${this.apiUrl}/action/${actionId}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  creerFraisDepuisEnquete(enqueteId: number): Observable<FluxFrais> {
    return this.http.post<FluxFrais>(`${this.apiUrl}/enquete/${enqueteId}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  creerFraisDepuisAudience(audienceId: number): Observable<FluxFrais> {
    return this.http.post<FluxFrais>(`${this.apiUrl}/audience/${audienceId}`, {}).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('Erreur dans FluxFraisService:', error);
    return throwError(() => error);
  }
}

