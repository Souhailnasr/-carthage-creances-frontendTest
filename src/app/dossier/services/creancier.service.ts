import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, catchError } from 'rxjs/operators';
import { Creancier } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class CreancierService {
  private creanciers: Creancier[] = [
    new Creancier({
      id: 1,
      codeCreancier: 'C001',
      codeCreance: 'CREA001',
      nom: 'Entreprise Tunisie Telecom',
      prenom: '',
      adresse: 'Avenue Habib Bourguiba',
      ville: 'Tunis',
      codePostal: '1000',
      telephone: '71234567',
      fax: '71234568',
      email: 'contact@tunisietelecom.tn',
      agentCreateur: 'John Doe'
    }),
    new Creancier({
      id: 2,
      codeCreancier: 'C002',
      codeCreance: 'CREA002',
      nom: 'Banque de Tunisie',
      prenom: '',
      adresse: 'Rue de la République',
      ville: 'Tunis',
      codePostal: '1001',
      telephone: '71234568',
      fax: '71234569',
      email: 'contact@btd.com.tn',
      agentCreateur: 'Jane Smith'
    }),
    new Creancier({
      id: 3,
      codeCreancier: 'C003',
      codeCreance: 'CREA003',
      nom: 'STEG',
      prenom: '',
      adresse: 'Rue de la République',
      ville: 'Tunis',
      codePostal: '1000',
      telephone: '71234569',
      fax: '71234570',
      email: 'contact@steg.com.tn',
      agentCreateur: 'Mike Johnson'
    })
  ];
  private baseUrl = '/api/creanciers';

  constructor(private http: HttpClient) { }

  getAll(): Observable<Creancier[]> {
    return of(this.creanciers).pipe(delay(500), catchError(this.handleError));
  }

  getById(id: string): Observable<Creancier | undefined> {
    const creancier = this.creanciers.find(c => c.id.toString() === id);
    return of(creancier).pipe(delay(200), catchError(this.handleError));
  }

  create(creancier: Creancier): Observable<Creancier> {
    creancier.id = this.creanciers.length + 1;
    this.creanciers.push(creancier);
    return of(creancier).pipe(delay(200), catchError(this.handleError));
  }

  update(id: string, updatedCreancier: Creancier): Observable<Creancier> {
    const index = this.creanciers.findIndex(c => c.id.toString() === id);
    if (index > -1) {
      const existingCreancier = this.creanciers[index];
      const mergedCreancier = new Creancier({ ...existingCreancier, ...updatedCreancier });
      this.creanciers[index] = mergedCreancier;
      return of(this.creanciers[index]).pipe(delay(200), catchError(this.handleError));
    }
    return throwError(() => new Error('Creancier not found'));
  }

  delete(id: string): Observable<boolean> {
    const initialLength = this.creanciers.length;
    this.creanciers = this.creanciers.filter(c => c.id.toString() !== id);
    if (this.creanciers.length < initialLength) {
      return of(true).pipe(delay(200), catchError(this.handleError));
    }
    return throwError(() => new Error('Creancier not found'));
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred in CreancierService:', error);
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}
