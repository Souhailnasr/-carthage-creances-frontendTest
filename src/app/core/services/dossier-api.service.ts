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
import { Page } from '../../shared/models/pagination.model';

@Injectable({
  providedIn: 'root'
})
export class DossierApiService {
  private apiUrl = 'http://localhost:8089/carthage-creance/api/dossiers';

  constructor(private http: HttpClient) { }

  // ==================== TYPES POUR RECHERCHE AVANCÉE ====================

  /**
   * Paramètres de recherche/filtrage combinés pour dossiers
   */
  public static readonly DEFAULT_PAGE_SIZE = 10;

  private buildSearchParams(params: AdvancedSearchParams): HttpParams {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      // cast sécurisée en string
      httpParams = httpParams.set(key, String(value));
    });
    return httpParams;
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Crée un nouveau dossier
   */
  createDossier(dossier: DossierRequest): Observable<DossierApi> {
    return this.http.post<DossierApi>(this.apiUrl, dossier);
  }

  /**
   * Nouvelle création: POST /create?isChef=
   */
  create(dossier: DossierRequest, isChef: boolean): Observable<DossierApi> {
    return this.http.post<DossierApi>(`${this.apiUrl}/create`, dossier, {
      params: { isChef: String(isChef) }
    });
  }

  /**
   * Création robuste: si /create renvoie un 500 (ex: Duplicate entry sur numeroDossier),
   * on régénère un numeroDossier unique et on retente sur la même route /create.
   */
  createWithFallback(dossier: DossierRequest, isChef: boolean): Observable<DossierApi> {
    return new Observable<DossierApi>(observer => {
      const tryCreate = (payload: DossierRequest, attempt: number = 1) => {
        console.log(`🔄 Tentative ${attempt} de création avec numeroDossier: ${payload.numeroDossier}`);
        
        this.http.post<DossierApi>(`${this.apiUrl}/create`, payload, { params: { isChef: String(isChef) } })
          .subscribe({
            next: d => { 
              console.log(`✅ Dossier créé avec succès avec numeroDossier: ${payload.numeroDossier}`);
              observer.next(d); 
              observer.complete(); 
            },
            error: err => {
              console.log(`❌ Erreur tentative ${attempt}:`, err);
              
              const msg: string = (err?.error?.error || err?.error?.message || err?.message || '').toString();
              console.log(`📝 Message d'erreur: ${msg}`);
              
              // Détection plus robuste des erreurs de duplicate entry
              const isDuplicate = msg.includes('Duplicate entry') || 
                                 msg.includes('duplicate') || 
                                 msg.includes('UK511v1d6q4d0pvftyg9hc3qyfw') ||
                                 msg.includes('numero_dossier');
              
              if (err.status === 500 && isDuplicate && attempt < 3) {
                const uniqueNumero = `${payload.numeroDossier}-${Date.now().toString().slice(-6)}-${attempt}`;
                console.log(`🔄 Duplicate entry détecté, retry avec nouveau numeroDossier: ${uniqueNumero}`);
                const secondPayload: DossierRequest = { ...payload, numeroDossier: uniqueNumero } as DossierRequest;
                tryCreate(secondPayload, attempt + 1);
              } else {
                console.error(`❌ Échec définitif après ${attempt} tentatives:`, err);
                observer.error(err);
              }
            }
          });
      };
      tryCreate(dossier);
    });
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
   * Nouvelle création avec fichiers: /create?isChef=
   * FormData keys: dossier(json), contratSigne, pouvoir
   */
  createWithFiles(
    dossier: DossierRequest,
    contratSigne: File | undefined,
    pouvoir: File | undefined,
    isChef: boolean
  ): Observable<DossierApi> {
    const formData = new FormData();
    // Champs simples attendus par le DTO backend
    if (dossier.titre !== undefined) formData.append('titre', String(dossier.titre));
    if (dossier.description !== undefined) formData.append('description', String(dossier.description));
    if (dossier.numeroDossier !== undefined) formData.append('numeroDossier', String(dossier.numeroDossier));
    if (dossier.montantCreance !== undefined) formData.append('montantCreance', String(dossier.montantCreance as any));
    if (dossier.typeDocumentJustificatif !== undefined) formData.append('typeDocumentJustificatif', String(dossier.typeDocumentJustificatif));
    if (dossier.urgence !== undefined) formData.append('urgence', String(dossier.urgence));
    if ((dossier as any).dossierStatus !== undefined) formData.append('dossierStatus', String((dossier as any).dossierStatus));
    if ((dossier as any).statut !== undefined) formData.append('statut', String((dossier as any).statut));
    if ((dossier as any).nomCreancier !== undefined) formData.append('nomCreancier', String((dossier as any).nomCreancier));
    if ((dossier as any).nomDebiteur !== undefined) formData.append('nomDebiteur', String((dossier as any).nomDebiteur));
    // Optionnel: agentCreateurId si disponible
    if ((dossier as any).agentCreateurId !== undefined && (dossier as any).agentCreateurId !== null) {
      formData.append('agentCreateurId', String((dossier as any).agentCreateurId));
    }

    // Fichiers (clés conformes au DTO: contratSigneFile, pouvoirFile)
    if (contratSigne) formData.append('contratSigneFile', contratSigne);
    if (pouvoir) formData.append('pouvoirFile', pouvoir);

    return this.http.post<DossierApi>(`${this.apiUrl}/create`, formData, { params: { isChef: String(isChef) } });
  }

  /**
   * Récupère un dossier par ID
   */
  getDossierById(id: number): Observable<DossierApi> {
    return this.http.get<DossierApi>(`${this.apiUrl}/${id}`);
  }


  /**
   * Clôture un dossier
   */
  cloturerDossier(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/cloturer`, {});
  }

  /**
   * Récupère tous les dossiers avec pagination
   */
  getAllDossiers(): Observable<Page<DossierApi>> {
    return this.http.get<Page<DossierApi>>(this.apiUrl);
  }

  /**
   * Liste filtrée: GET /?role=&userId=
   */
  list(role?: 'CHEF' | 'AGENT', userId?: number): Observable<Page<DossierApi>> {
    const params: any = {};
    if (role) params.role = role;
    if (userId !== undefined) params.userId = String(userId);
    return this.http.get<Page<DossierApi>>(this.apiUrl, { params });
  }

  /**
   * Récupère les dossiers par statut
   */
  getDossiersByStatut(statut: DossierStatus | string | undefined): Observable<DossierApi[]> {
    const status: string | undefined = typeof statut === 'string' ? statut : (statut as DossierStatus | undefined);
    const safe = status ?? '';
    return this.http.get<DossierApi[]>(`${this.apiUrl}/statut/${safe}`);
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

  /**
   * Recherche simplifiée: GET /search?term=
   */
  search(term: string): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/search`, { params: { term } });
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
   * Téléverse un fichier PDF (contrat ou pouvoir) pour un dossier existant
   */
  uploadPdf(
    dossierId: number,
    type: 'contratSigne' | 'pouvoir',
    file: File
  ): Observable<DossierApi> {
    const formData = new FormData();
    formData.append(type, file);
    return this.http.post<DossierApi>(`${this.apiUrl}/${dossierId}/upload-${type}`, formData);
  }

  /**
   * Uploads dédiés: POST /{id}/upload/contrat|pouvoir avec clé 'file'
   */
  uploadContrat(dossierId: number, file: File): Observable<DossierApi> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<DossierApi>(`${this.apiUrl}/${dossierId}/upload/contrat`, fd);
  }

  uploadPouvoir(dossierId: number, file: File): Observable<DossierApi> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<DossierApi>(`${this.apiUrl}/${dossierId}/upload/pouvoir`, fd);
  }

  /**
   * Supprime un fichier PDF (contrat ou pouvoir) d'un dossier
   */
  deletePdf(
    dossierId: number,
    type: 'contratSigne' | 'pouvoir'
  ): Observable<DossierApi> {
    return this.http.delete<DossierApi>(`${this.apiUrl}/${dossierId}/delete-${type}`);
  }

  deleteContrat(dossierId: number): Observable<DossierApi> {
    return this.http.delete<DossierApi>(`${this.apiUrl}/${dossierId}/upload/contrat`);
  }

  deletePouvoir(dossierId: number): Observable<DossierApi> {
    return this.http.delete<DossierApi>(`${this.apiUrl}/${dossierId}/upload/pouvoir`);
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
   * Filtrage par statut de validation: GET /status/{statut}
   */
  byValidationStatut(statut: 'EN_ATTENTE' | 'VALIDE' | 'REJETE'): Observable<DossierApi[]> {
    return this.http.get<DossierApi[]>(`${this.apiUrl}/status/${statut}`);
  }

  /**
   * Valide un dossier
   */
  validerDossier(dossierId: number, chefId: number): Observable<DossierApi> {
    return this.http.put<DossierApi>(`${this.apiUrl}/${dossierId}/valider`, null, {
      params: { chefId: chefId.toString() }
    });
  }

  /**
   * Alias attendu par certains composants (validateDossier)
   */
  validateDossier(dossierId: number, chefId: number): Observable<DossierApi> {
    return this.validerDossier(dossierId, chefId);
  }

  /**
   * Rejette un dossier
   */
  rejeterDossier(dossierId: number, commentaire: string): Observable<DossierApi> {
    return this.http.put<DossierApi>(`${this.apiUrl}/${dossierId}/rejeter`, null, {
      params: { commentaire }
    });
  }

  /**
   * Alias attendu par certains composants (rejectDossier)
   */
  rejectDossier(dossierId: number, commentaire: string): Observable<DossierApi> {
    return this.rejeterDossier(dossierId, commentaire);
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
   * Statistiques unifiées: GET /stats?role=&agentId=
   */
  stats(role?: 'CHEF' | 'AGENT', agentId?: number): Observable<any> {
    const params: any = {};
    if (role) params.role = role;
    if (agentId !== undefined) params.agentId = String(agentId);
    return this.http.get<any>(`${this.apiUrl}/stats`, { params });
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

  /**
   * Recherche avancée combinable via query params optionnels
   */
  searchAdvanced(params: AdvancedSearchParams): Observable<DossiersResponse> {
    const httpParams = this.buildSearchParams(params);
    return this.http.get<DossiersResponse>(`${this.apiUrl}/search/advanced`, { params: httpParams });
  }

  /**
   * Méthode conviviale pour effectuer une recherche combinée avec pagination/tri
   */
  combinedSearch(options: {
    query?: string;
    filters?: Omit<AdvancedSearchParams, 'page' | 'size' | 'sort' | 'searchTerm'>;
    page?: number;
    size?: number;
    sort?: string;
  }): Observable<DossiersResponse> {
    const { query, filters = {}, page = 0, size = DossierApiService.DEFAULT_PAGE_SIZE, sort } = options;
    const params: AdvancedSearchParams = {
      ...filters,
      page,
      size,
      sort,
      // autoriser aussi une clé générique "searchTerm" côté backend si supportée
      searchTerm: query
    };
    return this.searchAdvanced(params);
  }
}

// Types exportés pour les appels avancés
export interface AdvancedSearchParams {
  numero?: string;
  titre?: string;
  description?: string;
  searchTerm?: string;
  agentId?: number;
  creancierId?: number;
  debiteurId?: number;
  minMontant?: number;
  maxMontant?: number;
  urgence?: Urgence;
  dateCreationDebut?: string; // ISO date
  dateCreationFin?: string;   // ISO date
  dateClotureDebut?: string;  // ISO date
  dateClotureFin?: string;    // ISO date
  statut?: DossierStatus | string;
  page?: number;              // 0-based
  size?: number;              // page size
  sort?: string;              // e.g. "dateCreation,desc"
}
