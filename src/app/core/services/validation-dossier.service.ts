import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ValidationDossier {
  id: number;
  dossier: {
    id: number;
    numeroDossier: string;
    titre: string;
    description?: string;
    montantCreance?: number;
    dateCreation?: string;
    statut?: string;
    agentCreateur?: string;
    agentResponsable?: string;
    valide?: boolean;
    dateValidation?: string;
    dossierStatus?: string;
    urgence?: string;
    typeDocumentJustificatif?: string;
    creancier?: any;
    debiteur?: any;
  };
  agentCreateur: {
    id: number;
    nom: string;
    prenom: string;
  };
  chefValidateur?: {
    id: number;
    nom: string;
    prenom: string;
  };
  dateValidation?: string;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REJETE';
  commentaires?: string;
  dateCreation: string;
  dateModification?: string;
}

export interface CreateValidationRequest {
  dossier: { id: number };
  agentCreateur: { id: number };
  commentaires?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ValidationDossierService {
  private apiUrl = 'http://localhost:8089/carthage-creance/api/validation/dossiers';

  constructor(private http: HttpClient) {}

  // ==================== CRUD OPERATIONS ====================

  /**
   * Crée une nouvelle validation de dossier
   */
  createValidationDossier(validation: CreateValidationRequest): Observable<ValidationDossier> {
    return this.http.post<ValidationDossier>(`${this.apiUrl}`, validation);
  }

  /**
   * Met à jour une validation de dossier
   */
  updateValidationDossier(id: number, validation: Partial<ValidationDossier>): Observable<ValidationDossier> {
    return this.http.put<ValidationDossier>(`${this.apiUrl}/${id}`, validation);
  }

  /**
   * Supprime une validation de dossier
   */
  deleteValidationDossier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Récupère une validation par ID
   */
  getValidationDossierById(id: number): Observable<ValidationDossier> {
    return this.http.get<ValidationDossier>(`${this.apiUrl}/${id}`);
  }

  /**
   * Récupère toutes les validations
   */
  getAllValidationsDossier(): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossier[]>(`${this.apiUrl}`);
  }

  // ==================== FILTRAGE ====================

  /**
   * Récupère les dossiers en attente de validation
   */
  getDossiersEnAttente(): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossier[]>(`${this.apiUrl}/en-attente`);
  }

  /**
   * Récupère les validations par agent créateur
   */
  getValidationsByAgent(agentId: number): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossier[]>(`${this.apiUrl}/agent/${agentId}`);
  }

  /**
   * Récupère les validations par chef validateur
   */
  getValidationsByChef(chefId: number): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossier[]>(`${this.apiUrl}/chef/${chefId}`);
  }

  /**
   * Récupère les validations par dossier
   */
  getValidationsByDossier(dossierId: number): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossier[]>(`${this.apiUrl}/dossier/${dossierId}`);
  }

  /**
   * Récupère les validations par statut
   */
  getValidationsByStatut(statut: string): Observable<ValidationDossier[]> {
    return this.http.get<ValidationDossier[]>(`${this.apiUrl}/statut/${statut}`);
  }

  // ==================== ACTIONS ====================

  /**
   * Valide un dossier
   */
  validerDossier(id: number, chefId: number, commentaire?: string): Observable<ValidationDossier> {
    const params: any = { chefId };
    if (commentaire) {
      params.commentaire = commentaire;
    }
    return this.http.post<ValidationDossier>(`${this.apiUrl}/${id}/valider`, null, { params });
  }

  /**
   * Rejette un dossier
   */
  rejeterDossier(id: number, chefId: number, commentaire?: string): Observable<ValidationDossier> {
    const params: any = { chefId };
    if (commentaire) {
      params.commentaire = commentaire;
    }
    return this.http.post<ValidationDossier>(`${this.apiUrl}/${id}/rejeter`, null, { params });
  }

  /**
   * Remet une validation en attente
   */
  remettreEnAttente(id: number, commentaire?: string): Observable<ValidationDossier> {
    const params: any = {};
    if (commentaire) {
      params.commentaire = commentaire;
    }
    return this.http.post<ValidationDossier>(`${this.apiUrl}/${id}/en-attente`, null, { params });
  }

  // ==================== STATISTIQUES ====================

  /**
   * Compte les validations par statut
   */
  countValidationsByStatut(statut: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistiques/statut/${statut}`);
  }

  /**
   * Compte les validations par agent
   */
  countValidationsByAgent(agentId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistiques/agent/${agentId}`);
  }

  /**
   * Compte les validations par chef
   */
  countValidationsByChef(chefId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistiques/chef/${chefId}`);
  }

  /**
   * Récupère les statistiques de validation
   */
  getValidationStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/statistiques`);
  }
}