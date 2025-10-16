import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DossierService {
  private baseUrl = 'http://localhost:8089/carthage-creance/api/dossiers';

  constructor(private http: HttpClient) { }

  /**
   * Créer un dossier avec données JSON uniquement
   */
  createDossier(dossierData: any): Observable<any> {
    // Ajouter le statut par défaut si non fourni
    const dataWithDefaults = {
      ...dossierData,
      dossierStatus: dossierData.dossierStatus || 'ENCOURSDETRAITEMENT'
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.baseUrl}/create`, dataWithDefaults, { headers })
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la création du dossier:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Créer un dossier avec fichiers (multipart/form-data)
   */
  createDossierWithFiles(dossierData: any, contratFile?: File, pouvoirFile?: File): Observable<any> {
    // Ajouter le statut par défaut si non fourni
    const dataWithDefaults = {
      ...dossierData,
      dossierStatus: dossierData.dossierStatus || 'ENCOURSDETRAITEMENT'
    };

    const formData = new FormData();
    
    // Ajouter les données du dossier comme JSON string
    formData.append('dossier', JSON.stringify(dataWithDefaults));
    
    // Ajouter les fichiers si fournis
    if (contratFile) {
      formData.append('contratSigne', contratFile);
    }
    
    if (pouvoirFile) {
      formData.append('pouvoir', pouvoirFile);
    }

    return this.http.post(`${this.baseUrl}/create`, formData)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la création du dossier avec fichiers:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Récupérer tous les dossiers
   */
  getAllDossiers(): Observable<any> {
    return this.http.get(this.baseUrl)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la récupération des dossiers:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Récupérer un dossier par ID
   */
  getDossierById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la récupération du dossier ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Rechercher des dossiers par terme
   */
  searchDossiers(term: string): Observable<any> {
    const params = new HttpParams().set('term', term);
    
    return this.http.get(`${this.baseUrl}/search`, { params })
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la recherche de dossiers avec le terme "${term}":`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Modifier un dossier
   */
  updateDossier(id: number, data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.put(`${this.baseUrl}/${id}`, data, { headers })
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la modification du dossier ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Supprimer un dossier
   */
  deleteDossier(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la suppression du dossier ${id}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Assigner un agent à un dossier
   */
  assignAgent(dossierId: number, agentId: number): Observable<any> {
    const params = new HttpParams().set('agentId', agentId.toString());
    
    return this.http.put(`${this.baseUrl}/${dossierId}/assign/agent`, null, { params })
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de l'assignation de l'agent ${agentId} au dossier ${dossierId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Assigner un avocat à un dossier
   */
  assignAvocat(dossierId: number, avocatId: number): Observable<any> {
    const params = new HttpParams().set('avocatId', avocatId.toString());
    
    return this.http.put(`${this.baseUrl}/${dossierId}/assign/avocat`, null, { params })
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de l'assignation de l'avocat ${avocatId} au dossier ${dossierId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Assigner un huissier à un dossier
   */
  assignHuissier(dossierId: number, huissierId: number): Observable<any> {
    const params = new HttpParams().set('huissierId', huissierId.toString());
    
    return this.http.put(`${this.baseUrl}/${dossierId}/assign/huissier`, null, { params })
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de l'assignation du huissier ${huissierId} au dossier ${dossierId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Uploader un fichier PDF pour un dossier
   */
  uploadPdf(dossierId: number, type: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.http.post(`${this.baseUrl}/${dossierId}/upload-pdf`, formData)
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de l'upload du PDF ${type} pour le dossier ${dossierId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Supprimer un fichier PDF d'un dossier
   */
  deletePdf(dossierId: number, type: string): Observable<any> {
    const params = new HttpParams().set('type', type);
    
    return this.http.delete(`${this.baseUrl}/${dossierId}/delete-pdf`, { params })
      .pipe(
        catchError(error => {
          console.error(`Erreur lors de la suppression du PDF ${type} du dossier ${dossierId}:`, error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Charger tous les dossiers (alias pour getAllDossiers)
   */
  loadAll(): Observable<any> {
    return this.getAllDossiers();
  }

  /**
   * Rafraîchir les statistiques des dossiers
   */
  refreshStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/stats`)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du rafraîchissement des statistiques:', error);
          return throwError(() => error);
        })
      );
  }
}

/**
 * Interface pour les statistiques des dossiers
 */
export interface DossierStats {
  totalDossiers: number;
  dossiersEnCours: number;
  dossiersValides: number;
  dossiersRejetes: number;
  agentsActifs: number;
  tachesUrgentes: number;
  notificationsNonLues: number;
}