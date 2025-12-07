import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DocumentHuissier, DocumentHuissierDTO } from '../models/huissier-document.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HuissierDocumentService {
  private apiUrl = `${environment.apiUrl}/api/huissier`;

  constructor(private http: HttpClient) {}

  /**
   * Crée un document huissier
   * POST /api/huissier/document
   */
  createDocument(dto: DocumentHuissierDTO): Observable<DocumentHuissier> {
    return this.http.post<DocumentHuissier>(`${this.apiUrl}/document`, dto)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère un document par son ID
   * GET /api/huissier/document/{id}
   */
  getDocumentById(id: number): Observable<DocumentHuissier> {
    return this.http.get<DocumentHuissier>(`${this.apiUrl}/document/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère tous les documents d'un dossier
   * GET /api/huissier/documents?dossierId={id}
   */
  getDocumentsByDossier(dossierId: number): Observable<DocumentHuissier[]> {
    const params = new HttpParams().set('dossierId', dossierId.toString());
    return this.http.get<DocumentHuissier[]>(`${this.apiUrl}/documents`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère tous les documents (sans filtre)
   * GET /api/huissier/documents
   */
  getAllDocuments(): Observable<DocumentHuissier[]> {
    return this.http.get<DocumentHuissier[]>(`${this.apiUrl}/documents`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Met à jour un document huissier
   * PUT /api/huissier/document/{id}
   */
  updateDocument(id: number, dto: DocumentHuissierDTO): Observable<DocumentHuissier> {
    return this.http.put<DocumentHuissier>(`${this.apiUrl}/document/${id}`, dto)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Supprime un document huissier
   * DELETE /api/huissier/document/{id}
   */
  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/document/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Marque un document comme complété
   * PUT /carthage-creance/api/huissier/document/{id}/complete
   * 
   * Contraintes :
   * - Seulement si le statut est PENDING
   * - Impossible si le statut est EXPIRED
   * - Impossible si le statut est déjà COMPLETED
   */
  markDocumentAsCompleted(id: number): Observable<DocumentHuissier> {
    const url = `${this.apiUrl}/document/${id}/complete`;
    console.log('🔍 [markDocumentAsCompleted] URL complète:', url);
    console.log('🔍 [markDocumentAsCompleted] apiUrl base:', this.apiUrl);
    console.log('🔍 [markDocumentAsCompleted] environment.apiUrl:', environment.apiUrl);
    console.log('🔍 [markDocumentAsCompleted] ID du document:', id);
    
    return this.http.put<DocumentHuissier>(url, {})
      .pipe(
        catchError((error) => {
          console.error('❌ [markDocumentAsCompleted] Erreur HTTP:', error);
          console.error('❌ [markDocumentAsCompleted] URL appelée:', url);
          console.error('❌ [markDocumentAsCompleted] Status:', error.status);
          console.error('❌ [markDocumentAsCompleted] Message:', error.message);
          return this.handleError(error);
        })
      );
  }

  /**
   * Marque un document comme expiré (utilisé par le scheduler, pas par l'utilisateur)
   * PUT /api/huissier/document/{id}/expire
   */
  markDocumentAsExpired(id: number): Observable<DocumentHuissier> {
    return this.http.put<DocumentHuissier>(`${this.apiUrl}/document/${id}/expire`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les dossiers à l'étape documents
   * GET /api/dossiers/huissier/documents
   */
  getDossiersEnDocuments(page: number = 0, size: number = 100): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${environment.apiUrl}/api/dossiers/huissier/documents`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Crée un document avec ou sans upload de fichier
   * POST /api/huissier/document
   * - Si file est fourni : envoie FormData (multipart/form-data)
   * - Si file n'est pas fourni : envoie JSON (application/json)
   */
  createDocumentWithFile(dto: DocumentHuissierDTO, file?: File): Observable<DocumentHuissier> {
    // Si un fichier est fourni, utiliser FormData
    if (file) {
      const formData = new FormData();
      
      // Ajouter les champs du DTO
      formData.append('dossierId', dto.dossierId.toString());
      formData.append('typeDocument', dto.typeDocument);
      formData.append('huissierName', dto.huissierName);
      formData.append('pieceJointe', file);
      
      console.log('📤 Envoi avec FormData (multipart/form-data)');
      console.log('📤 Fichier:', file.name, '(', file.size, 'bytes)');
      
      return this.http.post<DocumentHuissier>(`${this.apiUrl}/document`, formData)
        .pipe(
          catchError(this.handleError)
        );
    } else {
      // Si pas de fichier, envoyer du JSON
      console.log('📤 Envoi avec JSON (application/json)');
      console.log('📤 DTO:', dto);
      
      return this.http.post<DocumentHuissier>(`${this.apiUrl}/document`, dto)
        .pipe(
          catchError(this.handleError)
        );
    }
  }

  /**
   * Met à jour un document avec ou sans upload de fichier
   * PUT /api/huissier/document/{id}
   * - Si file est fourni : envoie FormData (multipart/form-data)
   * - Si file n'est pas fourni : envoie JSON (application/json)
   */
  updateDocumentWithFile(id: number, dto: DocumentHuissierDTO, file?: File): Observable<DocumentHuissier> {
    // Si un fichier est fourni, utiliser FormData
    if (file) {
      const formData = new FormData();
      
      // Ajouter les champs du DTO
      formData.append('dossierId', dto.dossierId.toString());
      formData.append('typeDocument', dto.typeDocument);
      formData.append('huissierName', dto.huissierName);
      formData.append('pieceJointe', file);
      
      console.log('📤 Mise à jour avec FormData (multipart/form-data)');
      console.log('📤 Fichier:', file.name, '(', file.size, 'bytes)');
      
      return this.http.put<DocumentHuissier>(`${this.apiUrl}/document/${id}`, formData)
        .pipe(
          catchError(this.handleError)
        );
    } else {
      // Si pas de fichier, envoyer du JSON
      console.log('📤 Mise à jour avec JSON (application/json)');
      console.log('📤 DTO:', dto);
      
      return this.http.put<DocumentHuissier>(`${this.apiUrl}/document/${id}`, dto)
        .pipe(
          catchError(this.handleError)
        );
    }
  }

  /**
   * Transition : Passer aux actions
   * POST /api/dossiers/{dossierId}/huissier/passer-aux-actions
   */
  passerAuxActions(dossierId: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/dossiers/${dossierId}/huissier/passer-aux-actions`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('Erreur dans HuissierDocumentService:', error);
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur réseau: ${error.error.message}`;
    } else {
      errorMessage = `Erreur ${error.status}: ${error.error?.message || error.statusText}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}

