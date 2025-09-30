import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, catchError } from 'rxjs/operators';
import { Huissier } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class HuissierService {
  private huissiers: Huissier[] = [
    new Huissier({
      id: '1',
      nom: 'Ben Salem',
      prenom: 'Ali',
      email: 'ali.bensalem@huissier.tn',
      telephone: '71234570',
      specialite: 'Signification',
      adresse: 'Avenue Habib Bourguiba, Tunis'
    }),
    new Huissier({
      id: '2',
      nom: 'Mansouri',
      prenom: 'Khadija',
      email: 'khadija.mansouri@huissier.tn',
      telephone: '71234571',
      specialite: 'Saisie',
      adresse: 'Rue de la République, Sfax'
    }),
    new Huissier({
      id: '3',
      nom: 'Jebali',
      prenom: 'Omar',
      email: 'omar.jebali@huissier.tn',
      telephone: '71234572',
      specialite: 'Exécution',
      adresse: 'Avenue de l\'Indépendance, Sousse'
    })
  ];
  private baseUrl = '/api/huissiers';

  constructor(private http: HttpClient) { }

  getAll(): Observable<Huissier[]> {
    return of(this.huissiers).pipe(delay(500), catchError(this.handleError));
  }

  getById(id: string): Observable<Huissier | undefined> {
    const huissier = this.huissiers.find(h => h.id === id);
    return of(huissier).pipe(delay(200), catchError(this.handleError));
  }

  create(huissier: Huissier): Observable<Huissier> {
    huissier.id = (this.huissiers.length + 1).toString();
    this.huissiers.push(huissier);
    return of(huissier).pipe(delay(200), catchError(this.handleError));
  }

  update(id: string, updatedHuissier: Huissier): Observable<Huissier> {
    const index = this.huissiers.findIndex(h => h.id === id);
    if (index > -1) {
      const existingHuissier = this.huissiers[index];
      const mergedHuissier = new Huissier({ ...existingHuissier, ...updatedHuissier });
      this.huissiers[index] = mergedHuissier;
      return of(this.huissiers[index]).pipe(delay(200), catchError(this.handleError));
    }
    return throwError(() => new Error('Huissier not found'));
  }

  delete(id: string): Observable<boolean> {
    const initialLength = this.huissiers.length;
    this.huissiers = this.huissiers.filter(h => h.id !== id);
    if (this.huissiers.length < initialLength) {
      return of(true).pipe(delay(200), catchError(this.handleError));
    }
    return throwError(() => new Error('Huissier not found'));
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred in HuissierService:', error);
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}
