import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Debiteur } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class DebiteurService {
  private baseUrl = `${environment.apiUrl}/api/debiteurs`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Debiteur[]> {
    return this.http.get<Debiteur[]>(this.baseUrl)
      .pipe(catchError(this.handleError));
  }

  getById(id: string | number): Observable<Debiteur> {
    return this.http.get<Debiteur>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  create(debiteur: Debiteur): Observable<Debiteur> {
    return this.http.post<Debiteur>(this.baseUrl, debiteur)
      .pipe(catchError(this.handleError));
  }

  update(id: string | number, updatedDebiteur: Debiteur): Observable<Debiteur> {
    return this.http.put<Debiteur>(`${this.baseUrl}/${id}`, updatedDebiteur)
      .pipe(catchError(this.handleError));
  }

  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred in DebiteurService:', error);
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}
