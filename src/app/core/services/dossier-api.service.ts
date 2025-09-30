import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  DossierApi, 
  DossierRequest, 
  DossiersResponse, 
  DossierResponse,
  ValidationRequest,
  RejetRequest,
  Urgence,
  DossierStatus
} from '../../shared/models/dossier-api.model';

@Injectable({
  providedIn: 'root'
})
export class DossierApiService {
  private apiUrl = 'http://localhost:8089/carthage-creance/api/dossiers';

  constructor(private http: HttpClient) { }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Crée un nouveau dossier
   */
  createDossier(dossier: DossierRequest): Observable<DossierApi> {
    return this.http.post<DossierApi>(this.apiUrl, dossier);
  }

  /**
   * Crée un nouveau dossier avec fichiers
   */
  createDossierWithFiles(
    dossier: DossierRequest, 
    contratSigne?: File, 
    pouvoir?: File
  ): Observable<DossierApi> {
    const formData = new FormData();
    formData.append('dossier', JSON.stringify(dossier));
    
    if (contratSigne) {
      formData.append('contratSigne', contratSigne);
    }
    if (pouvoir) {
      formData.append('pouvoir', pouvoir);
    }

    return this.http.post<DossierApi>(`${this.apiUrl}/addDossier`, formData);
  }

  /**
   * Récupère un dossier par ID
   */
  getDossierById(id: number): Observable<DossierApi> {
    return this.http.get<DossierApi>(`${this.apiUrl}/${id}`);
  }

  /**
   * Récupère tous les dossiers
   */
  getAllDossiers(): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(this.apiUrl);
  }

  /**
   * Met à jour un dossier
   */
  updateDossier(id: number, dossier: DossierApi): Observable<DossierApi> {
    return this.http.put<DossierApi>(`${this.apiUrl}/${id}`, dossier);
  }

  /**
   * Supprime un dossier
   */
  deleteDossier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ==================== SEARCH OPERATIONS ====================

  /**
   * Recherche par numéro de dossier
   */
  getDossierByNumber(numeroDossier: string): Observable<DossierApi> {
    return this.http.get<DossierApi>(`${this.apiUrl}/number/${numeroDossier}`);
  }

  /**
   * Recherche par titre
   */
  getDossiersByTitle(title: string): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/search/title`, {
      params: { title }
    });
  }

  /**
   * Recherche par description
   */
  getDossiersByDescription(description: string): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/search/description`, {
      params: { description }
    });
  }

  /**
   * Recherche par urgence
   */
  getDossiersByUrgency(urgency: Urgence): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/urgency/${urgency}`);
  }

  /**
   * Recherche par créancier
   */
  getDossiersByCreancier(creancierId: number): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/creancier/${creancierId}`);
  }

  /**
   * Recherche par débiteur
   */
  getDossiersByDebiteur(debiteurId: number): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/debiteur/${debiteurId}`);
  }

  /**
   * Recherche par utilisateur
   */
  getDossiersByUser(userId: number): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Recherche globale
   */
  searchDossiers(searchTerm: string): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/search`, {
      params: { searchTerm }
    });
  }

  // ==================== SPECIAL OPERATIONS ====================

  /**
   * Récupère les dossiers ouverts
   */
  getOpenDossiers(): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/open`);
  }

  /**
   * Récupère les dossiers fermés
   */
  getClosedDossiers(): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/closed`);
  }

  /**
   * Récupère les dossiers récents
   */
  getRecentDossiers(): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/recent`);
  }

  /**
   * Vérifie l'existence d'un numéro de dossier
   */
  existsByNumber(numeroDossier: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists/number/${numeroDossier}`);
  }

  // ==================== WORKFLOW OPERATIONS ====================

  /**
   * Récupère les dossiers en attente de validation
   */
  getDossiersEnAttente(): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/en-attente`);
  }

  /**
   * Récupère les dossiers assignés à un agent
   */
  getDossiersByAgent(agentId: number): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/agent/${agentId}`);
  }

  /**
   * Récupère les dossiers créés par un agent
   */
  getDossiersCreesByAgent(agentId: number): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/agent/${agentId}/crees`);
  }

  /**
   * Valide un dossier
   */
  validerDossier(dossierId: number, chefId: number): Observable<DossierApi> {
    return this.http.post<DossierApi>(`${this.apiUrl}/${dossierId}/valider`, null, {
      params: { chefId: chefId.toString() }
    });
  }

  /**
   * Rejette un dossier
   */
  rejeterDossier(dossierId: number, commentaire: string): Observable<DossierApi> {
    return this.http.post<DossierApi>(`${this.apiUrl}/${dossierId}/rejeter`, null, {
      params: { commentaire }
    });
  }

  // ==================== STATISTIQUES ====================

  /**
   * Compte le total des dossiers
   */
  countTotalDossiers(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistiques/total`);
  }

  /**
   * Compte les dossiers en cours
   */
  countDossiersEnCours(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistiques/en-cours`);
  }

  /**
   * Compte les dossiers validés
   */
  countDossiersValides(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistiques/valides`);
  }

  /**
   * Compte les dossiers créés ce mois
   */
  countDossiersCreesCeMois(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistiques/ce-mois`);
  }

  /**
   * Compte les dossiers par agent
   */
  countDossiersByAgent(agentId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistiques/agent/${agentId}`);
  }

  /**
   * Compte les dossiers créés par un agent
   */
  countDossiersCreesByAgent(agentId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/statistiques/agent/${agentId}/crees`);
  }

  // ==================== FILTRES AVANCÉS ====================

  /**
   * Recherche par date de création
   */
  getDossiersByCreationDate(date: string): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/creation-date/${date}`);
  }

  /**
   * Recherche par plage de dates
   */
  getDossiersByCreationDateRange(startDate: string, endDate: string): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/creation-date-range`, {
      params: { startDate, endDate }
    });
  }

  /**
   * Recherche par montant
   */
  getDossiersByAmount(amount: number): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/amount/${amount}`);
  }

  /**
   * Recherche par plage de montants
   */
  getDossiersByAmountRange(minAmount: number, maxAmount: number): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/amount-range`, {
      params: { minAmount: minAmount.toString(), maxAmount: maxAmount.toString() }
    });
  }
}
