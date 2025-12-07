import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ActionHuissier, ActionHuissierDTO } from '../models/huissier-action.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HuissierActionService {
  private apiUrl = `${environment.apiUrl}/api/huissier`;

  constructor(private http: HttpClient) {}

  /**
   * Crée une action huissier
   * POST /api/huissier/action
   */
  createAction(dto: ActionHuissierDTO): Observable<ActionHuissier> {
    return this.http.post<ActionHuissier>(`${this.apiUrl}/action`, dto)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère une action par son ID
   * GET /api/huissier/action/{id}
   */
  getActionById(id: number): Observable<ActionHuissier> {
    return this.http.get<ActionHuissier>(`${this.apiUrl}/action/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère toutes les actions d'un dossier
   * GET /api/huissier/actions?dossierId={id}
   */
  getActionsByDossier(dossierId: number): Observable<ActionHuissier[]> {
    const params = new HttpParams().set('dossierId', dossierId.toString());
    return this.http.get<ActionHuissier[]>(`${this.apiUrl}/actions`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère toutes les actions huissier
   * GET /api/huissier/actions/all
   */
  getAllActions(): Observable<ActionHuissier[]> {
    return this.http.get<ActionHuissier[]>(`${this.apiUrl}/actions/all`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Met à jour une action huissier
   * PUT /api/huissier/action/{id}
   */
  updateAction(id: number, dto: ActionHuissierDTO): Observable<ActionHuissier> {
    return this.http.put<ActionHuissier>(`${this.apiUrl}/action/${id}`, dto)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Supprime une action huissier
   * DELETE /api/huissier/action/{id}
   */
  deleteAction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/action/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les dossiers à l'étape actions
   * GET /api/dossiers/huissier/actions
   */
  getDossiersEnActions(page: number = 0, size: number = 100): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<any>(`${environment.apiUrl}/api/dossiers/huissier/actions`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Crée une action avec ou sans upload de fichier
   * POST /api/huissier/action
   * - Si file est fourni : envoie FormData (multipart/form-data)
   * - Si file n'est pas fourni : envoie JSON (application/json)
   */
  createActionWithFile(dto: ActionHuissierDTO, file?: File): Observable<ActionHuissier> {
    // Si un fichier est fourni, utiliser FormData
    if (file) {
      const formData = new FormData();
      
      // Ajouter les champs du DTO
      formData.append('dossierId', dto.dossierId.toString());
      formData.append('typeAction', dto.typeAction);
      formData.append('huissierName', dto.huissierName);
      
      if (dto.montantRecouvre !== undefined) {
        formData.append('montantRecouvre', dto.montantRecouvre.toString());
      }
      if (dto.montantRestant !== undefined) {
        formData.append('montantRestant', dto.montantRestant.toString());
      }
      if (dto.etatDossier) {
        formData.append('etatDossier', dto.etatDossier);
      }
      if (dto.updateMode) {
        formData.append('updateMode', dto.updateMode);
      }
      
      formData.append('pieceJointe', file);
      
      console.log('📤 Envoi action avec FormData (multipart/form-data)');
      console.log('📤 Fichier:', file.name, '(', file.size, 'bytes)');
      
      return this.http.post<ActionHuissier>(`${this.apiUrl}/action`, formData)
        .pipe(
          catchError(this.handleError)
        );
    } else {
      // Si pas de fichier, envoyer du JSON
      console.log('📤 Envoi action avec JSON (application/json)');
      console.log('📤 DTO:', dto);
      
      return this.http.post<ActionHuissier>(`${this.apiUrl}/action`, dto)
        .pipe(
          catchError(this.handleError)
        );
    }
  }

  /**
   * Met à jour une action avec ou sans upload de fichier
   * PUT /api/huissier/action/{id}
   * - Si file est fourni : envoie FormData (multipart/form-data)
   * - Si file n'est pas fourni : envoie JSON (application/json)
   */
  updateActionWithFile(id: number, dto: ActionHuissierDTO, file?: File): Observable<ActionHuissier> {
    // Si un fichier est fourni, utiliser FormData
    if (file) {
      const formData = new FormData();
      
      // Ajouter les champs du DTO
      formData.append('dossierId', dto.dossierId.toString());
      formData.append('typeAction', dto.typeAction);
      formData.append('huissierName', dto.huissierName);
      
      if (dto.montantRecouvre !== undefined) {
        formData.append('montantRecouvre', dto.montantRecouvre.toString());
      }
      if (dto.montantRestant !== undefined) {
        formData.append('montantRestant', dto.montantRestant.toString());
      }
      if (dto.etatDossier) {
        formData.append('etatDossier', dto.etatDossier);
      }
      if (dto.updateMode) {
        formData.append('updateMode', dto.updateMode);
      }
      
      formData.append('pieceJointe', file);
      
      console.log('📤 Mise à jour action avec FormData (multipart/form-data)');
      console.log('📤 Fichier:', file.name, '(', file.size, 'bytes)');
      
      return this.http.put<ActionHuissier>(`${this.apiUrl}/action/${id}`, formData)
        .pipe(
          catchError(this.handleError)
        );
    } else {
      // Si pas de fichier, envoyer du JSON
      console.log('📤 Mise à jour action avec JSON (application/json)');
      console.log('📤 DTO:', dto);
      
      return this.http.put<ActionHuissier>(`${this.apiUrl}/action/${id}`, dto)
        .pipe(
          catchError(this.handleError)
        );
    }
  }

  /**
   * Transition : Passer aux audiences
   * POST /api/dossiers/{dossierId}/huissier/passer-aux-audiences
   */
  passerAuxAudiences(dossierId: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/dossiers/${dossierId}/huissier/passer-aux-audiences`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère les documents d'un dossier (pour l'interface actions)
   * GET /api/dossiers/{dossierId}/huissier/documents
   */
  getDocumentsByDossier(dossierId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/dossiers/${dossierId}/huissier/documents`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('Erreur dans HuissierActionService:', error);
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur réseau: ${error.error.message}`;
    } else {
      errorMessage = `Erreur ${error.status}: ${error.error?.message || error.statusText}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}

