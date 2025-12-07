import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DossierApi } from '../../shared/models/dossier-api.model';

export interface SupervisionFilters {
  statut?: string[];
  departement?: string[];
  montantMin?: number;
  montantMax?: number;
  urgence?: string;
  agentId?: number;
  scoreIA?: string;
  dateCreationDebut?: string;
  dateCreationFin?: string;
  dateDerniereActionDebut?: string;
  dateDerniereActionFin?: string;
  montantRecouvreMin?: number;
  montantRecouvreMax?: number;
  debiteur?: string;
  page?: number;
  size?: number;
}

export interface ReaffectationRequest {
  nouveauDepartement: string;
  nouveauStatut?: string;
  agentId?: number;
  raison?: string;
}

export interface CommentaireInterneRequest {
  commentaire: string;
  visibleParChef?: boolean;
}

export interface ForcerStatutRequest {
  nouveauStatut: string;
  raison: string;
}

export interface ReactivationRequest {
  raison: string;
  nouveauStatut: string;
  nouveauDepartement: string;
  agentId?: number;
  dateReactivation?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupervisionService {
  private apiUrl = `${environment.apiUrl}/api/admin/supervision`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('❌ Erreur SupervisionService:', error);
    return throwError(() => error);
  }

  /**
   * Récupère tous les dossiers actifs avec filtres avancés
   */
  getDossiersActifs(filters: SupervisionFilters = {}): Observable<{ content: DossierApi[]; totalElements: number; totalPages: number }> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    
    // Ajouter les filtres aux paramètres
    if (filters.statut && filters.statut.length > 0) {
      filters.statut.forEach(s => params = params.append('statut', s));
    }
    if (filters.departement && filters.departement.length > 0) {
      filters.departement.forEach(d => params = params.append('departement', d));
    }
    if (filters.montantMin) params = params.set('montantMin', filters.montantMin.toString());
    if (filters.montantMax) params = params.set('montantMax', filters.montantMax.toString());
    if (filters.urgence) params = params.set('urgence', filters.urgence);
    if (filters.agentId) params = params.set('agentId', filters.agentId.toString());
    if (filters.scoreIA) params = params.set('scoreIA', filters.scoreIA);
    if (filters.dateCreationDebut) params = params.set('dateCreationDebut', filters.dateCreationDebut);
    if (filters.dateCreationFin) params = params.set('dateCreationFin', filters.dateCreationFin);
    if (filters.dateDerniereActionDebut) params = params.set('dateDerniereActionDebut', filters.dateDerniereActionDebut);
    if (filters.dateDerniereActionFin) params = params.set('dateDerniereActionFin', filters.dateDerniereActionFin);
    if (filters.montantRecouvreMin) params = params.set('montantRecouvreMin', filters.montantRecouvreMin.toString());
    if (filters.montantRecouvreMax) params = params.set('montantRecouvreMax', filters.montantRecouvreMax.toString());
    if (filters.debiteur) params = params.set('debiteur', filters.debiteur);
    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.size !== undefined) params = params.set('size', filters.size.toString());

    return this.http.get<{ content: DossierApi[]; totalElements: number; totalPages: number }>(
      `${this.apiUrl}/dossiers-actifs`,
      { headers, params }
    ).pipe(
      tap(data => console.log('✅ Dossiers actifs récupérés:', data)),
      catchError(this.handleError)
    );
  }

  /**
   * Réaffecte un dossier à un autre département
   */
  reaffecterDossier(dossierId: number, request: ReaffectationRequest): Observable<DossierApi> {
    const headers = this.getHeaders();
    return this.http.put<DossierApi>(
      `${this.apiUrl}/dossiers/${dossierId}/reaffecter`,
      request,
      { headers }
    ).pipe(
      tap(dossier => console.log('✅ Dossier réaffecté:', dossier)),
      catchError(this.handleError)
    );
  }

  /**
   * Ajoute un commentaire interne (visible par Superadmin et chef de département)
   */
  ajouterCommentaireInterne(dossierId: number, request: CommentaireInterneRequest): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post<any>(
      `${this.apiUrl}/dossiers/${dossierId}/commentaire-interne`,
      request,
      { headers }
    ).pipe(
      tap(result => console.log('✅ Commentaire interne ajouté:', result)),
      catchError(this.handleError)
    );
  }

  /**
   * Force un changement de statut avec justification
   */
  forcerStatut(dossierId: number, request: ForcerStatutRequest): Observable<DossierApi> {
    const headers = this.getHeaders();
    return this.http.put<DossierApi>(
      `${this.apiUrl}/dossiers/${dossierId}/forcer-statut`,
      request,
      { headers }
    ).pipe(
      tap(dossier => console.log('✅ Statut forcé:', dossier)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les dossiers clôturés avec filtres
   */
  getDossiersClotures(filters: {
    motif?: string[];
    periodeDebut?: string;
    periodeFin?: string;
    montantMin?: number;
    montantMax?: number;
    departement?: string[];
    page?: number;
    size?: number;
  } = {}): Observable<{ content: DossierApi[]; totalElements: number; totalPages: number }> {
    // ✅ CORRECTION : Ajouter un header pour indiquer à l'intercepteur de ne pas afficher l'erreur
    // car on gère l'erreur localement avec un fallback
    const headers = this.getHeaders().set('X-Skip-Error-Toast', 'true');
    let params = new HttpParams();
    
    if (filters.motif && filters.motif.length > 0) {
      filters.motif.forEach(m => params = params.append('motif', m));
    }
    if (filters.periodeDebut) params = params.set('periodeDebut', filters.periodeDebut);
    if (filters.periodeFin) params = params.set('periodeFin', filters.periodeFin);
    if (filters.montantMin) params = params.set('montantMin', filters.montantMin.toString());
    if (filters.montantMax) params = params.set('montantMax', filters.montantMax.toString());
    if (filters.departement && filters.departement.length > 0) {
      filters.departement.forEach(d => params = params.append('departement', d));
    }
    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.size !== undefined) params = params.set('size', filters.size.toString());

    return this.http.get<{ content: DossierApi[]; totalElements: number; totalPages: number }>(
      `${this.apiUrl}/dossiers-clotures`,
      { headers, params }
    ).pipe(
      tap(data => console.log('✅ Dossiers clôturés récupérés:', data)),
      // ✅ CORRECTION : Ne pas utiliser handleError ici car on veut que l'erreur soit gérée par le composant
      // L'intercepteur ne l'affichera pas grâce au header X-Skip-Error-Toast
      catchError(error => {
        console.warn('⚠️ Erreur lors de la récupération des dossiers clôturés (gérée par le composant):', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Réactive un dossier clôturé
   */
  reactiverDossier(dossierId: number, request: ReactivationRequest): Observable<DossierApi> {
    const headers = this.getHeaders();
    return this.http.post<DossierApi>(
      `${this.apiUrl}/dossiers/${dossierId}/reactiver`,
      request,
      { headers }
    ).pipe(
      tap(dossier => console.log('✅ Dossier réactivé:', dossier)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère les dossiers archivés avec filtres
   */
  getDossiersArchives(filters: {
    dateArchivageDebut?: string;
    dateArchivageFin?: string;
    reference?: string;
    debiteur?: string;
    departement?: string[];
    recherche?: string; // Recherche full-text
    page?: number;
    size?: number;
  } = {}): Observable<{ content: DossierApi[]; totalElements: number; totalPages: number }> {
    // ✅ CORRECTION : Ajouter un header pour indiquer à l'intercepteur de ne pas afficher l'erreur
    // car on gère l'erreur localement avec un fallback
    const headers = this.getHeaders().set('X-Skip-Error-Toast', 'true');
    let params = new HttpParams();
    
    if (filters.dateArchivageDebut) params = params.set('dateArchivageDebut', filters.dateArchivageDebut);
    if (filters.dateArchivageFin) params = params.set('dateArchivageFin', filters.dateArchivageFin);
    if (filters.reference) params = params.set('reference', filters.reference);
    if (filters.debiteur) params = params.set('debiteur', filters.debiteur);
    if (filters.departement && filters.departement.length > 0) {
      filters.departement.forEach(d => params = params.append('departement', d));
    }
    if (filters.recherche) params = params.set('recherche', filters.recherche);
    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.size !== undefined) params = params.set('size', filters.size.toString());

    return this.http.get<{ content: DossierApi[]; totalElements: number; totalPages: number }>(
      `${this.apiUrl}/dossiers-archives`,
      { headers, params }
    ).pipe(
      tap(data => console.log('✅ Dossiers archivés récupérés:', data)),
      // ✅ CORRECTION : Ne pas utiliser handleError ici car on veut que l'erreur soit gérée par le composant
      // L'intercepteur ne l'affichera pas grâce au header X-Skip-Error-Toast
      catchError(error => {
        console.warn('⚠️ Erreur lors de la récupération des dossiers archivés (gérée par le composant):', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Télécharge le dossier complet en PDF (pour archives)
   */
  telechargerDossierCompletPDF(dossierId: number): Observable<Blob> {
    const headers = this.getHeaders();
    return this.http.get(
      `${this.apiUrl}/dossiers/${dossierId}/export-pdf`,
      { headers, responseType: 'blob' }
    ).pipe(
      tap(() => console.log('✅ PDF généré')),
      catchError(this.handleError)
    );
  }

  /**
   * Modifie les coordonnées d'un débiteur
   */
  modifierCoordonneesDebiteur(dossierId: number, coordonnees: {
    adresse?: string;
    telephone?: string;
    email?: string;
    ville?: string;
    codePostal?: string;
  }): Observable<DossierApi> {
    const headers = this.getHeaders();
    return this.http.put<DossierApi>(
      `${this.apiUrl}/dossiers/${dossierId}/coordonnees-debiteur`,
      coordonnees,
      { headers }
    ).pipe(
      tap(dossier => console.log('✅ Coordonnées modifiées:', dossier)),
      catchError(this.handleError)
    );
  }
}

