import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ==================== INTERFACES ====================

export interface FinanceStats {
  totalFraisEngages: number;
  montantRecouvre: number;
  fraisRecuperes: number;
  netGenere: number;
  repartitionFrais: { categorie: string; montant: number; pourcentage?: number }[];
  evolutionMensuelle: { mois: string; frais: number; recouvre: number }[];
}

export interface FinanceAlert {
  id: number;
  type: 'FRAIS_ELEVES' | 'DOSSIER_INACTIF' | 'BUDGET_DEPASSE' | 'ACTION_RISQUE';
  message: string;
  dossierId: number;
  agent?: string;
  niveau: 'INFO' | 'WARNING' | 'DANGER';
  dateDeclenchement: string;
  phase?: string;
}

export interface AgentRoi {
  agentId: number;
  agentNom: string;
  montantRecouvre: number;
  fraisEngages: number;
  roiPourcentage: number;
}

export interface FluxFrais {
  id: number;
  dossierId: number;
  phase: 'CREATION' | 'AMIABLE' | 'ENQUETE' | 'JURIDIQUE';
  categorie: string;
  quantite: number;
  tarifUnitaire: number;
  montant: number;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'FACTURE' | 'PAYE';
  dateAction: string;
  justificatifUrl?: string;
  agent?: string;
  commentaire?: string;
  demandeur?: string;
  creeLe?: string;
}

export interface TarifCatalogue {
  id: number;
  phase: string;
  categorie: string;
  fournisseur?: string;
  tarifUnitaire: number;
  devise: string;
  dateDebut: string;
  dateFin?: string;
  actif: boolean;
}

export interface RapportFinance {
  id: number;
  type: 'MENSUEL' | 'CLIENT' | 'AGENT' | 'SECTEUR';
  periode: { debut: string; fin: string };
  generePar: string;
  dateGeneration: string;
  urlPdf?: string;
  urlExcel?: string;
}

export interface Facture {
  id: number;
  numero: string;
  dossierId: number;
  montantTotal: number;
  statut: 'BROUILLON' | 'GENEREE' | 'ENVOYEE' | 'PAYEE' | 'EN_RETARD';
  dateGeneration?: string;
  dateEnvoi?: string;
  dateEcheance?: string;
  urlPdf?: string;
}

export interface InsightFinance {
  id: number;
  categorie: 'OPTIMISATION_COUTS' | 'RISQUES_DOSSIER' | 'PERFORMANCE_AGENT';
  message: string;
  actionSuggeree: string;
  dossierId?: number;
  agentId?: number;
  montantPotentiel?: number;
  createdAt: string;
  traite: boolean;
}

// ==================== SERVICE ====================

@Injectable({ providedIn: 'root' })
export class ChefFinanceService {
  private baseUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  // ========== DASHBOARD & ANALYTICS ==========

  getDashboardStats(): Observable<FinanceStats> {
    return this.http.get<FinanceStats>(`${this.baseUrl}/finances/analytics/dashboard`).pipe(
      map(stats => ({
        ...stats,
        repartitionFrais: this.calculatePercentages(stats.repartitionFrais)
      }))
    );
  }

