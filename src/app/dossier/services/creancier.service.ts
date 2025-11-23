import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Creancier } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class CreancierService {
  private baseUrl = `${environment.apiUrl}/api/creanciers`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Creancier[]> {
    return this.http.get<Creancier[]>(this.baseUrl)
      .pipe(catchError(this.handleError));
  }

  getById(id: string | number): Observable<Creancier> {
    return this.http.get<Creancier>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  create(creancier: Creancier): Observable<Creancier> {
    return this.http.post<Creancier>(this.baseUrl, creancier)
      .pipe(catchError(this.handleError));
  }

  update(id: string | number, updatedCreancier: Creancier): Observable<Creancier> {
    return this.http.put<Creancier>(`${this.baseUrl}/${id}`, updatedCreancier)
      .pipe(catchError(this.handleError));
  }

  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred in CreancierService:', error);
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}
