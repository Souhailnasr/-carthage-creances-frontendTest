import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, catchError } from 'rxjs/operators';
import { Avocat } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class AvocatService {
  private avocats: Avocat[] = [
    new Avocat({
      id: '1',
      nom: 'Ben Ali',
      prenom: 'Mohamed',
      email: 'mohamed.benali@avocat.tn',
      telephone: '71234567',
      specialite: 'Droit Commercial',
      adresse: 'Avenue Habib Bourguiba, Tunis'
    }),
    new Avocat({
      id: '2',
      nom: 'Trabelsi',
      prenom: 'Fatma',
      email: 'fatma.trabelsi@avocat.tn',
      telephone: '71234568',
      specialite: 'Droit Civil',
      adresse: 'Rue de la République, Sfax'
    }),
    new Avocat({
      id: '3',
      nom: 'Khelil',
      prenom: 'Ahmed',
      email: 'ahmed.khelil@avocat.tn',
      telephone: '71234569',
      specialite: 'Droit Pénal',
      adresse: 'Avenue de l\'Indépendance, Sousse'
    })
  ];
  private baseUrl = '/api/avocats';

  constructor(private http: HttpClient) { }

  getAll(): Observable<Avocat[]> {
    return of(this.avocats).pipe(delay(500), catchError(this.handleError));
  }

  getById(id: string): Observable<Avocat | undefined> {
    const avocat = this.avocats.find(a => a.id === id);
    return of(avocat).pipe(delay(200), catchError(this.handleError));
  }

  create(avocat: Avocat): Observable<Avocat> {
    avocat.id = (this.avocats.length + 1).toString();
    this.avocats.push(avocat);
    return of(avocat).pipe(delay(200), catchError(this.handleError));
  }

  update(id: string, updatedAvocat: Avocat): Observable<Avocat> {
    const index = this.avocats.findIndex(a => a.id === id);
    if (index > -1) {
      const existingAvocat = this.avocats[index];
      const mergedAvocat = new Avocat({ ...existingAvocat, ...updatedAvocat });
      this.avocats[index] = mergedAvocat;
      return of(this.avocats[index]).pipe(delay(200), catchError(this.handleError));
    }
    return throwError(() => new Error('Avocat not found'));
  }

  delete(id: string): Observable<boolean> {
    const initialLength = this.avocats.length;
    this.avocats = this.avocats.filter(a => a.id !== id);
    if (this.avocats.length < initialLength) {
      return of(true).pipe(delay(200), catchError(this.handleError));
    }
    return throwError(() => new Error('Avocat not found'));
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred in AvocatService:', error);
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}
