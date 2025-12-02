import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TarifCatalogue, PhaseFrais } from '../../shared/models/finance.models';

@Injectable({
  providedIn: 'root'
})
export class TarifCatalogueService {
  private apiUrl = `${environment.apiUrl}/api/tarifs`;

  constructor(private http: HttpClient) {}

  // CRUD
  createTarif(tarif: Partial<TarifCatalogue>): Observable<TarifCatalogue> {
    return this.http.post<TarifCatalogue>(this.apiUrl, tarif).pipe(
      catchError(this.handleError)
    );
  }

  getTarifById(id: number): Observable<TarifCatalogue> {
    return this.http.get<TarifCatalogue>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getAllTarifs(): Observable<TarifCatalogue[]> {
    return this.http.get<TarifCatalogue[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getTarifsActifs(): Observable<TarifCatalogue[]> {
    return this.http.get<TarifCatalogue[]>(`${this.apiUrl}/actifs`).pipe(
      catchError(this.handleError)
    );
  }

  updateTarif(id: number, tarif: Partial<TarifCatalogue>): Observable<TarifCatalogue> {
    return this.http.put<TarifCatalogue>(`${this.apiUrl}/${id}`, tarif).pipe(
      catchError(this.handleError)
    );
  }

  deleteTarif(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  desactiverTarif(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/desactiver`, {}).pipe(
      catchError(this.handleError)
    );
  }

  // Filtres
  getTarifsByPhase(phase: PhaseFrais): Observable<TarifCatalogue[]> {
    return this.http.get<TarifCatalogue[]>(`${this.apiUrl}/phase/${phase}`).pipe(
      catchError(this.handleError)
    );
  }

  getTarifsByCategorie(categorie: string): Observable<TarifCatalogue[]> {
    return this.http.get<TarifCatalogue[]>(`${this.apiUrl}/categorie/${categorie}`).pipe(
      catchError(this.handleError)
    );
  }

  // Historique
  getHistoriqueTarif(id: number): Observable<TarifCatalogue[]> {
    return this.http.get<TarifCatalogue[]>(`${this.apiUrl}/${id}/historique`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('Erreur dans TarifCatalogueService:', error);
    return throwError(() => error);
  }
}

