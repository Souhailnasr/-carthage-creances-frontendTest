import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, catchError } from 'rxjs/operators';
import { Debiteur } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class DebiteurService {
  private debiteurs: Debiteur[] = [
    new Debiteur({
      id: 1,
      codeCreance: 'CREA001',
      nom: 'Ben Ali',
      prenom: 'Ahmed',
      adresse: 'Rue de la Paix',
      ville: 'Sfax',
      codePostal: '3000',
      telephone: '71234569',
      fax: '71234570',
      email: 'ahmed.benali@email.com',
      agentCreateur: 'John Doe'
    }),
    new Debiteur({
      id: 2,
      codeCreance: 'CREA002',
      nom: 'Trabelsi',
      prenom: 'Fatma',
      adresse: 'Avenue Habib Bourguiba',
      ville: 'Sousse',
      codePostal: '4000',
      telephone: '71234570',
      fax: '71234571',
      email: 'fatma.trabelsi@email.com',
      agentCreateur: 'Jane Smith'
    }),
    new Debiteur({
      id: 3,
      codeCreance: 'CREA003',
      nom: 'Hammami',
      prenom: 'Sonia',
      adresse: 'Rue de la Liberté',
      ville: 'Monastir',
      codePostal: '5000',
      telephone: '33444555',
      fax: '33444556',
      email: 'sonia.hammami@email.com',
      agentCreateur: 'Mike Johnson'
    })
  ];
  private baseUrl = '/api/debiteurs';

  constructor(private http: HttpClient) { }

  getAll(): Observable<Debiteur[]> {
    return of(this.debiteurs).pipe(delay(500), catchError(this.handleError));
  }

  getById(id: string): Observable<Debiteur | undefined> {
    const debiteur = this.debiteurs.find(d => d.id.toString() === id);
    return of(debiteur).pipe(delay(200), catchError(this.handleError));
  }

  create(debiteur: Debiteur): Observable<Debiteur> {
    debiteur.id = this.debiteurs.length + 1;
    this.debiteurs.push(debiteur);
    return of(debiteur).pipe(delay(200), catchError(this.handleError));
  }

  update(id: string, updatedDebiteur: Debiteur): Observable<Debiteur> {
    const index = this.debiteurs.findIndex(d => d.id.toString() === id);
    if (index > -1) {
      const existingDebiteur = this.debiteurs[index];
      const mergedDebiteur = new Debiteur({ ...existingDebiteur, ...updatedDebiteur });
      this.debiteurs[index] = mergedDebiteur;
      return of(this.debiteurs[index]).pipe(delay(200), catchError(this.handleError));
    }
    return throwError(() => new Error('Debiteur not found'));
  }

  delete(id: string): Observable<boolean> {
    const initialLength = this.debiteurs.length;
    this.debiteurs = this.debiteurs.filter(d => d.id.toString() !== id);
    if (this.debiteurs.length < initialLength) {
      return of(true).pipe(delay(200), catchError(this.handleError));
    }
    return throwError(() => new Error('Debiteur not found'));
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred in DebiteurService:', error);
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }
}