  getStatsByDateRange(startDate: string, endDate: string): Observable<FinanceStats> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<FinanceStats>(`${this.baseUrl}/finances/analytics/stats`, { params }).pipe(
      map(stats => ({
        ...stats,
        repartitionFrais: this.calculatePercentages(stats.repartitionFrais)
      }))
    );
  }

  getAlerts(niveau?: string, phase?: string): Observable<FinanceAlert[]> {
    let params = new HttpParams();
    if (niveau) params = params.set('niveau', niveau);
    if (phase) params = params.set('phase', phase);
    return this.http.get<FinanceAlert[]>(`${this.baseUrl}/finances/analytics/alerts`, { params });
  }

  getAlertsByDossier(dossierId: number): Observable<FinanceAlert[]> {
    return this.http.get<FinanceAlert[]>(`${this.baseUrl}/finances/analytics/alerts/dossier/${dossierId}`);
  }

  getRepartitionFrais(): Observable<{ categorie: string; montant: number; pourcentage: number }[]> {
    return this.http.get<any[]>(`${this.baseUrl}/finances/analytics/repartition`).pipe(
      map(data => this.calculatePercentages(data))
    );
  }

  getEvolutionMensuelle(startDate?: string, endDate?: string): Observable<{ mois: string; frais: number; recouvre: number }[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<any[]>(`${this.baseUrl}/finances/analytics/evolution`, { params });
  }

  getAgentRoiClassement(): Observable<AgentRoi[]> {
    return this.http.get<any[]>(`${this.baseUrl}/finances/analytics/roi-agents`).pipe(
      map(agents => agents.map(a => ({
        agentId: a.agentId || a.id,
        agentNom: a.agentNom || a.nom || `Agent ${a.agentId || a.id}`,
        montantRecouvre: a.montantRecouvre || a.recouvre || 0,
        fraisEngages: a.fraisEngages || a.frais || 0,
        roiPourcentage: a.roiPourcentage || a.roi || 0
      })))
    );
  }

  getAgentRoi(agentId: number): Observable<AgentRoi> {
    return this.http.get<any>(`${this.baseUrl}/finances/analytics/roi/agent/${agentId}`).pipe(
      map(a => ({
        agentId: a.agentId || a.id,
        agentNom: a.agentNom || a.nom || `Agent ${a.agentId || a.id}`,
        montantRecouvre: a.montantRecouvre || a.recouvre || 0,
        fraisEngages: a.fraisEngages || a.frais || 0,
        roiPourcentage: a.roiPourcentage || a.roi || 0
      }))
    );
  }

  getDossierStats(dossierId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/finances/analytics/dossier/${dossierId}/stats`);
  }

  getInsights(): Observable<InsightFinance[]> {
    return this.http.get<InsightFinance[]>(`${this.baseUrl}/finances/analytics/insights`);
  }

  marquerInsightTraite(insightId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/finances/analytics/insights/${insightId}/traite`, null);
  }

  exportRapportExcel(typeRapport: string, startDate: string, endDate: string, filtres?: any): Observable<Blob> {
    let params = new HttpParams()
      .set('typeRapport', typeRapport)
      .set('startDate', startDate)
      .set('endDate', endDate);
    if (filtres) {
      Object.keys(filtres).forEach(key => {
        if (filtres[key] != null) params = params.set(key, filtres[key]);
      });
    }
    return this.http.get(`${this.baseUrl}/finances/analytics/export-excel`, {
      params,
      responseType: 'blob'
    });
  }

  // ========== FLUX DE FRAIS ==========

  getFrais(params?: any): Observable<FluxFrais[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] != null) httpParams = httpParams.set(key, params[key]);
      });
    }
    return this.http.get<FluxFrais[]>(`${this.baseUrl}/frais`, { params: httpParams });
  }

  getFraisById(id: number): Observable<FluxFrais> {
    return this.http.get<FluxFrais>(`${this.baseUrl}/frais/${id}`);
  }

  createFrais(frais: Partial<FluxFrais>): Observable<FluxFrais> {
    return this.http.post<FluxFrais>(`${this.baseUrl}/frais`, frais);
  }

  updateFrais(id: number, frais: Partial<FluxFrais>): Observable<FluxFrais> {
    return this.http.put<FluxFrais>(`${this.baseUrl}/frais/${id}`, frais);
  }

  deleteFrais(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/frais/${id}`);
  }

  /**
   * Récupère les frais d'un dossier
   * Backend utilise: f.dossier.id = :dossierId (requête @Query explicite)
   */
  getFraisByDossier(dossierId: number): Observable<FluxFrais[]> {
    return this.http.get<FluxFrais[]>(`${this.baseUrl}/frais/dossier/${dossierId}`);
  }

  /**
   * Récupère les frais d'une action
   * Backend utilise: f.action.id = :actionId (requête @Query explicite)
   */
  getFraisByAction(actionId: number): Observable<FluxFrais[]> {
    return this.http.get<FluxFrais[]>(`${this.baseUrl}/frais/action/${actionId}`);
  }

  /**
   * Récupère les frais d'une enquête
   * Backend utilise: f.enquette.id = :enqueteId (requête @Query explicite)
   * Note: Le backend utilise "enquette" (avec double t) dans la relation
   */
  getFraisByEnquete(enqueteId: number): Observable<FluxFrais[]> {
    return this.http.get<FluxFrais[]>(`${this.baseUrl}/frais/enquete/${enqueteId}`);
  }

  /**
   * Récupère les frais d'une audience
   * Backend utilise: f.audience.id = :audienceId (requête @Query explicite)
   */
  getFraisByAudience(audienceId: number): Observable<FluxFrais[]> {
    return this.http.get<FluxFrais[]>(`${this.baseUrl}/frais/audience/${audienceId}`);
  }

  /**
   * Récupère les frais d'une facture
   * Backend utilise: f.facture.id = :factureId (requête @Query explicite)
   */
  getFraisByFacture(factureId: number): Observable<FluxFrais[]> {
    return this.http.get<FluxFrais[]>(`${this.baseUrl}/frais/facture/${factureId}`);
  }

  getFraisByStatut(statut: string): Observable<FluxFrais[]> {
    return this.http.get<FluxFrais[]>(`${this.baseUrl}/frais/statut/${statut}`);
  }

  getFraisEnAttente(): Observable<FluxFrais[]> {
    return this.http.get<FluxFrais[]>(`${this.baseUrl}/frais/en-attente`);
  }

  getFraisByPhase(phase: string): Observable<FluxFrais[]> {
    return this.http.get<FluxFrais[]>(`${this.baseUrl}/frais/phase/${phase}`);
  }

  getFraisByDateRange(startDate: string, endDate: string): Observable<FluxFrais[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<FluxFrais[]>(`${this.baseUrl}/frais/date-range`, { params });
  }

  validerFrais(fraisId: number, commentaire?: string): Observable<FluxFrais> {
    return this.http.put<FluxFrais>(`${this.baseUrl}/frais/${fraisId}/valider`, { commentaire });
  }

  rejeterFrais(fraisId: number, motif: string): Observable<FluxFrais> {
    return this.http.put<FluxFrais>(`${this.baseUrl}/frais/${fraisId}/rejeter`, { motif });
  }

  /**
   * Crée un frais depuis une action
   * Backend utilise la relation f.action.id pour lier le frais à l'action
   */
  createFraisFromAction(actionId: number, frais: Partial<FluxFrais>): Observable<FluxFrais> {
    return this.http.post<FluxFrais>(`${this.baseUrl}/frais/action/${actionId}`, frais);
  }

  /**
   * Crée un frais depuis une enquête
   * Backend utilise la relation f.enquette.id pour lier le frais à l'enquête
   * Note: Le backend utilise "enquette" (avec double t) dans la relation
   */
  createFraisFromEnquete(enqueteId: number, frais: Partial<FluxFrais>): Observable<FluxFrais> {
    return this.http.post<FluxFrais>(`${this.baseUrl}/frais/enquete/${enqueteId}`, frais);
  }

  /**
   * Crée un frais depuis une audience
   * Backend utilise la relation f.audience.id pour lier le frais à l'audience
   */
  createFraisFromAudience(audienceId: number, frais: Partial<FluxFrais>): Observable<FluxFrais> {
    return this.http.post<FluxFrais>(`${this.baseUrl}/frais/audience/${audienceId}`, frais);
  }

  getTotalFraisByDossier(dossierId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/frais/dossier/${dossierId}/total`);
  }

  getTotalFraisByStatut(statut: string): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/frais/statut/${statut}/total`);
  }

  importFraisCSV(file: File): Observable<{ success: number; errors: number; succes: any[]; erreurs: any[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/frais/import-csv`, formData);
  }

  // ========== FACTURES ==========

  getFactures(params?: any): Observable<Facture[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] != null) httpParams = httpParams.set(key, params[key]);
      });
    }
    return this.http.get<Facture[]>(`${this.baseUrl}/factures`, { params: httpParams });
  }

  getFactureById(id: number): Observable<Facture> {
    return this.http.get<Facture>(`${this.baseUrl}/factures/${id}`);
  }

  getFactureByNumero(numero: string): Observable<Facture> {
    return this.http.get<Facture>(`${this.baseUrl}/factures/numero/${numero}`);
  }

  getFacturesByDossier(dossierId: number): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.baseUrl}/factures/dossier/${dossierId}`);
  }

  getFacturesByStatut(statut: string): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.baseUrl}/factures/statut/${statut}`);
  }

  getFacturesEnRetard(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.baseUrl}/factures/en-retard`);
  }

  createFacture(facture: Partial<Facture>): Observable<Facture> {
    return this.http.post<Facture>(`${this.baseUrl}/factures`, facture);
  }

  updateFacture(id: number, facture: Partial<Facture>): Observable<Facture> {
    return this.http.put<Facture>(`${this.baseUrl}/factures/${id}`, facture);
  }

  deleteFacture(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/factures/${id}`);
  }

  genererFactureAutomatique(dossierId: number, periodeDebut?: string, periodeFin?: string): Observable<Facture> {
    let params = new HttpParams();
    if (periodeDebut) params = params.set('periodeDebut', periodeDebut);
    if (periodeFin) params = params.set('periodeFin', periodeFin);
    return this.http.post<Facture>(`${this.baseUrl}/factures/dossier/${dossierId}/generer`, null, { params });
  }

  finaliserFacture(id: number): Observable<Facture> {
    return this.http.put<Facture>(`${this.baseUrl}/factures/${id}/finaliser`, null);
  }

  envoyerFacture(id: number): Observable<Facture> {
    return this.http.put<Facture>(`${this.baseUrl}/factures/${id}/envoyer`, null);
  }

  relancerFacture(id: number): Observable<Facture> {
    return this.http.put<Facture>(`${this.baseUrl}/factures/${id}/relancer`, null);
  }

  downloadFacturePDF(factureId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/factures/${factureId}/pdf`, {
      responseType: 'blob'
    });
  }

  // ========== TARIFS ==========

  getTarifs(params?: any): Observable<TarifCatalogue[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] != null) httpParams = httpParams.set(key, params[key]);
      });
    }
    return this.http.get<TarifCatalogue[]>(`${this.baseUrl}/tarifs`, { params: httpParams });
  }

  getTarifById(id: number): Observable<TarifCatalogue> {
    return this.http.get<TarifCatalogue>(`${this.baseUrl}/tarifs/${id}`);
  }

  getTarifsByPhase(phase: string): Observable<TarifCatalogue[]> {
    return this.http.get<TarifCatalogue[]>(`${this.baseUrl}/tarifs/phase/${phase}`);
  }

  getTarifsActifs(): Observable<TarifCatalogue[]> {
    return this.http.get<TarifCatalogue[]>(`${this.baseUrl}/tarifs/actifs`);
  }

  getTarifsByCategorie(categorie: string): Observable<TarifCatalogue[]> {
    return this.http.get<TarifCatalogue[]>(`${this.baseUrl}/tarifs/categorie/${categorie}`);
  }

  searchTarifs(filters: { phase?: string; categorie?: string; actif?: boolean }): Observable<TarifCatalogue[]> {
    let params = new HttpParams();
    if (filters.phase) params = params.set('phase', filters.phase);
    if (filters.categorie) params = params.set('categorie', filters.categorie);
    if (filters.actif !== undefined) params = params.set('actif', filters.actif.toString());
    return this.http.get<TarifCatalogue[]>(`${this.baseUrl}/tarifs/recherche`, { params });
  }

  createTarif(tarif: Partial<TarifCatalogue>): Observable<TarifCatalogue> {
    return this.http.post<TarifCatalogue>(`${this.baseUrl}/tarifs`, tarif);
  }

  updateTarif(id: number, tarif: Partial<TarifCatalogue>): Observable<TarifCatalogue> {
    return this.http.put<TarifCatalogue>(`${this.baseUrl}/tarifs/${id}`, tarif);
  }

  deleteTarif(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tarifs/${id}`);
  }

  // ========== HELPERS ==========

  private calculatePercentages(data: { categorie: string; montant: number }[]): { categorie: string; montant: number; pourcentage: number }[] {
    const total = data.reduce((sum, item) => sum + item.montant, 0);
    return data.map(item => ({
      ...item,
      pourcentage: total > 0 ? (item.montant / total) * 100 : 0
    }));
  }
}

