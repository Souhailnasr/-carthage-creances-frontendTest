import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Facture, FactureStatut, SoldeFactureDTO } from '../../shared/models/finance.models';

@Injectable({
  providedIn: 'root'
})
export class FactureService {
  private apiUrl = `${environment.apiUrl}/api/factures`;

  constructor(private http: HttpClient) {}

  // CRUD
  createFacture(facture: Partial<Facture>): Observable<Facture> {
    return this.http.post<any>(this.apiUrl, facture).pipe(
      map(response => this.mapFactureFromBackend(response)),
      catchError(this.handleError)
    );
  }

  getFactureById(id: number): Observable<Facture> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => this.mapFactureFromBackend(response)),
      catchError(this.handleError)
    );
  }

  getAllFactures(): Observable<Facture[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(factures => factures.map(f => this.mapFactureFromBackend(f))),
      catchError(this.handleError)
    );
  }

  getFacturesByDossier(dossierId: number): Observable<Facture[]> {
    return this.http.get<any[]>(`${this.apiUrl}/dossier/${dossierId}`).pipe(
      map(factures => factures.map(f => this.mapFactureFromBackend(f))),
      catchError(this.handleError)
    );
  }

  updateFacture(id: number, facture: Partial<Facture>): Observable<Facture> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, facture).pipe(
      map(response => this.mapFactureFromBackend(response)),
      catchError(this.handleError)
    );
  }

  deleteFacture(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Génération automatique
  genererFactureAutomatique(
    dossierId: number,
    periodeDebut?: string,
    periodeFin?: string
  ): Observable<Facture> {
    let params = new HttpParams();
    if (periodeDebut) params = params.set('periodeDebut', periodeDebut);
    if (periodeFin) params = params.set('periodeFin', periodeFin);
    return this.http.post<any>(`${this.apiUrl}/dossier/${dossierId}/generer`, {}, { params }).pipe(
      map(response => this.mapFactureFromBackend(response)),
      catchError(this.handleError)
    );
  }

  // Workflow
  finaliserFacture(id: number): Observable<Facture> {
    return this.http.put<any>(`${this.apiUrl}/${id}/finaliser`, {}).pipe(
      map(response => this.mapFactureFromBackend(response)),
      catchError(this.handleError)
    );
  }

  envoyerFacture(id: number): Observable<Facture> {
    return this.http.put<any>(`${this.apiUrl}/${id}/envoyer`, {}).pipe(
      map(response => this.mapFactureFromBackend(response)),
      catchError(this.handleError)
    );
  }

  relancerFacture(id: number): Observable<Facture> {
    return this.http.put<any>(`${this.apiUrl}/${id}/relancer`, {}).pipe(
      map(response => this.mapFactureFromBackend(response)),
      catchError(this.handleError)
    );
  }

  // Filtres
  getFacturesByStatut(statut: FactureStatut): Observable<Facture[]> {
    return this.http.get<any[]>(`${this.apiUrl}/statut/${statut}`).pipe(
      map(factures => factures.map(f => this.mapFactureFromBackend(f))),
      catchError(this.handleError)
    );
  }

  getFacturesEnRetard(): Observable<Facture[]> {
    return this.http.get<any[]>(`${this.apiUrl}/en-retard`).pipe(
      map(factures => factures.map(f => this.mapFactureFromBackend(f))),
      catchError(this.handleError)
    );
  }

  /**
   * Calculer le solde restant d'une facture
   * GET /api/factures/{factureId}/solde
   */
  getSoldeFacture(factureId: number): Observable<SoldeFactureDTO> {
    return this.http.get<SoldeFactureDTO>(`${this.apiUrl}/${factureId}/solde`).pipe(
      catchError(this.handleError)
    );
  }

  // PDF
  genererPdfFacture(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' }).pipe(
      catchError(this.handleError)
    );
  }

  downloadPdfFacture(id: number): void {
    this.genererPdfFacture(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `facture-${id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement du PDF:', error);
      }
    });
  }

  /**
   * Mappe les données de facture du backend (snake_case) vers le format frontend (camelCase)
   */
  private mapFactureFromBackend(facture: any): Facture {
    // Le backend renvoie maintenant dossierId (camelCase) via FactureDTO
    // On garde la compatibilité avec d'autres formats au cas où
    let dossierId: number | null = null;
    
    if (facture.dossierId !== undefined && facture.dossierId !== null) {
      dossierId = facture.dossierId;
    } else if (facture.dossier_id !== undefined && facture.dossier_id !== null) {
      dossierId = facture.dossier_id;
    } else if (facture.dossier?.id !== undefined && facture.dossier?.id !== null) {
      dossierId = facture.dossier.id;
    } else if (facture.dossier?.dossierId !== undefined && facture.dossier?.dossierId !== null) {
      dossierId = facture.dossier.dossierId;
    }
    
    // Log uniquement si dossierId est manquant (cas d'erreur)
    if (!dossierId) {
      console.warn('⚠️ La facture n\'a pas de dossierId dans la réponse backend', facture);
    }

    return {
      id: facture.id,
      numeroFacture: facture.numeroFacture || facture.numero_facture || '',
      dossierId: dossierId,
      periodeDebut: facture.periodeDebut || facture.periode_debut 
        ? (typeof (facture.periodeDebut || facture.periode_debut) === 'string' 
          ? new Date(facture.periodeDebut || facture.periode_debut) 
          : facture.periodeDebut || facture.periode_debut)
        : undefined,
      periodeFin: facture.periodeFin || facture.periode_fin
        ? (typeof (facture.periodeFin || facture.periode_fin) === 'string'
          ? new Date(facture.periodeFin || facture.periode_fin)
          : facture.periodeFin || facture.periode_fin)
        : undefined,
      dateEmission: facture.dateEmission || facture.date_emission
        ? (typeof (facture.dateEmission || facture.date_emission) === 'string'
          ? new Date(facture.dateEmission || facture.date_emission)
          : facture.dateEmission || facture.date_emission)
        : new Date(),
      dateEcheance: facture.dateEcheance || facture.date_echeance
        ? (typeof (facture.dateEcheance || facture.date_echeance) === 'string'
          ? new Date(facture.dateEcheance || facture.date_echeance)
          : facture.dateEcheance || facture.date_echeance)
        : undefined,
      montantHT: facture.montantHT || facture.montantht || 0,
      montantTTC: facture.montantTTC || facture.montantttc || 0,
      tva: facture.tva || 0,
      statut: facture.statut || 'BROUILLON',
      pdfUrl: facture.pdfUrl || facture.pdf_url || undefined,
      envoyee: facture.envoyee !== undefined ? facture.envoyee : false,
      relanceEnvoyee: facture.relanceEnvoyee !== undefined ? facture.relanceEnvoyee : (facture.relance_envoyee !== undefined ? facture.relance_envoyee : false)
    } as Facture;
  }

  private handleError(error: any): Observable<never> {
    console.error('Erreur dans FactureService:', error);
    return throwError(() => error);
  }
}

