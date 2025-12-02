import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Paiement, StatutPaiement } from '../../shared/models/finance.models';

@Injectable({
  providedIn: 'root'
})
export class PaiementService {
  private apiUrl = `${environment.apiUrl}/api/paiements`;

  constructor(private http: HttpClient) {}

  // CRUD
  createPaiement(paiement: Partial<Paiement>): Observable<Paiement> {
    return this.http.post<Paiement>(this.apiUrl, paiement).pipe(
      catchError(this.handleError)
    );
  }

  getPaiementById(id: number): Observable<Paiement> {
    return this.http.get<Paiement>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getAllPaiements(): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getPaiementsByFacture(factureId: number): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.apiUrl}/facture/${factureId}`).pipe(
      catchError(this.handleError)
    );
  }

  updatePaiement(id: number, paiement: Partial<Paiement>): Observable<Paiement> {
    return this.http.put<Paiement>(`${this.apiUrl}/${id}`, paiement).pipe(
      catchError(this.handleError)
    );
  }

  deletePaiement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Validation
  validerPaiement(id: number): Observable<Paiement> {
    return this.http.put<Paiement>(`${this.apiUrl}/${id}/valider`, {}).pipe(
      catchError(this.handleError)
    );
  }

  refuserPaiement(id: number, motif: string): Observable<Paiement> {
    const params = new HttpParams().set('motif', motif);
    return this.http.put<Paiement>(`${this.apiUrl}/${id}/refuser`, {}, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // Filtres
  getPaiementsByStatut(statut: StatutPaiement): Observable<Paiement[]> {
    return this.http.get<Paiement[]>(`${this.apiUrl}/statut/${statut}`).pipe(
      catchError(this.handleError)
    );
  }

  getPaiementsByDateRange(startDate: string, endDate: string): Observable<Paiement[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<Paiement[]>(`${this.apiUrl}/date-range`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // Calculs
  calculerTotalPaiementsByFacture(factureId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/facture/${factureId}/total`).pipe(
      catchError(this.handleError)
    );
  }

  calculerTotalPaiementsByDateRange(startDate: string, endDate: string): Observable<number> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<number>(`${this.apiUrl}/date-range/total`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('Erreur dans PaiementService:', error);
    return throwError(() => error);
  }
}

